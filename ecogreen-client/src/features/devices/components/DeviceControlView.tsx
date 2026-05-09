"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Droplets,
  Save,
  SunMedium,
  Thermometer,
  Wind,
} from "lucide-react";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import {
  ModeButton,
  PrimaryDeviceCard,
  SecondaryControlCard,
  StatusPill,
} from "@/features/devices/components/DeviceControlCards";
import {
  loadDeviceControlState,
  saveDeviceControlState,
} from "@/services/automation.service";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { DeviceControlState, PrimaryDevice } from "@/types/automation";

const shellStyles = {
  "--emerald-background": "#f7f9fb",
  "--emerald-surface": "#ffffff",
  "--emerald-surface-low": "#f2f4f6",
  "--emerald-surface-soft": "#eceef0",
  "--emerald-surface-variant": "#e0e3e5",
  "--emerald-on-surface": "#191c1e",
  "--emerald-on-surface-variant": "#3c4a42",
  "--emerald-primary": "#006c49",
  "--emerald-primary-soft": "#10b981",
  "--emerald-secondary": "#00668a",
  "--emerald-secondary-soft": "#40c2fd",
  "--emerald-tertiary": "#674bb5",
  "--emerald-danger": "#ba1a1a",
  "--emerald-inverse": "#2d3133",
  "--emerald-inverse-text": "#eff1f3",
} as CSSProperties;

