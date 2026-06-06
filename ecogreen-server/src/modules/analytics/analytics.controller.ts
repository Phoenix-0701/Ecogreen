import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StreamableFile } from '@nestjs/common';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── Endpoint cũ (giữ nguyên) ──────────────────
  @ApiOperation({ summary: 'Get daily summary for a device' })
  @Get('devices/:deviceId/summary')
  async getDailySummary(@Param('deviceId') deviceId: string) {
    const summary = await this.analyticsService.getDeviceDailySummary(deviceId);
    return {
      message: 'Lấy dữ liệu thống kê thành công',
      data: summary,
    };
  }

  // ── Export Excel ───────────────────────────────
  @ApiOperation({ summary: 'Export report as Excel (.xlsx)' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-06-01', description: 'Ngày bắt đầu (YYYY-MM-DD). Mặc định: 30 ngày trước' })
  @ApiQuery({ name: 'endDate',   required: false, example: '2026-06-30', description: 'Ngày kết thúc (YYYY-MM-DD). Mặc định: hôm nay' })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Get('devices/:deviceId/export/excel')
  async exportExcel(
    @Param('deviceId') deviceId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate')   endDateStr?: string,
  ): Promise<StreamableFile> {
    const { startDate, endDate } = this.parseDateRange(startDateStr, endDateStr);
    return this.analyticsService.exportExcel(deviceId, startDate, endDate);
  }

  // ── Export PDF ─────────────────────────────────
  @ApiOperation({ summary: 'Export report as PDF' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-06-01', description: 'Ngày bắt đầu (YYYY-MM-DD). Mặc định: 30 ngày trước' })
  @ApiQuery({ name: 'endDate',   required: false, example: '2026-06-30', description: 'Ngày kết thúc (YYYY-MM-DD). Mặc định: hôm nay' })
  @Header('Content-Type', 'application/pdf')
  @Get('devices/:deviceId/export/pdf')
  async exportPdf(
    @Param('deviceId') deviceId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate')   endDateStr?: string,
  ): Promise<StreamableFile> {
    const { startDate, endDate } = this.parseDateRange(startDateStr, endDateStr);
    return this.analyticsService.exportPdf(deviceId, startDate, endDate);
  }

  // ── Helper parse ngày ──────────────────────────
  private parseDateRange(startDateStr?: string, endDateStr?: string) {
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Định dạng ngày không hợp lệ. Vui lòng dùng YYYY-MM-DD');
    }

    if (startDate > endDate) {
      throw new BadRequestException('startDate phải nhỏ hơn hoặc bằng endDate');
    }

    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 365) {
      throw new BadRequestException('Khoảng thời gian tối đa là 365 ngày');
    }

    return { startDate, endDate };
  }
}
