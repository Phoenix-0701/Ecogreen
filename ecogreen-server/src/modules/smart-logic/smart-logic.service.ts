import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSmartLogicDto } from './dto/upsert-smart-logic.dto';

@Injectable()
export class SmartLogicService {
  private readonly logger = new Logger(SmartLogicService.name);
  private readonly WEATHER_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // Cache thời tiết trong 2 giờ

  constructor(private prisma: PrismaService) {}

  // 1. QUẢN LÝ CẤU HÌNH THÔNG MINH
  async getConfig(deviceId: string) {
    let config = await this.prisma.sMART_LOGIC_CONFIGS.findUnique({
      where: { Device_ID: deviceId },
    });

    // Tự động tạo cấu hình mặc định nếu chưa có
    if (!config) {
      config = await this.prisma.sMART_LOGIC_CONFIGS.create({
        data: {
          Device_ID: deviceId,
          city_name: 'Ho Chi Minh',
          rain_prob_threshold: 70, // Mặc định: Mưa > 70% thì không tưới
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

  // 2. LẤY DỮ LIỆU THỜI TIẾT (CÓ CACHE)
  async getWeatherForCity(cityName: string) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return null;

    // A. Kiểm tra trong Database xem có Cache cũ không
    const cached = await this.prisma.wEATHER_CACHE.findFirst({
      where: { city_name: cityName },
    });

    const now = new Date();
    // B. Nếu có cache và chưa quá 2 tiếng -> Dùng luôn cho lẹ, tiết kiệm API
    if (cached && now.getTime() - cached.updated_at.getTime() < this.WEATHER_CACHE_TTL_MS) {
      return cached.weather_data;
    }

    // C. Nếu không có hoặc đã hết hạn -> Gọi API OpenWeatherMap
    try {
      this.logger.log(`🌥 Đang lấy dữ liệu thời tiết thực tế cho ${cityName}...`);
      // Lấy dự báo thời tiết (forecast) để lấy xác suất mưa (pop: probability of precipitation)
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Lưu đè vào Cache
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
      this.logger.error(`❌ Lỗi lấy thời tiết: ${error.message}`);
      // Lỗi mạng thì đành xài lại cache cũ (nếu có)
      return cached ? cached.weather_data : null; 
    }
  }
  
  // 3. HÀM KIỂM TRA: CÓ NÊN BỎ QUA TƯỚI KHÔNG?
  async shouldSkipWatering(deviceId: string): Promise<boolean> {
    const config = await this.getConfig(deviceId);
    
    // Nếu chế độ thông minh đang TẮT -> Luôn tưới (Không bỏ qua)
    if (!config.is_smart_mode) return false;

    // Lấy thời tiết
    const weatherData: any = await this.getWeatherForCity(config.city_name);
    if (!weatherData || !weatherData.list) return false;

    // OpenWeatherMap Forecast trả về list dự báo mỗi 3 giờ.
    // Lấy xác suất mưa (pop) của khung giờ ngay tiếp theo (phần tử 0 hoặc 1)
    const nextForecast = weatherData.list[0]; 
    const rainProbability = nextForecast.pop * 100; // pop chạy từ 0 đến 1 -> Nhân 100 lấy %

    this.logger.log(`🌦 Chế độ Smart: Xác suất mưa tại ${config.city_name} sắp tới là ${rainProbability}%`);

    // So sánh với ngưỡng cài đặt. Nếu lớn hơn ngưỡng -> BỎ QUA TƯỚI (return true)
    if (rainProbability >= config.rain_prob_threshold) {
      return true;
    }

    return false; // Không đủ khả năng mưa -> Cứ tưới bình thường
  }
}