import { Controller, Get, Body, Param, Patch, Post, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { SmartLogicService } from './smart-logic.service';
import { UpsertSmartLogicDto } from './dto/upsert-smart-logic.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from '../schedules/schedules.service';

@ApiTags('Smart Logic (Thời tiết)')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/smart-logic')
export class SmartLogicController {
  constructor(
    private readonly smartLogicService: SmartLogicService,
    @Inject(forwardRef(() => SchedulesService))
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get('devices/:deviceId')
  @ApiOperation({ summary: 'Lấy cấu hình Smart Logic + dữ liệu thời tiết cache' })
  async getConfig(@Param('deviceId') deviceId: string) {
    const config = await this.smartLogicService.getConfig(deviceId);
    // Đính kèm dữ liệu thời tiết từ cache (nếu có)
    const weatherData = await this.smartLogicService.getWeatherForCity(config.city_name);
    return {
      message: 'Lấy cấu hình thông minh thành công',
      data: {
        ...config,
        last_weather_data: weatherData,
      },
    };
  }

  @Patch('devices/:deviceId')
  @ApiOperation({ summary: 'Cập nhật cấu hình Smart Logic' })
  async updateConfig(@Param('deviceId') deviceId: string, @Body() dto: UpsertSmartLogicDto) {
    const config = await this.smartLogicService.upsertConfig(deviceId, dto);
    // Kích hoạt đồng bộ trạng thái SmartLogic ngay lập tức (chạy ngầm)
    this.schedulesService.runSmartLogicForAllDevices().catch((err) =>
      console.error('❌ Lỗi chạy SmartLogic sau khi cập nhật cấu hình:', err.message)
    );
    return { message: 'Cập nhật Smart Logic thành công', data: config };
  }

  @Post('devices/:deviceId/check-weather')
  @ApiOperation({ summary: 'Kiểm tra thời tiết thực tế + tính toán quyết định tưới' })
  async checkWeather(@Param('deviceId') deviceId: string) {
    const config = await this.smartLogicService.getConfig(deviceId);
    // Bỏ qua cache, gọi API thời tiết mới nhất
    const weatherData = await this.smartLogicService.fetchFreshWeather(config.city_name);

    if (!weatherData || !weatherData.list?.length) {
      return {
        success: false,
        message: 'Không lấy được dữ liệu thời tiết. Kiểm tra lại OPENWEATHER_API_KEY.',
        rainProbability: null,
        decision: 'unknown',
        shouldSkip: false,
      };
    }

    const nextForecast = weatherData.list[0];
    const rainProbability = Math.round((nextForecast.pop ?? 0) * 100);
    const shouldSkip = rainProbability >= config.rain_prob_threshold;

    return {
      success: true,
      message: shouldSkip
        ? `Xác suất mưa ${rainProbability}% ≥ ngưỡng ${config.rain_prob_threshold}% → Bỏ qua tưới hôm nay.`
        : `Xác suất mưa ${rainProbability}% < ngưỡng ${config.rain_prob_threshold}% → Tiếp tục tưới bình thường.`,
      city: config.city_name,
      rainProbability,
      rainThreshold: config.rain_prob_threshold,
      decision: shouldSkip ? 'skip' : 'execute',
      shouldSkip,
      weatherSummary: nextForecast.weather?.[0]?.description ?? null,
      tempC: nextForecast.main?.temp ?? null,
      last_weather_data: weatherData,
    };
  }
}