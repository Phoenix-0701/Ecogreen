import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDeviceDailySummary(deviceId: string) {
    // 1. Kiểm tra thiết bị có tồn tại không và lấy kèm Cảm biến + Máy bơm
    const device = await this.prisma.dEVICES.findUnique({
      where: { Device_ID: deviceId },
      include: { sensors: true, actuators: true },
    });

    if (!device) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }

    // Thiết lập mốc thời gian "Hôm nay"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Thống kê Cảm biến (Ví dụ lấy Nhiệt độ làm chuẩn)
    const tempSensor = device.sensors.find((s) => s.type === 'temperature');
    let tempStats = { avg: 0, max: 0, min: 0 };

    if (tempSensor) {
      // Dùng hàm .aggregate của Prisma để CSDL tự tính toán cực nhanh
      const aggregate = await this.prisma.sENSOR_READINGS.aggregate({
        _avg: { value: true },
        _max: { value: true },
        _min: { value: true },
        where: {
          Sensor_ID: tempSensor.Sensor_ID,
          recorded_at: { gte: startOfDay, lte: endOfDay },
        },
      });

      tempStats = {
        avg: aggregate._avg.value
          ? parseFloat(aggregate._avg.value.toFixed(1))
          : 0,
        max: aggregate._max.value || 0,
        min: aggregate._min.value || 0,
      };
    }

    // 3. Đếm số lần Cảnh báo (WARNING) trong hôm nay
    const warningCount = await this.prisma.aCTIVITY_LOGS.count({
      where: {
        Device_ID: deviceId,
        event_type: 'WARNING',
        occurred_at: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 4. Đếm số lần Máy bơm đã bật trong hôm nay
    const pump = device.actuators.find((a) => a.type === 'pump');
    let pumpCount = 0;

    if (pump) {
      pumpCount = await this.prisma.aCTUATOR_LOGS.count({
        where: {
          Actuator_ID: pump.Actuator_ID,
          action: 'ON',
          occurred_at: { gte: startOfDay, lte: endOfDay },
        },
      });
    }

    // 🟢 Trả về Raw Data tổng hợp
    return {
      date: startOfDay.toISOString().split('T')[0], // Trả về ngày YYYY-MM-DD
      temperature: tempStats,
      warnings_today: warningCount,
      pump_activations_today: pumpCount,
    };
  }
}
