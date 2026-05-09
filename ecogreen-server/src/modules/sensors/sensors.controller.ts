import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sensors')
@UseGuards(AuthGuard)
@Controller('/v1')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @ApiOperation({ summary: 'Get all sensors of a device' })
  @Get('devices/:deviceId/sensors')
  getSensors(@Param('deviceId') deviceId: string) {
    return this.sensorsService.getSensorsByDevice(deviceId);
  }

  @ApiOperation({ summary: 'Get sensor data history' })
  @Get('sensors/:sensorId/readings')
  getReadings(
    @Param('sensorId') sensorId: string,
    @Query('limit') limit: string,
  ) {
    return this.sensorsService.getSensorReadings(
      sensorId,
      limit ? parseInt(limit) : 50,
    );
  }
}
