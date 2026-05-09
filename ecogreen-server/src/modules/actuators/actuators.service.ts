import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ActuatorsService {
  constructor(
    private prisma: PrismaService,
    @Inject('MQTT_SERVICE') private mqttClient: ClientProxy,
  ) {}

  // Lấy danh sách máy bơm/quạt của 1 thiết bị
  async getDeviceActuators(deviceId: string) {
    return this.prisma.aCTUATORS.findMany({
      where: { Device_ID: deviceId },
    });
  }

  // Hàm thực thi lệnh Bật/Tắt
  async toggle(actuatorId: string, state: boolean, triggeredBy: string) {
    const actuator = await this.prisma.aCTUATORS.findUnique({
      where: { Actuator_ID: actuatorId },
      include: { device: true },
    });

    if (!actuator) throw new Error('Không tìm thấy thiết bị chấp hành');

    const payload = {
      mac: actuator.device.mac_address,
      device: actuator.type,
      state: state ? 1 : 0, 
    };
    this.mqttClient.emit('ecogreen/command', payload);

    await this.prisma.aCTUATOR_LOGS.create({
      data: {
        Actuator_ID: actuatorId,
        action: state ? 'ON' : 'OFF',
        triggered_by: triggeredBy,
      },
    });

    return { message: 'Đã gửi lệnh điều khiển thành công!', payload };
  }
}
