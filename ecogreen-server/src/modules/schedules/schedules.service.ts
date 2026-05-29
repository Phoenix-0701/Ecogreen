import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { SaveSchedulesDto } from './dto/save-schedules.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
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
}
