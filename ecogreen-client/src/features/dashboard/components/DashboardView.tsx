"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  Cpu,
  Droplets,
  ExternalLink,
  Loader2,
  Radio,
  Thermometer,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  Zap,
} from "lucide-react";
import { getDevices } from "@/services/device.service";
import { requestJson } from "@/services/api";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { Device } from "@/types";
import type { TelemetrySnapshot } from "@/types/automation";

interface ActivityLog {
  Log_ID: string;
  event_type: string;
  status: string;
  description: string;
  occurred_at: string;
}

function sensorValue(type: "temp" | "humi" | "soil" | "light", telemetry: TelemetrySnapshot) {
  if (type === "temp") return `${telemetry.temp.toFixed(1)}°C`;
  if (type === "humi") return `${telemetry.humi}%`;
  if (type === "soil") return `${telemetry.soil}%`;
  return `${telemetry.light}%`;
}

function formatTime(value?: string | null) {
  if (!value) return "Chưa ghi nhận";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa ghi nhận";
  return date.toLocaleString("vi-VN");
}

export function DashboardView() {
  const { telemetry, telemetryByMac, connected } = useRealtimeTelemetry();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getDevices()
      .then((data) => {
        if (!mounted) return;
        setDevices(data);
        setSelectedDeviceId((current) => current ?? data[0]?.Device_ID ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.Device_ID === selectedDeviceId) ?? devices[0] ?? null,
    [devices, selectedDeviceId],
  );

  useEffect(() => {
    if (!selectedDevice) {
      return;
    }

    let mounted = true;

    requestJson<ActivityLog[]>(`/v1/devices/${selectedDevice.Device_ID}/logs?limit=5`)
      .then((data) => {
        if (mounted) setLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setLogs([]);
      });

    return () => {
      mounted = false;
    };
  }, [selectedDevice]);

  const selectedTelemetry =
    (selectedDevice ? telemetryByMac[selectedDevice.mac_address] : undefined) ?? telemetry;
  const onlineCount = devices.filter((device) => device.status === "online").length;
  const sensorCount = devices.reduce((sum, device) => sum + (device.sensors?.length ?? 0), 0);
  const actuatorCount = devices.reduce((sum, device) => sum + (device.actuators?.length ?? 0), 0);
  const visibleLogs = selectedDevice ? logs : [];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl bg-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Đang tải dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                  connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
                {connected ? "Realtime online" : "Đang chờ realtime"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {onlineCount}/{devices.length} ESP online
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-950">Tổng quan nhà vườn</h1>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi nhanh thiết bị, cảm biến, máy bơm và hoạt động gần đây.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/devices"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm"
            >
              <Cpu className="size-4" />
              Quản lý thiết bị
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"
            >
              <CalendarClock className="size-4" />
              Lịch tưới
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard icon={<Cpu />} label="ESP đã đăng ký" value={devices.length.toString()} tone="emerald" />
        <SummaryCard icon={<Radio />} label="Đang online" value={onlineCount.toString()} tone="blue" />
        <SummaryCard icon={<Activity />} label="Sensors" value={sensorCount.toString()} tone="amber" />
        <SummaryCard icon={<Zap />} label="Pumps" value={actuatorCount.toString()} tone="violet" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Thông số hiện tại</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedDevice ? selectedDevice.name : "Chưa có thiết bị"}
              </p>
            </div>
            {devices.length > 0 ? (
              <select
                value={selectedDevice?.Device_ID ?? ""}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
              >
                {devices.map((device) => (
                  <option key={device.Device_ID} value={device.Device_ID}>
                    {device.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <MetricCard icon={<Thermometer />} label="Nhiệt độ" value={sensorValue("temp", selectedTelemetry)} tone="red" />
            <MetricCard icon={<Wind />} label="Độ ẩm không khí" value={sensorValue("humi", selectedTelemetry)} tone="blue" />
            <MetricCard icon={<Droplets />} label="Độ ẩm đất" value={sensorValue("soil", selectedTelemetry)} tone="emerald" />
            <MetricCard icon={<Waves />} label="Ánh sáng" value={sensorValue("light", selectedTelemetry)} tone="amber" />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Lần cuối online: <strong>{formatTime(selectedDevice?.last_seen_at)}</strong>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-950">Thiết bị</h2>
            <Link href="/dashboard/devices" className="text-emerald-700">
              <ExternalLink className="size-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {devices.slice(0, 5).map((device) => (
              <div key={device.Device_ID} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-bold text-slate-900">{device.name}</div>
                  <div className="text-xs text-slate-500">{device.mac_address}</div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    device.status === "online"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {device.status}
                </span>
              </div>
            ))}
            {devices.length === 0 ? <p className="text-sm text-slate-500">Chưa có ESP nào.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-950">Hoạt động gần đây</h2>
        <div className="space-y-3">
          {visibleLogs.length > 0 ? (
            visibleLogs.map((log) => (
              <div key={log.Log_ID} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-slate-800">{log.description || log.status}</span>
                  <span className="text-xs text-slate-500">{formatTime(log.occurred_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Chưa có log hoạt động cho thiết bị đang chọn.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "blue" | "amber" | "violet";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex size-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "red" | "blue" | "emerald" | "amber";
}) {
  const tones = {
    red: "bg-red-50 text-red-600",
    blue: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}
