import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AppController } from './app.controller';
import { EventsGateway } from './events.gateway';
import { DevicesModule } from './modules/devices/devices.module';
import { SensorsModule } from './modules/sensors/sensors.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    DevicesModule,
    SensorsModule,
  ],
  controllers: [AppController],
  providers: [EventsGateway],
})
export class AppModule {}
