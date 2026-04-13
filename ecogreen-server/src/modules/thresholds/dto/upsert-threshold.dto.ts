import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class UpsertThresholdDto {
  @IsString()
  Sensor_ID: string;

  @IsString()
  Actuator_ID: string;

  @IsNumber()
  min_value: number;

  @IsNumber()
  max_value: number;

  @IsBoolean()
  is_enabled: boolean;
}
