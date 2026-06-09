import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

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

    if (!this.discoveredMacs.has(createDeviceDto.mac_address)) {
      throw new BadRequestException(
        'Địa chỉ MAC không hợp lệ hoặc thiết bị chưa được hệ thống phát hiện. Vui lòng cắm nguồn thiết bị và thử lại!',
      );
    }

    this.discoveredMacs.delete(createDeviceDto.mac_address);

    const newDevice = await this.prisma.dEVICES.create({
      data: {
        name: createDeviceDto.name,
        mac_address: createDeviceDto.mac_address,
        User_ID: userId,
        status: 'online',

        // Tự động tạo 4 Cảm biến
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
            {
              name: 'Ánh sáng',
              type: 'light',
              unit: 'lux',
              pin_connection: 35,
            },
          ],
        },

        // Tự động tạo 1 Máy bơm và 1 Quạt
        actuators: {
          create: [
            { name: 'Máy bơm nước', type: 'pump', pin_connection: 5 },
            { name: 'Quạt thông gió', type: 'fan', pin_connection: 25 },
          ],
        },
      },
      include: { sensors: true, actuators: true },
    });

    return newDevice;
  }

  // 4. Lấy danh sách thiết bị CỦA RIÊNG NGƯỜI ĐÓ
  async findAllByUser(userId: string) {
    return this.prisma.dEVICES.findMany({
      where: { User_ID: userId },
      include: {
        sensors: {
          include: {
            sensor_readings: {
              orderBy: { recorded_at: 'desc' },
              take: 1,
              select: {
                value: true,
                recorded_at: true,
              },
            },
          },
        },
        actuators: {
          include: {
            actuator_logs: {
              orderBy: { occurred_at: 'desc' },
              take: 1,
              select: {
                action: true,
                occurred_at: true,
              },
            },
          },
        },
        smart_logic_configs: {
          select: {
            is_smart_mode: true,
          },
        },
      },
    });
  }

  // 5. Cập nhật tên thiết bị (Chỉ được sửa thiết bị của mình)
  async update(deviceId: string, userId: string, dto: UpdateDeviceDto) {
    const device = await this.prisma.dEVICES.findFirst({
      where: { Device_ID: deviceId, User_ID: userId },
    });

    if (!device) {
      throw new NotFoundException(
        'Không tìm thấy thiết bị hoặc bạn không có quyền sửa!',
      );
    }

    return this.prisma.dEVICES.update({
      where: { Device_ID: deviceId },
      data: { name: dto.name },
    });
  }

  // 6. Xóa thiết bị
  async remove(deviceId: string, userId: string) {
    const device = await this.prisma.dEVICES.findFirst({
      where: { Device_ID: deviceId, User_ID: userId },
    });

    if (!device) {
      throw new NotFoundException(
        'Không tìm thấy thiết bị hoặc bạn không có quyền xóa!',
      );
    }

    return this.prisma.dEVICES.delete({
      where: { Device_ID: deviceId },
    });
  }
}
