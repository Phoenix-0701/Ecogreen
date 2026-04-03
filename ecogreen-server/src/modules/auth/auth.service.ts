import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

    // JWT
    const payload = {
      sub: user.User_ID,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: '🎉 Đăng nhập thành công!',
      access_token: accessToken,
      user: {
        User_ID: user.User_ID,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }
}
