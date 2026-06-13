import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  // Ghi log tự động
  async createSystemLog(
    deviceId: string,
    eventType: string,
    status: string,
    description: string,
    extraData?: any,
  ) {
    return this.prisma.aCTIVITY_LOGS.create({
      data: {
        Device_ID: deviceId,
        event_type: eventType,
        status: status,
        description: description,
        extra_data: extraData || null,
      },
    });
  }

  // Lấy danh sách log
  async getLogsByDevice(deviceId: string, limit: number) {
    return this.prisma.aCTIVITY_LOGS.findMany({
      where: { Device_ID: deviceId },
      orderBy: { occurred_at: 'desc' },
      take: limit,
    });
  }
}
