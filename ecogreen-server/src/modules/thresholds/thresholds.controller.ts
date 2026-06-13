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
  async upsert(@Body() dto: UpsertThresholdDto) {
    const result = await this.thresholdsService.upsertThreshold(dto);

    return {
      message: 'Cập nhật cấu hình ngưỡng thành công',
      data: result,
    };
  }

  @Get('devices/:deviceId/thresholds')
  @ApiOperation({
    summary: 'Get the list of thresholds currently configured for the device',
  })
  async getThresholds(@Param('deviceId') deviceId: string) {
    const thresholds =
      await this.thresholdsService.getDeviceThresholds(deviceId);

    return {
      message: 'Lấy danh sách ngưỡng thành công',
      data: thresholds,
    };
  }
}
