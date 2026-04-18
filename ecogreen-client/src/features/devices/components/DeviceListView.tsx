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
  ChevronDown,
  Loader2,
  RefreshCw,
  CircuitBoard,
  Zap,
  Hash,
  Clock,
} from "lucide-react";
import { Device, CreateDevicePayload, CreateComponentPayload } from "@/types";
import {
  getDevices,
  createDevice,
  deleteDevice,
  addComponent,
} from "@/services/device.service";

export function DeviceListView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

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

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thiết bị này?")) return;
    try {
      await deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.Device_ID !== id));
    } catch (err) {
      console.error("Lỗi xóa thiết bị:", err);
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
          filteredDevices.map((device) => (
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
                    className="device-btn-icon"
                    onClick={() =>
                      setExpandedDevice(
                        expandedDevice === device.Device_ID
                          ? null
                          : device.Device_ID
                      )
                    }
                    title="Chi tiết"
                  >
                    <ChevronDown
                      size={18}
                      style={{
                        transform:
                          expandedDevice === device.Device_ID
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>

                  <button
                    className="device-btn-icon device-btn-icon--danger"
                    onClick={() => handleDeleteDevice(device.Device_ID)}
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Device Detail (expanded) */}
              {expandedDevice === device.Device_ID && (
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
                  <div className="device-detail-row">
                    <Hash size={14} />
                    <span>ID: {device.Device_ID}</span>
                  </div>

                  {/* Sensors */}
                  <div className="device-components-section">
                    <div className="device-components-header">
                      <h5>
                        <CircuitBoard size={14} /> Sensors (
                        {device.sensors?.length || 0})
                      </h5>
                    </div>
                    {device.sensors && device.sensors.length > 0 ? (
                      <div className="device-components-list">
                        {device.sensors.map((s) => (
                          <div key={s.Sensor_ID} className="device-component-chip">
                            <CircuitBoard size={12} />
                            <span>{s.name}</span>
                            <span className="device-component-meta">
                              Pin {s.pin_connection} · {s.type} · {s.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="device-components-empty">
                        Chưa có sensor nào
                      </p>
                    )}
                  </div>

                  {/* Actuators */}
                  <div className="device-components-section">
                    <div className="device-components-header">
                      <h5>
                        <Zap size={14} /> Actuators (
                        {device.actuators?.length || 0})
                      </h5>
                    </div>
                    {device.actuators && device.actuators.length > 0 ? (
                      <div className="device-components-list">
                        {device.actuators.map((a) => (
                          <div key={a.Actuator_ID} className="device-component-chip">
                            <Zap size={12} />
                            <span>{a.name}</span>
                            <span className="device-component-meta">
                              Pin {a.pin_connection} · {a.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="device-components-empty">
                        Chưa có actuator nào
                      </p>
                    )}
                  </div>

                  {/* Add Component Button */}
                  <button
                    className="device-btn device-btn--outline"
                    onClick={() => {
                      setSelectedDeviceId(device.Device_ID);
                      setShowComponentModal(true);
                    }}
                  >
                    <Plus size={14} /> Thêm Sensor / Actuator
                  </button>
                </div>
              )}
            </div>
          ))
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

      {/* Add Component Modal */}
      {showComponentModal && selectedDeviceId && (
        <AddComponentModal
          deviceId={selectedDeviceId}
          onClose={() => {
            setShowComponentModal(false);
            setSelectedDeviceId(null);
          }}
          onSuccess={() => {
            setShowComponentModal(false);
            setSelectedDeviceId(null);
            fetchDevices(); // Reload to get updated components
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

        .device-component-meta {
          color: #6b7280;
          font-size: 0.65rem;
        }

        .device-components-empty {
          font-size: 0.75rem;
          color: #9ca3af;
          font-style: italic;
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
    } catch (err: any) {
      setError(err.message || "Không thể tạo thiết bị!");
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
/*       ADD COMPONENT MODAL                  */
/* ========================================== */
function AddComponentModal({
  deviceId,
  onClose,
  onSuccess,
}: {
  deviceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [componentType, setComponentType] = useState<"sensor" | "actuator">("sensor");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [pinConnection, setPinConnection] = useState("");
  const [unit, setUnit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload: CreateComponentPayload = {
        name,
        type,
        pin_connection: parseInt(pinConnection),
        component_type: componentType,
        ...(componentType === "sensor" ? { unit } : {}),
      };
      await addComponent(deviceId, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Không thể thêm component!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} title="Thêm Sensor / Actuator">
      <form onSubmit={handleSubmit} className="modal-form">
        {error && <div className="modal-error">{error}</div>}

        <div className="modal-field">
          <label>Loại</label>
          <div className="modal-toggle-group">
            <button
              type="button"
              className={`modal-toggle ${componentType === "sensor" ? "modal-toggle--active" : ""}`}
              onClick={() => setComponentType("sensor")}
            >
              <CircuitBoard size={14} /> Sensor
            </button>
            <button
              type="button"
              className={`modal-toggle ${componentType === "actuator" ? "modal-toggle--active" : ""}`}
              onClick={() => setComponentType("actuator")}
            >
              <Zap size={14} /> Actuator
            </button>
          </div>
        </div>

        <div className="modal-field">
          <label>Tên *</label>
          <input
            type="text"
            placeholder={componentType === "sensor" ? "VD: DHT22 Temperature" : "VD: Water Pump"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="modal-field">
          <label>Kiểu *</label>
          <input
            type="text"
            placeholder={componentType === "sensor" ? "VD: temperature, humidity, soil_moisture" : "VD: pump, fan, led"}
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        </div>

        <div className="modal-row">
          <div className="modal-field">
            <label>Cổng Pin *</label>
            <input
              type="number"
              placeholder="VD: 4"
              value={pinConnection}
              onChange={(e) => setPinConnection(e.target.value)}
              required
              min={0}
            />
          </div>

          {componentType === "sensor" && (
            <div className="modal-field">
              <label>Đơn vị *</label>
              <input
                type="text"
                placeholder="VD: °C, %, lux"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className="modal-btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Thêm
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
