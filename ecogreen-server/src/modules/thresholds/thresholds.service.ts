import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertThresholdDto } from './dto/upsert-threshold.dto';

@Injectable()
export class ThresholdsService {
  constructor(private prisma: PrismaService) {}

  // Tạo mới hoặc cập nhật nếu đã có
  async upsertThreshold(dto: UpsertThresholdDto) {
    const existing = await this.prisma.tHRESHOLDS.findFirst({
      where: { Sensor_ID: dto.Sensor_ID, Actuator_ID: dto.Actuator_ID },
    });

    if (existing) {
      return this.prisma.tHRESHOLDS.update({
        where: { Threshold_ID: existing.Threshold_ID },
        data: {
          min_value: dto.min_value,
          max_value: dto.max_value,
          is_enabled: dto.is_enabled,
        },
      });
    } else {
      return this.prisma.tHRESHOLDS.create({ data: dto });
    }
  }

  // Lấy danh sách ngưỡng của 1 thiết bị
  async getDeviceThresholds(deviceId: string) {
    return this.prisma.tHRESHOLDS.findMany({
      where: { sensor: { Device_ID: deviceId } },
      include: { sensor: true, actuator: true },
    });
  }
}