export function DeviceControlView() {
  const { telemetry, connected } = useRealtimeTelemetry();
  const [state, setState] = useState<DeviceControlState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadDeviceControlState().then((nextState) => {
      if (!mounted) {
        return;
      }

      setState(nextState);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const sessionLabel = useMemo(() => {
    if (!state) {
      return "";
    }

    if (state.mode === "auto") {
      return "Hệ thống đang ưu tiên kịch bản tự động.";
    }

    const hours = Math.floor(state.manualExpiresInMinutes / 60);
    const minutes = state.manualExpiresInMinutes % 60;
    return `Ghi đè thủ công còn ${hours} giờ ${minutes.toString().padStart(2, "0")} phút trước khi trả lại chế độ tự động.`;
  }, [state]);

  const updateState = (updater: (current: DeviceControlState) => DeviceControlState) => {
    setState((current) => {
      if (!current) {
        return current;
      }

      const nextState = updater(current);
      setDirty(true);
      return nextState;
    });
  };

  const updatePrimaryDevice = (
    deviceId: string,
    updater: (device: PrimaryDevice) => PrimaryDevice,
  ) => {
    updateState((current) => ({
      ...current,
      primaryDevices: current.primaryDevices.map((device) =>
        device.id === deviceId ? updater(device) : device,
      ),
    }));
  };

  const handleSave = async () => {
    if (!state) {
      return;
    }

    setSaving(true);
    const resolved = await saveDeviceControlState(state);
    setState(resolved);
    setSaving(false);
    setDirty(false);
  };

  if (loading || !state) {
    return <LoadingPanel message="Đang tải màn điều khiển thiết bị..." />;
  }

  return (
    <div
      style={shellStyles}
      className="min-h-full rounded-[2rem] bg-[var(--emerald-background)] p-4 text-[var(--emerald-on-surface)] shadow-[0_24px_60px_rgba(20,57,43,0.05)] sm:p-6 lg:p-8"
    >
      <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[color:rgba(0,108,73,0.1)] px-3 py-1 text-xs font-bold tracking-[0.18em] text-[var(--emerald-primary)]">
              THIẾT BỊ KHU VỰC CHÍNH
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                connected
                  ? "bg-[color:rgba(0,108,73,0.08)] text-[var(--emerald-primary)]"
                  : "bg-[color:rgba(60,74,66,0.08)] text-[var(--emerald-on-surface-variant)]"
              }`}
            >
              {connected ? "Realtime từ server" : "Đang chờ dữ liệu"}
            </span>
          </div>
          <h1
            className="text-4xl font-medium tracking-tight md:text-5xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Điều khiển thiết bị
          </h1>
        </div>

        <div className="flex flex-col gap-4 xl:items-end">
          <div className="flex items-center rounded-full bg-[var(--emerald-surface-low)] p-1.5 shadow-sm">
            <ModeButton
              active={state.mode === "auto"}
              onClick={() =>
                updateState((current) => ({
                  ...current,
                  mode: "auto",
                  manualExpiresInMinutes: 0,
                }))
              }
              label="TỰ ĐỘNG"
            />
            <ModeButton
              active={state.mode === "manual"}
              onClick={() =>
                updateState((current) => ({
                  ...current,
                  mode: "manual",
                  manualExpiresInMinutes: current.manualExpiresInMinutes || 165,
                }))
              }
              label="THỦ CÔNG"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusPill
              label="Đất"
              value={`${telemetry.soil}%`}
              icon={<Droplets className="size-4 text-[var(--emerald-primary)]" />}
            />
            <StatusPill
              label="Không khí"
              value={`${telemetry.humi}%`}
              icon={<Wind className="size-4 text-[var(--emerald-secondary)]" />}
            />
            <StatusPill
              label="Nhiệt độ"
              value={`${telemetry.temp.toFixed(1)}°C`}
              icon={<Thermometer className="size-4 text-[#ef4444]" />}
            />
            <StatusPill
              label="Ánh sáng"
              value={`${telemetry.light}%`}
              icon={<SunMedium className="size-4 text-[var(--emerald-tertiary)]" />}
            />
          </div>
        </div>
      </div>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2
              className="text-3xl"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Thiết bị trọng yếu
            </h2>
            <p className="mt-2 text-sm text-[var(--emerald-on-surface-variant)]">
              Grid đồng cỡ cho nhiều máy bơm/quạt, thay vì 1 bơm lớn và 1 quạt lớn.
            </p>
          </div>
          <div className="rounded-full border border-[color:rgba(187,202,191,0.3)] bg-white px-4 py-2 text-sm font-semibold text-[var(--emerald-on-surface-variant)]">
            {state.primaryDevices.length} thiết bị chính
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {state.primaryDevices.map((device) => (
            <PrimaryDeviceCard
              key={device.id}
              device={device}
              telemetry={telemetry}
              onToggleRunning={() =>
                updatePrimaryDevice(device.id, (current) => ({
                  ...current,
                  running: !current.running,
                  statusLabel: !current.running
                    ? current.kind === "pump"
                      ? "Đang hoạt động"
                      : "Làm mát chủ động"
                    : "Tạm dừng thủ công",
                }))
              }
              onSpeedChange={(value) =>
                updatePrimaryDevice(device.id, (current) => ({
                  ...current,
                  running: value > 0,
                  speedPercent: value,
                  statusLabel: value > 0 ? "Làm mát chủ động" : "Đã tắt",
                }))
              }
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5">
          <h2
            className="text-3xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Thiết bị phụ trợ
          </h2>
          <p className="mt-2 text-sm text-[var(--emerald-on-surface-variant)]">
            Các thiết bị này vẫn giữ ở dạng compact để không làm loãng thông tin chính.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {state.accessories.map((control) => (
            <SecondaryControlCard
              key={control.id}
              control={control}
              onToggle={() =>
                updateState((current) => ({
                  ...current,
                  accessories: current.accessories.map((item) =>
                    item.id === control.id ? { ...item, enabled: !item.enabled } : item,
                  ),
                }))
              }
            />
          ))}
        </div>
      </section>

      <footer className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[color:rgba(187,202,191,0.18)] pt-8 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-0.5 size-5 text-[var(--emerald-danger)]" />
          <div className="space-y-1">
            <p className="text-sm italic text-[var(--emerald-on-surface-variant)]">
              {sessionLabel}
            </p>
            <p className="text-xs text-[color:rgba(60,74,66,0.7)]">
              Kết nối: {connected ? "Realtime đang online" : "Đang chờ realtime"}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() =>
              updateState((current) => ({
                ...current,
                mode: "auto",
                manualExpiresInMinutes: 0,
              }))
            }
            className="rounded-full border border-[color:rgba(187,202,191,0.3)] px-6 py-2 font-bold text-[var(--emerald-on-surface-variant)] transition-colors hover:bg-[var(--emerald-surface-soft)] hover:text-[var(--emerald-on-surface)]"
          >
            Đặt lại về tự động
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--emerald-inverse)] px-8 py-2 font-bold text-[var(--emerald-inverse-text)] transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Save className="size-4 animate-pulse" /> : <Save className="size-4" />}
            Lưu cài đặt
          </button>
        </div>
      </footer>
    </div>
  );
}
