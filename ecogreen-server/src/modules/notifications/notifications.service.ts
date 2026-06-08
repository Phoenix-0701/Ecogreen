import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertNotificationConfigDto } from './dto/upsert-notification-config.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async getConfig(userId: string) {
    let config = await this.prisma.nOTIFICATION_CONFIGS.findFirst({
      where: { User_ID: userId },
    });

    if (!config) {
      config = await this.prisma.nOTIFICATION_CONFIGS.create({
        data: { User_ID: userId },
      });
    }

    return config;
  }

  async upsertConfig(userId: string, dto: UpsertNotificationConfigDto) {
    const existing = await this.prisma.nOTIFICATION_CONFIGS.findFirst({
      where: { User_ID: userId },
    });

    if (existing) {
      return this.prisma.nOTIFICATION_CONFIGS.update({
        where: { Config_ID: existing.Config_ID },
        data: dto,
      });
    } else {
      return this.prisma.nOTIFICATION_CONFIGS.create({
        data: { ...dto, User_ID: userId },
      });
    }
  }
  
  //  TELE
 
  async sendTelegramMessage(userId: string, message: string, isError: boolean = false) {
    try {
      // 1. Lấy Chat ID ("Địa chỉ nhà") của User đang bị lỗi
      const config = await this.getConfig(userId);

      // Nếu user chưa khai báo Chat ID hoặc đã tắt thông báo thì bỏ qua
      if (!config || !config.tg_chat_id) return false;
      if (isError && !config.notify_on_error) return false;
      if (!isError && !config.notify_on_action) return false;

      // 2. Lấy "Anh bưu tá chung" từ biến môi trường
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        this.logger.error('❌ Chưa khai báo TELEGRAM_BOT_TOKEN trong file .env');
        return false;
      }

      // 3. Giao thư
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.tg_chat_id,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        this.logger.error(`❌ Gửi Telegram thất bại tới Chat ID: ${config.tg_chat_id}. Người dùng có thể chưa bấm START bot.`);
        return false;
      }
      
      this.logger.log(`📱 Đã gửi cảnh báo Telegram thành công tới User: ${userId}`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Lỗi hệ thống khi gửi Telegram: ${error.message}`);
      return false;
    }
  }
}