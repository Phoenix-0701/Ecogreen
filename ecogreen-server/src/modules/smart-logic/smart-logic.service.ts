import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSmartLogicDto } from './dto/upsert-smart-logic.dto';

@Injectable()
export class SmartLogicService {
  private readonly logger = new Logger(SmartLogicService.name);
  private readonly WEATHER_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 giờ

  constructor(private prisma: PrismaService) {}

  // ── 1. QUẢN LÝ CẤU HÌNH ──────────────────────────────────────────────────
  async getConfig(deviceId: string) {
    let config = await this.prisma.sMART_LOGIC_CONFIGS.findUnique({
      where: { Device_ID: deviceId },
    });

    if (!config) {
      config = await this.prisma.sMART_LOGIC_CONFIGS.create({
        data: {
          Device_ID: deviceId,
          city_name: 'Ho Chi Minh',
          rain_prob_threshold: 70,
          is_smart_mode: false,
        },
      });
    }
    return config;
  }

  async upsertConfig(deviceId: string, dto: UpsertSmartLogicDto) {
    return this.prisma.sMART_LOGIC_CONFIGS.upsert({
      where: { Device_ID: deviceId },
      update: {
        city_name: dto.city_name,
        rain_prob_threshold: dto.rain_prob_threshold,
        is_smart_mode: dto.is_smart_mode,
      },
      create: {
        Device_ID: deviceId,
        city_name: dto.city_name,
        rain_prob_threshold: dto.rain_prob_threshold,
        is_smart_mode: dto.is_smart_mode,
      },
    });
  }

  // ── 2. LẤY THỜI TIẾT (có cache) ───────────────────────────────────────────
  async getWeatherForCity(cityName: string) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return null;

    const cached = await this.prisma.wEATHER_CACHE.findFirst({
      where: { city_name: cityName },
    });

    const now = new Date();
    // Dùng cache nếu còn trong 2 giờ
    if (cached && now.getTime() - cached.updated_at.getTime() < this.WEATHER_CACHE_TTL_MS) {
      return cached.weather_data;
    }

    return this._callWeatherApi(cityName, cached, now);
  }

  // ── 3. LẤY THỜI TIẾT FRESH (bỏ qua cache) ────────────────────────────────
  async fetchFreshWeather(cityName: string) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return null;

    const cached = await this.prisma.wEATHER_CACHE.findFirst({
      where: { city_name: cityName },
    });

    return this._callWeatherApi(cityName, cached, new Date());
  }

  private async _callWeatherApi(cityName: string, cached: any, now: Date) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return null;

    try {
      this.logger.log(`🌥 Gọi OpenWeatherMap cho: ${cityName}`);
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric&lang=vi`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message ?? 'OpenWeatherMap error');

      // Cập nhật cache
      if (cached) {
        await this.prisma.wEATHER_CACHE.update({
          where: { Cache_ID: cached.Cache_ID },
          data: { weather_data: data, updated_at: now },
        });
      } else {
        await this.prisma.wEATHER_CACHE.create({
          data: { city_name: cityName, weather_data: data },
        });
      }

      return data;
    } catch (error) {
      this.logger.error(`❌ Lỗi OpenWeatherMap: ${error.message}`);
      return cached ? cached.weather_data : null;
    }
  }

  // ── 4. QUYẾT ĐỊNH CÓ NÊN Bỏ QUA TƯỚI KHÔNG ─────────────────────────────────
  async shouldSkipWatering(deviceId: string): Promise<{ skip: boolean; reason: string; rainProbability: number }> {
    const config = await this.getConfig(deviceId);

    if (!config.is_smart_mode) {
      return { skip: false, reason: 'Smart Logic đang TắT', rainProbability: 0 };
    }

    const weatherData: any = await this.getWeatherForCity(config.city_name);
    if (!weatherData?.list?.length) {
      return { skip: false, reason: 'Không có dữ liệu thời tiết', rainProbability: 0 };
    }

    // Kiểm tra xac suất mưa trong 12 giờ tới (4 slot × 3h)
    // Dùng giá trị CAO NHẤT để an toàn hơn
    const slotsToCheck = Math.min(4, weatherData.list.length);
    let rainProbability = 0;
    for (let i = 0; i < slotsToCheck; i++) {
      const slotPop = Math.round((weatherData.list[i].pop ?? 0) * 100);
      if (slotPop > rainProbability) rainProbability = slotPop;
    }

    this.logger.log(
      `🌦 SmartLogic [${deviceId}]: Mưa tối đa ${rainProbability}% trong 12h tới tại ${config.city_name} (ngưỡng ${config.rain_prob_threshold}%)`,
    );

    if (rainProbability >= config.rain_prob_threshold) {
      return {
        skip: true,
        reason: `Xác suất mưa ${rainProbability}% ≥ ngưỡng ${config.rain_prob_threshold}% (trong 12h tới)`,
        rainProbability,
      };
    }

    return {
      skip: false,
      reason: `Xác suất mưa ${rainProbability}% thấp hơn ngưỡng ${config.rain_prob_threshold}%`,
      rainProbability,
    };
  }
}