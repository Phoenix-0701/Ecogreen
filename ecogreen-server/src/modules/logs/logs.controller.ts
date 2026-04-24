import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Logs')
@UseGuards(AuthGuard)
@Controller('v1')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('devices/:deviceId/logs')
  @ApiOperation({
    summary: 'Get device operation history',
  })
  getLogs(@Param('deviceId') deviceId: string, @Query('limit') limit: string) {
    return this.logsService.getLogsByDevice(
      deviceId,
      limit ? parseInt(limit) : 50,
    );
  }
}
