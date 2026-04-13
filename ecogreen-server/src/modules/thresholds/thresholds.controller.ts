import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { UpsertThresholdDto } from './dto/upsert-threshold.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Thresholds')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1')
export class ThresholdsController {
  constructor(private readonly thresholdsService: ThresholdsService) {}

  @Post('thresholds')
  @ApiOperation({ summary: 'Create or update threshold configuration' })
  upsert(@Body() dto: UpsertThresholdDto) {
    return this.thresholdsService.upsertThreshold(dto);
  }

  @Get('devices/:deviceId/thresholds')
  @ApiOperation({
    summary: 'Get the list of thresholds currently configured for the device',
  })
  getThresholds(@Param('deviceId') deviceId: string) {
    return this.thresholdsService.getDeviceThresholds(deviceId);
  }
}
