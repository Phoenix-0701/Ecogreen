import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ActuatorsService {
  constructor(
    private prisma: PrismaService,
    @Inject('MQTT_SERVICE') private mqttClient: ClientProxy,
    private notificationsService: NotificationsService,
  ) {}

  // Lấy danh sách máy bơm/quạt của 1 thiết bị
  async getDeviceActuators(deviceId: string) {
    return this.prisma.aCTUATORS.findMany({
      where: { Device_ID: deviceId },
    });
  }

  // Hàm thực thi lệnh Bật/Tắt
  async toggle(actuatorId: string, state: boolean, triggeredBy: string) {
    console.log(`[ACTUATOR-DEBUG] toggle called for actuatorId: ${actuatorId}, state: ${state}, triggeredBy: ${triggeredBy}`);
    const actuator = await this.prisma.aCTUATORS.findUnique({
      where: { Actuator_ID: actuatorId },
      include: { device: true },
    });

    if (!actuator) {
      console.error(`[ACTUATOR-DEBUG] Actuator ${actuatorId} not found`);
      throw new Error('Không tìm thấy thiết bị chấp hành');
    }

    const macFlat = actuator.device.mac_address.replace(/:/g, '').toUpperCase();
    console.log(`[ACTUATOR-DEBUG] Found actuator. Flat MAC: ${macFlat}, Type: ${actuator.type}`);
    const method =
      actuator.type === 'pump'
        ? 'setPump'
        : actuator.type === 'fan'
          ? 'setFan'
          : 'setMode';

    const payload = {
      method,
      params: state,
    };
    console.log(`[ACTUATOR-DEBUG] Emitting to ecogreen/command/${macFlat}:`, payload);
    this.mqttClient.emit(`ecogreen/command/${macFlat}`, payload).subscribe({
      next: () => console.log(`[ACTUATOR-DEBUG] Successfully published to ecogreen/command/${macFlat}`),
      error: (err) => console.error(`[ACTUATOR-DEBUG] Failed to publish to ecogreen/command/${macFlat}:`, err),
    });

    await this.prisma.aCTUATOR_LOGS.create({
      data: {
        Actuator_ID: actuatorId,
        action: state ? 'ON' : 'OFF',
        triggered_by: triggeredBy,
      },
    });

    // Viết log hoạt động hệ thống
    let description = '';
    if (triggeredBy === 'AUTO_SYSTEM_MIN') {
      description = `Hệ thống tự động kích hoạt BẬT ${actuator.name} do chỉ số cảm biến giảm dưới ngưỡng tối thiểu.`;
    } else if (triggeredBy === 'AUTO_SYSTEM_MAX') {
      description = `Hệ thống tự động TẮT ${actuator.name} khi chỉ số cảm biến đạt mức đủ ẩm.`;
    } else {
      const actorName = triggeredBy.includes('@') ? `Người dùng (${triggeredBy})` : triggeredBy;
      description = `${actorName} đã điều khiển ${state ? 'BẬT' : 'TẮT'} thiết bị ${actuator.name}.`;
    }

    const eventType = actuator.type === 'pump' ? (state ? 'PUMP_ON' : 'PUMP_OFF') : (state ? 'FAN_ON' : 'FAN_OFF');
    await this.prisma.aCTIVITY_LOGS.create({
      data: {
        Device_ID: actuator.Device_ID,
        event_type: eventType,
        status: 'success',
        description,
      },
    });

    // 📱 Gửi thông báo Telegram khi người dùng bật/tắt thủ công
    if (!triggeredBy.startsWith('AUTO_SYSTEM')) {
      const deviceName = actuator.device.name;
      const icon = actuator.type === 'pump' ? '💧' : '🌀';
      const stateLabel = state ? 'BẬT' : 'TẮT';
      const actorLabel = triggeredBy.startsWith('USER: ') ? triggeredBy.replace('USER: ', '') : triggeredBy;
      const msg =
        `${icon} <b>ĐIỀU KHIỂN THỦ CÔNG</b>\n\n` +
        `🌱 Vườn: <b>${deviceName}</b>\n` +
        `⚙️ <b>${actuator.name}</b> đã được <b>${stateLabel}</b>\n` +
        `👤 Người thực hiện: <i>${actorLabel}</i>`;
      // isError=false → chỉ gửi nếu notify_on_action = true
      this.notificationsService.sendNotificationToDeviceOwner(actuator.Device_ID, msg, false);
    }

    return {
      message: state
        ? 'Đã bật thiết bị thành công!'
        : 'Đã tắt thiết bị thành công!',
      data: payload,
    };
  }

  async setDeviceMode(deviceId: string, isAuto: boolean, triggeredBy: string) {
    console.log(`[ACTUATOR-DEBUG] setDeviceMode called for deviceId: ${deviceId}, isAuto: ${isAuto}, triggeredBy: ${triggeredBy}`);
    const device = await this.prisma.dEVICES.findUnique({
      where: { Device_ID: deviceId },
    });

    if (!device) {
      console.error(`[ACTUATOR-DEBUG] Device ${deviceId} not found`);
      throw new Error('Không tìm thấy thiết bị');
    }

    const macFlat = device.mac_address.replace(/:/g, '').toUpperCase();
    const payload = {
      method: 'setMode',
      params: isAuto ? 'AUTO' : 'MANUAL',
    };

    console.log(`[ACTUATOR-DEBUG] Emitting to ecogreen/command/${macFlat}:`, payload);
    this.mqttClient.emit(`ecogreen/command/${macFlat}`, payload).subscribe({
      next: () => console.log(`[ACTUATOR-DEBUG] Successfully published mode to ecogreen/command/${macFlat}`),
      error: (err) => console.error(`[ACTUATOR-DEBUG] Failed to publish mode to ecogreen/command/${macFlat}:`, err),
    });

    const actorName = triggeredBy.includes('@') ? `Người dùng (${triggeredBy})` : triggeredBy;
    const description = `${actorName} đã chuyển thiết bị sang chế độ ${isAuto ? 'Tự động (AUTO)' : 'Thủ công (MANUAL)'}.`;
    await this.prisma.aCTIVITY_LOGS.create({
      data: {
        Device_ID: deviceId,
        event_type: isAuto ? 'MODE_AUTO' : 'MODE_MANUAL',
        status: 'success',
        description,
      },
    });

    // 📱 Gửi thông báo Telegram khi đổi chế độ
    const modeIcon = isAuto ? '🤖' : '🕹️';
    const modeLabel = isAuto ? 'Tự động (AUTO)' : 'Thủ công (MANUAL)';
    const msg =
      `${modeIcon} <b>ĐỔI CHẾ ĐỘ ĐIỀU KHIỂN</b>\n\n` +
      `🌱 Vườn: <b>${device.name}</b>\n` +
      `⚙️ Đã chuyển sang: <b>${modeLabel}</b>\n` +
      `👤 Người thực hiện: <i>${triggeredBy}</i>`;
    // isError=false → chỉ gửi nếu notify_on_action = true
    this.notificationsService.sendNotificationToDeviceOwner(deviceId, msg, false);

    return {
      message: `Đã chuyển sang chế độ ${isAuto ? 'Tự động' : 'Thủ công'} thành công!`,
      mode: isAuto ? 'AUTO' : 'MANUAL',
    };
  }
}
