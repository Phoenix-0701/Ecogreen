export interface SensorReading {
  time: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightIntensity: number;
}

export interface ActivityLog {
  id: string;
  eventType: string;
  status: string;
  description: string;
  time: string;
}

export const generateMockHistory = (hours: number = 24): SensorReading[] => {
  const data: SensorReading[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();

    let tempBase = 28;
    if (hour >= 6 && hour <= 10) tempBase = 24;
    else if (hour >= 11 && hour <= 14) tempBase = 32;
    else if (hour >= 15 && hour <= 18) tempBase = 30;
    else if (hour >= 19 || hour <= 5) tempBase = 26;

    data.push({
      time: time.toISOString(),
      temperature: tempBase + (Math.random() - 0.5) * 4,
      humidity: 60 + Math.random() * 20,
      soilMoisture: 40 + Math.random() * 30,
      lightIntensity: hour >= 6 && hour <= 18
        ? 500 + Math.random() * 500
        : 0 + Math.random() * 50,
    });
  }

  return data;
};

export const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    eventType: 'PUMP_ON',
    status: 'success',
    description: 'Bơm nước bật - độ ẩm đất thấp (35%)',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    eventType: 'SENSOR_DATA',
    status: 'info',
    description: 'Cập nhật dữ liệu cảm biến nhiệt độ 28.5°C',
    time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    eventType: 'FAN_ON',
    status: 'success',
    description: 'Quạt thông gió bật - nhiệt độ cao (32°C)',
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    eventType: 'THRESHOLD_ALERT',
    status: 'warning',
    description: 'Cảnh báo: độ ẩm đất dưới ngưỡng (30%)',
    time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    eventType: 'DEVICE_CONNECTED',
    status: 'success',
    description: 'ESP32 kết nối thành công qua MQTT',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    eventType: 'SCHEDULE_TRIGGER',
    status: 'info',
    description: 'Lịch tưới tự động: 06:00 AM',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    eventType: 'PUMP_OFF',
    status: 'success',
    description: 'Bơm nước tắt - độ ẩm đạt ngưỡng (65%)',
    time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    eventType: 'WIFI_RECONNECT',
    status: 'warning',
    description: 'WiFi mất kết nối, tự động kết nối lại',
    time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];