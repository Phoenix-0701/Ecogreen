import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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
    return { data: await this.devicesService.create(userId, createDeviceDto) };
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

  @ApiOperation({ summary: 'Update device name' })
  @Patch(':id')
  async updateDevice(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateDeviceDto,
  ) {
    const userId = req.user.sub;
    const updatedDevice = await this.devicesService.update(id, userId, dto);

    return {
      message: 'Cập nhật tên thiết bị thành công',
      data: updatedDevice,
    };
  }

  @ApiOperation({ summary: 'Delete a device' })
  @Delete(':id')
  async removeDevice(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub;
    const deletedDevice = await this.devicesService.remove(id, userId);

    return {
      message: 'Xóa thiết bị thành công',
      data: deletedDevice,
    };
  }
}
