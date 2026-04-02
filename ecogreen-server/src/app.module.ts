// import { Module } from '@nestjs/common';
// import { UsersModule } from './modules/users/users.module';
// import { AuthModule } from './modules/auth/auth.module';
// import { PrismaModule } from './modules/prisma/prisma.module';

// @Module({
//   imports: [
//     // DatabaseConfigModule,
//     UsersModule,
//     AuthModule,
//     PrismaModule,
//   ],
//   controllers: [], // Không để controller lộn xộn ở đây
//   providers: [], // Không để service lộn xộn ở đây
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
<<<<<<< HEAD
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
=======
import { AppController } from './app.controller';

@Module({
  imports: [UsersModule, AuthModule, PrismaModule],
  controllers: [AppController],
  providers: [],
>>>>>>> 43c3d7e50fb0208fb01d6b493a8361103a493718
})
export class AppModule {}
