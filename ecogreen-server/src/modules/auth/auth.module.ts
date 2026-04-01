import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt'; // <-- 1. Import JwtModule

@Module({
  imports: [
    // 2. Cấu hình máy in thẻ
    JwtModule.register({
      global: true, // Cho phép dùng thợ làm thẻ ở mọi nơi trong dự án
      secret: process.env.JWT_SECRET || 'ecogreen_super_secret_key_2026', // Mật mã đóng dấu
      signOptions: { expiresIn: '1d' }, // Thẻ này có hạn sử dụng 1 ngày (1 day)
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
