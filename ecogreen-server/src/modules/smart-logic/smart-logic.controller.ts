import { Controller, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { SmartLogicService } from './smart-logic.service';
import { UpsertSmartLogicDto } from './dto/upsert-smart-logic.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Smart Logic (Thời tiết)')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/smart-logic')
export class SmartLogicController {
  constructor(private readonly smartLogicService: SmartLogicService) {}

  @Get('devices/:deviceId')
  @ApiOperation({ summary: 'Lấy cấu hình Smart Logic của Thiết bị' })
  async getConfig(@Param('deviceId') deviceId: string) {
    const config = await this.smartLogicService.getConfig(deviceId);
    return { message: 'Lấy cấu hình thông minh thành công', data: config };
  }

  @Patch('devices/:deviceId')
  @ApiOperation({ summary: 'Cập nhật cấu hình Smart Logic' })
  async updateConfig(@Param('deviceId') deviceId: string, @Body() dto: UpsertSmartLogicDto) {
    const config = await this.smartLogicService.upsertConfig(deviceId, dto);
    return { message: 'Cập nhật Smart Logic thành công', data: config };
  }
}