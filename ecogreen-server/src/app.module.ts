
import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AppController } from './app.controller';
import { EventsGateway } from './events.gateway';
@Module({
  imports: [UsersModule, AuthModule, PrismaModule],
  controllers: [AppController],
  providers: [EventsGateway],
})
export class AppModule {}
