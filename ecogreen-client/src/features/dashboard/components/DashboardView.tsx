"use client";

import React from "react";
import {
  Droplets,
  Wind,
  Cloud,
  Eye,
} from "lucide-react";

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-gray-100 text-gray-600 border border-gray-200">
          <Cloud size={16} />
          Chờ dữ liệu từ backend...
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <SensorCard
          title="Nhiệt độ"
          value="--"
          unit="°C"
          icon={<Cloud size={24} />}
          color="text-gray-400"
        />
        <SensorCard
          title="Độ ẩm không khí"
          value="--"
          unit="%"
          icon={<Wind size={24} />}
          color="text-gray-400"
        />
        <SensorCard
          title="Độ ẩm đất"
          value="--"
          unit="%"
          icon={<Droplets size={24} />}
          color="text-gray-400"
        />
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Ánh sáng</h3>
            <div className="p-2 bg-gray-50 rounded-lg">
              <Eye size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-400">--</p>
              <p className="text-sm text-gray-500">lux</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Chờ dữ liệu...
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Điều khiển nhanh</h3>
          <div className="space-y-3">
            <ControlItem name="Bơm nước" status="off" />
            <ControlItem name="Quạt thông gió" status="off" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Chu kỳ tưới</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Số lần tưới hôm nay</span>
              <span className="text-sm font-bold text-gray-400">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tổng lượng nước</span>
              <span className="text-sm font-bold text-gray-400">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Thời gian hoạt động</span>
              <span className="text-sm font-bold text-gray-400">--</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-800 font-mono">
          <h3 className="text-sm font-bold text-green-400 mb-4 text-center">LCD DISPLAY</h3>
          <div className="bg-green-950 rounded-lg p-4 space-y-2 border border-green-700">
            <div className="flex justify-between text-green-400 text-sm">
              <span>T: --°C</span>
              <span>H: --%</span>
            </div>
            <div className="flex justify-between text-green-400 text-sm">
              <span>SM: --%</span>
              <span>L: --L</span>
            </div>
            <div className="border-t border-green-700 pt-2 text-green-400 text-sm">
              <div>PUMP: OFF</div>
              <div>FAN: OFF</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SensorCard({ title, value, unit, icon, color }: {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
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
      <div className="w-full bg-gray-200 rounded-full h-2" />
    </div>
  );
}

function ControlItem({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-900">{name}</span>
      <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-600">
        {status}
      </div>
    </div>
  );
}