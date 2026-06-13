import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Đặt đường dẫn là: POST /users/register
  @ApiOperation({ summary: 'Register new user' })
  @Post('register')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.create(createUserDto);

    return {
      message: '🎉 Tạo tài khoản thành công!',
      data: newUser,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my profile',
  })
  @UseGuards(AuthGuard)
  @Get('me') // Route: GET /v1/users/me
  async getMyProfile(@Request() req) {
    // Tự động lấy User ID từ cục Token gửi lên
    const userId = req.user.sub;
    const profile = await this.usersService.getProfile(userId);

    // Chuẩn hóa { message, data }
    return {
      message: 'Lấy thông tin cá nhân thành công',
      data: profile,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update name, nickname' })
  @UseGuards(AuthGuard)
  @Patch('me') // Route: PATCH /v1/users/me
  async updateMyProfile(@Request() req, @Body() dto: UpdateUserDto) {
    const userId = req.user.sub;
    const updatedProfile = await this.usersService.updateProfile(userId, dto);

    // Chuẩn hóa { message, data }
    return {
      message: 'Cập nhật thông tin cá nhân thành công',
      data: updatedProfile,
    };
  }

  @ApiOperation({ summary: 'Get all users' })
  @UseGuards(AuthGuard)
  @Get()
  async findAllUsers() {
    const users = await this.usersService.findAll();

    return {
      message: 'Lấy danh sách người dùng thành công',
      data: users,
    };
  }
}
