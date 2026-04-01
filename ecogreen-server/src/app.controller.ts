import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern('ecogreen/test')
  handleMqttMessage(@Payload() data: string) {
    console.log('📬 CÓ THƯ TỪ ESP32 GỬI LÊN:', data);
  }
}
