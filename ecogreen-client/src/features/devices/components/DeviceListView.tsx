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
} from "lucide-react";
import { Device, CreateDevicePayload, Sensor } from "@/types";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { TelemetrySnapshot } from "@/types/automation";
import {
  getDevices,
  createDevice,
  deleteDevice,
  toggleActuator,
} from "@/services/device.service";

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
              typeof value.totalMs === "number" && Number.isFinite(value.totalMs)
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

  window.localStorage.setItem(ACTUATOR_STATE_STORAGE_KEY, JSON.stringify(states));
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

function formatActuatorTime(value: string | null) {
  if (!value) {
    return "Chưa ghi nhận";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa ghi nhận";
  }

  return date.toLocaleString("vi-VN", {
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
): { value: string; stale: boolean } {
  if (!telemetry) {
    return { value: "Chưa có dữ liệu", stale: true };
  }

  const text = `${sensor.type} ${sensor.name}`.toLowerCase();

  if (text.includes("temperature") || text.includes("nhiet") || text.includes("nhiệt")) {
    return { value: `${telemetry.temp.toFixed(1)}${sensor.unit || "°C"}`, stale: false };
  }

  if (text.includes("humidity") || text.includes("khong khi") || text.includes("không khí")) {
    return { value: `${telemetry.humi}%`, stale: false };
  }

  if (text.includes("soil") || text.includes("dat") || text.includes("đất") || text.includes("moisture")) {
    return { value: `${telemetry.soil}%`, stale: false };
  }

  if (text.includes("light") || text.includes("lux") || text.includes("anh sang") || text.includes("ánh sáng")) {
    return { value: `${telemetry.light}%`, stale: false };
  }

  return { value: "Chưa map dữ liệu", stale: true };
}

function getSensorIcon(sensor: Sensor) {
  const text = `${sensor.type} ${sensor.name}`.toLowerCase();

  if (text.includes("temperature") || text.includes("nhiet") || text.includes("nhiệt")) {
    return <Thermometer size={18} />;
  }

  if (text.includes("humidity") || text.includes("soil") || text.includes("moisture") || text.includes("ẩm")) {
    return <Droplets size={18} />;
  }

  if (text.includes("air") || text.includes("không khí")) {
    return <Wind size={18} />;
  }

  return <CircuitBoard size={18} />;
}

export function DeviceListView() {
  const { telemetry, telemetryByMac } = useRealtimeTelemetry();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actuatorStates, setActuatorStates] = useState<
    Record<string, ActuatorRuntimeState>
  >({});
  const [togglingActuatorId, setTogglingActuatorId] = useState<string | null>(null);
  const [runtimeNow, setRuntimeNow] = useState(() => Date.now());

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDevices();
      setDevices(data);
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

      devices.forEach((device) => {
        device.actuators?.forEach((actuator) => {
          if (next[actuator.Actuator_ID] === undefined) {
            next[actuator.Actuator_ID] = createDefaultActuatorState();
          }
        });
      });

      writeActuatorStates(next);
      return next;
    });
  }, [devices]);

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

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thiết bị này?")) return;
    try {
      await deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.Device_ID !== id));
    } catch (err) {
      console.error("Lỗi xóa thiết bị:", err);
    }
  };
  const handleToggleActuator = async (actuatorId: string) => {
    const currentState =
      actuatorStates[actuatorId] ?? createDefaultActuatorState();
    const nextRunning = !currentState.running;

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
    } finally {
      setTogglingActuatorId(null);
    }
  };

  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.mac_address.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  return (
    <div className="device-view">
      {/* Stats Cards */}
      <div className="device-stats">
        <div className="device-stat-card device-stat--total">
          <div className="device-stat-icon">
            <Cpu size={22} />
          </div>
          <div>
            <p className="device-stat-label">Tổng thiết bị</p>
            <h3 className="device-stat-value">{devices.length}</h3>
          </div>
        </div>
        <div className="device-stat-card device-stat--online">
          <div className="device-stat-icon device-stat-icon--online">
            <Wifi size={22} />
          </div>
          <div>
            <p className="device-stat-label">Online</p>
            <h3 className="device-stat-value">{onlineCount}</h3>
          </div>
        </div>
        <div className="device-stat-card device-stat--offline">
          <div className="device-stat-icon device-stat-icon--offline">
            <WifiOff size={22} />
          </div>
          <div>
            <p className="device-stat-label">Offline</p>
            <h3 className="device-stat-value">{offlineCount}</h3>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="device-toolbar">
        <div className="device-search">
          <Search size={18} className="device-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc MAC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="device-search-input"
            id="device-search-input"
          />
        </div>
        <div className="device-toolbar-actions">
          <button
            onClick={fetchDevices}
            className="device-btn device-btn--secondary"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="device-btn device-btn--primary"
            id="add-device-btn"
          >
            <Plus size={18} />
            Thêm thiết bị
          </button>
        </div>
      </div>

      {/* Device List */}
      <div className="device-list">
        {loading ? (
          <div className="device-empty">
            <Loader2 size={32} className="animate-spin text-green-500" />
            <p>Đang tải danh sách thiết bị...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="device-empty">
            <Cpu size={48} className="text-gray-300" />
            <h3>Chưa có thiết bị nào</h3>
            <p>Nhấn &quot;Thêm thiết bị&quot; để đăng ký thiết bị IoT mới</p>
          </div>
        ) : (
          filteredDevices.map((device) => {
            const deviceTelemetry = telemetryByMac[device.mac_address] ?? telemetry;

            return (
            <div key={device.Device_ID} className="device-card">
              {/* Device Header */}
              <div className="device-card-header">
                <div className="device-card-info">
                  <div
                    className={`device-status-dot ${
                      device.status === "online"
                        ? "device-status-dot--online"
                        : "device-status-dot--offline"
                    }`}
                  />
                  <div>
                    <h4 className="device-card-name">{device.name}</h4>
                    <p className="device-card-mac">{device.mac_address}</p>
                  </div>
                </div>

                <div className="device-card-actions">
                  <span
                    className={`device-badge ${
                      device.status === "online"
                        ? "device-badge--online"
                        : "device-badge--offline"
                    }`}
                  >
                    {device.status === "online" ? "Online" : "Offline"}
                  </span>

                  <button
                    className="device-btn-icon device-btn-icon--danger"
                    onClick={() => handleDeleteDevice(device.Device_ID)}
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Device Detail */}
              <div className="device-card-detail">
                  <div className="device-detail-row">
                    <Clock size={14} />
                    <span>
                      Lần cuối online:{" "}
                      {device.last_seen_at
                        ? new Date(device.last_seen_at).toLocaleString("vi-VN")
                        : "Chưa ghi nhận"}
                    </span>
                  </div>
                  {/* Sensors */}
                  <div className="device-components-section device-sensors-panel">
                    <div className="device-components-header">
                      <h5>
                        <CircuitBoard size={14} /> Sensors (
                        {device.sensors?.length || 0})
                      </h5>
                    </div>
                    {device.sensors && device.sensors.length > 0 ? (
                      <div className="device-components-list">
                        {device.sensors.map((s) => {
                          const reading = getSensorReading(
                            s,
                            deviceTelemetry,
                          );

                          return (
                          <div key={s.Sensor_ID} className="device-component-chip device-sensor-card">
                            {getSensorIcon(s)}
                            <span>{s.name}</span>
                            <strong className={reading.stale ? "device-reading-stale" : ""}>
                              {reading.value}
                            </strong>
                            <span className="device-component-meta">
                              Pin {s.pin_connection} · {s.type} · {s.unit}
                            </span>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="device-components-empty">
                        Chưa có sensor nào
                      </p>
                    )}
                  </div>

                  {/* Actuators */}
                  <div className="device-components-section device-pump-panel">
                    <div className="device-components-header">
                      <h5>
                        <Zap size={14} /> Actuators (
                        {device.actuators?.length || 0})
                      </h5>
                    </div>
                    {device.actuators && device.actuators.length > 0 ? (
                      <div className="device-components-list">
                        {device.actuators.map((a) => {
                          const actuatorState =
                            actuatorStates[a.Actuator_ID] ??
                            createDefaultActuatorState();
                          const running = actuatorState.running;
                          const toggling = togglingActuatorId === a.Actuator_ID;
                          const runtimeLabel = formatRuntime(
                            getActuatorRuntimeMs(actuatorState, runtimeNow),
                          );

                          return (
                          <div key={a.Actuator_ID} className="device-component-chip">
                            <div className="device-pump-title">
                              <Zap size={16} />
                              <span>{a.name}</span>
                              <strong
                                className={`device-pump-status ${
                                  running ? "device-pump-status--on" : ""
                                }`}
                              >
                                {running ? "Đang bật" : "Đang tắt"}
                              </strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleActuator(a.Actuator_ID)}
                              disabled={toggling}
                              className={`device-inline-toggle ${
                                running ? "device-inline-toggle--on" : ""
                              }`}
                            >
                              {toggling ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : running ? (
                                "Tắt"
                              ) : (
                                "Bật"
                              )}
                            </button>
                            <div className="device-pump-info-grid">
                              <div>
                                <span>Thời gian chạy</span>
                                <strong>{runtimeLabel}</strong>
                              </div>
                              <div>
                                <span>Lần đổi trạng thái</span>
                                <strong>
                                  {formatActuatorTime(actuatorState.changedAt)}
                                </strong>
                              </div>
                              <div>
                                <span>Cổng pin</span>
                                <strong>Pin {a.pin_connection}</strong>
                              </div>
                              <div>
                                <span>Kiểu</span>
                                <strong>{a.type}</strong>
                              </div>
                              Pin {a.pin_connection} · {a.type}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="device-components-empty">
                        Chưa có actuator nào
                      </p>
                    )}
                  </div>

              </div>
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

      <style jsx>{`
        .device-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ===== Stat Cards ===== */
        .device-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .device-stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border-radius: 16px;
          background: white;
          border: 1px solid #f0f0f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .device-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .device-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e0f2fe, #bae6fd);
          color: #0284c7;
        }

        .device-stat-icon--online {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #16a34a;
        }

        .device-stat-icon--offline {
          background: linear-gradient(135deg, #fef2f2, #fecaca);
          color: #dc2626;
        }

        .device-stat-label {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .device-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #111827;
        }

        /* ===== Toolbar ===== */
        .device-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .device-search {
          position: relative;
          flex: 1;
          min-width: 250px;
          max-width: 400px;
        }

        .device-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .device-search-input {
          width: 100%;
          padding: 0.7rem 1rem 0.7rem 2.75rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }

        .device-search-input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        .device-toolbar-actions {
          display: flex;
          gap: 0.5rem;
        }

        .device-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          border-radius: 12px;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .device-btn--primary {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }

        .device-btn--primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
        }

        .device-btn--secondary {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
          padding: 0.65rem;
        }

        .device-btn--secondary:hover {
          background: #f9fafb;
        }

        .device-btn--outline {
          background: transparent;
          border: 1px dashed #d1d5db;
          color: #6b7280;
          width: 100%;
          justify-content: center;
          padding: 0.6rem;
          font-size: 0.8rem;
          margin-top: 0.75rem;
        }

        .device-btn--outline:hover {
          border-color: #22c55e;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.04);
        }

        /* ===== Device List ===== */
        .device-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .device-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: #9ca3af;
          gap: 0.75rem;
        }

        .device-empty h3 {
          font-size: 1.1rem;
          color: #6b7280;
          font-weight: 600;
        }

        .device-empty p {
          font-size: 0.875rem;
        }

        /* ===== Device Card ===== */
        .device-card {
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .device-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .device-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
        }

        .device-card-info {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .device-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .device-status-dot--online {
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
          animation: statusPulse 2s ease-in-out infinite;
        }

        .device-status-dot--offline {
          background: #d1d5db;
        }

        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.1); }
        }

        .device-card-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
        }

        .device-card-mac {
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: 'Geist Mono', monospace;
        }

        .device-card-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .device-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .device-badge--online {
          background: #dcfce7;
          color: #16a34a;
        }

        .device-badge--offline {
          background: #f3f4f6;
          color: #9ca3af;
        }

        .device-btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .device-btn-icon:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .device-btn-icon--danger:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        /* ===== Card Detail ===== */
        .device-card-detail {
          padding: 0 1.25rem 1.25rem;
          border-top: 1px solid #f5f5f5;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .device-detail-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .device-components-section {
          margin-top: 0.75rem;
        }

        .device-components-header h5 {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .device-components-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .device-component-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          font-size: 0.75rem;
          color: #166534;
        }

        .device-sensor-card {
          min-width: 190px;
          justify-content: space-between;
        }

        .device-sensor-card strong {
          color: #0f172a;
          font-size: 0.95rem;
          margin-left: auto;
        }

        .device-reading-stale {
          color: #9ca3af !important;
          font-size: 0.72rem !important;
          font-weight: 600;
        }

        .device-inline-toggle {
          margin-left: 0.25rem;
          border: none;
          border-radius: 999px;
          background: #e5e7eb;
          color: #374151;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          padding: 0.25rem 0.65rem;
          font-size: 0.7rem;
          font-weight: 800;
          transition: all 0.2s;
        }

        .device-inline-toggle:hover:not(:disabled) {
          background: #d1d5db;
        }

        .device-inline-toggle--on {
          background: #16a34a;
          color: white;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.22);
        }

        .device-inline-toggle--on:hover:not(:disabled) {
          background: #15803d;
        }

        .device-inline-toggle:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        .device-component-meta {
          color: #6b7280;
          font-size: 0.65rem;
        }

        .device-components-empty {
          font-size: 0.75rem;
          color: #9ca3af;
          font-style: italic;
        }

        .device-card {
          border-color: #e5eee8;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }

        .device-card:hover {
          border-color: #b9e7cb;
          box-shadow: 0 16px 40px rgba(22, 163, 74, 0.08);
        }

        .device-card-header {
          background: linear-gradient(135deg, #ffffff 0%, #f4fbf7 100%);
          border-bottom: 1px solid #e9f3ed;
          padding: 1.25rem 1.5rem;
        }

        .device-card-name {
          font-size: 1.05rem;
        }

        .device-card-detail {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 0.9fr);
          gap: 1rem;
          padding: 1.25rem 1.5rem 1.5rem;
          background: #f8faf9;
          border-top: none;
        }

        .device-detail-row {
          border: 1px solid #edf2ef;
          border-radius: 12px;
          background: #ffffff;
          color: #64748b;
          padding: 0.75rem 0.9rem;
        }

        .device-detail-row:nth-child(1) {
          grid-column: 1;
        }

        .device-sensors-panel {
          grid-column: 1;
          margin-top: 0;
        }

        .device-pump-panel {
          grid-column: 2;
          grid-row: 1 / span 2;
          margin-top: 0;
        }

        .device-components-header h5 {
          margin-bottom: 0.75rem;
          color: #0f172a;
          font-size: 0.85rem;
        }

        .device-sensors-panel .device-components-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .device-sensor-card {
          align-items: flex-start;
          background: white;
          border-color: #dcefe4;
          border-radius: 14px;
          color: #166534;
          flex-direction: column;
          gap: 0.45rem;
          min-height: 126px;
          min-width: 0;
          padding: 1rem;
        }

        .device-sensor-card span:not(.device-component-meta) {
          color: #334155;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .device-sensor-card strong {
          color: #020617;
          font-size: 1.55rem;
          line-height: 1.1;
          margin-left: 0;
        }

        .device-sensor-card .device-component-meta {
          margin-top: auto;
        }

        .device-pump-panel .device-components-list {
          display: block;
        }

        .device-pump-panel .device-component-chip {
          align-items: stretch;
          background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
          border-color: #bbf7d0;
          border-radius: 16px;
          color: #064e3b;
          display: grid;
          gap: 0.65rem;
          grid-template-columns: auto 1fr;
          padding: 1rem;
          width: 100%;
        }

        .device-pump-title {
          align-items: center;
          display: flex;
          gap: 0.5rem;
          grid-column: 1 / -1;
          min-width: 0;
        }

        .device-pump-title span {
          color: #064e3b;
          font-size: 1rem;
          font-weight: 800;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .device-pump-status {
          border-radius: 999px;
          background: #e5e7eb;
          color: #475569;
          font-size: 0.72rem;
          font-weight: 800;
          margin-left: auto;
          padding: 0.25rem 0.6rem;
          white-space: nowrap;
        }

        .device-pump-status--on {
          background: #dcfce7;
          color: #15803d;
        }

        .device-pump-info-grid {
          display: grid;
          font-size: 0;
          gap: 0.65rem;
          grid-column: 1 / -1;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .device-pump-info-grid > div {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid #d9f7e4;
          border-radius: 12px;
          min-width: 0;
          padding: 0.7rem 0.75rem;
        }

        .device-pump-info-grid span {
          color: #64748b;
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          margin-bottom: 0.2rem;
          text-transform: uppercase;
        }

        .device-pump-info-grid strong {
          color: #0f172a;
          display: block;
          font-size: 0.86rem;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .device-inline-toggle {
          grid-column: 1 / -1;
          margin-left: 0;
          min-width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }

        .device-card-detail > .device-btn--outline {
          display: none;
        }

        /* ===== Responsive ===== */
        @media (max-width: 768px) {
          .device-stats {
            grid-template-columns: 1fr;
          }
          .device-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .device-search {
            max-width: 100%;
          }
          .device-card-detail {
            grid-template-columns: 1fr;
          }
          .device-detail-row,
          .device-detail-row:nth-child(1),
          .device-detail-row:nth-child(2),
          .device-sensors-panel,
          .device-pump-panel {
            grid-column: 1;
            grid-row: auto;
          }
          .device-sensors-panel .device-components-list {
            grid-template-columns: 1fr;
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
  const [name, setName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload: CreateDevicePayload = {
        name,
        mac_address: macAddress,
      };
      const newDevice = await createDevice(payload);
      onSuccess(newDevice);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tạo thiết bị!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title="Đăng ký thiết bị IoT mới">
      <form onSubmit={handleSubmit} className="modal-form">
        {error && <div className="modal-error">{error}</div>}

        <div className="modal-field">
          <label>Tên thiết bị *</label>
          <input
            type="text"
            placeholder="VD: ESP32 - Vườn rau"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            id="device-name-input"
          />
        </div>

        <div className="modal-field">
          <label>Địa chỉ MAC *</label>
          <input
            type="text"
            placeholder="VD: AA:BB:CC:DD:EE:FF"
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value)}
            required
            id="device-mac-input"
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className="modal-btn-submit"
            disabled={isSubmitting}
            id="device-submit-btn"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Đăng ký
          </button>
        </div>
      </form>
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
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: modalSlideUp 0.3s ease;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(20px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
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
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }
      `}</style>

      {/* Shared modal form styles */}
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
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .modal-field input,
        .modal-field select {
          padding: 0.7rem 1rem;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          background: #fafafa;
        }

        .modal-field input:focus,
        .modal-field select:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
          background: white;
        }

        .modal-row {
          display: flex;
          gap: 1rem;
        }

        .modal-toggle-group {
          display: flex;
          gap: 0.5rem;
        }

        .modal-toggle {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.6rem;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fafafa;
          font-size: 0.85rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-toggle--active {
          background: #f0fdf4;
          border-color: #22c55e;
          color: #16a34a;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }

        .modal-btn-cancel {
          flex: 1;
          padding: 0.7rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn-cancel:hover {
          background: #f9fafb;
        }

        .modal-btn-submit {
          flex: 1;
          padding: 0.7rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }

        .modal-btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
        }

        .modal-btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
