import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt'; // <-- 1. Import JwtService

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // <-- 2. Tiêm anh thợ làm thẻ vào đầu bếp
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.uSERS.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Username hoặc mật khẩu không chính xác!',
      );
    }

    const isPasswordMatch = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException(
        'Username hoặc mật khẩu không chính xác!',
      );
    }

    // --- PHẦN MỚI: TẠO THẺ VIP (JWT) ---
    // 3. Ghi thông tin cơ bản lên mặt thẻ (Payload).
    // Tuyệt đối KHÔNG ghi password vào đây vì ai cũng có thể đọc mặt thẻ.
    const payload = {
      sub: user.User_ID, // 'sub' (subject) là quy ước chuẩn của quốc tế để lưu ID người dùng
      username: user.username,
    };

    // 4. In thẻ và đóng dấu (Sign)
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: '🎉 Đăng nhập thành công!',
      access_token: accessToken, // <-- 5. Giao chiếc thẻ này cho khách hàng!
      user: {
        User_ID: user.User_ID,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }
}
