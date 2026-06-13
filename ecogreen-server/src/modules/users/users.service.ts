import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  // Tiêm PrismaService vào đây
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );
    const newUser = await this.prisma.uSERS.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        password_hash: hashedPassword,
        full_name: createUserDto.full_name,
      },
    });

    return {
      message: '🎉 Tạo tài khoản thành công và đã lưu vào DB!',
      user: newUser,
    };
  }

  findAll() {
    return this.prisma.uSERS.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // Lấy thông tin cá nhân của người dùng
  async getProfile(userId: string) {
    const user = await this.prisma.uSERS.findUnique({
      where: { User_ID: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  //  CẬP NHẬT THÔNG TIN CÁ NHÂN
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const updatedUser = await this.prisma.uSERS.update({
      where: { User_ID: userId },
      data: {
        full_name: dto.full_name,
        username: dto.username,
      },
    });

    const { password_hash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
