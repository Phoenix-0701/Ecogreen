import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Họ và tên đầy đủ',
    example: 'Nguyễn Hữu Thời',
    required: false,
  })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({
    description: 'Tên hiển thị ngắn (Nickname)',
    example: 'thoi_nguyen',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;
}
