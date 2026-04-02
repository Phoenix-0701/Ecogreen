import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [
    // DatabaseConfigModule,
    UsersModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [EventsGateway],
})
export class AppModule {}
