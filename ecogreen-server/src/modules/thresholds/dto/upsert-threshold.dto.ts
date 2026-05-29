import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpsertThresholdDto {
  @ApiProperty()
  @IsString()
  Sensor_ID: string;

  @ApiProperty()
  @IsString()
  Actuator_ID: string;

  @ApiProperty()
  @IsNumber()
  min_value: number;

  @ApiProperty()
  @IsNumber()
  max_value: number;

  @ApiProperty()
  @IsBoolean()
  is_enabled: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  max_pump_sec?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  cooldown_sec?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  temp_high?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  temp_low?: number;
}
