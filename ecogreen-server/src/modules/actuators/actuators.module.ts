import { Module } from '@nestjs/common';
import { ActuatorsService } from './actuators.service';
import { ActuatorsController } from './actuators.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'MQTT_SERVICE',
        transport: Transport.MQTT,
        options: { url: 'mqtt://localhost:1883' },
      },
    ]),
  ],
  controllers: [ActuatorsController],
  providers: [ActuatorsService],
  exports: [ActuatorsService],
})
export class ActuatorsModule {}
