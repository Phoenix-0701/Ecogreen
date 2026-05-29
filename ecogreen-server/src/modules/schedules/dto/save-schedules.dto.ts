import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleRuleDto {
  @ApiProperty({ description: 'ID of the schedule rule' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Title of the schedule rule' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Target zone' })
  @IsString()
  zone: string;

  @ApiProperty({ description: 'Icon name' })
  @IsString()
  icon: string;

  @ApiProperty({ description: 'Start time (HH:MM)' })
  @IsString()
  time: string;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  durationMinutes: number;

  @ApiProperty({ description: 'Days of week (0 = Sunday, 1-6 = Mon-Sat)', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  days: number[];

  @ApiProperty({ description: 'Whether this schedule is enabled' })
  @IsBoolean()
  enabled: boolean;
}

export class SaveSchedulesDto {
  @ApiProperty({ description: 'Whether scheduling is globally enabled for the device' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'List of schedule rules', type: [ScheduleRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleRuleDto)
  schedules: ScheduleRuleDto[];
}
