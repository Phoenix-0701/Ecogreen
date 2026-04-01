import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Đặt Global để dùng Prisma ở mọi module khác mà không cần import lại nhiều lần
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
