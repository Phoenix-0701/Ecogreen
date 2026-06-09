"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Cpu,
  Plus,
  Trash2,
  Search,
  Wifi,
  WifiOff,
  X,
  Loader2,
  RefreshCw,
  CircuitBoard,
  Zap,
  Clock,
  Droplets,
  Thermometer,
  Wind,
  Activity,
  CheckCircle2,
  PowerOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Device, CreateDevicePayload, Sensor } from "@/types";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { TelemetrySnapshot } from "@/types/automation";
import {
  getDevices,
  createDevice,
  deleteDevice,
  toggleActuator,
  setDeviceMode,
  getDiscoveredDevices,
} from "@/services/device.service";
import { useLanguage } from "@/context/LanguageContext";

const ACTUATOR_STATE_STORAGE_KEY = "ecogreen.device.actuator-states";

type ActuatorRuntimeState = {
  running: boolean;
  startedAt: string | null;
  changedAt: string | null;
  totalMs: number;
};

function createDefaultActuatorState(): ActuatorRuntimeState {
  return {
    running: false,
    startedAt: null,
    changedAt: null,
    totalMs: 0,
  };
}

function readActuatorStates() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(ACTUATOR_STATE_STORAGE_KEY) || "{}",
    ) as Record<string, boolean | Partial<ActuatorRuntimeState>>;

    return Object.fromEntries(
      Object.entries(stored).map(([id, value]) => {
        if (typeof value === "boolean") {
          return [
            id,
            {
              ...createDefaultActuatorState(),
              running: value,
              startedAt: value ? new Date().toISOString() : null,
              changedAt: null,
            },
          ];
        }

        return [
          id,
          {
            ...createDefaultActuatorState(),
            ...value,
            totalMs:
              typeof value.totalMs === "number" &&
              Number.isFinite(value.totalMs)
                ? value.totalMs
                : 0,
          },
        ];
      }),
    ) as Record<string, ActuatorRuntimeState>;
  } catch {
    return {};
  }
}

function writeActuatorStates(states: Record<string, ActuatorRuntimeState>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ACTUATOR_STATE_STORAGE_KEY,
    JSON.stringify(states),
  );
}

function getActuatorRuntimeMs(state: ActuatorRuntimeState, now: number) {
  if (!state.running || !state.startedAt) {
    return state.totalMs;
  }

  const startedAt = new Date(state.startedAt).getTime();

  if (Number.isNaN(startedAt)) {
    return state.totalMs;
  }

  return state.totalMs + Math.max(0, now - startedAt);
}

