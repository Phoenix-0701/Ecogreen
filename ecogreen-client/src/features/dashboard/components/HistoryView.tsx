"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { generateMockHistory } from "@/lib/mockData";

export function HistoryView() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");
  const [chartData] = useState(() => generateMockHistory(24));

  const hours = timeRange === "day" ? 24 : timeRange === "week" ? 168 : 720;
  const displayData = generateMockHistory(hours);

  const formatXAxis = (time: string) => {
    const date = new Date(time);
    if (timeRange === "day") return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (timeRange === "week") return date.toLocaleDateString("vi-VN", { weekday: "short" });
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Biểu đồ lịch sử dữ liệu</h2>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi các thông số cảm biến theo thời gian
            </p>
          </div>
          <div className="flex gap-2">
            {(["day", "week", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  timeRange === range
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range === "day" ? "Ngày" : range === "week" ? "Tuần" : "Tháng"}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              labelFormatter={(time) => new Date(time).toLocaleString("vi-VN")}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperature"
              name="Nhiệt độ (°C)"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="humidity"
              name="Độ ẩm không khí (%)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="soilMoisture"
              name="Độ ẩm đất (%)"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="lightIntensity"
              name="Ánh sáng (lux)"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê nhanh</h3>
          <div className="space-y-4">
            <StatRow label="Nhiệt độ trung bình" value="28.5°C" trend="up" />
            <StatRow label="Độ ẩm trung bình" value="65%" trend="stable" />
            <StatRow label="Độ ẩm đất trung bình" value="45%" trend="down" />
            <StatRow label="Ánh sáng trung bình" value="450 lux" trend="up" />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ngưỡng an toàn</h3>
          <div className="space-y-4">
            <ThresholdRow label="Nhiệt độ" min={20} max={30} unit="°C" />
            <ThresholdRow label="Độ ẩm" min={50} max={80} unit="%" />
            <ThresholdRow label="Độ ẩm đất" min={30} max={70} unit="%" />
            <ThresholdRow label="Ánh sáng" min={500} max={1000} unit="lux" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, trend }: { label: string; value: string; trend: "up" | "down" | "stable" }) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500";
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${trendColor}`}>{value} {trendIcon}</span>
    </div>
  );
}

function ThresholdRow({ label, min, max, unit }: { label: string; min: number; max: number; unit: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-emerald-600">{min}{unit} - {max}{unit}</span>
    </div>
  );
}