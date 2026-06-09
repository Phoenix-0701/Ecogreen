import { Module } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { SensorsController } from './sensors.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LogsModule } from '../logs/logs.module';
import { ActuatorsModule } from '../actuators/actuators.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SmartLogicModule } from '../smart-logic/smart-logic.module';

@Module({
  imports: [
    PrismaModule,
    LogsModule,
    ActuatorsModule,
    NotificationsModule,
    SmartLogicModule,
  ],
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
