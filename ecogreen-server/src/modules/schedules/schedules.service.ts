import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { SaveSchedulesDto } from './dto/save-schedules.dto';
import { SmartLogicService } from '../smart-logic/smart-logic.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private prisma: PrismaService,
    private smartLogicService: SmartLogicService,
    @Inject('MQTT_SERVICE') private mqttClient: ClientProxy,
  ) {}

  async getDeviceSchedules(deviceId: string) {
    const device = await this.prisma.dEVICES.findUnique({
      where: { Device_ID: deviceId },
      include: {
        actuators: {
          where: { type: 'pump' },
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }

    const pumpActuator = device.actuators[0];
    const rawSchedules = pumpActuator ? pumpActuator.schedules : [];

    const schedules = rawSchedules.map((s) => {
      const hours = String(s.start_time.getUTCHours()).padStart(2, '0');
      const minutes = String(s.start_time.getUTCMinutes()).padStart(2, '0');
      return {
        id: s.Schedule_ID,
        title: s.title,
        zone: s.zone,
        icon: s.icon as 'sprout' | 'waves',
        time: `${hours}:${minutes}`,
        durationMinutes: s.duration_min,
        days: s.days_of_week ? s.days_of_week.split(',').map(Number) : [],
        enabled: s.is_enabled,
      };
    });

    return {
      enabled: device.schedule_enabled,
      schedules,
    };
  }

  async saveDeviceSchedules(deviceId: string, dto: SaveSchedulesDto) {
    const device = await this.prisma.dEVICES.findUnique({
      where: { Device_ID: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }

    // 1. Cập nhật trạng thái bật/tắt lịch của thiết bị
    await this.prisma.dEVICES.update({
      where: { Device_ID: deviceId },
      data: { schedule_enabled: dto.enabled },
    });

    // 2. Tìm hoặc tạo Máy bơm nước
    let actuator = await this.prisma.aCTUATORS.findFirst({
      where: { Device_ID: deviceId, type: 'pump' },
    });

    if (!actuator) {
      actuator = await this.prisma.aCTUATORS.create({
        data: {
          Device_ID: deviceId,
          name: 'Máy bơm nước',
          type: 'pump',
          pin_connection: 5,
        },
      });
    }

    // 3. Xóa lịch cũ
    await this.prisma.sCHEDULES.deleteMany({
      where: { Actuator_ID: actuator.Actuator_ID },
    });

    // 4. Thêm lịch mới
    const newSchedules = await Promise.all(
      dto.schedules.map((rule) => {
        const [hours, minutes] = rule.time.split(':').map(Number);
        const startTime = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
        const hasRealId = rule.id && !rule.id.startsWith('sched-');
        
        return this.prisma.sCHEDULES.create({
          data: {
            Schedule_ID: hasRealId ? rule.id : undefined,
            Actuator_ID: actuator.Actuator_ID,
            title: rule.title,
            zone: rule.zone,
            icon: rule.icon,
            start_time: startTime,
            duration_min: rule.durationMinutes,
            days_of_week: rule.days.join(','),
            is_enabled: rule.enabled,
            sync_status: 'pending',
          },
        });
      }),
    );

    // 5. Gửi lệnh MQTT tới ESP32
    const macFlat = device.mac_address.replace(/:/g, '').toUpperCase();
    const mqttPayload = {
      method: 'setSchedules',
      params: {
        enabled: dto.enabled,
        schedules: dto.schedules.map((s) => ({
          time: s.time,
          duration: s.durationMinutes,
          days: s.days,
          enabled: s.enabled,
        })),
      },
    };

    console.log(`[SCHEDULE-MQTT] Publishing schedules to ecogreen/command/${macFlat}:`, JSON.stringify(mqttPayload));
    this.mqttClient.emit(`ecogreen/command/${macFlat}`, mqttPayload).subscribe({
      next: () => console.log(`[SCHEDULE-MQTT] Successfully published to ecogreen/command/${macFlat}`),
      error: (err) => console.error(`[SCHEDULE-MQTT] Failed to publish to ecogreen/command/${macFlat}:`, err),
    });

    // Viết log hoạt động hệ thống
    await this.prisma.aCTIVITY_LOGS.create({
      data: {
        Device_ID: deviceId,
        event_type: 'SCHEDULE_UPDATE',
        status: 'success',
        description: `Cập nhật lịch tưới thành công: ${dto.enabled ? 'Đã bật' : 'Đã tạm dừng'} lịch trình và đồng bộ ${dto.schedules.length} chu kỳ.`,
      },
    });

    // Trả về kết quả đã map tương thích với Frontend
    return {
      enabled: dto.enabled,
      schedules: newSchedules.map((s) => {
        const hours = String(s.start_time.getUTCHours()).padStart(2, '0');
        const minutes = String(s.start_time.getUTCMinutes()).padStart(2, '0');
        return {
          id: s.Schedule_ID,
          title: s.title,
          zone: s.zone,
          icon: s.icon as 'sprout' | 'waves',
          time: `${hours}:${minutes}`,
          durationMinutes: s.duration_min,
          days: s.days_of_week ? s.days_of_week.split(',').map(Number) : [],
          enabled: s.is_enabled,
        };
      }),
    };
  }

  // =========================================================================
  // THÊM MỚI: BOT KIỂM TRA THỜI TIẾT TỰ ĐỘNG (CHẠY MỖI GIỜ 1 LẦN)
  // =========================================================================
  @Cron(CronExpression.EVERY_HOUR)
  async handleSmartLogicCron() {
    this.logger.log('☁️ [SmartLogic] Bắt đầu quét thời tiết để điều chỉnh lịch tưới...');

    // 1. Tìm các cấu hình Smart Logic đang được BẬT
    const smartConfigs = await this.prisma.sMART_LOGIC_CONFIGS.findMany({
      where: { is_smart_mode: true },
      include: {
        device: {
          include: {
            actuators: {
              where: { type: 'pump' },
              include: { schedules: true }
            }
          }
        }
      }
    });

    for (const config of smartConfigs) {
      const device = config.device;
      
      // Nếu người dùng đã tự tay TẮT toàn bộ lịch tưới (schedule_enabled = false) thì Backend không can thiệp
      if (!device || !device.schedule_enabled) continue;

      try {
        // Hỏi ý kiến API Thời tiết: Sắp mưa không?
        const shouldSkip = await this.smartLogicService.shouldSkipWatering(device.Device_ID);
        
        const macFlat = device.mac_address.replace(/:/g, '').toUpperCase();
        const pumpActuator = device.actuators[0];
        const rawSchedules = pumpActuator ? pumpActuator.schedules : [];

        // Đóng gói Payload y hệt như lúc lưu, CHỈ KHÁC CỜ `enabled`
        const mqttPayload = {
          method: 'setSchedules',
          params: {
            // NẾU MƯA (shouldSkip = true) -> Ép ESP32 đổi thành FALSE (Tạm dừng lịch)
            // NẾU NẮNG (shouldSkip = false) -> Ép ESP32 đổi thành TRUE (Cho tưới bình thường)
            enabled: !shouldSkip, 
            schedules: rawSchedules.map((s) => {
              const hours = String(s.start_time.getUTCHours()).padStart(2, '0');
              const minutes = String(s.start_time.getUTCMinutes()).padStart(2, '0');
              return {
                time: `${hours}:${minutes}`,
                duration: s.duration_min,
                days: s.days_of_week ? s.days_of_week.split(',').map(Number) : [],
                enabled: s.is_enabled,
              };
            }),
          },
        };

        if (shouldSkip) {
          this.logger.log(`🛑 [SmartLogic] Phát hiện trời sắp mưa tại ${config.city_name}. TẠM DỪNG lịch tưới của mạch ${macFlat}`);
          this.mqttClient.emit(`ecogreen/command/${macFlat}`, mqttPayload);

          // Tùy chọn: Ghi Log để người dùng mở web lên thấy vì sao máy bơm không chạy
          await this.prisma.aCTIVITY_LOGS.create({
            data: {
              Device_ID: device.Device_ID,
              event_type: 'SMART_LOGIC_ACTION',
              status: 'WARNING',
              description: `Hệ thống tự động TẠM DỪNG các lịch tưới do dự báo xác suất mưa cao tại ${config.city_name}.`,
            },
          });
        } else {
          // Bắn lệnh liên tục mỗi giờ để đảm bảo nếu ESP32 vừa mất điện có lại thì vẫn đúng trạng thái Nắng -> Được tưới
          this.mqttClient.emit(`ecogreen/command/${macFlat}`, mqttPayload);
        }

      } catch (error) {
        this.logger.error(`❌ Lỗi xử lý Smart Logic cho thiết bị ${device.Device_ID}: ${error.message}`);
      }
    }
  }
}