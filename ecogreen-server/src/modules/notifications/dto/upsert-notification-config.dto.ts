import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertNotificationConfigDto {
  @ApiProperty({ description: 'Chat ID của Telegram', required: false })
  @IsString()
  @IsOptional()
  tg_chat_id?: string;

  @ApiProperty({ description: 'Email nhận thông báo', required: false })
  @IsString()
  @IsOptional()
  smtp_email?: string;

  @ApiProperty({ description: 'Mật khẩu ứng dụng Email', required: false })
  @IsString()
  @IsOptional()
  smtp_password_encrypted?: string;

  @ApiProperty({ description: 'Nhận thông báo khi có lỗi/vượt ngưỡng', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  notify_on_error?: boolean;

  @ApiProperty({ description: 'Nhận thông báo khi máy bơm tự động bật/tắt', required: false, example: false })
  @IsBoolean()
  @IsOptional()
  notify_on_action?: boolean;
}