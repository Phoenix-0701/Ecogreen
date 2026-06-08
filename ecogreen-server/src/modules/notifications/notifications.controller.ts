import { Controller, Get, Body, UseGuards, Request, Patch } from '@nestjs/common';
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
      data: config,
    };
  }

  @Patch('config')
  @ApiOperation({ summary: 'Cập nhật cấu hình thông báo' })
  async updateConfig(@Request() req, @Body() dto: UpsertNotificationConfigDto) {
    const userId = req.user.sub;
    const config = await this.notificationsService.upsertConfig(userId, dto);

    return {
      message: 'Cập nhật cấu hình thông báo thành công',
      data: config,
    };
  }
}