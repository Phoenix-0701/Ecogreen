"use client";

import { requestJson as apiRequestJson } from "@/services/api";
import type {
  DeviceControlState,
  PrimaryDevice,
  PrimaryDeviceKind,
  ScheduleState,
  SmartLogicLog,
  SmartLogicState,
  TelemetrySnapshot,
  ThresholdState,
} from "@/types/automation";

const DEFAULT_TELEMETRY: TelemetrySnapshot = {
  temp: 29.8,
  humi: 63,
  soil: 35,
  light: 78,
  updatedAt: new Date().toISOString(),
  source: "mock",
};

const DEFAULT_DEVICE_STATE: DeviceControlState = {
  mode: "manual",
  zone: "Phân khu phía Bắc",
  manualExpiresInMinutes: 165,
  primaryDevices: [
    {
      id: "pump-01",
      kind: "pump",
      label: "Máy bơm nước 01",
      location: "Bơm hồ chứa chính - Đơn vị 04",
      badge: "HỆ THỐNG ĐANG HOẠT ĐỘNG",
      statusLabel: "Đang hoạt động",
      running: true,
      runtimeLabel: "02:14:45",
      flowRate: 4.2,
      powerWatts: 120,
      zone: "Phân khu phía Bắc",
      automationHint: "Ưu tiên tưới nhanh khi độ ẩm đất giảm xuống dưới 32%.",
    },
    {
      id: "pump-02",
      kind: "pump",
      label: "Máy bơm nước 02",
      location: "Máng tưới trung tâm - Đơn vị 07",
      badge: "CHẾ ĐỘ DỰ PHÒNG",
      statusLabel: "Sẵn sàng thay phiên",
      running: false,
      runtimeLabel: "00:28:10",
      flowRate: 3.5,
      powerWatts: 86,
      zone: "Khu ươm cây non",
      automationHint: "Giữ áp suất ống ổn định cho nhánh tưới phụ.",
    },
    {
      id: "fan-01",
      kind: "fan",
      label: "Quạt làm mát 01",
      location: "Đơn vị thông gió - Phía Bắc",
      badge: "ỔN ĐỊNH VI KHÍ HẬU",
      statusLabel: "Làm mát chủ động",
      running: true,
      runtimeLabel: "01:46:20",
      speedPercent: 45,
      powerWatts: 74,
      zone: "Giàn treo trên",
      automationHint: "Tăng tốc độ khi nhiệt độ vượt 30°C.",
    },
    {
      id: "fan-02",
      kind: "fan",
      label: "Quạt làm mát 02",
      location: "Lối hút gió Tây - Đơn vị 02",
      badge: "LUÂN CHUYỂN NỀN",
      statusLabel: "Chạy nền tiết kiệm",
      running: true,
      runtimeLabel: "05:12:08",
      speedPercent: 25,
      powerWatts: 38,
      zone: "Khu râm mát",
      automationHint: "Giữ lớp không khí dưới tán lá thông thoáng.",
    },
  ],
  accessories: [
    {
      id: "grow-light",
      title: "Ánh sáng tăng trưởng",
      description: "Quang phổ: nở hoa toàn phần",
      enabled: true,
      tone: "violet",
      icon: "sun",
    },
    {
      id: "mist",
      title: "Hệ thống phun sương",
      description: "Nghỉ - chạy lần cuối 12p trước",
      enabled: false,
      tone: "emerald",
      icon: "mist",
    },
    {
      id: "co2",
      title: "Phun khí CO2",
      description: "Đã tắt - chỉ điều khiển thủ công",
      enabled: false,
      tone: "blue",
      icon: "leaf",
    },
    {
      id: "shade-screen",
      title: "Rèm che nắng",
      description: "Tự động kéo 60% khi bức xạ vượt ngưỡng",
      enabled: true,
      tone: "blue",
      icon: "sun",
    },
    {
      id: "nutrient-pump",
      title: "Bơm dinh dưỡng",
      description: "Pha loãng dung dịch NPK theo chu kỳ sáng",
      enabled: true,
      tone: "emerald",
      icon: "droplet",
    },
    {
      id: "root-heater",
      title: "Sưởi gốc",
      description: "Giữ vùng rễ ổn định trong ca đêm lạnh",
      enabled: false,
      tone: "violet",
      icon: "thermo",
    },
    {
      id: "air-circulation",
      title: "Tuần hoàn không khí",
      description: "Quạt đối lưu tầng thấp đang chạy nền 25%",
      enabled: true,
      tone: "blue",
      icon: "fan",
    },
  ],
};

