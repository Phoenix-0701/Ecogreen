import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { ActuatorsService } from '../actuators/actuators.service';

@Injectable()
export class SensorsService {
  private alertCache: Map<string, number> = new Map();

  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
    private actuatorsService: ActuatorsService,
  ) {}

  private shouldLogAlert(deviceId: string, alertType: string, cooldownMs: number): boolean {
    const key = `${deviceId}_${alertType}`;
    const lastTime = this.alertCache.get(key) || 0;
    const now = Date.now();
    if (now - lastTime > cooldownMs) {
      this.alertCache.set(key, now);
      return true;
    }
    return false;
  }

  async saveSensorData(macAddress: string, payload: any) {
    const device = await this.prisma.dEVICES.findUnique({
      where: { mac_address: macAddress },
      include: {
        sensors: {
          include: {
            thresholds: true,
          },
        },
        actuators: true,
      },
    });
    if (!device) return null;

    // Đồng bộ trạng thái thiết bị chấp hành báo về từ telemetry
    if (device.actuators && device.actuators.length > 0) {
      for (const actuator of device.actuators) {
        let reportedState = null;
        if (actuator.type === 'pump' && (payload.pump !== undefined || payload.pumpState !== undefined)) {
          reportedState = payload.pump ?? payload.pumpState;
        } else if (actuator.type === 'fan' && (payload.fan !== undefined || payload.fanState !== undefined)) {
          reportedState = payload.fan ?? payload.fanState;
        }

        if (reportedState !== null) {
          const lastLog = await this.prisma.aCTUATOR_LOGS.findFirst({
            where: { Actuator_ID: actuator.Actuator_ID },
            orderBy: { occurred_at: 'desc' },
          });

          const currentDbState = lastLog ? (lastLog.action === 'ON') : false;
          const reportedStateBool = !!reportedState;

          if (currentDbState !== reportedStateBool) {
            console.log(
              `🔄 [SYNC] Thiết bị báo trạng thái ${actuator.type} là ${reportedStateBool ? 'ON' : 'OFF'} (khác với DB là ${currentDbState ? 'ON' : 'OFF'}). Tiến hành cập nhật log.`
            );

            let triggeredBy = 'DEVICE_PHYSICAL';
            let actorName = 'Nút bấm vật lý (ESP32)';

            if (payload.autoMode) {
              triggeredBy = 'AUTO_HARDWARE';
              actorName = 'Chế độ Tự động (ESP32)';
            } else if (reportedStateBool) {
              triggeredBy = 'SCHED_HARDWARE';
              actorName = 'Lịch hẹn giờ / Nút bấm vật lý';
            }

            await this.prisma.aCTUATOR_LOGS.create({
              data: {
                Actuator_ID: actuator.Actuator_ID,
                action: reportedStateBool ? 'ON' : 'OFF',
                triggered_by: triggeredBy,
              },
            });

            const eventType = actuator.type === 'pump'
              ? (reportedStateBool ? 'PUMP_ON' : 'PUMP_OFF')
              : (reportedStateBool ? 'FAN_ON' : 'FAN_OFF');

            const description = reportedStateBool
              ? `Thiết bị tự ghi nhận: BẬT ${actuator.name} từ ${actorName}.`
              : `Thiết bị tự ghi nhận: TẮT ${actuator.name} từ ${actorName}.`;

            await this.prisma.aCTIVITY_LOGS.create({
              data: {
                Device_ID: device.Device_ID,
                event_type: eventType,
                status: 'success',
                description,
              },
            });
          }
        }
      }
    }

    const readingsToInsert: { Sensor_ID: string; value: number }[] = [];

    for (const sensor of device.sensors) {
      let val = null;
      if (sensor.type === 'temperature')
        val = payload.temp ?? payload.temperature;
      if (sensor.type === 'humidity')
        val = payload.humi ?? payload.humidity ?? payload.hum;
      if (sensor.type === 'soil_moisture')
        val = payload.soil ?? payload.soil_moisture ?? payload.soilMoisture;
      if (sensor.type === 'light')
        val = payload.light ?? payload.lightLux ?? payload.light_lux;

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

      // --- ĐỒNG BỘ TRẠNG THÁI ACTUATORS TỪ TELEMETRY ---
      // ESP32 đã tự quản lý Auto Mode và Cooldown, Server không nên can thiệp logic Thresholds
      // Server chỉ cập nhật Activity Logs khi nhận thấy pumpState/fanState thay đổi từ telemetry.
      
      if (payload.pumpState !== undefined) {
        const pumpActuator = device.actuators.find(a => a.name.toLowerCase().includes('bơm'));
        if (pumpActuator) {
          const lastLog = await this.prisma.aCTUATOR_LOGS.findFirst({
            where: { Actuator_ID: pumpActuator.Actuator_ID },
            orderBy: { occurred_at: 'desc' },
          });
          const isCurrentlyOn = lastLog ? lastLog.action === 'ON' : false;

          // Nếu trạng thái thực tế từ ESP khác với Database
          if (payload.pumpState !== isCurrentlyOn) {
            const timeSinceLastLog = lastLog ? (new Date().getTime() - lastLog.occurred_at.getTime()) : 999999;
            // Bỏ qua nếu vừa có lệnh thủ công cách đây < 3 giây (tránh log lặp)
            if (timeSinceLastLog > 3000) {
              const newState = payload.pumpState;
              console.log(`🔄 [SYNC] Máy bơm ESP32 chuyển sang: ${newState ? 'ON' : 'OFF'}`);
              
              await this.prisma.aCTUATOR_LOGS.create({
                data: {
                  Actuator_ID: pumpActuator.Actuator_ID,
                  action: newState ? 'ON' : 'OFF',
                  triggered_by: 'ESP32_AUTO',
                },
              });
              await this.logsService.createSystemLog(
                device.Device_ID,
                newState ? 'CẢNH BÁO ĐẤT KHÔ' : 'ĐẤT ĐỦ ẨM',
                newState ? 'warning' : 'success',
                newState 
                  ? 'Mạch tự động BẬT máy bơm do độ ẩm đất giảm xuống dưới mức an toàn (quá khô).' 
                  : 'Mạch tự động TẮT máy bơm do đất đã đạt đủ độ ẩm an toàn.',
              );
            }
          }
        }
      }

      if (payload.fanState !== undefined) {
        const fanActuator = device.actuators.find(a => a.type === 'fan' || a.name.toLowerCase().includes('quạt'));
        if (fanActuator) {
          const lastLog = await this.prisma.aCTUATOR_LOGS.findFirst({
            where: { Actuator_ID: fanActuator.Actuator_ID },
            orderBy: { occurred_at: 'desc' },
          });
          const isCurrentlyOn = lastLog ? lastLog.action === 'ON' : false;

          if (payload.fanState !== isCurrentlyOn) {
            const timeSinceLastLog = lastLog ? (new Date().getTime() - lastLog.occurred_at.getTime()) : 999999;
            if (timeSinceLastLog > 3000) {
              const newState = payload.fanState;
              console.log(`🔄 [SYNC] Quạt ESP32 chuyển sang: ${newState ? 'ON' : 'OFF'}`);
              
              await this.prisma.aCTUATOR_LOGS.create({
                data: {
                  Actuator_ID: fanActuator.Actuator_ID,
                  action: newState ? 'ON' : 'OFF',
                  triggered_by: 'ESP32_AUTO',
                },
              });
              await this.logsService.createSystemLog(
                device.Device_ID,
                newState ? 'CẢNH BÁO QUÁ NHIỆT' : 'NHIỆT ĐỘ AN TOÀN',
                newState ? 'warning' : 'success',
                newState 
                  ? 'Nhiệt độ môi trường vượt mức an toàn, mạch tự động BẬT quạt làm mát!' 
                  : 'Nhiệt độ đã giảm xuống mức an toàn, mạch tự động TẮT quạt.',
              );
            }
          }
        }
      }

      // --- KIỂM TRA VÀ GHI LOG CẢNH BÁO ĐỘC LẬP TỪ SENSORS ---
      // Chỉ ghi log tối đa 1 lần mỗi 5 phút (300000ms) để tránh spam database
      if (payload.alertSoil) {
        if (this.shouldLogAlert(device.Device_ID, 'alertSoil', 300000)) {
          const soilVal = payload.soilMoisture ?? payload.soil ?? 0;
          const displaySoil = Math.max(0, Number(soilVal)).toFixed(0);
          await this.logsService.createSystemLog(
            device.Device_ID,
            'CẢNH BÁO ĐẤT KHÔ',
            'warning-dark',
            `Độ ẩm đất hiện tại đang ở mức quá thấp (${displaySoil}%), dưới ngưỡng an toàn!`,
          );
        }
      }

      if (payload.alertTemp) {
        if (this.shouldLogAlert(device.Device_ID, 'alertTemp', 300000)) {
          const tempVal = payload.temperature ?? payload.temp ?? 0;
          const displayTemp = Number(tempVal).toFixed(1);
          await this.logsService.createSystemLog(
            device.Device_ID,
            'CẢNH BÁO QUÁ NHIỆT',
            'warning',
            `Nhiệt độ môi trường đang ở mức quá cao (${displayTemp}°C), vượt ngưỡng an toàn!`,
          );
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
