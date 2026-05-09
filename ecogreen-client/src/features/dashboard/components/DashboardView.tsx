"use client";

import React, { useEffect, useState } from "react";
import { Cloud, Droplets, Eye, Thermometer, Wind } from "lucide-react";
import { io } from "socket.io-client";
import { SensorCard } from "./SensorCard";

interface SensorData {
  temp: number;
  humi: number;
  soil: number;
  light: number;
}

function parseSensorData(data: unknown): SensorData | null {
  try {
    const wrappedData =
      typeof data === "object" && data !== null
        ? (data as { payload?: unknown; message?: unknown })
        : {};
    let sensorPayload = wrappedData.payload ?? wrappedData.message ?? data;

    if (typeof sensorPayload === "string") {
      sensorPayload = JSON.parse(sensorPayload);
    }

    if (typeof sensorPayload !== "object" || sensorPayload === null) {
      return null;
    }

    const payload = sensorPayload as Record<string, unknown>;
    const readNumber = (...keys: string[]) => {
      for (const key of keys) {
        const value = payload[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
      }
      return 0;
    };

    return {
      temp: readNumber("temp", "temperature"),
      humi: readNumber("humi", "humidity", "hum"),
      soil: readNumber("soil", "soil_moisture", "soilMoisture"),
      light: readNumber("light", "lux", "brightness"),
    };
  } catch {
    return null;
  }
}

export function DashboardView() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temp: 0,
    humi: 0,
    soil: 0,
    light: 0,
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      `http://${window.location.hostname}:3001`;

    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 2,
      timeout: 2500,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("realtime-data", (data: unknown) => {
      const nextSensorData = parseSensorData(data);
      if (nextSensorData) {
        setSensorData(nextSensorData);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border ${
            connected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          <Cloud size={16} />
          {connected ? "Realtime connected" : "Cho du lieu tu backend..."}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <SensorCard
          title="Nhiet do"
          value={`${sensorData.temp}°C`}
          icon={<Thermometer size={28} className="text-red-500" />}
          colorClass="bg-red-50"
        />
        <SensorCard
          title="Do am khong khi"
          value={`${sensorData.humi}%`}
          icon={<Wind size={28} className="text-blue-500" />}
          colorClass="bg-blue-50"
        />
        <SensorCard
          title="Do am dat"
          value={`${sensorData.soil}%`}
          icon={<Droplets size={28} className="text-orange-500" />}
          colorClass="bg-orange-50"
        />
        <SensorCard
          title="Anh sang"
          value={`${sensorData.light} lux`}
          icon={<Eye size={28} className="text-yellow-500" />}
          colorClass="bg-yellow-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Dieu khien nhanh
          </h3>
          <div className="space-y-3">
            <ControlItem name="Bom nuoc" status="off" />
            <ControlItem name="Quat thong gio" status="off" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Chu ky tuoi
          </h3>
          <div className="space-y-2">
            <InfoRow label="So lan tuoi hom nay" value="--" />
            <InfoRow label="Tong luong nuoc" value="--" />
            <InfoRow label="Thoi gian hoat dong" value="--" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-800 font-mono">
          <h3 className="text-sm font-bold text-green-400 mb-4 text-center">
            LCD DISPLAY
          </h3>
          <div className="bg-green-950 rounded-lg p-4 space-y-2 border border-green-700">
            <div className="flex justify-between text-green-400 text-sm">
              <span>T: {sensorData.temp}°C</span>
              <span>H: {sensorData.humi}%</span>
            </div>
            <div className="flex justify-between text-green-400 text-sm">
              <span>SM: {sensorData.soil}%</span>
              <span>L: {sensorData.light}</span>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-bold text-gray-400">{value}</span>
    </div>
  );
}
