"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  getStoredTelemetry,
  persistTelemetry,
} from "@/services/automation.service";
import type { TelemetrySnapshot } from "@/types/automation";

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
      temp: toNumber("temp", "temperature") ?? 0,
      humi: toNumber("humi", "humidity", "hum") ?? 0,
      soil: toNumber("soil", "soil_moisture", "soilMoisture") ?? 0,
      light: toNumber("light", "lux", "brightness") ?? 0,
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
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      return;
    }

    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 2,
      timeout: 2500,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("realtime-data", (payload: unknown) => {
      const nextTelemetry = parseRealtimeTelemetry(payload);
      if (!nextTelemetry) {
        return;
      }

      setTelemetry(nextTelemetry);
      persistTelemetry(nextTelemetry);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { telemetry, connected };
}
