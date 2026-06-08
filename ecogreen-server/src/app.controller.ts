import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from './events.gateway';
import { SensorsService } from './modules/sensors/sensors.service';
import { DevicesService } from './modules/devices/devices.service';
import { SchedulesService } from './modules/schedules/schedules.service';

@Controller()
export class AppController {
  private lastTelemetryReceived = new Map<string, number>();
  private lastWeatherSync = new Map<string, number>();

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly sensorsService: SensorsService,
    private readonly devicesService: DevicesService,
    private readonly schedulesService: SchedulesService,
  ) {}

  @EventPattern('ecogreen/telemetry/+')
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
        const isSaved = await this.sensorsService.saveSensorData(mac, payload);
        if (isSaved === null) {
          this.devicesService.addDiscoveredMac(mac);
        }

        // Tự động đồng bộ trạng thái SmartLogic khi thiết bị kết nối lại hoặc khởi động lại
        const now = Date.now();
        const lastTime = this.lastTelemetryReceived.get(mac) || 0;
        this.lastTelemetryReceived.set(mac, now);

        const isFirstTime = !this.lastWeatherSync.has(mac);
        const didReconnect = lastTime > 0 && (now - lastTime > 15000);

        if (isFirstTime || didReconnect) {
          this.lastWeatherSync.set(mac, now);
          console.log(`🔄 [SmartLogic] Thiết bị ${mac} vừa kết nối/khởi động lại -> Tự động đồng bộ trạng thái thời tiết...`);
          this.schedulesService.runSmartLogicForAllDevices().catch((err) =>
            console.error(`❌ Lỗi đồng bộ SmartLogic cho ${mac}:`, err.message)
          );
        }
      }

      this.eventsGateway.broadcastSensorData({
        source: 'ESP32',
        payload,
        message: payload,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Loi xu ly MQTT:', error);
    }
  }

  @EventPattern('ecogreen/command')
  handleCommand(@Payload() data: any) {
    console.log('Command:', data);
  }
}
