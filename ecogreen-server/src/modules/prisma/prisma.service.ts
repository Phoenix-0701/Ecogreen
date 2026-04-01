import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Đã kết nối thành công tới Database PostgreSQL qua Prisma!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
