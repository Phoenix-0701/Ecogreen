import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  // Bộ nhớ tạm (RAM) lưu các mã MAC vừa được ESP32 phát lên nhưng chưa có chủ
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
    // Kiểm tra xem mã MAC này đã có ai đăng ký chưa (chống đăng ký trộm)
    const existingDevice = await this.prisma.dEVICES.findUnique({
      where: { mac_address: createDeviceDto.mac_address },
    });

    if (existingDevice) {
      throw new ConflictException(
        'Thiết bị với địa chỉ MAC này đã tồn tại trong hệ thống!',
      );
    }

    // Khi đăng ký thành công, xóa mã MAC này khỏi danh sách "đang chờ"
    this.discoveredMacs.delete(createDeviceDto.mac_address);

    // Lưu thiết bị mới và TỰ ĐỘNG TẠO 3 CẢM BIẾN + 1 MÁY BƠM
    const newDevice = await this.prisma.dEVICES.create({
      data: {
        name: createDeviceDto.name,
        mac_address: createDeviceDto.mac_address,
        User_ID: userId,
        status: 'online', // Vừa add xong cho nó online luôn vì nó vừa phát sóng

        // Tự động tạo 3 Cảm biến (Gắn sẵn chân Pin theo code C++ của bạn)
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
      // Lôi luôn data cảm biến và máy bơm ra để trả về cho Frontend hiển thị ngay
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
      include: { sensors: true, actuators: true }, // Kéo theo cả Cảm biến & Máy bơm để vẽ giao diện
    });
  }
}
