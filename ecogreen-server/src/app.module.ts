import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    // DatabaseConfigModule,
    UsersModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [], // Không để controller lộn xộn ở đây
  providers: [], // Không để service lộn xộn ở đây
})
export class AppModule {}
