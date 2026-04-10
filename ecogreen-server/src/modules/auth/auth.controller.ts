import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport'; // <-- Import cực kỳ quan trọng!
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- 2 API MỚI DÀNH CHO GOOGLE ---

  // 1. Khách gọi vào đây: Cảnh sát sẽ tự động ném khách sang trang đăng nhập của Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Không cần viết code ở đây, Passport tự làm hết!
  }

  // 2. Google ném khách về lại đây kèm thông tin: Bồi bàn gọi Service lấy Token
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }
}
