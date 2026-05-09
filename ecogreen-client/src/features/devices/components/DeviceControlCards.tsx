import type { ReactNode } from "react";
import {
  CloudFog,
  Droplets,
  Fan,
  Leaf,
  SunMedium,
  Thermometer,
  Waves,
} from "lucide-react";
import type {
  DeviceAccessory,
  PrimaryDevice,
  TelemetrySnapshot,
} from "@/types/automation";

const toneClasses: Record<DeviceAccessory["tone"], { icon: string; surface: string }> = {
  violet: {
    icon: "text-[var(--emerald-tertiary)]",
    surface: "bg-[color:rgba(103,75,181,0.12)]",
  },
  emerald: {
    icon: "text-[var(--emerald-primary)]",
    surface: "bg-[color:rgba(0,108,73,0.1)]",
  },
  blue: {
    icon: "text-[var(--emerald-secondary)]",
    surface: "bg-[color:rgba(0,102,138,0.12)]",
  },
};

export function PrimaryDeviceCard({
  device,
  telemetry,
  onToggleRunning,
  onSpeedChange,
}: {
  device: PrimaryDevice;
  telemetry: TelemetrySnapshot;
  onToggleRunning: () => void;
  onSpeedChange: (value: number) => void;
}) {
  const isPump = device.kind === "pump";
  const badgeClass = isPump
    ? "bg-[color:rgba(0,108,73,0.1)] text-[var(--emerald-primary)]"
    : "bg-[color:rgba(0,102,138,0.1)] text-[var(--emerald-secondary)]";
  const iconClass = isPump ? "text-[var(--emerald-primary)]" : "text-[var(--emerald-secondary)]";
  const Icon = isPump ? Waves : Fan;

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[var(--emerald-surface)] p-8 shadow-[24px_24px_48px_-12px_rgba(0,108,73,0.04)]">
      <div
        className={`pointer-events-none absolute inset-0 ${
          isPump
            ? "bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.15),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(64,194,253,0.14),transparent_38%)]"
            : "bg-[radial-gradient(circle_at_80%_20%,rgba(64,194,253,0.16),transparent_35%),radial-gradient(circle_at_10%_80%,rgba(0,108,73,0.08),transparent_32%)]"
        }`}
      />

      <div className="relative z-10">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${badgeClass}`}>
              {device.badge}
            </span>
            <h3
              className="mt-4 text-3xl"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {device.label}
            </h3>
            <p className="font-medium text-[color:rgba(60,74,66,0.72)]">
              {device.location}
            </p>
          </div>
          <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-[var(--emerald-surface-low)]">
            <Icon className={`size-8 ${iconClass}`} />
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <MetricBlock label="Trạng thái hiện tại">
            <div className="flex items-center gap-2">
              <div
                className={`size-2.5 rounded-full ${
                  device.running
                    ? isPump
                      ? "bg-[var(--emerald-primary)]"
                      : "bg-[var(--emerald-secondary)]"
                    : "bg-[color:rgba(60,74,66,0.35)]"
                }`}
              />
              <span className="text-xl font-bold">{device.statusLabel}</span>
            </div>
          </MetricBlock>
          <MetricBlock label="Thời gian chạy">
            <span className="text-xl font-bold">{device.runtimeLabel}</span>
          </MetricBlock>
          <MetricBlock label={isPump ? "Tốc độ dòng chảy" : "Tốc độ quạt"}>
            <span className="text-xl font-bold">
              {isPump ? `${device.flowRate?.toFixed(1)} L/phút` : `${device.speedPercent ?? 0}%`}
            </span>
          </MetricBlock>
          <MetricBlock label="Điện năng tiêu thụ">
            <span className="text-xl font-bold">{device.powerWatts}W</span>
          </MetricBlock>
        </div>

        {!isPump ? (
          <div className="mb-8 space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--emerald-on-surface-variant)]">
              Điều khiển tốc độ
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={device.speedPercent ?? 0}
              onChange={(event) => onSpeedChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--emerald-surface-low)] accent-[var(--emerald-secondary)]"
            />
          </div>
        ) : null}

        <div className="rounded-[1.5rem] border border-[color:rgba(0,108,73,0.08)] bg-[color:rgba(242,244,246,0.7)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--emerald-on-surface-variant)]">
            Tự động hóa theo cảm biến
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InsightMetric label="Ưu tiên khu vực" value={device.zone} />
            <InsightMetric
              label={isPump ? "Độ ẩm đất" : "Nhiệt độ hiện tại"}
              value={isPump ? `${telemetry.soil}%` : `${telemetry.temp.toFixed(1)}°C`}
            />
            <InsightMetric
              label={isPump ? "Gợi ý điều khiển" : "Ẩm không khí"}
              value={isPump ? device.automationHint : `${telemetry.humi}%`}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8 flex gap-4">
        <ActionButton variant="ghost" onClick={onToggleRunning}>
          {device.running ? "Tắt" : "Giữ tắt"}
        </ActionButton>
        <ActionButton variant={isPump ? "primary" : "secondary"} onClick={onToggleRunning}>
          {device.running ? "Đang bật" : "Bật"}
        </ActionButton>
      </div>
    </section>
  );
}

export function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all md:px-8 ${
        active
          ? "scale-105 bg-[var(--emerald-primary)] text-white shadow-lg shadow-[rgba(0,108,73,0.18)]"
          : "text-[var(--emerald-on-surface-variant)] hover:text-[var(--emerald-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

export function StatusPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[color:rgba(187,202,191,0.26)] bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--emerald-on-surface-variant)]">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-[var(--emerald-on-surface)]">{value}</div>
    </div>
  );
}

export function SecondaryControlCard({
  control,
  onToggle,
}: {
  control: DeviceAccessory;
  onToggle: () => void;
}) {
  const Icon =
    control.icon === "sun"
      ? SunMedium
      : control.icon === "mist"
        ? CloudFog
        : control.icon === "fan"
          ? Fan
          : control.icon === "droplet"
            ? Droplets
            : control.icon === "thermo"
              ? Thermometer
              : Leaf;
  const tone = toneClasses[control.tone];

  return (
    <section className="flex items-center justify-between rounded-[2rem] bg-[var(--emerald-surface)] p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex size-12 items-center justify-center rounded-[1rem] ${tone.surface}`}>
          <Icon className={`size-6 ${tone.icon}`} />
        </div>
        <div>
          <h4 className="text-lg font-bold">{control.title}</h4>
          <p className="text-xs text-[var(--emerald-on-surface-variant)]">
            {control.description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-12 overflow-hidden rounded-full transition-colors ${
          control.enabled ? "bg-[var(--emerald-primary)]" : "bg-[var(--emerald-surface-low)]"
        }`}
        aria-pressed={control.enabled}
        aria-label={control.title}
      >
        <span
          className={`absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform ${
            control.enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </section>
  );
}

function MetricBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-[0.18em] text-[var(--emerald-on-surface-variant)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function InsightMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] bg-white/75 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--emerald-on-surface-variant)]">
        {label}
      </div>
      <div className="mt-1 font-semibold text-[var(--emerald-on-surface)]">{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  variant,
  onClick,
}: {
  children: ReactNode;
  variant: "ghost" | "primary" | "secondary";
  onClick: () => void;
}) {
  const classes =
    variant === "primary"
      ? "bg-gradient-to-r from-[var(--emerald-primary)] to-[var(--emerald-primary-soft)] text-white shadow-lg shadow-[rgba(0,108,73,0.18)] hover:scale-[1.02]"
      : variant === "secondary"
        ? "bg-[var(--emerald-secondary-soft)] text-[var(--emerald-on-surface)] shadow-lg shadow-[rgba(64,194,253,0.18)] hover:scale-[1.02]"
        : "bg-[var(--emerald-surface-low)] text-[var(--emerald-on-surface)] hover:bg-[var(--emerald-surface-variant)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-2xl py-4 font-bold transition-all active:scale-95 ${classes}`}
    >
      {children}
    </button>
  );
}
