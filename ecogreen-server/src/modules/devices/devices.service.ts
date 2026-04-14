import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  private discoveredMacs = new Set<string>();

  constructor(private prisma: PrismaService) {}

  // 1. Thêm MAC lạ vào danh sách chờ (Gọi từ AppController khi nhận MQTT)
  addDiscoveredMac(mac: string) {
    this.discoveredMacs.add(mac);
  }

  // 2. Lấy danh sách các MAC đang chờ để Frontend gọi API hiển thị
  async getDiscovered() {
    return Array.from(this.discoveredMacs);
  }

  // 3. Đăng ký thiết bị mới (Nhập hộ khẩu)
  async create(userId: string, createDeviceDto: CreateDeviceDto) {
    const existingDevice = await this.prisma.dEVICES.findUnique({
      where: { mac_address: createDeviceDto.mac_address },
    });

    if (existingDevice) {
      throw new ConflictException(
        'Thiết bị với địa chỉ MAC này đã tồn tại trong hệ thống!',
      );
    }

    this.discoveredMacs.delete(createDeviceDto.mac_address);

    const newDevice = await this.prisma.dEVICES.create({
      data: {
        name: createDeviceDto.name,
        mac_address: createDeviceDto.mac_address,
        User_ID: userId,
        status: 'online',

        // Tự động tạo 3 Cảm biến
        sensors: {
          create: [
            {
              name: 'Nhiệt độ',
              type: 'temperature',
              unit: '°C',
              pin_connection: 4,
            },
            {
              name: 'Độ ẩm không khí',
              type: 'humidity',
              unit: '%',
              pin_connection: 4,
            },
            {
              name: 'Độ ẩm đất',
              type: 'soil_moisture',
              unit: '%',
              pin_connection: 34,
            },
          ],
        },

        // Tự động tạo 1 Máy bơm
        actuators: {
          create: [{ name: 'Máy bơm nước', type: 'pump', pin_connection: 5 }],
        },
      },
      include: { sensors: true, actuators: true },
    });

    return {
      message: '🎉 Đã thêm thiết bị thành công!',
      device: newDevice,
    };
  }

  // 4. Lấy danh sách thiết bị CỦA RIÊNG NGƯỜI ĐÓ
  async findAllByUser(userId: string) {
    return this.prisma.dEVICES.findMany({
      where: { User_ID: userId },
      include: { sensors: true, actuators: true },
    });
  }
}
