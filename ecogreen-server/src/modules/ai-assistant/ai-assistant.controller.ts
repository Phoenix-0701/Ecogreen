import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiService: AiAssistantService) {}

  @Post('voice-command')
  @ApiOperation({ summary: 'Process voice command to control devices' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'Bật bơm nước 5 phút' },
        deviceId: { type: 'string', example: 'd1', nullable: true },
      },
    },
  })
  async processVoiceCommand(
    @Req() req: any,
    @Body() body: { text: string; deviceId?: string },
  ) {
    // userId from JWT Token
    const userId = req.user.userId;
    
    return this.aiService.processVoiceCommand(body.text, body.deviceId, userId);
  }
}
