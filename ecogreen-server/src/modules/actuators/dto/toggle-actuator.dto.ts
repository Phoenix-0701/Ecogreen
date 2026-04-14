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
