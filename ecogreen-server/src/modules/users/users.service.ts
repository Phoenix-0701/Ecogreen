import { Injectable } from '@nestjs/common';
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

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
