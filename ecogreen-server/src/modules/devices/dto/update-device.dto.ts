import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceDto {
  @ApiProperty({
    description: 'Tên mới của thiết bị',
    example: 'Vườn Hoa Hồng',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
