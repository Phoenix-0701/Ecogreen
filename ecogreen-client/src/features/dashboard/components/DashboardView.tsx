"use client";

import React, { useEffect, useState } from "react";
import { Droplets, Thermometer, Wind } from "lucide-react";
import { io } from "socket.io-client";
import { SensorCard } from "./SensorCard";

interface SensorData {
  temp: number;
  humi: number;
  soil: number;
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
  });

  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      `http://${window.location.hostname}:3001`;

    const socket = io(backendUrl);

    socket.on("connect", () => console.log("Connected to WebSocket"));
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
