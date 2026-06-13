import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { GoogleGuard } from './google.guard';

@ApiTags('Authentication')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const tokenData = await this.authService.login(loginDto);

    return {
      message: 'Đăng nhập thành công!',
      data: tokenData,
    };
  }

  @ApiOperation({ summary: 'Logout' })
  @Post('logout')
  async logout() {
    return {
      message: 'Đăng xuất thành công!',
    };
  }

  // Google OAuth routes — only active when credentials are configured
  @ApiOperation({ summary: 'Active Oauth2' })
  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth() {
    // GoogleGuard will handle the redirection automatically
  }

  @ApiOperation({ summary: 'Automatic data capture point' })
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/dashboard?token=${result.access_token}`);
  }
}
