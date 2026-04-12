import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices'; // EventPattern, không phải MessagePattern
import { EventsGateway } from './events.gateway';

@Controller()
export class AppController {
  constructor(private readonly eventsGateway: EventsGateway) {}

  @EventPattern('ecogreen/telemetry/+') // wildcard match mọi MAC
  handleTelemetry(@Payload() data: any) {
    console.log('📬 Telemetry từ ESP32:', data);
    this.eventsGateway.broadcastSensorData({
      source: 'ESP32',
      message: data,
      timestamp: new Date().toISOString(),
    });
  }

  @EventPattern('ecogreen/command') // nếu sau này cần gửi lệnh xuống
  handleCommand(@Payload() data: any) {
    console.log('📡 Command:', data);
  }
}
