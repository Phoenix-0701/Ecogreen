import { Module } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { ThresholdsController } from './thresholds.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Serializer, OutgoingEvent } from '@nestjs/microservices';

class RawMqttSerializer implements Serializer {
  serialize(value: OutgoingEvent): any {
    return JSON.stringify(value.data);
  }
}

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'MQTT_SERVICE',
        transport: Transport.MQTT,
        options: {
          url: process.env.MQTT_URL || 'mqtt://broker.emqx.io:1883',
          serializer: new RawMqttSerializer(),
        },
      },
    ]),
  ],
  controllers: [ThresholdsController],
  providers: [ThresholdsService],
})
export class ThresholdsModule {}
