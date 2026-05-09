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

    if (!user.password_hash) {
      throw new UnauthorizedException(
        'Tài khoản này được liên kết với Google. Vui lòng sử dụng Đăng nhập bằng Google!',
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

  async googleLogin(req: any) {
    if (!req.user) {
      return { message: 'Không có thông tin từ Google' };
    }

    const { provider_id, email, full_name, avatar_url } = req.user;

    // 1. Tìm xem trong Database có ai dùng email hoặc ID này chưa
    let user = await this.prisma.uSERS.findFirst({
      where: {
        OR: [{ provider_id: provider_id }, { email: email }],
      },
    });

    if (!user) {
      user = await this.prisma.uSERS.create({
        data: {
          username:
            email.split('@')[0] + '_' + Math.floor(Math.random() * 1000),
          email: email,
          full_name: full_name,
          avatar_url: avatar_url,
          auth_provider: 'google',
          provider_id: provider_id,
        },
      });
    } else if (!user.provider_id) {
      user = await this.prisma.uSERS.update({
        where: { email: email },
        data: {
          provider_id: provider_id,
          auth_provider: 'google',
          avatar_url: avatar_url || user.avatar_url,
        },
      });
    }

    const payload = { sub: user.User_ID, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: '🎉 Đăng nhập bằng Google thành công!',
      access_token: accessToken,
      user: {
        User_ID: user.User_ID,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    };
  }
}
