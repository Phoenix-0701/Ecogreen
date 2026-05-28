"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Droplets,
  Leaf,
  RefreshCcw,
  Thermometer,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDevices, getSensorReadings } from "@/services/device.service";
import type { Device, Sensor } from "@/types";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { TelemetrySnapshot } from "@/types/automation";

type MetricKey = "temp" | "humi" | "soil" | "light";

type ChartPoint = {
  recordedAt: string;
  time: string;
  temp?: number;
  humi?: number;
  soil?: number;
  light?: number;
};

type ReadingLike = {
  value: number | string;
  recorded_at?: string;
  recordedAt?: string;
  created_at?: string;
};

const metricConfig: Record<
  MetricKey,
  { label: string; unit: string; color: string }
> = {
  temp: { label: "Nhiệt độ", unit: "°C", color: "#ef4444" },
  humi: { label: "Độ ẩm không khí", unit: "%", color: "#2563eb" },
  soil: { label: "Độ ẩm đất", unit: "%", color: "#059669" },
  light: { label: "Ánh sáng", unit: "lux", color: "#d97706" },
};

const limitOptions = [50, 100, 200, 300];

function normalizeText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSensorMetric(sensor: Sensor): MetricKey | null {
  const haystack = `${normalizeText(sensor.type)} ${normalizeText(sensor.name)}`;

  if (haystack.includes("soil") || haystack.includes("dat")) {
    return "soil";
  }

  if (haystack.includes("light") || haystack.includes("lux")) {
    return "light";
  }

  if (haystack.includes("temp") || haystack.includes("nhiet")) {
    return "temp";
  }

  if (
    haystack.includes("humi") ||
    haystack.includes("humidity") ||
    haystack.includes("do am") ||
    haystack.includes("khong khi")
  ) {
    return "humi";
  }

  return null;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullTime(value?: string) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function toNumber(value: unknown) {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));

  return Number.isFinite(parsed) ? Number(parsed.toFixed(1)) : undefined;
}

function getReadingTime(reading: ReadingLike) {
  return (
    reading.recorded_at ??
    reading.recordedAt ??
    reading.created_at ??
    new Date().toISOString()
  );
}

function toChartPoint(snapshot: TelemetrySnapshot): ChartPoint {
  return {
    recordedAt: snapshot.updatedAt,
    time: formatTime(snapshot.updatedAt),
    temp: toNumber(snapshot.temp),
    humi: toNumber(snapshot.humi),
    soil: toNumber(snapshot.soil),
    light: toNumber(snapshot.light),
  };
}

function mergePoints(points: ChartPoint[], nextPoint: ChartPoint, limit: number) {
  const byTime = new Map(points.map((point) => [point.recordedAt, point]));
  byTime.set(nextPoint.recordedAt, {
    ...byTime.get(nextPoint.recordedAt),
    ...nextPoint,
  });

  return Array.from(byTime.values())
    .sort(
      (left, right) =>
        new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime()
    )
    .slice(-limit);
}

function buildHistoryPoints(
  readingsByMetric: Partial<Record<MetricKey, ReadingLike[]>>
) {
  const byTime = new Map<string, ChartPoint>();

  Object.entries(readingsByMetric).forEach(([metric, readings]) => {
    readings?.forEach((reading) => {
      const value = toNumber(reading.value);

      if (value === undefined) {
        return;
      }

      const recordedAt = getReadingTime(reading);
      const current = byTime.get(recordedAt) ?? {
        recordedAt,
        time: formatTime(recordedAt),
      };

      byTime.set(recordedAt, {
        ...current,
        [metric]: value,
      });
    });
  });

  return Array.from(byTime.values()).sort(
    (left, right) =>
      new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime()
  );
}

function getLatestValue(points: ChartPoint[], metric: MetricKey) {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const value = points[index][metric];

    if (typeof value === "number") {
      return value;
    }
  }

  return undefined;
}

