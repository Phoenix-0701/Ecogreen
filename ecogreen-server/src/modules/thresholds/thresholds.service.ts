import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertThresholdDto } from './dto/upsert-threshold.dto';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ThresholdsService {
  constructor(
    private prisma: PrismaService,
    @Inject('MQTT_SERVICE') private mqttClient: ClientProxy,
    private notificationsService: NotificationsService,
  ) {}

  // Tạo mới hoặc cập nhật nếu đã có
  async upsertThreshold(dto: UpsertThresholdDto) {
    const existing = await this.prisma.tHRESHOLDS.findFirst({
      where: { Sensor_ID: dto.Sensor_ID, Actuator_ID: dto.Actuator_ID },
    });

    let result;
    if (existing) {
      result = await this.prisma.tHRESHOLDS.update({
        where: { Threshold_ID: existing.Threshold_ID },
        data: {
          min_value: dto.min_value,
          max_value: dto.max_value,
          max_pump_sec: dto.max_pump_sec ?? existing.max_pump_sec,
          cooldown_sec: dto.cooldown_sec ?? existing.cooldown_sec,
          temp_high: dto.temp_high ?? existing.temp_high,
          temp_low: dto.temp_low ?? existing.temp_low,
          is_enabled: dto.is_enabled,
        },
      });
    } else {
      result = await this.prisma.tHRESHOLDS.create({ data: dto });
    }

    // Gửi gói tin đồng bộ MQTT xuống ESP32
    try {
      const actuator = await this.prisma.aCTUATORS.findUnique({
        where: { Actuator_ID: dto.Actuator_ID },
        include: { device: { include: { sensors: true } } },
      });

      if (actuator && actuator.device) {
        const deviceThresholds = await this.prisma.tHRESHOLDS.findMany({
          where: { sensor: { Device_ID: actuator.Device_ID } },
          include: { sensor: true },
        });

        const soilThresh = deviceThresholds.find(t => t.sensor?.name.toLowerCase().includes("đất") || t.sensor?.name.toLowerCase().includes("soil"));
        const tempThresh = deviceThresholds.find(t => t.sensor?.name.toLowerCase().includes("nhiệt") || t.sensor?.name.toLowerCase().includes("temp"));

        let soilDry = soilThresh ? soilThresh.min_value : 30;
        let soilWet = soilThresh ? soilThresh.max_value : 60;
        let tempHigh = tempThresh ? tempThresh.max_value : (soilThresh ? soilThresh.temp_high : 35);
        let tempLow = tempThresh ? tempThresh.min_value : (soilThresh ? soilThresh.temp_low : 33);
        let pumpMax = soilThresh ? soilThresh.max_pump_sec : 60;
        let pumpCool = soilThresh ? soilThresh.cooldown_sec : 300;

        const sensorName = actuator.device.sensors?.find(s => s.Sensor_ID === dto.Sensor_ID)?.name || 'Cảm biến';
        const isSoil = sensorName.toLowerCase().includes("đất") || sensorName.toLowerCase().includes("soil");
        const isTemp = sensorName.toLowerCase().includes("nhiệt") || sensorName.toLowerCase().includes("temp");

        if (isSoil) {
          soilDry = result.min_value;
          soilWet = result.max_value;
          pumpMax = result.max_pump_sec;
          pumpCool = result.cooldown_sec;
          if (result.temp_high !== undefined) tempHigh = result.temp_high;
          if (result.temp_low !== undefined) tempLow = result.temp_low;
        } else if (isTemp) {
          tempLow = result.min_value;
          tempHigh = result.max_value;
        }

        const macFlat = actuator.device.mac_address.replace(/:/g, '').toUpperCase();
        const mqttPayload = {
          method: 'setThreshold',
          params: {
            soilDry,
            soilWet,
            tempHigh,
            tempLow,
            pumpMax,
            pumpCool,
          },
        };
        this.mqttClient.emit(`ecogreen/command/${macFlat}`, mqttPayload).subscribe({
          next: () => console.log(`[THRESHOLD-MQTT] Successfully published to ecogreen/command/${macFlat}`),
          error: (err) => console.error(`[THRESHOLD-MQTT] Failed to publish to ecogreen/command/${macFlat}:`, err),
        });

        // Viết log hoạt động hệ thống
        const actorName = actuator.name;

        let desc = '';
        if (isSoil) {
          desc = `Cập nhật cấu hình độ ẩm đất thành công: Ngưỡng khô ${dto.min_value}%, Ngưỡng ướt ${dto.max_value}%.`;
        } else if (isTemp) {
          desc = `Cập nhật cấu hình nhiệt độ thành công: Ngưỡng tắt quạt ${dto.min_value}°C, Ngưỡng bật quạt ${dto.max_value}°C.`;
        } else {
          desc = `Cập nhật cấu hình ngưỡng ${sensorName} thành công: Min ${dto.min_value}, Max ${dto.max_value}.`;
        }

        await this.prisma.aCTIVITY_LOGS.create({
          data: {
            Device_ID: actuator.Device_ID,
            event_type: 'THRESHOLD_UPDATE',
            status: 'success',
            description: desc,
          },
        });

        // 📱 Gửi thông báo Telegram khi set ngưỡng
        let msg = `⚙️ <b>CẬP NHẬT NGƯỠNG CẢNH BÁO</b>\n\n` +
          `🌱 Vườn: <b>${actuator.device.name}</b>\n` +
          `📊 Cảm biến: <b>${sensorName}</b>\n`;

        if (isSoil) {
          msg += `💧 Ngưỡng khô (bật ${actorName}): <b>${dto.min_value}%</b>\n` +
                 `🌊 Ngưỡng ướt (tắt ${actorName}): <b>${dto.max_value}%</b>\n`;
          const pumpSec = dto.max_pump_sec ?? result.max_pump_sec;
          const coolSec = dto.cooldown_sec ?? result.cooldown_sec;
          if (pumpSec !== undefined && pumpSec !== null) {
            msg += `⏱️ Thời gian tưới tối đa: <b>${pumpSec} giây</b>\n`;
          }
          if (coolSec !== undefined && coolSec !== null) {
            msg += `⏳ Thời gian nghỉ (cooldown): <b>${coolSec} giây</b>\n`;
          }
        } else if (isTemp) {
          msg += `❄️ Ngưỡng mát (tắt ${actorName}): <b>${dto.min_value}°C</b>\n` +
                 `🔥 Ngưỡng nóng (bật ${actorName}): <b>${dto.max_value}°C</b>\n`;
        } else {
          msg += `📉 Ngưỡng thấp (min): <b>${dto.min_value}</b>\n` +
                 `📈 Ngưỡng cao (max): <b>${dto.max_value}</b>\n`;
        }

        if (isSoil && dto.temp_high !== undefined) {
          msg += `🌡️ Nhiệt độ cao: <b>${dto.temp_high}°C</b>\n`;
        }
        if (isSoil && dto.temp_low !== undefined) {
          msg += `🌡️ Nhiệt độ thấp: <b>${dto.temp_low}°C</b>\n`;
        }
        msg += `\n<i>Cấu hình đã được đồng bộ xuống thiết bị.</i>`;

        // isError=false → chỉ gửi nếu notify_on_config = true
        this.notificationsService.sendNotificationToDeviceOwnerOnConfig(actuator.Device_ID, msg);
      }
    } catch (error) {
      console.error('[THRESHOLD-MQTT] Error publishing to MQTT:', error);
    }

    return result;
  }

  // Lấy danh sách ngưỡng của 1 thiết bị
  async getDeviceThresholds(deviceId: string) {
    return this.prisma.tHRESHOLDS.findMany({
      where: { sensor: { Device_ID: deviceId } },
      include: { sensor: true, actuator: true },
    });
  }
}
