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

// import { Controller } from '@nestjs/common';
// import { MessagePattern, Payload } from '@nestjs/microservices';
// import { EventsGateway } from './events.gateway';

// @Controller()
// export class AppController {
//   constructor(private readonly eventsGateway: EventsGateway) {}

//   @MessagePattern('ecogreen/telemetry')
//   handleTelemetry(@Payload() data: any) {
//     console.log('📬 Telemetry từ ESP32:', data);
//     this.eventsGateway.broadcastSensorData({
//       source: 'ESP32',
//       message: data,
//       timestamp: new Date().toISOString(),
//     });
//   }
// }

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from './events.gateway';
import { SensorsService } from './modules/sensors/sensors.service'; // <-- Import thêm

@Controller()
export class AppController {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly sensorsService: SensorsService, // <-- Tiêm anh thợ lưu DB vào đây
  ) {}

  @MessagePattern('ecogreen/test')
  async handleMqttMessage(@Payload() data: any) {
    try {
      // 1. Rút trích data và ép kiểu JSON
      let payload = data.payload || data.message || data;
      if (typeof payload === 'string') payload = JSON.parse(payload);

      console.log('📬 Nhận MQTT:', payload);

      // 2. LƯU VÀO DATABASE (CHỈ KHI ESP32 CÓ GỬI KÈM MÃ MAC)
      if (payload.mac || payload.mac_address) {
        const mac = payload.mac || payload.mac_address;
        await this.sensorsService.saveSensorData(mac, payload);
      } else {
        console.log(
          '⚠️ Data không có MAC Address, chỉ bắn WebSocket chứ không lưu DB.',
        );
      }

      // 3. Bắn WebSocket cho Frontend
      this.eventsGateway.broadcastSensorData({
        source: 'ESP32',
        payload: payload,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Lỗi xử lý MQTT:', error);
    }
  }
}
