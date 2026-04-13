import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Devices')
@Controller('v1/devices')
@UseGuards(AuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @ApiOperation({ summary: 'Add a new device' })
  @Post()
  async createDevice(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    // req.user.sub : User_ID trong Token lúc đăng nhập
    const userId = req.user.sub;
    return this.devicesService.create(userId, createDeviceDto);
  }

  @ApiOperation({ summary: 'Get the devices in the connection queue' })
  @Get('discovery')
  async getDiscoveredDevices() {
    return this.devicesService.getDiscovered();
  }

  @ApiOperation({ summary: 'Get all devices of the current user' })
  @Get()
  async getMyDevices(@Request() req) {
    const userId = req.user.sub;
    return this.devicesService.findAllByUser(userId);
  }
}
