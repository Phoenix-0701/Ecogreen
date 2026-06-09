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

    const dbData: any = {
      notify_on_error: dto.notify_on_error,
      notify_on_action: dto.notify_on_action,
      notify_on_config: dto.notify_on_config,
    };
    if (dto.tg_chat_id !== undefined) dbData.tg_chat_id = dto.tg_chat_id;
    if (dto.smtp_email !== undefined) dbData.smtp_email = dto.smtp_email;
    if (dto.smtp_password !== undefined) {
      dbData.smtp_password_encrypted = dto.smtp_password;
    }

    if (existing) {
      return this.prisma.nOTIFICATION_CONFIGS.update({
        where: { Config_ID: existing.Config_ID },
        data: dbData,
      });
    } else {
      return this.prisma.nOTIFICATION_CONFIGS.create({
        data: { ...dbData, User_ID: userId },
      });
    }
  }
  
  // 🔔 Gửi Telegram cho chủ thiết bị theo Device_ID (không cần biết User_ID)
  async sendNotificationToDeviceOwner(deviceId: string, message: string, isError: boolean = false) {
    try {
      const device = await this.prisma.dEVICES.findUnique({
        where: { Device_ID: deviceId },
        select: { User_ID: true },
      });
      if (!device) return false;
      return this.sendTelegramMessage(device.User_ID, message, isError);
    } catch (error) {
      this.logger.error(`❌ sendNotificationToDeviceOwner lỗi: ${error.message}`);
      return false;
    }
  }

  // 🔔 Gửi Telegram cho cập nhật cấu hình (ngưỡng / lịch) — kiểm tra notify_on_config
  async sendNotificationToDeviceOwnerOnConfig(deviceId: string, message: string) {
    try {
      const device = await this.prisma.dEVICES.findUnique({
        where: { Device_ID: deviceId },
        select: { User_ID: true },
      });
      if (!device) return false;
      return this.sendTelegramMessageOnConfig(device.User_ID, message);
    } catch (error) {
      this.logger.error(`❌ sendNotificationToDeviceOwnerOnConfig lỗi: ${error.message}`);
      return false;
    }
  }

  //  TELE
 
  async sendTelegramMessage(userId: string, message: string, isError: boolean = false, bypassChecks: boolean = false) {
    try {
      const config = await this.getConfig(userId);
      if (!config || !config.tg_chat_id) return false;
      
      if (!bypassChecks) {
        if (isError && !config.notify_on_error) return false;
        if (!isError && !config.notify_on_action) return false;
      }

      return this._dispatchTelegram(config.tg_chat_id, message, userId);
    } catch (error) {
      this.logger.error(`❌ Lỗi hệ thống khi gửi Telegram: ${error.message}`);
      return false;
    }
  }

  // Gửi Telegram kiểm tra notify_on_config
  async sendTelegramMessageOnConfig(userId: string, message: string) {
    try {
      const config = await this.getConfig(userId);
      if (!config || !config.tg_chat_id) return false;
      if (!(config as any).notify_on_config) return false;
      return this._dispatchTelegram(config.tg_chat_id, message, userId);
    } catch (error) {
      this.logger.error(`❌ Lỗi gửi Telegram (config): ${error.message}`);
      return false;
    }
  }

  private async _dispatchTelegram(chatId: string, message: string, userId: string): Promise<boolean> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        this.logger.error('❌ Chưa khai báo TELEGRAM_BOT_TOKEN trong file .env');
        return false;
      }

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        this.logger.error(`❌ Gửi Telegram thất bại tới Chat ID: ${chatId}`);
        return false;
      }

      this.logger.log(`📱 Đã gửi Telegram thành công tới User: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ _dispatchTelegram lỗi: ${error.message}`);
      return false;
    }
  }
}