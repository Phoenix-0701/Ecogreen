"use client";

import React, { useState } from "react";
import {
  Droplets,
  Wind,
  Cloud,
  Eye,
  Activity,
  AlertCircle,
} from "lucide-react";

export function DashboardView() {
  const [sensorData] = useState({
    ambientTemp: 28.5,
    airHumidity: 65,
    soilMoisture: 45,
    lightIntensity: 500,
    isIrrigating: false,
    isFanRunning: false,
    wifiStrength: 75,
    systemMode: "AUTO" as "AUTO" | "MANUAL",
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Cloud size={16} />
          Nhiệt độ OK
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Droplets size={16} />
          Bơm an toàn
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Activity size={16} />
          WiFi Connected ({sensorData.wifiStrength}%)
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-blue-50 text-blue-700 border border-blue-200">
          <AlertCircle size={16} />
          Mode: {sensorData.systemMode}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <SensorCard
          title="Nhiệt độ"
          value={sensorData.ambientTemp.toFixed(1)}
          unit="°C"
          icon={<Cloud size={24} />}
          color="text-orange-500"
          progress={(sensorData.ambientTemp / 40) * 100}
        />
        <SensorCard
          title="Độ ẩm không khí"
          value={sensorData.airHumidity.toFixed(0)}
          unit="%"
          icon={<Wind size={24} />}
          color="text-blue-500"
          progress={sensorData.airHumidity}
        />
        <SensorCard
          title="Độ ẩm đất"
          value={sensorData.soilMoisture.toFixed(0)}
          unit="%"
          icon={<Droplets size={24} />}
          color="text-green-500"
          progress={sensorData.soilMoisture}
        />
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Ánh sáng</h3>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Eye size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-600">
                {sensorData.lightIntensity.toFixed(0)}
              </p>
              <p className="text-sm text-gray-500">lux</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Tối ưu: 800-1000 lux
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Điều khiển nhanh</h3>
          <div className="space-y-3">
            <ControlItem name="Bơm nước" isOn={sensorData.isIrrigating} />
            <ControlItem name="Quạt thông gió" isOn={sensorData.isFanRunning} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Chu kỳ tưới</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Số lần tưới hôm nay</span>
              <span className="text-sm font-bold text-emerald-600">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tổng lượng nước</span>
              <span className="text-sm font-bold text-emerald-600">45L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Thời gian hoạt động</span>
              <span className="text-sm font-bold text-emerald-600">2h 30m</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-800 font-mono">
          <h3 className="text-sm font-bold text-green-400 mb-4 text-center">LCD DISPLAY</h3>
          <div className="bg-green-950 rounded-lg p-4 space-y-2 border border-green-700">
            <div className="flex justify-between text-green-400 text-sm">
              <span>T: {sensorData.ambientTemp.toFixed(1)}°C</span>
              <span>H: {sensorData.airHumidity.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-green-400 text-sm">
              <span>SM: {sensorData.soilMoisture.toFixed(0)}%</span>
              <span>L: {sensorData.lightIntensity.toFixed(0)}L</span>
            </div>
            <div className="border-t border-green-700 pt-2 text-green-400 text-sm">
              <div>PUMP: {sensorData.isIrrigating ? "ON" : "OFF"}</div>
              <div>FAN: {sensorData.isFanRunning ? "ON" : "OFF"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SensorCard({ title, value, unit, icon, color, progress }: {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <div className="mb-4">
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
        <span className="text-sm text-gray-500 ml-2">{unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ControlItem({ name, isOn }: { name: string; isOn: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-900">{name}</span>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${isOn ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
        {isOn ? "Bật" : "Tắt"}
      </div>
    </div>
  );
}