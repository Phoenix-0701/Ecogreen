import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from './events.gateway';
import { SensorsService } from './modules/sensors/sensors.service';
import { DevicesService } from './modules/devices/devices.service';

@Controller()
export class AppController {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly sensorsService: SensorsService,
    private readonly devicesService: DevicesService,
  ) {}

  @EventPattern('ecogreen/telemetry/+')
  @MessagePattern('ecogreen/test')
  async handleTelemetry(@Payload() data: any) {
    try {
      let payload = data?.payload ?? data?.message ?? data;
      if (typeof payload === 'string') {
        payload = JSON.parse(payload);
      }

      const mac = payload?.mac ?? payload?.mac_address;
      if (mac) {
        const isSaved = await this.sensorsService.saveSensorData(mac, payload);
        if (isSaved === null) {
          this.devicesService.addDiscoveredMac(mac);
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
