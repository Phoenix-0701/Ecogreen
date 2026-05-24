import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get daily summary for a device' })
  @Get('devices/:deviceId/summary')
  async getDailySummary(@Param('deviceId') deviceId: string) {
    const summary = await this.analyticsService.getDeviceDailySummary(deviceId);

    return {
      message: 'Lấy dữ liệu thống kê thành công',
      data: summary,
    };
  }
}
