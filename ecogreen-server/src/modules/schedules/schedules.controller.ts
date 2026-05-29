import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SaveSchedulesDto } from './dto/save-schedules.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('devices/:deviceId/schedules')
  @ApiOperation({ summary: 'Get schedule configuration for a device' })
  async getSchedules(@Param('deviceId') deviceId: string) {
    const data = await this.schedulesService.getDeviceSchedules(deviceId);
    return {
      message: 'Lấy cấu hình lịch tưới thành công',
      data,
    };
  }

  @Post('devices/:deviceId/schedules')
  @ApiOperation({ summary: 'Save/sync schedule configuration for a device' })
  async saveSchedules(
    @Param('deviceId') deviceId: string,
    @Body() dto: SaveSchedulesDto,
  ) {
    const data = await this.schedulesService.saveDeviceSchedules(deviceId, dto);
    return {
      message: 'Lưu cấu hình lịch tưới thành công',
      data,
    };
  }
}
