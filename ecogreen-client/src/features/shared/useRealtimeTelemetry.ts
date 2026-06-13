"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  getStoredTelemetry,
  persistTelemetry,
} from "@/services/automation.service";
import type { TelemetrySnapshot } from "@/types/automation";
import { getDevices } from "@/services/device.service";

function getBackendUrl() {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      `http://${window.location.hostname}:3001`
    );
  }

  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
}

function parseRealtimeTelemetry(payload: unknown): TelemetrySnapshot | null {
  try {
    let source = payload;

    if (
      typeof source === "object" &&
      source !== null &&
      ("payload" in source || "message" in source)
    ) {
      const wrapped = source as { payload?: unknown; message?: unknown };
      source = wrapped.payload ?? wrapped.message;
    }

    if (typeof source === "string") {
      source = JSON.parse(source);
    }

    if (!source || typeof source !== "object") {
      return null;
    }

    const candidate = source as Record<string, unknown>;
    const macAddress =
      typeof candidate.mac === "string"
        ? candidate.mac
        : typeof candidate.mac_address === "string"
          ? candidate.mac_address
          : undefined;
    const toNumber = (...keys: string[]) => {
      for (const key of keys) {
        const value = candidate[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
      }
      return undefined;
    };

    return {
      macAddress,
      temp: toNumber("temp", "temperature") ?? 0,
      humi: toNumber("humi", "humidity", "hum") ?? 0,
      soil: toNumber("soil", "soil_moisture", "soilMoisture") ?? 0,
      light:
        toNumber("light", "lux", "brightness", "lightLux", "light_lux") ?? 0,
      autoMode:
        typeof candidate.autoMode === "boolean" ? candidate.autoMode : true,
      cooldownRemain:
        typeof candidate.cooldownRemain === "number"
          ? candidate.cooldownRemain
          : 0,
      pumpState:
        typeof candidate.pumpState === "boolean"
          ? candidate.pumpState
          : undefined,
      fanState:
        typeof candidate.fanState === "boolean"
          ? candidate.fanState
          : undefined,
      updatedAt: new Date().toISOString(),
      source: "socket",
    };
  } catch {
    return null;
  }
}

export function useRealtimeTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() =>
    getStoredTelemetry(),
  );
  const [telemetryByMac, setTelemetryByMac] = useState<
    Record<string, TelemetrySnapshot>
  >({});
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      return;
    }

    const socketInstance = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 2,
      timeout: 2500,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => setConnected(true));
    socketInstance.on("disconnect", () => setConnected(false));
    socketInstance.on("connect_error", () => setConnected(false));

    let lastUpdate = 0;

    socketInstance.on("realtime-data", (payload: unknown) => {
      const nextTelemetry = parseRealtimeTelemetry(payload);
      if (!nextTelemetry) {
        return;
      }

      const now = Date.now();
      let currentInterval = 2; // default to 2 seconds
      try {
        const saved = localStorage.getItem("pref_refresh_interval");
        if (saved) {
          currentInterval = Number(saved);
        }
      } catch (e) {
        console.error(e);
      }

      if (now - lastUpdate >= currentInterval * 1000) {
        lastUpdate = now;
        setTelemetry(nextTelemetry);
        if (nextTelemetry.macAddress) {
          setTelemetryByMac((current) => ({
            ...current,
            [nextTelemetry.macAddress as string]: nextTelemetry,
          }));
        }
        persistTelemetry(nextTelemetry);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (connected) {
      return;
    }

    console.log("🔌 [RealtimeTelemetry] WebSocket mất kết nối. Đang khởi chạy chế độ Polling mỗi 30s...");

    const poll = async () => {
      try {
        const devices = await getDevices();
        if (!devices || devices.length === 0) return;

        const updatedByMac: Record<string, TelemetrySnapshot> = {};
        let latestTelemetry: TelemetrySnapshot | null = null;

        for (const device of devices) {
          const tempSensor = device.sensors?.find((s: any) => s.type === "temperature");
          const humiSensor = device.sensors?.find((s: any) => s.type === "humidity");
          const soilSensor = device.sensors?.find((s: any) => s.type === "soil_moisture" || s.type === "soil");
          const lightSensor = device.sensors?.find((s: any) => s.type === "light" || s.type === "lux");

          const tempVal = (tempSensor as any)?.sensor_readings?.[0]?.value ?? 0;
          const humiVal = (humiSensor as any)?.sensor_readings?.[0]?.value ?? 0;
          const soilVal = (soilSensor as any)?.sensor_readings?.[0]?.value ?? 0;
          const lightVal = (lightSensor as any)?.sensor_readings?.[0]?.value ?? 0;

          const pump = device.actuators?.find((a: any) => a.type === "pump");
          const fan = device.actuators?.find((a: any) => a.type === "fan");

          const pumpState = (pump as any)?.actuator_logs?.[0]?.action === "ON";
          const fanState = (fan as any)?.actuator_logs?.[0]?.action === "ON";
          
          const isAutoMode = (device as any).smart_logic_configs ? !!(device as any).smart_logic_configs.is_smart_mode : true;

          const snap: TelemetrySnapshot = {
            macAddress: device.mac_address,
            temp: tempVal,
            humi: humiVal,
            soil: soilVal,
            light: lightVal,
            autoMode: isAutoMode,
            cooldownRemain: 0,
            pumpState,
            fanState,
            updatedAt: new Date().toISOString(),
            source: "socket",
          };

          updatedByMac[device.mac_address] = snap;
          if (!latestTelemetry) {
            latestTelemetry = snap;
          }
        }

        setTelemetryByMac((current) => ({
          ...current,
          ...updatedByMac,
        }));

        if (latestTelemetry) {
          setTelemetry(latestTelemetry);
          persistTelemetry(latestTelemetry);
        }
      } catch (err) {
        console.error("❌ [RealtimeTelemetry] Lỗi trong lúc polling lấy dữ liệu cảm biến:", err);
      }
    };

    // Run immediately when disconnected
    poll();

    // Run every 30 seconds
    const interval = setInterval(poll, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [connected]);

  return { telemetry, telemetryByMac, connected, socket };
}