function formatRuntime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function formatActuatorTime(value: string | null, locale = "vi-VN", fallbackText = "Chưa ghi nhận") {
  if (!value) {
    return fallbackText;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallbackText;
  }

  return date.toLocaleString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function getSensorReading(
  sensor: Sensor,
  telemetry?: TelemetrySnapshot,
  formatTemp?: (val: number, dec?: number) => string
): { value: string; stale: boolean } {
  if (!telemetry) {
    return { value: "—", stale: true };
  }

  const text = `${sensor.type} ${sensor.name}`.toLowerCase();

  if (
    text.includes("temperature") ||
    text.includes("nhiet") ||
    text.includes("nhiệt")
  ) {
    return {
      value: formatTemp ? formatTemp(telemetry.temp) : `${telemetry.temp.toFixed(1)}${sensor.unit || "°C"}`,
      stale: false,
    };
  }

  if (
    text.includes("humidity") ||
    text.includes("khong khi") ||
    text.includes("không khí")
  ) {
    return { value: `${telemetry.humi.toFixed(0)}%`, stale: false };
  }

  if (
    text.includes("soil") ||
    text.includes("dat") ||
    text.includes("đất") ||
    text.includes("moisture")
  ) {
    return { value: `${telemetry.soil.toFixed(0)}%`, stale: false };
  }

  if (
    text.includes("light") ||
    text.includes("lux") ||
    text.includes("anh sang") ||
    text.includes("ánh sáng")
  ) {
    return { value: `${telemetry.light.toFixed(0)} lux`, stale: false };
  }

  return { value: "—", stale: true };
}

function getSensorIconAndColor(sensor: Sensor): {
  icon: React.ReactNode;
  color: string;
  bg: string;
} {
  const text = `${sensor.type} ${sensor.name}`.toLowerCase();

  if (
    text.includes("temperature") ||
    text.includes("nhiet") ||
    text.includes("nhiệt")
  ) {
    return {
      icon: <Thermometer size={18} />,
      color: "#ef4444",
      bg: "linear-gradient(135deg, #fef2f2, #fecaca)",
    };
  }

  if (
    text.includes("soil") ||
    text.includes("dat") ||
    text.includes("đất") ||
    text.includes("moisture")
  ) {
    return {
      icon: <Droplets size={18} />,
      color: "#16a34a",
      bg: "linear-gradient(135deg, #f0fdf4, #bbf7d0)",
    };
  }

  if (text.includes("humidity") || text.includes("ẩm")) {
    return {
      icon: <Wind size={18} />,
      color: "#0284c7",
      bg: "linear-gradient(135deg, #eff6ff, #bfdbfe)",
    };
  }

  return {
    icon: <CircuitBoard size={18} />,
    color: "#7c3aed",
    bg: "linear-gradient(135deg, #faf5ff, #e9d5ff)",
  };
}

export function DeviceListView() {
  const { language, t, formatTemp } = useLanguage();

  // Translate sensor display name by sensor type when in English
  const translateSensorName = (sensor: { type: string; name: string }) => {
    if (language === "vi") return sensor.name;
    const text = `${sensor.type} ${sensor.name}`.toLowerCase();
    if (text.includes("temperature") || text.includes("nhiet") || text.includes("nhiệt")) return "Temperature";
    if (text.includes("soil") || text.includes("dat") || text.includes("đất") || text.includes("moisture")) return "Soil Moisture";
    if (text.includes("humidity") || text.includes("khong khi") || text.includes("không khí") || text.includes("ẩm")) return "Air Humidity";
    if (text.includes("light") || text.includes("lux") || text.includes("anh sang") || text.includes("ánh sáng")) return "Light";
    return sensor.name;
  };

  // Translate actuator display name when in English
  const translateActuatorName = (name: string) => {
    if (language === "vi") return name;
    const lower = name.toLowerCase().trim();
    if (lower === "máy bơm nước" || lower === "máy bơm") return "Water Pump";
    if (lower === "quạt thông gió" || lower === "quạt") return "Ventilation Fan";
    return name;
  };
  const { telemetry, telemetryByMac, socket } = useRealtimeTelemetry();
  const [devices, setDevices] = useState<Device[]>([]);

  // Lắng nghe trạng thái online/offline của thiết bị qua WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleDeviceStatus = (data: { Device_ID: string; status: "online" | "offline"; name: string }) => {
      // 1. Cập nhật danh sách thiết bị
      setDevices((prev) =>
        prev.map((d) =>
          d.Device_ID === data.Device_ID ? { ...d, status: data.status } : d
        )
      );

      // 2. Hiển thị Toast thông báo
      setToast({
        show: true,
        type: data.status === "offline" ? "danger" : "success",
        title: data.status === "offline" ? "Thiết bị mất kết nối" : "Thiết bị đã kết nối",
        message: data.status === "offline"
          ? `Thiết bị "${data.name}" đã mất kết nối với hệ thống.`
          : `Thiết bị "${data.name}" đã kết nối lại thành công.`,
      });

      // 3. Mở Modal cảnh báo lớn giữa màn hình khi thiết bị mất kết nối
      if (data.status === "offline") {
        setDisconnectDeviceName(data.name);
      }
    };

    socket.on("device-status", handleDeviceStatus);

    return () => {
      socket.off("device-status", handleDeviceStatus);
    };
  }, [socket]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actuatorStates, setActuatorStates] = useState<
    Record<string, ActuatorRuntimeState>
  >({});
  const [togglingActuatorId, setTogglingActuatorId] = useState<string | null>(
    null,
  );
  const [runtimeNow, setRuntimeNow] = useState(() => Date.now());
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(
    new Set(),
  );
  const [deviceToDeleteId, setDeviceToDeleteId] = useState<string | null>(null);
  const [disconnectDeviceName, setDisconnectDeviceName] = useState<string | null>(null);
  const [togglingModeDeviceId, setTogglingModeDeviceId] = useState<
    string | null
  >(null);
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "danger";
    title: string;
    message: string;
  } | null>(null);

  // Auto-close toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDevices();
      setDevices(data);
      // Auto-expand all devices by default
      setExpandedDevices(new Set(data.map((d) => d.Device_ID)));
    } catch (err) {
      console.error("Lỗi tải danh sách thiết bị:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (devices.length === 0) {
      return;
    }

    setActuatorStates((current) => {
      const next = { ...readActuatorStates(), ...current };
      let changed = false;
      const now = Date.now();

      devices.forEach((device) => {
        const macUpper = device.mac_address.toUpperCase();
        const deviceTelemetry =
          telemetryByMac[macUpper] ??
          telemetryByMac[device.mac_address] ??
          telemetry;

        device.actuators?.forEach((actuator) => {
          const actuatorId = actuator.Actuator_ID;
          const isFan = actuator.type === "fan";
          const telemetryRunning = isFan 
            ? deviceTelemetry?.fanState
            : deviceTelemetry?.pumpState;

          if (next[actuatorId] === undefined) {
            next[actuatorId] = createDefaultActuatorState();
            changed = true;
          }

          const actuatorState = next[actuatorId];

          // Check if we are in optimistic manual update window (3s) to avoid race conditions with MQTT latency
          const manualTime = new Date(actuatorState.changedAt || 0).getTime();
          const isOptimistic = (now - manualTime) < 3000;

          if (!isOptimistic && telemetryRunning !== undefined && telemetryRunning !== actuatorState.running) {
            const previous = actuatorState;
            next[actuatorId] = {
              running: telemetryRunning,
              changedAt: new Date(now).toISOString(),
              startedAt: telemetryRunning ? new Date(now).toISOString() : null,
              totalMs: telemetryRunning
                ? previous.totalMs
                : getActuatorRuntimeMs(previous, now),
            };
            changed = true;
          }
        });
      });

      if (changed) {
        writeActuatorStates(next);
        return next;
      }

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      if (nextKeys.length !== currentKeys.length) {
        writeActuatorStates(next);
        return next;
      }

      return current;
    });
  }, [devices, telemetryByMac, telemetry]);

  useEffect(() => {
    const hasRunningActuator = Object.values(actuatorStates).some(
      (state) => state.running,
    );

    if (!hasRunningActuator) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRuntimeNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [actuatorStates]);

  const handleDeleteDevice = (id: string) => {
    setDeviceToDeleteId(id);
  };

  const confirmDeleteDevice = async () => {
    if (!deviceToDeleteId) return;
    try {
      await deleteDevice(deviceToDeleteId);
      setDevices((prev) =>
        prev.filter((d) => d.Device_ID !== deviceToDeleteId),
      );
    } catch (err) {
      console.error("Lỗi xóa thiết bị:", err);
    } finally {
      setDeviceToDeleteId(null);
    }
  };

  const handleToggleMode = async (deviceId: string, isAuto: boolean) => {
    try {
      setTogglingModeDeviceId(deviceId);
      await setDeviceMode(deviceId, isAuto);
      setToast({
        show: true,
        type: "success",
        title: t('deviceList.mode.toastSuccess', "Thành công"),
        message: t('deviceList.mode.toastModeMsg', "Đã gửi lệnh chuyển sang chế độ {mode} thành công!")
          .replace('{mode}', isAuto ? t('deviceList.mode.auto', "Tự động") : t('deviceList.mode.manual', "Thủ công")),
      });
    } catch (err) {
      console.error("Lỗi thay đổi chế độ:", err);
      setToast({
        show: true,
        type: "danger",
        title: t('deviceList.mode.toastError', "Lỗi"),
        message: t('deviceList.mode.toastModeErr', "Không thể thay đổi chế độ hoạt động."),
      });
    } finally {
      setTogglingModeDeviceId(null);
    }
  };

  const handleToggleActuator = async (
    actuatorId: string,
    currentRunning: boolean,
    isDeviceOnline: boolean
  ) => {
    if (!isDeviceOnline) {
      setToast({
        show: true,
        type: "danger",
        title: t('deviceList.mode.toastError', "Lỗi"),
        message: "Không thể điều khiển thiết bị",
      });
      return;
    }

    const currentState =
      actuatorStates[actuatorId] ?? createDefaultActuatorState();
    const nextRunning = !currentRunning;

    try {
      setTogglingActuatorId(actuatorId);
      await toggleActuator(actuatorId, nextRunning);
      setActuatorStates((current) => {
        const now = Date.now();
        const previous = current[actuatorId] ?? currentState;
        const nextState: ActuatorRuntimeState = {
          running: nextRunning,
          changedAt: new Date(now).toISOString(),
          startedAt: nextRunning ? new Date(now).toISOString() : null,
          totalMs: nextRunning
            ? previous.totalMs
            : getActuatorRuntimeMs(previous, now),
        };
        const next = { ...current, [actuatorId]: nextState };
        writeActuatorStates(next);
        return next;
      });
    } catch (err) {
      console.error("Lỗi điều khiển actuator:", err);
      setToast({
        show: true,
        type: "danger",
        title: t('deviceList.mode.toastError', "Lỗi"),
        message: err instanceof Error ? err.message : "Không thể điều khiển thiết bị",
      });
    } finally {
      setTogglingActuatorId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.mac_address.toLowerCase().includes(search.toLowerCase()),
  );

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  return (
    <div className="dv-shell">
      {/* ===== Header ===== */}
      <section className="dv-header">
        <div className="dv-header-left">
          <span className="dv-badge-pill">
            {t('deviceList.headerBadge', 'Quản lý phần cứng')}
          </span>
          <h1 className="dv-title">
            {t('deviceList.headerTitle', 'Quản lý thiết bị')}
          </h1>
          <p className="dv-subtitle">
            {t('deviceList.headerSubtitle', 'Xem danh sách thiết bị IoT, trạng thái kết nối, cấu hình cảm biến và điều khiển trực tiếp các cơ cấu chấp hành.')}
          </p>
        </div>
      </section>

      {/* ===== Stats Row ===== */}
      <div className="dv-stats">
        <div className="dv-stat-card dv-stat-card--total">
          <div className="dv-stat-icon dv-stat-icon--total">
            <Cpu size={20} />
          </div>
          <div>
            <p className="dv-stat-label">{t('deviceList.stats.totalDevices', 'Tổng thiết bị')}</p>
            <h3 className="dv-stat-value dv-stat-value--total">{devices.length}</h3>
          </div>
          <div className="dv-stat-shimmer" />
        </div>
        <div className="dv-stat-card dv-stat-card--online">
          <div className="dv-stat-icon dv-stat-icon--online">
            <Wifi size={20} />
          </div>
          <div>
            <p className="dv-stat-label">{t('deviceList.stats.onlineDevices', 'Đang trực tuyến')}</p>
            <h3 className="dv-stat-value dv-stat-value--online">
              {onlineCount}
            </h3>
          </div>
          <div className="dv-stat-shimmer" />
        </div>
        <div className="dv-stat-card dv-stat-card--offline">
          <div className="dv-stat-icon dv-stat-icon--offline">
            <WifiOff size={20} />
          </div>
          <div>
            <p className="dv-stat-label">{t('deviceList.stats.offlineDevices', 'Ngoại tuyến')}</p>
            <h3 className="dv-stat-value dv-stat-value--offline">
              {offlineCount}
            </h3>
          </div>
          <div className="dv-stat-shimmer" />
        </div>
      </div>

      {/* ===== Toolbar ===== */}
      <div className="dv-toolbar">
        <div className="dv-search-wrap">
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              display: "flex",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={t('deviceList.searchPlaceholder', 'Tìm tên thiết bị hoặc địa chỉ MAC...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dv-search-input"
            id="device-search-input"
          />
          {search && (
            <button className="dv-search-clear" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="dv-toolbar-right">
          <button
            onClick={fetchDevices}
            className="dv-btn dv-btn--ghost"
            title={t('deviceList.refreshTitle', 'Làm mới')}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="dv-btn dv-btn--primary"
            id="add-device-btn"
          >
            <Plus size={18} />
            {t('deviceList.addDeviceBtn', 'Thêm thiết bị')}
          </button>
        </div>
      </div>

      {/* ===== Device List ===== */}
      <div className="dv-list">
        {loading ? (
          <div className="dv-empty">
            <Loader2
              size={36}
              className="animate-spin"
              style={{ color: "#22c55e" }}
            />
            <p>{t('deviceList.loadingDevices', 'Đang tải danh sách thiết bị...')}</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="dv-empty">
            <div className="dv-empty-icon">
              <Cpu size={40} />
            </div>
            <h3>{t('deviceList.noDevicesTitle', 'Chưa có thiết bị nào')}</h3>
            <p>{t('deviceList.noDevicesDesc', 'Nhấn "Thêm thiết bị" để đăng ký thiết bị IoT mới')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="dv-btn dv-btn--primary"
              style={{ marginTop: "0.5rem" }}
            >
              <Plus size={16} /> {t('deviceList.addDeviceBtn', 'Thêm thiết bị')}
            </button>
          </div>
        ) : (
          filteredDevices.map((device) => {
            const isOnline = device.status === "online";
            const isExpanded = expandedDevices.has(device.Device_ID);
            const macUpper = device.mac_address.toUpperCase();
            const deviceTelemetry =
              telemetryByMac[macUpper] ??
              telemetryByMac[device.mac_address] ??
              telemetry;
            const isAuto = deviceTelemetry?.autoMode ?? true;

            return (
              <div
                key={device.Device_ID}
                className={`dv-card ${isOnline ? "dv-card--online" : "dv-card--offline"}`}
              >
                {/* Card Header */}
                <div
                  className="dv-card-header"
                  onClick={() => toggleExpanded(device.Device_ID)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && toggleExpanded(device.Device_ID)
                  }
                >
                  <div className="dv-card-left">
                    <div
                      className={`dv-online-ring ${isOnline ? "dv-online-ring--on" : ""}`}
                    >
                      <div
                        className={`dv-online-dot ${isOnline ? "dv-online-dot--on" : ""}`}
                      />
                    </div>
                    <div className="dv-card-identity">
                      <div className="dv-card-name-row">
                        <h4 className="dv-card-name">{device.name}</h4>
                        <span
                          className={`dv-badge ${isOnline ? "dv-badge--online" : "dv-badge--offline"}`}
                        >
                          {isOnline ? (
                            <>
                              <CheckCircle2 size={10} /> {t('deviceList.stats.online', 'Online')}
                            </>
                          ) : (
                            <>
                              <WifiOff size={10} /> {t('deviceList.stats.offline', 'Offline')}
                            </>
                          )}
                        </span>
                      </div>
                      <div className="dv-card-meta">
                        <span className="dv-mac">{device.mac_address}</span>
                        <span className="dv-meta-sep">·</span>
                        <span>
                          <Clock
                            size={11}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                            }}
                          />{" "}
                          {device.last_seen_at
                            ? new Date(device.last_seen_at).toLocaleString(
                                language === 'vi' ? 'vi-VN' : 'en-US',
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                },
                              )
                            : t('deviceList.card.noSeenRecord', 'Chưa ghi nhận')}
                        </span>
                        <span className="dv-meta-sep">·</span>
                        <span>
                          <CircuitBoard
                            size={11}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                            }}
                          />{" "}
                          {t('deviceList.card.sensorsCount', '{count} cảm biến').replace('{count}', String(device.sensors?.length ?? 0))}
                        </span>
                        <span className="dv-meta-sep">·</span>
                        <span>
                          <Zap
                            size={11}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                            }}
                          />{" "}
                          {t('deviceList.card.actuatorsCount', '{count} thiết bị chấp hành').replace('{count}', String(device.actuators?.length ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dv-card-right">
                    <button
                      className="dv-icon-btn dv-icon-btn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDevice(device.Device_ID);
                      }}
                      title={t('deviceList.card.deleteTitle', 'Xóa thiết bị')}
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      className="dv-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(device.Device_ID);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Body - Expandable */}
                {isExpanded && (
                  <div className="dv-card-body">
                    {/* Device Mode Switch Section */}
                    <div className="dv-mode-section">
                      <div className="dv-mode-info">
                        <span className="dv-mode-title">{t('deviceList.mode.title', 'Chế độ vận hành')}</span>
                        <p className="dv-mode-desc">
                          {isAuto
                            ? t('deviceList.mode.autoDesc', 'Chế độ Tự động (AUTO): Thiết bị tự động điều chỉnh theo cảm biến & lịch trình.')
                            : t('deviceList.mode.manualDesc', 'Chế độ Thủ công (MANUAL): Cho phép bật/tắt thiết bị bằng nút nhấn trực tiếp.')}
                        </p>
                      </div>
                      <div className="dv-mode-switch-group">
                        <button
                          onClick={() =>
                            handleToggleMode(device.Device_ID, true)
                          }
                          disabled={togglingModeDeviceId === device.Device_ID}
                          className={`dv-mode-tab ${isAuto ? "dv-mode-tab--active-auto" : ""}`}
                        >
                          {t('deviceList.mode.auto', 'Tự động')}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleMode(device.Device_ID, false)
                          }
                          disabled={togglingModeDeviceId === device.Device_ID}
                          className={`dv-mode-tab ${!isAuto ? "dv-mode-tab--active-manual" : ""}`}
                        >
                          {t('deviceList.mode.manual', 'Thủ công')}
                        </button>
                      </div>
                    </div>

                    {/* Sensor Grid */}
                    <div className="dv-section">
                      <div className="dv-section-header">
                        <Activity size={14} />
                        <span>{t('deviceList.realtimeSensors', 'Cảm biến thời gian thực')}</span>
                        <span className="dv-section-count">
                          {device.sensors?.length ?? 0}
                        </span>
                      </div>
                      {device.sensors && device.sensors.length > 0 ? (
                        <div className="dv-sensor-grid">
                          {device.sensors.map((s) => {
                            const reading = getSensorReading(
                              s,
                              deviceTelemetry,
                              formatTemp
                            );
                            const text = `${s.type} ${s.name}`.toLowerCase();
                            const isTemp = text.includes("temperature") || text.includes("nhiet") || text.includes("nhiệt");
                            const displayValue = (isTemp && deviceTelemetry) 
                              ? formatTemp(deviceTelemetry.temp) 
                              : reading.value;
                            const { icon, color, bg } =
                              getSensorIconAndColor(s);
                            return (
                              <div key={s.Sensor_ID} className="dv-sensor-tile">
                                <div
                                  className="dv-sensor-icon-wrap"
                                  style={{ background: bg, color }}
                                >
                                  {icon}
                                </div>
                                <div className="dv-sensor-info">
                                  <span className="dv-sensor-name">
                                    {translateSensorName(s)}
                                  </span>
                                  <strong
                                    className="dv-sensor-value"
                                    style={{
                                      color: reading.stale ? "#9ca3af" : color,
                                    }}
                                  >
                                    {displayValue}
                                  </strong>
                                  <span className="dv-sensor-meta">
                                    Pin {s.pin_connection} · {isTemp ? `°${formatTemp(0).slice(-1)}` : s.unit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="dv-empty-text">{t('deviceList.noSensors', 'Chưa có cảm biến nào')}</p>
                      )}
                    </div>

                    {/* Actuator Grid */}
                    <div className="dv-section">
                      <div className="dv-section-header">
                        <Zap size={14} />
                        <span>{t('deviceList.actuators', 'Thiết bị chấp hành')}</span>
                        <span className="dv-section-count">
                          {device.actuators?.length ?? 0}
                        </span>
                      </div>
                      {device.actuators && device.actuators.length > 0 ? (
                        <div className="dv-actuator-grid">
                          {device.actuators.map((a) => {
                            const actuatorState =
                              actuatorStates[a.Actuator_ID] ??
                              createDefaultActuatorState();
                            const isFan = a.type === "fan";
                            
                            // Sử dụng trạng thái thực từ MQTT telemetry nếu có, ngược lại dùng state cục bộ
                            const telemetryRunning = isFan 
                              ? deviceTelemetry?.fanState
                              : deviceTelemetry?.pumpState;
                              
                            // Nếu người dùng vừa bấm thủ công trong vòng 3 giây qua, ưu tiên dùng trạng thái cục bộ để tránh bị giật UI do trễ telemetry
                            const manualTime = new Date(actuatorState.changedAt || 0).getTime();
                            const isOptimistic = (Date.now() - manualTime) < 3000;
                            
                            const running = isOptimistic 
                              ? actuatorState.running 
                              : (telemetryRunning !== undefined ? telemetryRunning : actuatorState.running);
                            
                            const toggling =
                              togglingActuatorId === a.Actuator_ID;
                            const runtimeLabel = formatRuntime(
                              getActuatorRuntimeMs(actuatorState, runtimeNow),
                            );

                            // Pump = blue, Fan = green
                            const activeColor = isFan ? "#16a34a" : "#0284c7";
                            const activeBg = isFan
                              ? "rgba(22,163,74,0.15)"
                              : "rgba(2,132,199,0.15)";
                            const activeShadow = isFan
                              ? "rgba(34,197,94,0.3)"
                              : "rgba(2,132,199,0.3)";
                            const activeGradient = isFan
                              ? "linear-gradient(135deg,#22c55e,#16a34a)"
                              : "linear-gradient(135deg,#38bdf8,#0284c7)";

                            return (
                              <div
                                key={a.Actuator_ID}
                                className={`dv-actuator-card ${running ? (isFan ? "dv-actuator-card--on-green" : "dv-actuator-card--on-blue") : ""}`}
                              >
                                {/* Glow effect when running */}
                                {running && (
                                  <div
                                    className="dv-actuator-glow"
                                    style={{
                                      background: `radial-gradient(circle, ${activeBg} 0%, transparent 70%)`,
                                    }}
                                  />
                                )}

                                <div className="dv-actuator-top">
                                  <div
                                    className="dv-actuator-icon-wrap"
                                    style={{
                                      background: running
                                        ? activeBg
                                        : "#f3f4f6",
                                      color: running ? activeColor : "#9ca3af",
                                    }}
                                  >
                                    {isFan ? (
                                      <Wind size={22} />
                                    ) : (
                                      <Droplets size={22} />
                                    )}
                                  </div>
                                  <div className="dv-actuator-identity">
                                    <h5 className="dv-actuator-name">
                                      {translateActuatorName(a.name)}
                                    </h5>
                                    <p className="dv-actuator-type">
                                      {isFan
                                        ? t('deviceList.actuator.fan', 'Quạt thông gió')
                                        : t('deviceList.actuator.pump', 'Máy bơm nước')}{" "}
                                      · {t('deviceList.actuator.pin', 'Pin')} {a.pin_connection}
                                    </p>
                                  </div>
                                  <span
                                    className={`dv-actuator-badge ${running ? "dv-actuator-badge--on" : "dv-actuator-badge--off"}`}
                                    style={
                                      running
                                        ? {
                                            background: `${activeBg}`,
                                            color: activeColor,
                                          }
                                        : !running && !isFan && isAuto && deviceTelemetry?.cooldownRemain && deviceTelemetry.cooldownRemain > 0
                                          ? {
                                              background: "rgba(245, 158, 11, 0.15)", // Amber-500
                                              color: "#d97706", // Amber-600
                                            }
                                          : {}
                                    }
                                  >
                                    {!running && !isFan && isAuto && deviceTelemetry?.cooldownRemain && deviceTelemetry.cooldownRemain > 0
                                      ? t('deviceList.actuator.cooldown', 'Chờ {min}p {sec}s')
                                          .replace('{min}', String(Math.floor(deviceTelemetry.cooldownRemain / 60)))
                                          .replace('{sec}', String(deviceTelemetry.cooldownRemain % 60))
                                      : running
                                        ? t('deviceList.actuator.statusOn', 'Đang bật')
                                        : t('deviceList.actuator.statusOff', 'Đang tắt')}
                                  </span>
                                </div>

                                <div className="dv-actuator-stats">
                                  <div className="dv-actuator-stat">
                                    <span>{t('deviceList.actuator.runtime', 'Thời gian chạy')}</span>
                                    <strong>{runtimeLabel}</strong>
                                  </div>
                                  <div className="dv-actuator-stat">
                                    <span>{t('deviceList.actuator.lastChange', 'Lần đổi trạng thái')}</span>
                                    <strong>
                                      {formatActuatorTime(
                                        actuatorState.changedAt,
                                        language === 'vi' ? 'vi-VN' : 'en-US',
                                        t('deviceList.actuator.noRecord', 'Chưa ghi nhận')
                                      )}
                                    </strong>
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    handleToggleActuator(a.Actuator_ID, running, isOnline)
                                  }
                                  disabled={toggling || isAuto}
                                  className="dv-actuator-toggle"
                                  style={
                                    isAuto
                                      ? {
                                          background: "#e2e8f0",
                                          color: "#94a3b8",
                                          border: "1.5px solid #cbd5e1",
                                          cursor: "not-allowed",
                                          boxShadow: "none",
                                        }
                                      : running
                                        ? {
                                            background: activeGradient,
                                            color: "white",
                                            border: "none",
                                            boxShadow: `0 3px 12px ${activeShadow}`,
                                          }
                                        : {
                                            background: "white",
                                            border: "1.5px solid #e5e7eb",
                                            color: "#374151",
                                          }
                                  }
                                >
                                  {toggling ? (
                                    <>
                                      <Loader2
                                        size={15}
                                        className="animate-spin"
                                      />{" "}
                                      {t('deviceList.actuator.processing', 'Đang xử lý...')}
                                    </>
                                  ) : isAuto ? (
                                    <>
                                      <PowerOff size={15} /> {t('deviceList.actuator.lockAuto', 'Khóa (Tự động)')}
                                    </>
                                  ) : running ? (
                                    <>
                                      <PowerOff size={15} /> {t('deviceList.actuator.turnOff', 'Tắt thiết bị')}
                                    </>
                                  ) : (
                                    <>
                                      <Zap size={15} /> {t('deviceList.actuator.turnOn', 'Bật thiết bị')}
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="dv-empty-text">
                          {t('deviceList.noActuators', 'Chưa có thiết bị chấp hành nào')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newDevice) => {
            setDevices((prev) => [newDevice, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deviceToDeleteId && (
        <ConfirmDeleteModal
          onClose={() => setDeviceToDeleteId(null)}
          onConfirm={confirmDeleteDevice}
        />
      )}

      {disconnectDeviceName && (
        <DisconnectModal
          deviceName={disconnectDeviceName}
          onClose={() => setDisconnectDeviceName(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_10px_30px_rgba(16,185,129,0.08),0_2px_8px_rgba(0,0,0,0.04)] animate-slide-in-up">
          {toast.type === "success" ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="size-5" />
            </div>
          )}
          <div className="flex-1 pt-0.5">
            <h4
              className={`text-sm font-extrabold tracking-tight ${toast.type === "success" ? "text-emerald-900" : "text-red-950"}`}
            >
              {toast.title}
            </h4>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 flex size-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <style jsx>{`
        /* ===== Shell ===== */
        .dv-shell {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ===== Header ===== */
        .dv-header {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 1.75rem 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        @media (min-width: 1024px) {
          .dv-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .dv-header-left {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dv-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(16, 185, 129, 0.15);
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          width: fit-content;
        }

        .dv-title {
          font-size: 1.875rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .dv-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* ===== Stats ===== */
        .dv-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .dv-stat-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dv-stat-card--total:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
        }

        .dv-stat-card--online:hover {
          transform: translateY(-3px);
          border-color: #bbf7d0;
          box-shadow: 0 10px 25px rgba(22, 163, 74, 0.08);
        }

        .dv-stat-card--offline:hover {
          transform: translateY(-3px);
          border-color: #fecaca;
          box-shadow: 0 10px 25px rgba(220, 38, 38, 0.08);
        }

        .dv-stat-shimmer {
          position: absolute;
          top: 0;
          right: 0;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          transform: translate(25px, -25px);
          transition: transform 0.25s ease;
          pointer-events: none;
        }

        .dv-stat-card:hover .dv-stat-shimmer {
          transform: translate(15px, -15px) scale(1.1);
        }

        .dv-stat-card--total .dv-stat-shimmer {
          background: radial-gradient(
            circle,
            rgba(15, 23, 42, 0.05) 0%,
            transparent 70%
          );
        }

        .dv-stat-card--online .dv-stat-shimmer {
          background: radial-gradient(
            circle,
            rgba(22, 163, 74, 0.06) 0%,
            transparent 70%
          );
        }

        .dv-stat-card--offline .dv-stat-shimmer {
          background: radial-gradient(
            circle,
            rgba(220, 38, 38, 0.06) 0%,
            transparent 70%
          );
        }

        .dv-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }

        .dv-stat-card:hover .dv-stat-icon {
          transform: scale(1.08) rotate(3deg);
        }

        .dv-stat-icon--total {
          background: linear-gradient(135deg, #475569, #1e293b);
          color: #f8fafc;
        }

        .dv-stat-icon--online {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
        }

        .dv-stat-icon--offline {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
        }

        .dv-stat-label {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 3px;
        }

        .dv-stat-value {
          font-size: 1.875rem;
          font-weight: 850;
          color: #0f172a;
          line-height: 1;
        }

        .dv-stat-value--total {
          color: #1e293b;
        }

        .dv-stat-value--online {
          color: #10b981;
        }

        .dv-stat-value--offline {
          color: #ef4444;
        }

        /* ===== Toolbar ===== */
        .dv-toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .dv-search-wrap {
          position: relative;
          flex: 1;
          min-width: 260px;
        }

        .dv-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .dv-search-input {
          width: 100%;
          padding: 0.72rem 2.5rem 0.72rem 2.75rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          color: #111827;
        }

        .dv-search-input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
        }

        .dv-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
        }

        .dv-search-clear:hover {
          background: #e5e7eb;
        }

        .dv-toolbar-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: auto;
        }

        .dv-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.65rem 1.2rem;
          border-radius: 12px;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .dv-btn--primary {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);
        }

        .dv-btn--primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(34, 197, 94, 0.4);
        }

        .dv-btn--ghost {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
          padding: 0.65rem;
        }

        .dv-btn--ghost:hover {
          background: #f9fafb;
        }

        /* ===== List ===== */
        .dv-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ===== Empty ===== */
        .dv-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
          gap: 0.75rem;
          color: #9ca3af;
        }

        .dv-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d1d5db;
          margin-bottom: 0.5rem;
        }

        .dv-empty h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #4b5563;
        }

        .dv-empty p {
          font-size: 0.875rem;
        }

        /* ===== Device Card ===== */
        .dv-card {
          background: white;
          border-radius: 20px;
          border: 1.5px solid #e5e7eb;
          overflow: hidden;
          transition:
            border-color 0.2s,
            box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .dv-card:hover {
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
        }

        .dv-card--online {
          border-color: #dcfce7;
        }

        .dv-card--online:hover {
          border-color: #86efac;
          box-shadow: 0 6px 24px rgba(34, 197, 94, 0.1);
        }

        .dv-card--offline {
          border-color: #f3f4f6;
          opacity: 0.85;
        }

        /* Card Header */
        .dv-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s;
          gap: 1rem;
        }

        .dv-card-header:hover {
          background: #fafafa;
        }

        .dv-card-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .dv-online-ring {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .dv-online-ring--on {
          border-color: rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.05);
          animation: ringPulse 2.5s ease-in-out infinite;
        }

        @keyframes ringPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.2);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.05);
          }
        }

        .dv-online-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #d1d5db;
          transition: background 0.3s;
        }

        .dv-online-dot--on {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
          animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%,
          100% {
            box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 14px rgba(34, 197, 94, 0.7);
          }
        }

        .dv-card-identity {
          flex: 1;
          min-width: 0;
        }

        .dv-card-name-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .dv-card-name {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dv-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          border-radius: 100px;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .dv-badge--online {
          background: #dcfce7;
          color: #16a34a;
        }

        .dv-badge--offline {
          background: #f3f4f6;
          color: #9ca3af;
        }

        .dv-card-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.3rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .dv-mac {
          font-family: "Courier New", monospace;
          font-size: 0.72rem;
          background: #f3f4f6;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          color: #6b7280;
        }

        .dv-meta-sep {
          color: #d1d5db;
        }

        .dv-card-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .dv-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #9ca3af;
        }

        .dv-icon-btn--danger:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        .dv-expand-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: all 0.2s;
        }

        .dv-expand-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        /* Card Body */
        .dv-card-body {
          padding: 0 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          animation: bodySlide 0.22s ease-out;
          border-top: 1px solid #f3f4f6;
          padding-top: 1.25rem;
        }

        @keyframes bodySlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mode Section */
        .dv-mode-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1rem 1.25rem;
          background: #fafafa;
          border: 1.5px solid #f0f0f0;
          border-radius: 16px;
          transition: all 0.2s;
        }

        .dv-mode-section:hover {
          background: white;
          border-color: #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .dv-mode-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
          flex: 1;
        }

        .dv-mode-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
        }

        .dv-mode-desc {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .dv-mode-switch-group {
          display: flex;
          background: #f3f4f6;
          padding: 0.2rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .dv-mode-tab {
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.45rem 1rem;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .dv-mode-tab:hover:not(:disabled):not([class*="active"]) {
          background: rgba(0, 0, 0, 0.04);
          color: #374151;
        }

        .dv-mode-tab:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        .dv-mode-tab--active-auto {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }

        .dv-mode-tab--active-manual {
          background: linear-gradient(135deg, #4b5563, #374151);
          color: white;
          box-shadow: 0 2px 8px rgba(75, 85, 99, 0.3);
        }

        /* Section */
        .dv-section {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .dv-section-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .dv-section-count {
          margin-left: auto;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
        }

        /* Sensor Grid */
        .dv-sensor-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        .dv-sensor-tile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 1rem;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-radius: 14px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dv-sensor-tile:hover {
          background: white;
          border-color: #e5e7eb;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          transform: translateY(-3px);
        }

        .dv-sensor-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }

        .dv-sensor-tile:hover .dv-sensor-icon-wrap {
          transform: scale(1.08) rotate(3deg);
        }

        .dv-sensor-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .dv-sensor-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: #6b7280;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .dv-sensor-value {
          font-size: 1.35rem;
          font-weight: 850;
          line-height: 1.1;
          transition: transform 0.25s ease;
          transform-origin: left center;
          display: inline-block;
        }

        .dv-sensor-tile:hover .dv-sensor-value {
          transform: scale(1.04);
        }

        .dv-sensor-meta {
          font-size: 0.65rem;
          color: #9ca3af;
        }

        /* Actuator Grid */
        .dv-actuator-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 0.875rem;
        }

        .dv-actuator-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.25rem;
          background: #fafafa;
          border: 1.5px solid #f0f0f0;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.25s;
        }

        .dv-actuator-card--on-green {
          background: linear-gradient(135deg, #f0fdf4, #ffffff);
          border-color: #86efac;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.12);
        }

        .dv-actuator-card--on-blue {
          background: linear-gradient(135deg, #eff6ff, #ffffff);
          border-color: #7dd3fc;
          box-shadow: 0 4px 16px rgba(2, 132, 199, 0.12);
        }

        .dv-actuator-glow {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(34, 197, 94, 0.15) 0%,
            transparent 70%
          );
          pointer-events: none;
        }

        .dv-actuator-top {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .dv-actuator-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .dv-actuator-identity {
          flex: 1;
          min-width: 0;
        }

        .dv-actuator-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
        }

        .dv-actuator-type {
          font-size: 0.72rem;
          color: #9ca3af;
          margin-top: 0.1rem;
        }

        .dv-actuator-badge {
          padding: 0.25rem 0.7rem;
          border-radius: 100px;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .dv-actuator-badge--on {
          background: #dcfce7;
          color: #15803d;
        }

        .dv-actuator-badge--off {
          background: #f3f4f6;
          color: #6b7280;
        }

        .dv-actuator-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }

        .dv-actuator-stat {
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
        }

        .dv-actuator-stat span {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #9ca3af;
          margin-bottom: 0.25rem;
        }

        .dv-actuator-stat strong {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dv-actuator-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          width: 100%;
          padding: 0.75rem;
          border-radius: 12px;
          border: none;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dv-actuator-toggle--off {
          background: white;
          border: 1.5px solid #e5e7eb;
          color: #374151;
        }

        .dv-actuator-toggle--off:hover:not(:disabled) {
          background: #f0fdf4;
          border-color: #22c55e;
          color: #16a34a;
        }

        .dv-actuator-toggle--on {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 3px 12px rgba(34, 197, 94, 0.3);
        }

        .dv-actuator-toggle--on:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
          transform: translateY(-1px);
        }

        .dv-actuator-toggle:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .dv-empty-text {
          font-size: 0.8rem;
          color: #9ca3af;
          font-style: italic;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1024px) {
          .dv-sensor-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dv-stats {
            grid-template-columns: 1fr;
          }
          .dv-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .dv-search-wrap {
            max-width: 100%;
          }
          .dv-toolbar-right {
            margin-left: 0;
          }
          .dv-sensor-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dv-actuator-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .dv-sensor-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/* ========================================== */
/*       ADD DEVICE MODAL                     */
/* ========================================== */
function AddDeviceModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (device: Device) => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [discoveredMacs, setDiscoveredMacs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [macError, setMacError] = useState("");

  const fetchDiscovered = useCallback(async () => {
    setIsScanning(true);
    setError("");
    try {
      const macs = await getDiscoveredDevices();
      setDiscoveredMacs(macs);
      if (macs.length > 0) {
        setMacAddress(macs[0]);
        setMacError("");
      } else {
        setMacAddress("");
      }
    } catch (err) {
      console.error("Lỗi quét thiết bị:", err);
      setError("Không thể quét tìm thiết bị mới!");
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscovered();
  }, [fetchDiscovered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMacError("");

    if (!macAddress) {
      setMacError("Vui lòng chọn một địa chỉ MAC hợp lệ!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateDevicePayload = {
        name,
        mac_address: macAddress.toUpperCase(),
      };
      const newDevice = await createDevice(payload);
      onSuccess(newDevice);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('deviceList.addModal.createError', "Không thể tạo thiết bị!"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title={t('deviceList.addModal.title', "Đăng ký thiết bị IoT mới")}>
      <form onSubmit={handleSubmit} className="modal-form">
        {error && <div className="modal-error">{error}</div>}

        <div className="modal-field">
          <label>{t('deviceList.addModal.nameLabel', "Tên thiết bị *")}</label>
          <input
            type="text"
            placeholder={t('deviceList.addModal.namePlaceholder', "VD: ESP32 - Vườn rau")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            id="device-name-input"
          />
        </div>

        <div className="modal-field">
          <label>{t('deviceList.addModal.macLabel', "Địa chỉ MAC *")}</label>
          <div className="mac-input-row">
            <select
              value={macAddress}
              onChange={(e) => {
                setMacAddress(e.target.value);
                setMacError("");
              }}
              required
              id="device-mac-select"
              className={macError ? 'mac-select mac-select--error' : 'mac-select'}
            >
              <option value="">-- Chọn địa chỉ MAC --</option>
              {discoveredMacs.map((mac) => (
                <option key={mac} value={mac}>{mac}</option>
              ))}
            </select>
            <button
              type="button"
              className={isScanning ? 'mac-scan-btn mac-scan-btn--spinning' : 'mac-scan-btn'}
              onClick={fetchDiscovered}
              disabled={isScanning}
              title="Quét tìm thiết bị mới"
            >
              {isScanning ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
            </button>
          </div>

          {discoveredMacs.length === 0 && !isScanning ? (
            <div className="mac-notice mac-notice--warn">
              <span className="mac-notice-icon">⚠️</span>
              <span>Không tìm thấy thiết bị mới. Vui lòng cắm nguồn thiết bị ESP32 để hệ thống tự dò quét và hiển thị địa chỉ MAC tại đây.</span>
            </div>
          ) : discoveredMacs.length > 0 ? (
            <div className="mac-notice mac-notice--ok">
              <span className="mac-notice-icon">✅</span>
              <span>Tìm thấy <strong>{discoveredMacs.length}</strong> thiết bị mới đang chờ kết nối.</span>
            </div>
          ) : null}

          {macError && (
            <div className="mac-notice mac-notice--err">
              <span className="mac-notice-icon">🚫</span>
              <span>{macError}</span>
            </div>
          )}
        </div>
        <style jsx>{`
          .mac-input-row {
            display: flex;
            gap: 0.5rem;
            align-items: stretch;
          }
          .mac-select {
            flex: 1;
            height: 44px;
            padding: 0 0.875rem;
            border-radius: 11px;
            border: 1.5px solid #e5e7eb;
            font-size: 0.875rem;
            outline: none;
            background: #fafafa;
            color: #111827;
            transition: all 0.2s;
            cursor: pointer;
            appearance: auto;
          }
          .mac-select:focus {
            border-color: #22c55e;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
            background: white;
          }
          .mac-select--error {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }
          .mac-scan-btn {
            flex-shrink: 0;
            width: 44px;
            height: 44px;
            border-radius: 11px;
            border: 1.5px solid #e5e7eb;
            background: white;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.22s;
          }
          .mac-scan-btn:hover:not(:disabled) {
            border-color: #22c55e;
            background: #f0fdf4;
            color: #16a34a;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.18);
            transform: rotate(20deg);
          }
          .mac-scan-btn:disabled {
            opacity: 0.6;
            cursor: wait;
          }
          .mac-notice {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.6rem 0.875rem;
            border-radius: 10px;
            font-size: 0.78rem;
            line-height: 1.45;
            border: 1px solid transparent;
            margin-top: -0.15rem;
          }
          .mac-notice--warn {
            background: #fff7ed;
            border-color: #fed7aa;
            color: #92400e;
          }
          .mac-notice--ok {
            background: #f0fdf4;
            border-color: #bbf7d0;
            color: #14532d;
          }
          .mac-notice--err {
            background: #fef2f2;
            border-color: #fecaca;
            color: #991b1b;
          }
          .mac-notice-icon {
            flex-shrink: 0;
            margin-top: 1px;
          }
        `}</style>

        <div className="modal-actions">
          <button type="button" className="modal-btn-cancel" onClick={onClose}>
            {t('deviceList.addModal.cancel', "Hủy")}
          </button>
          <button
            type="submit"
            className="modal-btn-submit"
            disabled={isSubmitting || !macAddress || discoveredMacs.length === 0}
            id="device-submit-btn"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {t('deviceList.addModal.submit', "Đăng ký thiết bị")}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

/* ========================================== */
/*       DELETE CONFIRMATION MODAL            */
/* ========================================== */
function ConfirmDeleteModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  return (
    <ModalWrapper onClose={onClose} title={t('deviceList.deleteModal.title', "Xóa thiết bị")}>
      <div className="confirm-modal-body">
        <div className="confirm-icon-wrap">
          <AlertTriangle size={32} />
        </div>
        <p className="confirm-text">
          {t('deviceList.deleteModal.confirmMsg', "Bạn có chắc chắn muốn xóa thiết bị này không?")}
        </p>
        <p className="confirm-subtext">
          {t('deviceList.deleteModal.warningMsg', "Tất cả dữ liệu cảm biến, lịch sử hoạt động và các cài đặt liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác!")}
        </p>

        <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" className="modal-btn-cancel" onClick={onClose}>
            {t('deviceList.deleteModal.cancel', "Hủy")}
          </button>
          <button
            type="button"
            className="modal-btn-danger"
            onClick={onConfirm}
            id="confirm-delete-btn"
          >
            {t('deviceList.deleteModal.submit', "Xóa thiết bị")}
          </button>
        </div>
      </div>
      <style jsx>{`
        .confirm-modal-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem 1.25rem;
          text-align: center;
        }

        .confirm-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fef2f2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          animation: pulseWarning 2s infinite;
        }

        @keyframes pulseWarning {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .confirm-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .confirm-subtext {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          width: 100%;
        }

        .modal-btn-cancel {
          flex: 1;
          padding: 0.75rem;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn-cancel:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .modal-btn-danger {
          flex: 1;
          padding: 0.75rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
        }

        .modal-btn-danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        }
      `}</style>
    </ModalWrapper>
  );
}

/* ========================================== */
/*       DISCONNECT WARNING MODAL             */
/* ========================================== */
function DisconnectModal({
  deviceName,
  onClose,
}: {
  deviceName: string;
  onClose: () => void;
}) {
  return (
    <ModalWrapper onClose={onClose} title="Thiết bị mất kết nối">
      <div className="confirm-modal-body">
        <div className="confirm-icon-wrap">
          <PowerOff size={32} />
        </div>
        <p className="confirm-text">
          Thiết bị "{deviceName}" đã mất kết nối với hệ thống.
        </p>
        <p className="confirm-subtext">
          Vui lòng kiểm tra lại nguồn điện, trạng thái hoạt động của thiết bị hoặc cấu hình kết nối mạng Wi-Fi.
        </p>

        <div className="modal-actions" style={{ marginTop: "1.5rem", width: "100%" }}>
          <button type="button" className="modal-btn-cancel" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
      <style jsx>{`
        .confirm-modal-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1.5rem 1.25rem;
          text-align: center;
        }

        .confirm-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fef2f2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          animation: pulseWarning 2s infinite;
        }

        @keyframes pulseWarning {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .confirm-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .confirm-subtext {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .modal-btn-cancel {
          width: 100%;
          padding: 0.75rem;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn-cancel:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
      `}</style>
    </ModalWrapper>
  );
}

/* ========================================== */
/*       MODAL WRAPPER (shared)               */
/* ========================================== */
function ModalWrapper({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: white;
          border-radius: 22px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
          animation: modalUp 0.28s ease;
        }

        @keyframes modalUp {
          from {
            transform: translateY(24px) scale(0.97);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .modal-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e5e7eb;
          color: #374151;
        }
      `}</style>

      <style jsx global>{`
        .modal-form {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .modal-error {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 0.85rem;
        }

        .modal-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .modal-field label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .modal-field input,
        .modal-field select {
          padding: 0.72rem 1rem;
          border-radius: 11px;
          border: 1.5px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          background: #fafafa;
          color: #111827;
        }

        .modal-field input:focus,
        .modal-field select:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
          background: white;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.25rem;
        }

        .modal-btn-cancel {
          flex: 1;
          padding: 0.75rem;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn-cancel:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .modal-btn-submit {
          flex: 1;
          padding: 0.75rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);
        }

        .modal-btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(34, 197, 94, 0.4);
        }

        .modal-btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
