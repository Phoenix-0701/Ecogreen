import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class SensorsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async saveSensorData(macAddress: string, payload: any) {
    const device = await this.prisma.dEVICES.findUnique({
      where: { mac_address: macAddress },
      include: { sensors: true },
    });

    if (!device) return;

    const readingsToInsert: { Sensor_ID: string; value: number }[] = [];

    for (const sensor of device.sensors) {
      let val = null;
      if (sensor.type === 'temperature')
        val = payload.temp ?? payload.temperature;
      if (sensor.type === 'humidity')
        val = payload.humi ?? payload.humidity ?? payload.hum;
      if (sensor.type === 'soil_moisture')
        val = payload.soil ?? payload.soil_moisture;

      if (val !== null && val !== undefined) {
        readingsToInsert.push({
          Sensor_ID: sensor.Sensor_ID,
          value: parseFloat(val),
        });
      }
    }

    if (readingsToInsert.length > 0) {
      await this.prisma.sENSOR_READINGS.createMany({ data: readingsToInsert });

      for (const reading of readingsToInsert) {
        // Tìm xem Sensor này có được cấu hình ngưỡng không?
        const threshold = await this.prisma.tHRESHOLDS.findFirst({
          where: { Sensor_ID: reading.Sensor_ID, is_enabled: true },
        });

        if (threshold) {
          const sensorName =
            device.sensors.find((s) => s.Sensor_ID === reading.Sensor_ID)
              ?.name || 'Cảm biến';

          if (reading.value > threshold.max_value) {
            console.log(
              `🚨 CẢNH BÁO: ${sensorName} VƯỢT NGƯỠNG MAX! (${reading.value} > ${threshold.max_value})`,
            );

            // Ghi Log ngầm vào Database
            await this.logsService.createSystemLog(
              device.Device_ID,
              'WARNING',
              'VƯỢT NGƯỠNG MAX',
              `Cảnh báo: ${sensorName} đo được ${reading.value}, vượt mức tối đa ${threshold.max_value}`,
            );
          } else if (reading.value < threshold.min_value) {
            console.log(
              `🚨 CẢNH BÁO: ${sensorName} DƯỚI NGƯỠNG MIN! (${reading.value} < ${threshold.min_value})`,
            );

            // Ghi Log ngầm vào Database
            await this.logsService.createSystemLog(
              device.Device_ID,
              'WARNING',
              'DƯỚI NGƯỠNG MIN',
              `Cảnh báo: ${sensorName} đo được ${reading.value}, rớt dưới mức tối thiểu ${threshold.min_value}`,
            );
          }
        }
      }

      await this.prisma.dEVICES.update({
        where: { mac_address: macAddress },
        data: { status: 'online', last_seen_at: new Date() },
      });
    }
  }

  async getSensorsByDevice(deviceId: string) {
    return this.prisma.sENSORS.findMany({ where: { Device_ID: deviceId } });
  }

  async getSensorReadings(sensorId: string, limit: number) {
    return this.prisma.sENSOR_READINGS.findMany({
      where: { Sensor_ID: sensorId },
      orderBy: { recorded_at: 'desc' },
      take: limit,
    });
  }
}
