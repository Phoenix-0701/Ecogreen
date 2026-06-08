import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertSmartLogicDto {
  @ApiProperty({ description: 'Tên thành phố (Ví dụ: Ho Chi Minh, Hanoi)' })
  @IsString()
  city_name: string;

  @ApiProperty({ description: 'Ngưỡng xác suất mưa để hủy tưới (%)', example: 70 })
  @IsNumber()
  rain_prob_threshold: number;

  @ApiProperty({ description: 'Bật/Tắt chế độ thông minh', example: true })
  @IsBoolean()
  is_smart_mode: boolean;
}