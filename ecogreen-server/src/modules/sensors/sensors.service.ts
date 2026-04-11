import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SensorsService {
  constructor(private prisma: PrismaService) {}

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
