import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from './events.gateway';

@Controller()
export class AppController {
  constructor(private readonly eventsGateway: EventsGateway) {}

  @MessagePattern('ecogreen/test')
  handleMqttMessage(@Payload() data: string) {
    console.log(' CÓ THƯ TỪ ESP32 GỬI LÊN:', data);

    // Gọi PrismaService để lưu data vào Database ở đây

    //  Gửi tt lên cho FE
    this.eventsGateway.broadcastSensorData({
      source: 'ESP32',
      message: data,
      timestamp: new Date().toISOString(),
    });
  }
}
