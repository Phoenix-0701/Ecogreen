import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from './events.gateway';
import { SensorsService } from './modules/sensors/sensors.service';
import { DevicesService } from './modules/devices/devices.service';
import { SchedulesService } from './modules/schedules/schedules.service';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from './modules/prisma/prisma.service';
import { LogsService } from './modules/logs/logs.service';

@Controller()
export class AppController {
  private lastTelemetryReceived = new Map<string, number>();
  private lastWeatherSync = new Map<string, number>();

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly sensorsService: SensorsService,
    private readonly devicesService: DevicesService,
    private readonly schedulesService: SchedulesService,
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  @EventPattern('ecogreen/telemetry/+')
  @EventPattern('ecogreen/sensor/data')
  @MessagePattern('ecogreen/test')
  async handleTelemetry(@Payload() data: any) {
    try {
      let payload = data?.payload ?? data?.message ?? data;
      if (typeof payload === 'string') {
        payload = JSON.parse(payload);
      }

      console.log('📡 [MQTT-LOCAL] Nhận gói tin telemetry từ ESP32:', payload);

      const mac = payload?.mac ?? payload?.mac_address;
      if (mac) {
        const result = await this.sensorsService.saveSensorData(mac, payload);
        if (result === null) {
          this.devicesService.addDiscoveredMac(mac);
        } else {
          if (result.success && result.wasOffline) {
            console.log(`🔌 [Device-Status] Thiết bị ${result.deviceName} (${mac}) đã kết nối lại -> ONLINE`);
            this.eventsGateway.server.emit('device-status', {
              Device_ID: result.deviceId,
              status: 'online',
              name: result.deviceName,
            });

            // Ghi nhận sự kiện thiết bị hoạt động lại vào nhật ký
            await this.logsService.createSystemLog(
              result.deviceId,
              'THIẾT BỊ ONLINE',
              'success',
              `Thiết bị ${result.deviceName} (${mac}) đã kết nối lại thành công.`,
            );
          }

          // Tự động đồng bộ trạng thái SmartLogic khi thiết bị kết nối lại hoặc khởi động lại
          const now = Date.now();
          const lastTime = this.lastTelemetryReceived.get(mac) || 0;
          this.lastTelemetryReceived.set(mac, now);

          const isFirstTime = !this.lastWeatherSync.has(mac);
          const didReconnect = lastTime > 0 && (now - lastTime > 10000);

          if (isFirstTime || didReconnect) {
            this.lastWeatherSync.set(mac, now);
            console.log(`🔄 [SmartLogic] Thiết bị ${mac} vừa kết nối/khởi động lại -> Tự động đồng bộ trạng thái thời tiết...`);
            this.schedulesService.runSmartLogicForAllDevices().catch((err) =>
              console.error(`❌ Lỗi đồng bộ SmartLogic cho ${mac}:`, err.message)
            );
          }

          // Chỉ broadcast dữ liệu realtime khi thiết bị đã được đăng ký thành công
          this.eventsGateway.broadcastSensorData({
            source: 'ESP32',
            payload,
            message: payload,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Loi xu ly MQTT:', error);
    }
  }

  @EventPattern('ecogreen/command')
  handleCommand(@Payload() data: any) {
    console.log('Command:', data);
  }

  @Interval(10000)
  async checkOfflineDevices() {
    try {
      const thresholdTime = new Date(Date.now() - 10000); // 10s limit
      
      // Tìm các thiết bị đang online nhưng last_seen_at đã quá 10 giây
      const offlineDevices = await this.prisma.dEVICES.findMany({
        where: {
          status: 'online',
          OR: [
            { last_seen_at: { lt: thresholdTime } },
            { last_seen_at: null }
          ]
        }
      });

      for (const device of offlineDevices) {
        await this.prisma.dEVICES.update({
          where: { Device_ID: device.Device_ID },
          data: { status: 'offline' }
        });

        console.log(`🔌 [Device-Status] Thiết bị ${device.name} (${device.mac_address}) đã mất kết nối -> OFFLINE`);

        // Ghi nhận sự kiện thiết bị mất kết nối vào nhật ký
        await this.logsService.createSystemLog(
          device.Device_ID,
          'CẢNH BÁO MẤT KẾT NỐI',
          'error',
          `Thiết bị ${device.name} (${device.mac_address}) đã mất kết nối với hệ thống!`,
        );

        // Gửi thông báo WebSocket cho Frontend
        this.eventsGateway.server.emit('device-status', {
          Device_ID: device.Device_ID,
          status: 'offline',
          name: device.name,
        });
      }
    } catch (error) {
      console.error('Loi checkOfflineDevices:', error);
    }
  }
}
