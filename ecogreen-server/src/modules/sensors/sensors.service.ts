import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { ActuatorsService } from '../actuators/actuators.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  // 🟢 Bộ nhớ đệm chống Spam tin nhắn Telegram
  // Key: Sensor_ID, Value: Thời gian gửi tin nhắn cảnh báo cuối cùng (millisecond)
  private alertCache: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN_MS = 5 * 60 * 1000; // Khoảng cách giữa 2 lần spam (5 phút)

  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
    private actuatorsService: ActuatorsService,
    private notificationsService: NotificationsService,
  ) {}

  async saveSensorData(macAddress: string, payload: any) {
    try {
      // 1. Tìm thiết bị (Gộp lấy luôn Cảm biến và Máy bơm để dùng sau)
      const device = await this.prisma.dEVICES.findUnique({
        where: { mac_address: macAddress },
        include: { sensors: true, actuators: true },
      });

      if (!device) return null; // Trả về null để AppController tiến hành Discovery

      const readingsToInsert: { Sensor_ID: string; value: number }[] = [];

      // 2. Map dữ liệu từ ESP32 gửi lên và ép kiểu an toàn
      for (const sensor of device.sensors) {
        let val = null;
        if (sensor.type === 'temperature') val = payload.temp ?? payload.temperature;
        else if (sensor.type === 'humidity') val = payload.humi ?? payload.humidity ?? payload.hum;
        else if (sensor.type === 'soil_moisture') val = payload.soil ?? payload.soil_moisture;

        if (val !== null && val !== undefined) {
          const parsedVal = parseFloat(val);
          if (!isNaN(parsedVal)) {
            readingsToInsert.push({ Sensor_ID: sensor.Sensor_ID, value: parsedVal });
          }
        }
      }

      if (readingsToInsert.length === 0) return true;

      // 3. TỐI ƯU HÓA 1: Lưu lịch sử và cập nhật thiết bị qua TRANSACTION
      await this.prisma.$transaction([
        this.prisma.sENSOR_READINGS.createMany({ data: readingsToInsert }),
        this.prisma.dEVICES.update({
          where: { Device_ID: device.Device_ID },
          data: { status: 'online', last_seen_at: new Date() },
        })
      ]);

      // 4. TỐI ƯU HÓA 2: Truy vấn GỘP toàn bộ Threshold bằng 1 lần gọi DB
      const sensorIds = readingsToInsert.map(r => r.Sensor_ID);
      const thresholds = await this.prisma.tHRESHOLDS.findMany({
        where: { Sensor_ID: { in: sensorIds }, is_enabled: true },
      });

      if (thresholds.length === 0) return true;

      // 5. TỐI ƯU HÓA 3: Tìm trạng thái các Máy bơm bằng 1 lần gọi DB duy nhất
      const actuatorIds = thresholds.map(t => t.Actuator_ID);
      const lastLogs = await this.prisma.aCTUATOR_LOGS.findMany({
        where: { Actuator_ID: { in: actuatorIds } },
        orderBy: { occurred_at: 'desc' },
      });

      // Tạo một từ điển (map) chứa trạng thái máy bơm hiện tại để tra cứu siêu tốc
      const pumpStatusMap = new Map<string, boolean>();
      for (const log of lastLogs) {
        if (!pumpStatusMap.has(log.Actuator_ID)) {
          pumpStatusMap.set(log.Actuator_ID, log.action === 'ON');
        }
      }

      // 6. SO SÁNH VÀ ĐIỀU KHIỂN
      for (const reading of readingsToInsert) {
        const threshold = thresholds.find(t => t.Sensor_ID === reading.Sensor_ID);
        if (!threshold) continue;

        const sensorName = device.sensors.find((s) => s.Sensor_ID === reading.Sensor_ID)?.name || 'Cảm biến';
        const actuatorID = threshold.Actuator_ID;
        const isCurrentlyOn = pumpStatusMap.get(actuatorID) || false;

        // =====================================
        // XỬ LÝ VƯỢT NGƯỠNG MAX (QUÁ NÓNG/KHÔ)
        // =====================================
        if (reading.value > threshold.max_value) {
          
          if (!isCurrentlyOn) {
            await this.logsService.createSystemLog(
              device.Device_ID, 'WARNING', 'VƯỢT NGƯỠNG MAX',
              `Cảnh báo: ${sensorName} vượt Max (${reading.value} > ${threshold.max_value})`
            );
            await this.actuatorsService.toggle(actuatorID, true, 'AUTO_SYSTEM_MAX');
            pumpStatusMap.set(actuatorID, true); // Chống gọi bơm liên tục ở vòng lặp kế
          }

          // Cảnh báo Telegram (Áp dụng chống Spam)
          const now = Date.now();
          const lastAlert = this.alertCache.get(reading.Sensor_ID) || 0;

          if (now - lastAlert > this.ALERT_COOLDOWN_MS) {
            const msg = 
              `🚨 <b>CẢNH BÁO QUÁ NHIỆT / VƯỢT NGƯỠNG!</b>\n\n` +
              `🌱 Vườn: <b>${device.name}</b>\n` +
              `⚠️ <b>${sensorName}</b>: <b>${reading.value}</b> (Max: ${threshold.max_value})\n\n` +
              `💦 <i>Hệ thống ${!isCurrentlyOn ? 'đã TỰ ĐỘNG BẬT bơm!' : 'đang duy trì tưới...'}</i>`;
            
            await this.notificationsService.sendTelegramMessage(device.User_ID, msg, true);
            this.alertCache.set(reading.Sensor_ID, now); // Cập nhật mốc thời gian vừa nhắn
          }
        } 
        // =====================================
        // XỬ LÝ DƯỚI NGƯỠNG MIN (ĐÃ MÁT/ẨM)
        // =====================================
        else if (reading.value < threshold.min_value) {
          
          if (isCurrentlyOn) {
            await this.logsService.createSystemLog(
              device.Device_ID, 'ACTION', 'DƯỚI NGƯỠNG MIN',
              `Thông báo: ${sensorName} an toàn (${reading.value} < ${threshold.min_value})`
            );
            await this.actuatorsService.toggle(actuatorID, false, 'AUTO_SYSTEM_MIN');
            pumpStatusMap.set(actuatorID, false);

            // Xóa cache cảnh báo khi hệ thống đã an toàn trở lại
            this.alertCache.delete(reading.Sensor_ID);

            const msg = 
              `✅ <b>THÔNG BÁO AN TOÀN</b>\n\n` +
              `🌱 Vườn: <b>${device.name}</b>\n` +
              `📉 <b>${sensorName}</b> đã hạ xuống <b>${reading.value}</b> (Min: ${threshold.min_value})\n\n` +
              `🛑 <i>Hệ thống đã TỰ ĐỘNG TẮT bơm.</i>`;
            
            await this.notificationsService.sendTelegramMessage(device.User_ID, msg, false);
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`❌ Lỗi xử lý MQTT tại SensorsService: ${error.message}`);
      return false;
    }
  }

  async getSensorsByDevice(deviceId: string) {
    return this.prisma.sENSORS.findMany({ where: { Device_ID: deviceId } });
  }

  async getSensorReadings(sensorId: string, limit: number) {
    const readings = await this.prisma.sENSOR_READINGS.findMany({
      where: { Sensor_ID: sensorId },
      orderBy: { recorded_at: 'desc' },
      take: limit,
    });

    return readings.map((r) => ({
      ...r,
      Reading_ID: r.Reading_ID.toString(),
    }));
  }
}
