import { Injectable, Inject, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { SaveSchedulesDto } from './dto/save-schedules.dto';
import { SmartLogicService } from '../smart-logic/smart-logic.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SchedulesService implements OnModuleInit {
  private readonly logger = new Logger(SchedulesService.name);
  private lastWeatherBlockState = new Map<string, boolean>();

  constructor(
    private prisma: PrismaService,
    private smartLogicService: SmartLogicService,
    private notificationsService: NotificationsService,
    @Inject('MQTT_SERVICE') private mqttClient: ClientProxy,
  ) {}

  // Chạy SmartLogic ngay khi server khởi động (sau 5s để MQTT kịp kết nối)
  async onModuleInit() {
    setTimeout(() => {
      this.logger.log('🚀 [SmartLogic] Khởi động — chạy SmartLogic lần đầu...');
      this.runSmartLogicForAllDevices().catch((err) =>
        this.logger.error(`❌ SmartLogic onInit error: ${err.message}`),
      );
    }, 5000); // đợi 5s để MQTT broker kết nối xong
  }

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

  async saveDeviceSchedules(deviceId: string, dto: SaveSchedulesDto, userId?: string) {
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

    // 📱 Gửi thông báo Telegram khi cập nhật lịch tưới
    const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const enabledSchedules = dto.schedules.filter(s => s.enabled);
    let scheduleDetail = '';
    if (enabledSchedules.length > 0) {
      scheduleDetail = enabledSchedules.slice(0, 3).map(s => {
        const dayNames = s.days.map(d => DAYS[d] ?? d).join(', ');
        const durText = s.durationMinutes === 0 ? 'tưới theo ngưỡng' : `${s.durationMinutes} phút`;
        return `  • ${s.title}: ${s.time} | ${durText} | ${dayNames}`;
      }).join('\n');
      if (enabledSchedules.length > 3) {
        scheduleDetail += `\n  ... và ${enabledSchedules.length - 3} lịch khác`;
      }
    }

    const notifMsg =
      `📅 <b>CẬP NHẬT LỊCH TƯỚI</b>\n\n` +
      `🌱 Vườn: <b>${device.name}</b>\n` +
      `🔔 Trạng thái: <b>${dto.enabled ? '✅ Đang hoạt động' : '⏸️ Tạm dừng'}</b>\n` +
      `📋 Tổng số lịch: <b>${dto.schedules.length}</b> (bật: <b>${enabledSchedules.length}</b>)\n` +
      (scheduleDetail ? `\n<b>Lịch đang bật:</b>\n${scheduleDetail}\n` : '') +
      `\n<i>Lịch tưới đã được đồng bộ xuống thiết bị.</i>`;
    // chỉ gửi nếu notify_on_config = true
    this.notificationsService.sendNotificationToDeviceOwnerOnConfig(deviceId, notifMsg);

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
  // BOT KIỂM TRA THỜI TIẾT TỰ ĐỘNG (CHẠY MỖI GIỜ 1 LẦN)
  // =========================================================================
  @Cron(CronExpression.EVERY_HOUR)
  async handleSmartLogicCron() {
    await this.runSmartLogicForAllDevices();
  }

  // Hàm core — có thể gọi từ cron hoặc từ API endpoint để trigger thủ công
  async runSmartLogicForAllDevices(): Promise<{ processed: number; results: any[] }> {
    this.logger.log('☁️ [SmartLogic] Bắt đầu quét thời tiết để điều chỉnh lịch tưới...');

    // 1. Tìm TẤT CẢ cấu hình Smart Logic (cả đang bật và tắt để đồng bộ trạng thái khi cấu hình thay đổi)
    const smartConfigs = await this.prisma.sMART_LOGIC_CONFIGS.findMany({
      include: {
        device: {
          include: {
            actuators: {
              where: { type: 'pump' },
              include: { schedules: true },
            },
          },
        },
      },
    });

    const results: any[] = [];

    for (const config of smartConfigs) {
      const device = config.device;
      if (!device) continue;

      try {
        // Hỏi ý kiến API Thời tiết: Sắp mưa không?
        const smartCheck = await this.smartLogicService.shouldSkipWatering(device.Device_ID);
        const macFlat = device.mac_address.replace(/:/g, '').toUpperCase();
        const isSmart = config.is_smart_mode;
        const currentSkip = smartCheck.skip; // Sẽ là false nếu isSmart là false

        // Lấy trạng thái block thời tiết trước đó từ bộ nhớ tạm hoặc DB
        let lastState = this.lastWeatherBlockState.get(device.Device_ID);
        if (lastState === undefined) {
          const lastLog = await this.prisma.aCTIVITY_LOGS.findFirst({
            where: {
              Device_ID: device.Device_ID,
              event_type: 'SMART_LOGIC_ACTION',
            },
            orderBy: {
              occurred_at: 'desc',
            },
          });
          if (lastLog) {
            lastState = lastLog.description.includes('CHẶN') && !lastLog.description.includes('GỠ CHẶN');
          } else {
            lastState = false;
          }
          this.lastWeatherBlockState.set(device.Device_ID, lastState);
        }

        const isStateChanged = lastState !== currentSkip;
        // Luôn gửi lệnh MQTT nếu chế độ thông minh đang BẬT (để đồng bộ khi ESP32 restart)
        // hoặc khi có sự thay đổi trạng thái (chặn -> gỡ chặn hoặc ngược lại)
        const shouldSendMqtt = isSmart || lastState === true;

        if (shouldSendMqtt) {
          // --- Luôn gửi setWeatherBlock bất kể schedule_enabled ---
          this.mqttClient
            .emit(`ecogreen/command/${macFlat}`, {
              method: 'setWeatherBlock',
              params: currentSkip,
            })
            .subscribe({
              next: () => this.logger.log(`[MQTT] setWeatherBlock=${currentSkip} → ${macFlat}`),
              error: (err) => this.logger.error(`[MQTT] setWeatherBlock failed: ${err.message}`),
            });

          // --- Chỉ can thiệp lịch tưới nếu người dùng đang bật lịch ---
          if (device.schedule_enabled) {
            const pumpActuator = device.actuators[0];
            const rawSchedules = pumpActuator ? pumpActuator.schedules : [];
            const mqttPayload = {
              method: 'setSchedules',
              params: {
                enabled: !currentSkip,
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
            this.mqttClient.emit(`ecogreen/command/${macFlat}`, mqttPayload).subscribe({
              next: () => this.logger.log(`[MQTT] setSchedules(skip=${currentSkip}) → ${macFlat}`),
              error: (err) => this.logger.error(`[MQTT] setSchedules failed: ${err.message}`),
            });
          }
        }

        // CHỈ ghi log hoạt động và gửi thông báo Telegram khi TRẠNG THÁI THAY ĐỔI (Event-driven)
        if (isStateChanged) {
          this.lastWeatherBlockState.set(device.Device_ID, currentSkip);

          if (currentSkip) {
            this.logger.log(
              `🛑 [SmartLogic] Trạng thái thay đổi -> CHẶN bơm: Mưa ${smartCheck.rainProbability}% tại ${config.city_name}.`,
            );

            await this.prisma.aCTIVITY_LOGS.create({
              data: {
                Device_ID: device.Device_ID,
                event_type: 'SMART_LOGIC_ACTION',
                status: 'WARNING',
                description: `Hệ thống tự động CHẶN bơm tự động và TẠM DỪNG lịch tưới do dự báo mưa ${smartCheck.rainProbability}% tại ${config.city_name}.`,
              },
            });

            // 📱 Thông báo Telegram
            const rainMsg =
              `🌧️ <b>BƠM TỰ ĐỘNG BỊ CHẶN - TRỜI SẮP MƯA</b>\n\n` +
              `🌱 Vườn: <b>${device.name}</b>\n` +
              `📍 Khu vực: <b>${config.city_name}</b>\n` +
              `🌧 Xác suất mưa: <b>${smartCheck.rainProbability}%</b> (ngưỡng ${config.rain_prob_threshold}%)\n` +
              `🤖 <i>Hệ thống đã tự động chặn bơm tự động và tạm dừng lịch tưới để tiết kiệm nước.</i>`;
            this.notificationsService.sendNotificationToDeviceOwner(device.Device_ID, rainMsg, false);
          } else {
            this.logger.log(
              `🌤 [SmartLogic] Trạng thái thay đổi -> GỠ CHẶN bơm: Thời tiết ổn định tại ${config.city_name}.`,
            );

            const desc = isSmart
              ? `Hệ thống tự động GỠ CHẶN bơm tự động và KHÔI PHỤC lịch tưới khi dự báo mưa tại ${config.city_name} giảm xuống còn ${smartCheck.rainProbability}%.`
              : `Hệ thống tự động GỠ CHẶN bơm tự động và KHÔI PHỤC lịch tưới do chế độ Smart Logic đã tắt.`;

            await this.prisma.aCTIVITY_LOGS.create({
              data: {
                Device_ID: device.Device_ID,
                event_type: 'SMART_LOGIC_ACTION',
                status: 'success',
                description: desc,
              },
            });

            // 📱 Thông báo Telegram
            const title = isSmart
              ? `🌤️ <b>GỠ CHẶN BƠM TỰ ĐỘNG - THỜI TIẾT ỔN ĐỊNH</b>`
              : `⚙️ <b>GỠ CHẶN BƠM TỰ ĐỘNG - TẮT CHẾ ĐỘ THÔNG MINH</b>`;
            
            const note = isSmart
              ? `🌧 Xác suất mưa: <b>${smartCheck.rainProbability}%</b> (dưới ngưỡng ${config.rain_prob_threshold}%)\n` +
                `🤖 <i>Dự báo thời tiết ổn định. Hệ thống đã tự động gỡ chặn bơm tự động và khôi phục lịch tưới.</i>`
              : `🤖 <i>Chế độ tự động thông minh (Smart Logic) đã bị tắt. Hệ thống đã gỡ chặn bơm tự động và khôi phục lịch tưới bình thường.</i>`;

            const normalMsg =
              `${title}\n\n` +
              `🌱 Vườn: <b>${device.name}</b>\n` +
              (isSmart ? `📍 Khu vực: <b>${config.city_name}</b>\n` : '') +
              note;

            this.notificationsService.sendNotificationToDeviceOwner(device.Device_ID, normalMsg, false);
          }
        }

        results.push({ deviceId: device.Device_ID, skip: currentSkip, rainProbability: smartCheck.rainProbability });
      } catch (error) {
        this.logger.error(`❌ Lỗi xử lý Smart Logic cho thiết bị ${device.Device_ID}: ${error.message}`);
        results.push({ deviceId: device.Device_ID, error: error.message });
      }
    }

    return { processed: smartConfigs.length, results };
  }

  // =========================================================================
  // CRON CHẠY LỊCH TƯỚI (kiểm tra mỗi phút)
  // =========================================================================
  @Cron('* * * * *')
  async handleScheduledWatering() {
    try {
      const now = new Date();
      // Giờ Việt Nam = UTC+7
      const vnHour = (now.getUTCHours() + 7) % 24;
      const vnMinute = now.getUTCMinutes();
      const vnDay = now.getDay(); // 0=CN, 1=T2...6=T7 (theo local time)
      // Tính lại ngày theo múi giờ +7
      const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const vnDayOfWeek = vnNow.getUTCDay();

      // Lấy tất cả lịch đang được bật, cùng actuator và device
      const schedules = await this.prisma.sCHEDULES.findMany({
        where: { is_enabled: true },
        include: {
          actuator: {
            include: { device: true },
          },
        },
      });

      for (const schedule of schedules) {
        // Bỏ qua nếu thiết bị không bật lịch tưới
        if (!schedule.actuator.device.schedule_enabled) continue;

        const schedHour = schedule.start_time.getUTCHours();
        const schedMin = schedule.start_time.getUTCMinutes();

        // Kiểm tra giờ & phút & ngày trong tuần
        if (schedHour !== vnHour || schedMin !== vnMinute) continue;

        const days = schedule.days_of_week ? schedule.days_of_week.split(',').map(Number) : [];
        if (days.length > 0 && !days.includes(vnDayOfWeek)) continue;

        // Kiểm tra Smart Logic (dự báo mưa) trước khi bật bơm
        try {
          const smartCheck = await this.smartLogicService.shouldSkipWatering(schedule.actuator.Device_ID);
          if (smartCheck.skip) {
            this.logger.log(`🛑 [SCHEDULE] Bỏ qua lịch tưới "${schedule.title}" của thiết bị ${schedule.actuator.Device_ID} do: ${smartCheck.reason}`);
            
            // Ghi log hoạt động hệ thống
            await this.prisma.aCTIVITY_LOGS.create({
              data: {
                Device_ID: schedule.actuator.Device_ID,
                event_type: 'SMART_LOGIC_ACTION',
                status: 'WARNING',
                description: `Bỏ qua chu kỳ tưới "${schedule.title}" do: ${smartCheck.reason}.`,
              },
            });

            // 📱 Gửi thông báo Telegram khi bỏ qua chu kỳ tưới
            const config = await this.smartLogicService.getConfig(schedule.actuator.Device_ID);
            const skipMsg =
              `🌧️ <b>BỎ QUA CHU KỲ TƯỚI - TRỜI SẮP MƯA</b>\n\n` +
              `🌱 Vườn: <b>${schedule.actuator.device.name}</b>\n` +
              `📅 Lịch: <b>${schedule.title}</b>\n` +
              `📍 Khu vực: <b>${config.city_name}</b>\n` +
              `🤖 <i>Dự báo thời tiết có xác suất mưa ${smartCheck.rainProbability}% (ngưỡng ${config.rain_prob_threshold}%). Hệ thống đã tự động bỏ qua chu kỳ tưới này để tiết kiệm nước.</i>`;
            this.notificationsService.sendNotificationToDeviceOwner(schedule.actuator.Device_ID, skipMsg, false);
            
            continue;
          }
        } catch (error) {
          // Nếu kiểm tra Smart Logic lỗi → an toàn hơn là Bỏ QUA lịch tưới (fail-safe)
          this.logger.error(`❌ Lỗi kiểm tra Smart Logic cho lịch tưới: ${error.message} → bỏ qua lượt này`);
          continue; // ← QUAN TRỌNG: không bật bơm khi không rõ tình trạng thời tiết
        }

        // Đúng giờ → Bật bơm
        const macFlat = schedule.actuator.device.mac_address.replace(/:/g, '').toUpperCase();
        this.mqttClient.emit(`ecogreen/command/${macFlat}`, {
          method: 'setPump',
          params: true,
        }).subscribe({
          next: () => this.logger.log(`[MQTT] setPump=true → ${macFlat}`),
          error: (err) => this.logger.error(`[MQTT] setPump=true failed: ${err.message}`),
        });

        // Ghi log
        await this.prisma.aCTUATOR_LOGS.create({
          data: {
            Actuator_ID: schedule.actuator.Actuator_ID,
            action: 'ON',
            triggered_by: 'SCHEDULE',
          },
        });

        // Xác định thời gian chạy thực tế (phút hoặc giây theo ngưỡng)
        let durationLabel = `${schedule.duration_min} phút`;
        let durationMs = schedule.duration_min * 60 * 1000;
        if (schedule.duration_min === 0) {
          const threshold = await this.prisma.tHRESHOLDS.findFirst({
            where: { Actuator_ID: schedule.actuator.Actuator_ID },
          });
          const maxPumpSec = threshold?.max_pump_sec ?? 60;
          durationLabel = `${maxPumpSec} giây (tưới theo ngưỡng)`;
          durationMs = maxPumpSec * 1000;
        }

        await this.prisma.aCTIVITY_LOGS.create({
          data: {
            Device_ID: schedule.actuator.Device_ID,
            event_type: 'SCHEDULE_WATERING',
            status: 'success',
            description: `Bắt đầu tưới theo lịch "${schedule.title}" (${String(schedHour).padStart(2, '0')}:${String(schedMin).padStart(2, '0')}, ${durationLabel}).`,
          },
        });

        // 📱 Thông báo Telegram khi bắt đầu tưới theo lịch
        const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayNames = days.length > 0 ? days.map(d => DAYS[d] ?? d).join(', ') : 'Hằng ngày';
        const waterMsg =
          `💧 <b>BẮT ĐẦU TƯỚI THEO LỊCH</b>\n\n` +
          `🌱 Vườn: <b>${schedule.actuator.device.name}</b>\n` +
          `📅 Lịch: <b>${schedule.title}</b> (${schedule.zone})\n` +
          `⏰ Giờ tưới: <b>${String(schedHour).padStart(2, '0')}:${String(schedMin).padStart(2, '0')}</b>\n` +
          `⏱️ Thời gian: <b>${durationLabel}</b>\n` +
          `📆 Ngày tưới: <b>${dayNames}</b>`;
        // isError=false → chỉ gửi nếu notify_on_action = true
        this.notificationsService.sendNotificationToDeviceOwner(schedule.actuator.Device_ID, waterMsg, false);

        // Hẹn giờ tắt bơm sau durationMs
        setTimeout(async () => {
          try {
            this.mqttClient.emit(`ecogreen/command/${macFlat}`, {
              method: 'setPump',
              params: false,
            }).subscribe({
              next: () => this.logger.log(`[MQTT] setPump=false → ${macFlat}`),
              error: (err) => this.logger.error(`[MQTT] setPump=false failed: ${err.message}`),
            });
            await this.prisma.aCTUATOR_LOGS.create({
              data: {
                Actuator_ID: schedule.actuator.Actuator_ID,
                action: 'OFF',
                triggered_by: 'SCHEDULE_END',
              },
            });
            await this.prisma.aCTIVITY_LOGS.create({
              data: {
                Device_ID: schedule.actuator.Device_ID,
                event_type: 'SCHEDULE_WATERING',
                status: 'success',
                description: `Hoàn thành tưới theo lịch "${schedule.title}" — đã tưới ${durationLabel}.`,
              },
            });

            // 📱 Thông báo Telegram khi hoàn thành tưới
            const doneMsg =
              `✅ <b>HOÀN THÀNH TƯỚI THEO LỊCH</b>\n\n` +
              `🌱 Vườn: <b>${schedule.actuator.device.name}</b>\n` +
              `📅 Lịch: <b>${schedule.title}</b>\n` +
              `⏱️ Đã tưới: <b>${durationLabel}</b>\n` +
              `🛑 <i>Máy bơm đã tắt tự động.</i>`;
            this.notificationsService.sendNotificationToDeviceOwner(schedule.actuator.Device_ID, doneMsg, false);
          } catch (err) {
            this.logger.error(`❌ Lỗi tắt bơm theo lịch: ${err.message}`);
          }
        }, durationMs);

        this.logger.log(`✅ [SCHEDULE] Bật bơm theo lịch "${schedule.title}" của thiết bị ${macFlat}`);
      }
    } catch (error) {
      this.logger.error(`❌ Lỗi cron lịch tưới: ${error.message}`);
    }
  }
}