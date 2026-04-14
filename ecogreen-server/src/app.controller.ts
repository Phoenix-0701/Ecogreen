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

// import { Controller } from '@nestjs/common';
// import { MessagePattern, Payload } from '@nestjs/microservices';
// import { EventsGateway } from './events.gateway';
// import { SensorsService } from './modules/sensors/sensors.service';
// import { DevicesService } from './modules/devices/devices.service';

// @Controller()
// export class AppController {
//   constructor(
//     private readonly eventsGateway: EventsGateway,
//     private readonly sensorsService: SensorsService,
//     private readonly devicesService: DevicesService,
//   ) {}

//   @MessagePattern('ecogreen/test')
//   async handleMqttMessage(@Payload() data: any) {
//     try {
//       let payload = data.payload || data.message || data;
//       if (typeof payload === 'string') payload = JSON.parse(payload);

//       if (payload.mac || payload.mac_address) {
//         const mac = payload.mac || payload.mac_address;

//         const deviceExists = await this.sensorsService
//           .getSensorsByDevice(mac)
//           .catch(() => null);

//         const isSaved = await this.sensorsService.saveSensorData(mac, payload);

//         if (isSaved === null) {
//           this.devicesService.addDiscoveredMac(mac);
//           console.log(` PHÁT HIỆN MẠCH ESP32 MỚI: ${mac} (Đang chờ đăng ký)`);
//         } else {
//           console.log(` Đã cập nhật data cho thiết bị: ${mac}`);
//         }
//       }

//       this.eventsGateway.broadcastSensorData({
//         source: 'ESP32',
//         payload: payload,
//         timestamp: new Date().toISOString(),
//       });
//     } catch (error) {
//       console.error(' Lỗi xử lý MQTT:', error);
//     }
//   }
// }

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
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

  @MessagePattern('ecogreen/test')
  async handleMqttMessage(@Payload() data: any) {
    try {
      let payload = data.payload || data.message || data;
      if (typeof payload === 'string') payload = JSON.parse(payload);

      const mac = payload.mac || payload.mac_address;

      if (mac) {
        const isSaved = await this.sensorsService.saveSensorData(mac, payload);

        if (isSaved === null) {
          this.devicesService.addDiscoveredMac(mac);
        }
      }

      this.eventsGateway.broadcastSensorData({
        source: 'ESP32',
        payload: payload,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Lỗi xử lý gói tin MQTT:', error);
    }
  }
}
