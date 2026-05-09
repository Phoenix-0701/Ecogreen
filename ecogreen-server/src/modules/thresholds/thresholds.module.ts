import { Module } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { ThresholdsController } from './thresholds.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ThresholdsController],
  providers: [ThresholdsService],
})
export class ThresholdsModule {}
