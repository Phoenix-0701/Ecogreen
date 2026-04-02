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

@Controller()
export class AppController {
  @MessagePattern('ecogreen/telemetry')
  handleTelemetry(@Payload() data: any) {
    console.log('📬 Telemetry từ ESP32:', data);
  }
}
