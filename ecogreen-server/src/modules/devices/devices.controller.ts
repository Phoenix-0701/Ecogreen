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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('devices')
@Controller('devices')
@UseGuards(AuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async createDevice(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    // req.user.sub : User_ID trong Token lúc đăng nhập
    const userId = req.user.sub;
    return this.devicesService.create(userId, createDeviceDto);
  }

  @Get()
  async getMyDevices(@Request() req) {
    const userId = req.user.sub;
    return this.devicesService.findAllByUser(userId);
  }
}
