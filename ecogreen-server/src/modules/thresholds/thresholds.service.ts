import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertThresholdDto } from './dto/upsert-threshold.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ThresholdsService {
  constructor(
    private prisma: PrismaService,
    @Inject('MQTT_SERVICE') private mqttClient: ClientProxy,
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
        include: { device: true },
      });

      if (actuator && actuator.device) {
        const macFlat = actuator.device.mac_address.replace(/:/g, '').toUpperCase();
        const mqttPayload = {
          method: 'setThreshold',
          params: {
            soilDry: dto.min_value,
            soilWet: dto.max_value,
            tempHigh: dto.temp_high ?? result.temp_high,
            tempLow: dto.temp_low ?? result.temp_low,
            pumpMax: dto.max_pump_sec ?? result.max_pump_sec,
            pumpCool: dto.cooldown_sec ?? result.cooldown_sec,
          },
        };
        this.mqttClient.emit(`ecogreen/command/${macFlat}`, mqttPayload).subscribe({
          next: () => console.log(`[THRESHOLD-MQTT] Successfully published to ecogreen/command/${macFlat}`),
          error: (err) => console.error(`[THRESHOLD-MQTT] Failed to publish to ecogreen/command/${macFlat}:`, err),
        });

        // Viết log hoạt động hệ thống
        await this.prisma.aCTIVITY_LOGS.create({
          data: {
            Device_ID: actuator.Device_ID,
            event_type: 'THRESHOLD_UPDATE',
            status: 'success',
            description: `Cập nhật ngưỡng độ ẩm đất thành công: Ngưỡng khô ${dto.min_value}%, Ngưỡng ướt ${dto.max_value}%.`,
          },
        });
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
