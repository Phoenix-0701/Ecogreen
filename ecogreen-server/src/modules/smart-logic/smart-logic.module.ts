import { Module } from '@nestjs/common';
import { SmartLogicService } from './smart-logic.service';
import { SmartLogicController } from './smart-logic.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SmartLogicController],
  providers: [SmartLogicService],
  exports: [SmartLogicService], 
})
export class SmartLogicModule {}