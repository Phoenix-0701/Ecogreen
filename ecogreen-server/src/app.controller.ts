// import { Controller } from '@nestjs/common';
// import { MessagePattern, Payload } from '@nestjs/microservices';

// @Controller()
// export class AppController {
// //   @MessagePattern('ecogreen/test')
// //   handleMqttMessage(@Payload() data: string) {
// //     console.log('📬 CÓ THƯ TỪ ESP32 GỬI LÊN:', data);
// //   }
// // }

// @MessagePattern('ecogreen/telemetry')
// handleTelemetry(@Payload() data: any) {
//   console.log('📬 Telemetry từ ESP32:', data);
// }
// }

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from './events.gateway';

@Controller()
export class AppController {
<<<<<<< HEAD
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
=======
  @MessagePattern('ecogreen/telemetry')
  handleTelemetry(@Payload() data: any) {
    console.log('📬 Telemetry từ ESP32:', data);
>>>>>>> 43c3d7e50fb0208fb01d6b493a8361103a493718
  }
}
