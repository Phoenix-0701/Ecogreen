import { Module, forwardRef } from '@nestjs/common';
import { SmartLogicService } from './smart-logic.service';
import { SmartLogicController } from './smart-logic.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SchedulesModule)],
  controllers: [SmartLogicController],
  providers: [SmartLogicService],
  exports: [SmartLogicService],
})
export class SmartLogicModule {}