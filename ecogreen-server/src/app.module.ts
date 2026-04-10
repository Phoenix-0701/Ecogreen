import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AppController } from './app.controller';
import { EventsGateway } from './events.gateway';
import { DevicesModule } from './modules/devices/devices.module';

@Module({
  imports: [UsersModule, AuthModule, PrismaModule, DevicesModule],
  controllers: [AppController],
  providers: [EventsGateway],
})
export class AppModule {}
