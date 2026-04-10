import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDeviceDto: CreateDeviceDto) {
    const existingDevice = await this.prisma.dEVICES.findUnique({
      where: { mac_address: createDeviceDto.mac_address },
    });

    if (existingDevice) {
      throw new ConflictException(
        'Thiết bị với địa chỉ MAC này đã tồn tại trong hệ thống!',
      );
    }

    const newDevice = await this.prisma.dEVICES.create({
      data: {
        name: createDeviceDto.name,
        mac_address: createDeviceDto.mac_address,
        User_ID: userId,
        status: 'offline',
      },
    });

    return {
      message: '🎉 Đã thêm thiết bị thành công!',
      device: newDevice,
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.dEVICES.findMany({
      where: { User_ID: userId },
    });
  }
}
