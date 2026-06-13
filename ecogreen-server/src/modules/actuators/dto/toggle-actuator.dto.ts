import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleActuatorDto {
  @ApiProperty({
    example: true,
    description: 'Trạng thái muốn điều khiển: true (Bật), false (Tắt)',
  })
  @IsBoolean()
  state: boolean;
}

export class SetModeDto {
  @ApiProperty({
    example: true,
    description: 'Chế độ hoạt động: true (Tự động), false (Thủ công)',
  })
  @IsBoolean()
  autoMode: boolean;
}

