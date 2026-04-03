"use client";

import React, { useEffect, useState } from "react";
import { Thermometer, Wind, Droplets } from "lucide-react";
import { SensorCard } from "./SensorCard";
import { io } from "socket.io-client";

export function DashboardView() {
  // 1. Khởi tạo State để lưu trữ dữ liệu thật (Mặc định là 0 hoặc "--")
  const [sensorData, setSensorData] = useState({
    temp: 0,
    humi: 0,
    soil: 0,
  });

  useEffect(() => {
    // 2. Kết nối tới WebSocket của Backend NestJS
    const socket = io("http://localhost:3000");

    socket.on("connect", () => console.log("✅ Đã kết nối WebSocket!"));

    // 3. Lắng nghe dữ liệu thật từ Backend bắn qua
    socket.on("realtime-data", (data: any) => {
      console.log("📥 Nhận dữ liệu từ Server (Nguyên bản):", data);

      try {
        // 1. Tìm xem cái cục chứa dữ liệu cảm biến nó nằm ở biến 'payload' hay 'message'
        let sensorPayload = data.payload || data.message;

        // 2. GIẢI MÃ: Nếu ESP32 gửi lên một chuỗi String (Text), ta phải Ép nó thành JSON Object
        if (typeof sensorPayload === "string") {
          sensorPayload = JSON.parse(sensorPayload);
        }

        // 3. GÁN DỮ LIỆU: Bọc các trường hợp tên biến khác nhau để chống trượt
        if (sensorPayload) {
          setSensorData({
            // Nếu có biến temp thì lấy temp, không thì tìm temperature, không có nữa thì lấy 0
            temp: sensorPayload.temp || sensorPayload.temperature || 0,
            humi:
              sensorPayload.humi ||
              sensorPayload.humidity ||
              sensorPayload.hum ||
              0,
            soil:
              sensorPayload.soil ||
              sensorPayload.soil_moisture ||
              sensorPayload.soilMoisture ||
              0,
          });
        }
      } catch (error) {
        console.error(" Lỗi giải mã dữ liệu cảm biến:", error);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SensorCard
        title="Nhiệt độ"
        value={`${sensorData.temp}°C`}
        icon={<Thermometer size={28} className="text-red-500" />}
        colorClass="bg-red-50"
      />
      <SensorCard
        title="Độ ẩm không khí"
        value={`${sensorData.humi}%`}
        icon={<Wind size={28} className="text-blue-500" />}
        colorClass="bg-blue-50"
      />
      <SensorCard
        title="Độ ẩm đất"
        value={`${sensorData.soil}%`}
        icon={<Droplets size={28} className="text-orange-500" />}
        colorClass="bg-orange-50"
      />
    </div>
  );
}
