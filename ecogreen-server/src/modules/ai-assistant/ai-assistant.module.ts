import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActuatorsModule } from '../actuators/actuators.module';

@Module({
  imports: [PrismaModule, ActuatorsModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
})
export class AiAssistantModule {}
