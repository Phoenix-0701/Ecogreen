import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ActuatorsService } from './actuators.service';
import { ToggleActuatorDto } from './dto/toggle-actuator.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Actuators')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1')
export class ActuatorsController {
  constructor(private readonly actuatorsService: ActuatorsService) {}

  @Get('devices/:deviceId/actuators')
  @ApiOperation({
    summary: 'Get the list of actuators (Pump) of the device',
  })
  getActuators(@Param('deviceId') deviceId: string) {
    return this.actuatorsService.getDeviceActuators(deviceId);
  }

  @Post('actuators/:actuatorId/toggle')
  @ApiOperation({ summary: 'Turn on/off actuators' })
  toggleActuator(
    @Param('actuatorId') actuatorId: string,
    @Body() dto: ToggleActuatorDto,
    @Request() req,
  ) {
    const userTrigger = `USER: ${req.user.username}`;
    return this.actuatorsService.toggle(actuatorId, dto.state, userTrigger);
  }
}