export function ChartView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [limit, setLimit] = useState(100);
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRealtimeKeyRef = useRef<string | null>(null);
  const { telemetry, connected } = useRealtimeTelemetry();

  useEffect(() => {
    let mounted = true;

    getDevices()
      .then((nextDevices) => {
        if (!mounted) {
          return;
        }

        setDevices(nextDevices);
        setSelectedDeviceId((current) => current || nextDevices[0]?.Device_ID || "");
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Không tải được thiết bị");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.Device_ID === selectedDeviceId),
    [devices, selectedDeviceId]
  );

  const metricSensors = useMemo(() => {
    const sensors = selectedDevice?.sensors ?? [];
    const next: Partial<Record<MetricKey, Sensor>> = {};

    sensors.forEach((sensor) => {
      const metric = getSensorMetric(sensor);

      if (metric && !next[metric]) {
        next[metric] = sensor;
      }
    });

    return next;
  }, [selectedDevice]);

  useEffect(() => {
    let mounted = true;

    if (!selectedDevice) {
      setPoints([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadHistory = async () => {
      try {
        const entries = await Promise.all(
          (Object.entries(metricSensors) as [MetricKey, Sensor][]).map(
            async ([metric, sensor]) => {
              const readings = await getSensorReadings(sensor.Sensor_ID, limit);
              return [metric, readings] as const;
            }
          )
        );

        if (!mounted) {
          return;
        }

        setPoints(
          buildHistoryPoints(Object.fromEntries(entries)).slice(-limit)
        );
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Không tải được dữ liệu biểu đồ"
          );
          setPoints([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, [selectedDevice, metricSensors, limit]);

  useEffect(() => {
    if (!selectedDevice || !telemetry.updatedAt) {
      return;
    }

    if (
      telemetry.macAddress &&
      telemetry.macAddress !== selectedDevice.mac_address
    ) {
      return;
    }

    const realtimeKey = `${selectedDevice.Device_ID}-${telemetry.updatedAt}`;

    if (lastRealtimeKeyRef.current === realtimeKey) {
      return;
    }

    lastRealtimeKeyRef.current = realtimeKey;
    setPoints((current) =>
      mergePoints(current, toChartPoint(telemetry), Math.max(limit, 100))
    );
  }, [limit, selectedDevice, telemetry]);

  const latestAt = points.at(-1)?.recordedAt;
  const latestValues = (Object.keys(metricConfig) as MetricKey[]).map(
    (metric) => ({
      metric,
      value: getLatestValue(points, metric),
      ...metricConfig[metric],
    })
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Telemetry realtime
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Biểu đồ cảm biến theo ESP
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Dữ liệu lịch sử lấy từ readings API, điểm mới được cập nhật từ
              socket realtime-data.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              ESP
              <select
                value={selectedDeviceId}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className="h-11 min-w-56 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {devices.map((device) => (
                  <option key={device.Device_ID} value={device.Device_ID}>
                    {device.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Số điểm
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {limitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {latestValues.map(({ metric, label, unit, color, value }) => (
          <div
            key={metric}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                {label}
              </span>
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {value ?? "--"}
              </span>
              <span className="pb-1 text-sm font-semibold text-slate-500">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Diễn biến cảm biến
              </h2>
              <p className="text-sm text-slate-500">
                Cập nhật gần nhất: {formatFullTime(latestAt)}
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
                connected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {connected ? "Realtime online" : "Realtime offline"}
            </div>
          </div>

          <div className="h-[430px] min-w-0">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                Đang tải biểu đồ...
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <RefreshCcw size={28} className="text-slate-400" />
                <p className="max-w-md text-sm font-semibold text-slate-600">
                  {error}
                </p>
              </div>
            ) : points.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Activity size={30} className="text-slate-400" />
                <p className="text-sm font-semibold text-slate-600">
                  Chưa có dữ liệu readings cho ESP này.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={points}
                  margin={{ left: 4, right: 16, top: 12, bottom: 8 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                    }}
                    labelFormatter={(_, payload) =>
                      formatFullTime(payload?.[0]?.payload?.recordedAt)
                    }
                  />
                  <Legend />
                  {(Object.keys(metricConfig) as MetricKey[]).map((metric) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      name={`${metricConfig[metric].label} (${metricConfig[metric].unit})`}
                      stroke={metricConfig[metric].color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Nguồn dữ liệu</h3>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="ESP" value={selectedDevice?.name ?? "--"} />
              <InfoRow
                label="MAC"
                value={selectedDevice?.mac_address ?? "--"}
              />
              <InfoRow label="Điểm chart" value={`${points.length}`} />
              <InfoRow label="Sensor map" value={`${Object.keys(metricSensors).length}/4`} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              Sensor đang dùng
            </h3>
            <div className="mt-4 space-y-3">
              <SensorMapRow
                icon={<Thermometer size={16} />}
                label="Nhiệt độ"
                sensor={metricSensors.temp}
              />
              <SensorMapRow
                icon={<Droplets size={16} />}
                label="Độ ẩm không khí"
                sensor={metricSensors.humi}
              />
              <SensorMapRow
                icon={<Leaf size={16} />}
                label="Độ ẩm đất"
                sensor={metricSensors.soil}
              />
              <SensorMapRow
                icon={<Activity size={16} />}
                label="Ánh sáng"
                sensor={metricSensors.light}
              />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function SensorMapRow({
  icon,
  label,
  sensor,
}: {
  icon: React.ReactNode;
  label: string;
  sensor?: Sensor;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="truncate text-xs text-slate-500">
          {sensor
            ? `${sensor.name} - Pin ${sensor.pin_connection}`
            : "Chưa map được sensor"}
        </p>
      </div>
    </div>
  );
}