const DEFAULT_THRESHOLD_STATE: ThresholdState = {
  zone: "Phân khu phía Bắc",
  dryThreshold: 32,
  wetThreshold: 68,
  maxPumpSeconds: 45,
  cooldownHours: 2.5,
  highTempC: 34,
  soilBands: [28, 34, 41, 52, 61, 73, 70, 57, 44, 39, 42, 49],
  recommendation:
    "Trầu bà lá xẻ đang ở giai đoạn phát triển mạnh. Có thể giữ ngưỡng khô quanh 32% để rễ thông khí tốt hơn vào buổi trưa.",
};

const DEFAULT_SMART_LOGIC_STATE: SmartLogicState = {
  enabled: true,
  providerLabel: "OpenWeather",
  apiKey: "••••••••••••••••",
  city: "Ho Chi Minh City",
  rainThreshold: 65,
  lastRainProbability: 82,
  projectedSavingsPercent: 14,
  decision: "skip",
  logs: [
    {
      id: "sl-1",
      time: "12:44:02",
      message:
        "Đánh chặn đang hoạt động: phát hiện 82% xác suất mưa trong 24 giờ tới.",
      level: "success",
    },
    {
      id: "sl-2",
      time: "12:30:15",
      message: "Dữ liệu dự báo đã được cập nhật thành công từ nguồn dự báo.",
      level: "info",
    },
    {
      id: "sl-3",
      time: "11:58:44",
      message: "Smart Logic đã đồng bộ lại khu vực theo dõi với thành phố hiện tại.",
      level: "system",
    },
  ],
};

const DEFAULT_SCHEDULE_STATE: ScheduleState = {
  enabled: true,
  schedules: [
    {
      id: "sched-1",
      title: "Phun sương lan sáng",
      zone: "Nhà lan khu A",
      icon: "sprout",
      time: "06:00",
      durationMinutes: 15,
      days: [1, 3, 5],
      enabled: true,
    },
    {
      id: "sched-2",
      title: "Tưới đẫm dương xỉ",
      zone: "Vườn ươm phía Tây",
      icon: "waves",
      time: "16:30",
      durationMinutes: 45,
      days: [2, 4, 6],
      enabled: true,
    },
  ],
  dailyConsumptionLiters: [18, 24, 56, 39, 49, 16, 71],
  projectedSavingsPercent: 12,
  advisory:
    "Độ ẩm đất đang cao ở cánh Tây. AI đề xuất bỏ qua chu kỳ 04:30 PM hôm nay để tránh úng rễ.",
};

const STORAGE_KEYS = {
  telemetry: "ecogreen.telemetry",
  device: "ecogreen.automation.device",
  thresholds: "ecogreen.automation.thresholds",
  smartLogic: "ecogreen.automation.smart-logic",
  schedule: "ecogreen.automation.schedule",
  selectedDeviceId: "ecogreen.selected-device-id",
};

interface BackendSensor {
  Sensor_ID: string;
  Device_ID: string;
  name: string;
  type: string;
  unit: string;
}

interface BackendActuator {
  Actuator_ID: string;
  Device_ID: string;
  name: string;
  type: string;
}

interface BackendDevice {
  Device_ID: string;
  name: string;
  mac_address: string;
  status: string;
  last_seen_at?: string | null;
  sensors?: BackendSensor[];
  actuators?: BackendActuator[];
}

interface BackendThreshold {
  Threshold_ID: string;
  Sensor_ID: string;
  Actuator_ID: string;
  min_value: number;
  max_value: number;
  is_enabled: boolean;
  sensor?: BackendSensor;
  actuator?: BackendActuator;
}

