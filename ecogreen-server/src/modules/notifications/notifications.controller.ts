import { Controller, Get, Body, UseGuards, Request, Patch, Put, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UpsertNotificationConfigDto } from './dto/upsert-notification-config.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications (Cấu hình Cảnh báo)')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Lấy cấu hình nhận thông báo (Telegram/Email) của tôi' })
  async getConfig(@Request() req) {
    const userId = req.user.sub;
    const config = await this.notificationsService.getConfig(userId);

    // 🟢 CHUẨN HÓA
    return {
      message: 'Lấy cấu hình thông báo thành công',
      data: {
        ...config,
        tg_bot_token_encrypted: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : undefined,
      },
    };
  }

  @Put('config')
  @ApiOperation({ summary: 'Cập nhật cấu hình thông báo (PUT)' })
  async updateConfigPut(@Request() req, @Body() dto: UpsertNotificationConfigDto) {
    return this.updateConfig(req, dto);
  }

  @Patch('config')
  @ApiOperation({ summary: 'Cập nhật cấu hình thông báo (PATCH)' })
  async updateConfigPatch(@Request() req, @Body() dto: UpsertNotificationConfigDto) {
    return this.updateConfig(req, dto);
  }

  private async updateConfig(req, dto: UpsertNotificationConfigDto) {
    const userId = req.user.sub;
    const config = await this.notificationsService.upsertConfig(userId, dto);

    return {
      message: 'Cập nhật cấu hình thông báo thành công',
      data: {
        ...config,
        tg_bot_token_encrypted: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : undefined,
      },
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Gửi tin nhắn test tới Telegram' })
  async testNotification(@Request() req, @Body() body: { channel: string }) {
    const userId = req.user.sub;

    if (body.channel === 'telegram') {
      const msg = `🔔 <b>TIN NHẮN THỬ NGHIỆM</b>\n\nChúc mừng! Kết nối cảnh báo Telegram của bạn đã hoạt động chính xác!`;
      const success = await this.notificationsService.sendTelegramMessage(userId, msg, false, true);
      if (!success) {
        return {
          success: false,
          message: 'Gửi tin nhắn test thất bại. Hãy chắc chắn bạn đã nhấn START bot và lưu đúng Chat ID.',
        };
      }
      return {
        success: true,
        message: 'Đã gửi tin nhắn test thành công tới Telegram!',
      };
    }

    return {
      success: false,
      message: 'Kênh thông báo không hỗ trợ test.',
    };
  }
}