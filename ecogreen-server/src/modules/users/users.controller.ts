import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Đặt đường dẫn là: POST /users/register
  @ApiOperation({ summary: 'Register new user' })
  @Post('register')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    // Gọi đúng hàm "create" có sẵn trong users.service.ts
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @UseGuards(AuthGuard)
  @Get()
  async findAllUsers() {
    return this.usersService.findAll();
  }
}