interface BackendActivityLog {
  Log_ID: string;
  event_type: string;
  status: string;
  description: string;
  occurred_at: string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isBrowser() {
  return typeof window !== "undefined";
}

async function requestJson<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    return await apiRequestJson<T>(endpoint, {
      ...options,
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return clone(fallback);
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return clone(fallback);
    }

    return JSON.parse(raw) as T;
  } catch {
    return clone(fallback);
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readRawStorage(key: string) {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeRawStorage(key: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

async function loadBackendDevices() {
  const devices = await requestJson<BackendDevice[]>("/v1/devices");
  return Array.isArray(devices) ? devices : [];
}

function selectDevice(devices: BackendDevice[]) {
  const selectedId = readRawStorage(STORAGE_KEYS.selectedDeviceId);
  const selected = devices.find((device) => device.Device_ID === selectedId) ?? devices[0];

  if (selected) {
    writeRawStorage(STORAGE_KEYS.selectedDeviceId, selected.Device_ID);
  }

  return selected;
}

function isSoilSensor(sensor: BackendSensor) {
  const text = `${sensor.type} ${sensor.name}`.toLowerCase();
  return text.includes("soil") || text.includes("dat") || text.includes("moisture");
}

function isPumpActuator(actuator: BackendActuator) {
  const text = `${actuator.type} ${actuator.name}`.toLowerCase();
  return text.includes("pump") || text.includes("bom");
}

function mapBackendActuator(
  actuator: BackendActuator,
  device: BackendDevice,
  previous?: PrimaryDevice,
): PrimaryDevice {
  const kind: PrimaryDeviceKind = actuator.type.toLowerCase().includes("fan")
    ? "fan"
    : "pump";
  const running = previous?.running ?? false;

  return {
    id: actuator.Actuator_ID,
    kind,
    label: actuator.name || (kind === "pump" ? "May bom nuoc" : "Quat lam mat"),
    location: device.name || device.mac_address,
    badge: device.status === "online" ? "ONLINE" : "OFFLINE",
    statusLabel: running ? "Dang hoat dong" : "Dang tat",
    running,
    runtimeLabel: previous?.runtimeLabel ?? "00:00:00",
    flowRate: kind === "pump" ? previous?.flowRate ?? 0 : undefined,
    speedPercent: kind === "fan" ? previous?.speedPercent ?? (running ? 50 : 0) : undefined,
    powerWatts: previous?.powerWatts ?? 0,
    zone: device.name || "Thiet bi da dang ky",
    automationHint:
      kind === "pump"
        ? "Dieu khien qua API /v1/actuators/:id/toggle."
        : "Dieu khien toc do hien chua co API rieng.",
  };
}

function mapBackendDeviceState(
  device: BackendDevice,
  previous: DeviceControlState,
): DeviceControlState {
  const previousById = new Map(previous.primaryDevices.map((item) => [item.id, item]));
  const primaryDevices = (device.actuators ?? []).map((actuator) =>
    mapBackendActuator(actuator, device, previousById.get(actuator.Actuator_ID)),
  );

  return {
    ...previous,
    zone: device.name || previous.zone,
    primaryDevices: primaryDevices.length > 0 ? primaryDevices : previous.primaryDevices,
  };
}

function findThresholdTargets(device: BackendDevice) {
  const soilSensor =
    device.sensors?.find(isSoilSensor) ?? device.sensors?.[0] ?? null;
  const pumpActuator =
    device.actuators?.find(isPumpActuator) ?? device.actuators?.[0] ?? null;

  return { soilSensor, pumpActuator };
}

function mapBackendThresholdState(
  device: BackendDevice,
  thresholds: BackendThreshold[],
  previous: ThresholdState,
): ThresholdState {
  const threshold =
    thresholds.find((item) => item.sensor && isSoilSensor(item.sensor)) ?? thresholds[0];

  if (!threshold) {
    return { ...previous, zone: device.name || previous.zone };
  }

  return {
    ...previous,
    zone: device.name || previous.zone,
    dryThreshold: Math.round(threshold.min_value),
    wetThreshold: Math.round(threshold.max_value),
  };
}

function mapBackendLog(entry: BackendActivityLog): SmartLogicLog {
  const occurredAt = new Date(entry.occurred_at);

  return {
    id: entry.Log_ID,
    time: Number.isNaN(occurredAt.getTime())
      ? todayTimeLabel()
      : todayTimeLabel(occurredAt),
    message: entry.description || entry.status || entry.event_type,
    level: entry.event_type === "WARNING" ? "success" : "info",
  };
}

function todayTimeLabel(date = new Date()) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createLog(message: string, level: SmartLogicLog["level"]): SmartLogicLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: todayTimeLabel(),
    message,
    level,
  };
}

export function getStoredTelemetry() {
  return readStorage(STORAGE_KEYS.telemetry, DEFAULT_TELEMETRY);
}

export function persistTelemetry(nextTelemetry: TelemetrySnapshot) {
  writeStorage(STORAGE_KEYS.telemetry, nextTelemetry);
}

export async function loadDeviceControlState() {
  const fallback = readStorage(STORAGE_KEYS.device, DEFAULT_DEVICE_STATE);
  const devices = await loadBackendDevices();
  const selectedDevice = selectDevice(devices);

  if (selectedDevice) {
    const resolved = mapBackendDeviceState(selectedDevice, fallback);
    writeStorage(STORAGE_KEYS.device, resolved);
    return resolved;
  }

  return fallback;
}

export async function saveDeviceControlState(nextState: DeviceControlState) {
  const previous = readStorage(STORAGE_KEYS.device, DEFAULT_DEVICE_STATE);
  const previousById = new Map(previous.primaryDevices.map((item) => [item.id, item]));

  await Promise.all(
    nextState.primaryDevices.map(async (device) => {
      const previousDevice = previousById.get(device.id);
      if (!previousDevice || previousDevice.running === device.running) {
        return;
      }

      await requestJson(`/v1/actuators/${device.id}/toggle`, {
        method: "POST",
        body: JSON.stringify({ state: device.running }),
      });
    }),
  );

  writeStorage(STORAGE_KEYS.device, nextState);
  return nextState;
}

export async function loadThresholdState() {
  const fallback = readStorage(STORAGE_KEYS.thresholds, DEFAULT_THRESHOLD_STATE);
  const devices = await loadBackendDevices();
  const selectedDevice = selectDevice(devices);

  if (selectedDevice) {
    const apiData = await requestJson<BackendThreshold[]>(
      `/v1/devices/${selectedDevice.Device_ID}/thresholds`,
    );
    const resolved = mapBackendThresholdState(
      selectedDevice,
      Array.isArray(apiData) ? apiData : [],
      fallback,
    );
    writeStorage(STORAGE_KEYS.thresholds, resolved);
    return resolved;
  }

  return fallback;
}

export async function saveThresholdState(nextState: ThresholdState) {
  const devices = await loadBackendDevices();
  const selectedDevice = selectDevice(devices);

  if (selectedDevice) {
    const { soilSensor, pumpActuator } = findThresholdTargets(selectedDevice);

    if (soilSensor && pumpActuator) {
      await requestJson<BackendThreshold>("/v1/thresholds", {
        method: "POST",
        body: JSON.stringify({
          Sensor_ID: soilSensor.Sensor_ID,
          Actuator_ID: pumpActuator.Actuator_ID,
          min_value: nextState.dryThreshold,
          max_value: nextState.wetThreshold,
          is_enabled: true,
        }),
      });
    }
  }

  writeStorage(STORAGE_KEYS.thresholds, nextState);
  return nextState;
}

export async function loadSmartLogicState() {
  const fallback = readStorage(STORAGE_KEYS.smartLogic, DEFAULT_SMART_LOGIC_STATE);
  const devices = await loadBackendDevices();
  const selectedDevice = selectDevice(devices);

  if (selectedDevice) {
    const logs = await requestJson<BackendActivityLog[]>(
      `/v1/devices/${selectedDevice.Device_ID}/logs?limit=8`,
    );

    if (Array.isArray(logs) && logs.length > 0) {
      const resolved = {
        ...fallback,
        logs: logs.map(mapBackendLog),
      };
      writeStorage(STORAGE_KEYS.smartLogic, resolved);
      return resolved;
    }
  }

  return fallback;
}

export async function saveSmartLogicState(nextState: SmartLogicState) {
  writeStorage(STORAGE_KEYS.smartLogic, nextState);
  return nextState;
}

export async function evaluateSmartLogic(
  nextState: SmartLogicState,
  telemetry: TelemetrySnapshot,
) {
  const offset = (telemetry.humi - telemetry.soil) * 0.45 + telemetry.temp * 0.35;
  const generatedProbability = Math.max(
    12,
    Math.min(96, Math.round(nextState.rainThreshold - 6 + offset)),
  );
  const decision = generatedProbability >= nextState.rainThreshold ? "skip" : "execute";
  const message =
    decision === "skip"
      ? `Dự báo mưa ${generatedProbability}% vượt ngưỡng ${nextState.rainThreshold}%, chu kỳ tưới sẽ bị đánh chặn.`
      : `Dự báo mưa ${generatedProbability}% thấp hơn ngưỡng ${nextState.rainThreshold}%, chu kỳ tưới được giữ nguyên.`;

  const resolved: SmartLogicState = {
    ...nextState,
    lastRainProbability: generatedProbability,
    decision,
    logs: [
      createLog("Yêu cầu kiểm tra thời tiết đã được mô phỏng trên frontend.", "system"),
      createLog(message, "success"),
      ...nextState.logs,
    ].slice(0, 8),
  };

  writeStorage(STORAGE_KEYS.smartLogic, resolved);
  return resolved;
}

export async function loadScheduleState() {
  return readStorage(STORAGE_KEYS.schedule, DEFAULT_SCHEDULE_STATE);
}

export async function saveScheduleState(nextState: ScheduleState) {
  writeStorage(STORAGE_KEYS.schedule, nextState);
  return nextState;
}

export function createEmptyScheduleRule() {
  return {
    id: `sched-${Date.now()}`,
    title: "Chu kỳ tưới mới",
    zone: "Khu canh tác mới",
    icon: "sprout" as const,
    time: "07:00",
    durationMinutes: 20,
    days: [1, 3, 5],
    enabled: true,
  };
}
