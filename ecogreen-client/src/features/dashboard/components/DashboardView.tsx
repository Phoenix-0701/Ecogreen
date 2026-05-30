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
  Clock,
  Info,
  AlertTriangle,
  Power,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { getDevices } from "@/services/device.service";
import { requestJson } from "@/services/api";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { Device } from "@/types";
import type { TelemetrySnapshot } from "@/types/automation";
import { useLanguage } from "@/context/LanguageContext";

interface ActivityLog {
  Log_ID: string;
  event_type: string;
  status: string;
  description: string;
  occurred_at: string;
}

function sensorValue(type: "temp" | "humi" | "soil" | "light", telemetry: TelemetrySnapshot, formatTemp?: (val: number, dec?: number) => string) {
  if (type === "temp") return formatTemp ? formatTemp(telemetry.temp) : `${telemetry.temp.toFixed(1)}°C`;
  if (type === "humi") return `${telemetry.humi.toFixed(0)}%`;
  if (type === "soil") return `${telemetry.soil.toFixed(0)}%`;
  return `${telemetry.light.toFixed(0)} lux`;
}

function formatTime(value?: string | null, locale = "vi-VN", fallbackText = "Chưa ghi nhận") {
  if (!value) return fallbackText;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackText;
  return date.toLocaleString(locale);
}

function getLogIconAndClass(log: ActivityLog) {
  const desc = (log.description || "").toLowerCase();
  const status = (log.status || "").toLowerCase();
  
  if (desc.includes("bật") || desc.includes("on") || desc.includes("start") || status === "active" || status === "success") {
    return {
      icon: <Power className="size-4" />,
      className: "db-log-icon--success"
    };
  }
  if (desc.includes("tắt") || desc.includes("off") || desc.includes("stop") || status === "inactive") {
    return {
      icon: <Power className="size-4" />,
      className: "db-log-icon--neutral"
    };
  }
  if (desc.includes("lỗi") || desc.includes("error") || desc.includes("hỏng") || status === "error" || status === "failed") {
    return {
      icon: <AlertTriangle className="size-4" />,
      className: "db-log-icon--danger"
    };
  }
  return {
    icon: <Info className="size-4" />,
    className: "db-log-icon--info"
  };
}

export function DashboardView() {
  const { language, t, translateLog, formatTemp } = useLanguage();
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
      <div className="db-loader-container">
        <div className="db-loader-card">
          <Loader2 className="db-loader-spinner animate-spin" />
          <span>{t('dashboard.loader', 'Đang tải dashboard...')}</span>
        </div>
        <style jsx global>{`
          .db-loader-container {
            display: flex;
            min-height: 60vh;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 28px;
            border: 1.5px solid #e5e7eb;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          }
          .db-loader-card {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.9rem;
            font-weight: 700;
            color: #6b7280;
          }
          :global(.db-loader-spinner) {
            color: #22c55e;
            width: 20px;
            height: 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="db-container">
      {/* Header Banner */}
      <section className="db-header">
        <div className="db-header-left">
          <div className="db-header-badges">
            <span
              className={`db-badge-pill ${
                connected ? "db-badge-pill--realtime-on" : "db-badge-pill--realtime-off"
              }`}
            >
              {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {connected ? t('dashboard.realtimeOnline', "Realtime online") : t('dashboard.waitingRealtime', "Đang chờ realtime")}
            </span>
            <span className="db-badge-pill db-badge-pill--count">
              {t('dashboard.espOnline', '{online}/{total} ESP online')
                .replace('{online}', String(onlineCount))
                .replace('{total}', String(devices.length))}
            </span>
          </div>
          <h1 className="db-title">{t('dashboard.title', 'Tổng quan nhà vườn')}</h1>
          <p className="db-subtitle">
            {t('dashboard.subtitle', 'Theo dõi nhanh thiết bị, cảm biến, máy bơm và hoạt động gần đây.')}
          </p>
        </div>

        <div className="db-header-actions">
          <Link href="/dashboard/devices" className="db-btn db-btn--primary">
            <Cpu size={15} />
            {t('dashboard.manageDevices', 'Quản lý thiết bị')}
          </Link>
          <Link href="/schedule" className="db-btn db-btn--secondary">
            <CalendarClock size={15} />
            {t('dashboard.wateringSchedules', 'Lịch tưới')}
          </Link>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="db-summary-grid">
        <SummaryCard 
          icon={<Cpu size={24} />} 
          label={t('dashboard.registeredEsp', 'ESP đã đăng ký')} 
          value={devices.length.toString()} 
          subtext={t('dashboard.hardwareDevice', 'Thiết bị phần cứng')}
          badge={
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-50 text-slate-700 border border-slate-100">
              V1.0 Cloud
            </span>
          }
          tone="slate" 
        />
        <SummaryCard 
          icon={<Radio size={24} />} 
          label={t('dashboard.onlineStatus', 'Đang online')} 
          value={onlineCount.toString()} 
          subtext={onlineCount > 0 ? t('dashboard.connectionGood', 'Kết nối hoạt động tốt') : t('dashboard.noConnection', 'Không có kết nối')}
          badge={
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          }
          tone="emerald" 
        />
        <SummaryCard 
          icon={<Activity size={24} />} 
          label={t('dashboard.sensorsLabel', 'Sensors')} 
          value={sensorCount.toString()} 
          subtext={t('dashboard.sensorsDesc', 'Cảm biến môi trường')}
          badge={
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100">
              {t('dashboard.sensorsFull', 'Đầy đủ')}
            </span>
          }
          tone="amber" 
        />
        <SummaryCard 
          icon={<Zap size={24} />} 
          label={t('dashboard.pumpsLabel', 'Pumps')} 
          value={actuatorCount.toString()} 
          subtext={t('dashboard.pumpsDesc', 'Bơm nước & quạt gió')}
          badge={
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
              {t('dashboard.pumpsReady', 'Sẵn sàng')}
            </span>
          }
          tone="blue" 
        />
      </section>

      {/* Split Panels */}
      <section className="db-main-grid">
        {/* Live Telemetry Panel */}
        <div className="db-panel db-panel-8">
          <div className="db-panel-header">
            <div className="db-panel-title-area">
              <h2 className="db-panel-title">
                <Activity size={18} style={{ color: "#22c55e" }} />
                {t('dashboard.currentParams', 'Thông số hiện tại')}
              </h2>
              <p className="db-panel-subtitle">
                {selectedDevice ? selectedDevice.name : t('dashboard.noEspTitle', 'Chưa có thiết bị')}
              </p>
            </div>
            {devices.length > 0 ? (
              <select
                value={selectedDevice?.Device_ID ?? ""}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className="db-select"
              >
                {devices.map((device) => (
                  <option key={device.Device_ID} value={device.Device_ID}>
                    {device.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="db-metric-grid">
            <MetricCard icon={<Thermometer size={20} />} label={t('history.metrics.temp', 'Nhiệt độ')} value={formatTemp(selectedTelemetry.temp)} tone="red" />
            <MetricCard icon={<Wind size={20} />} label={t('history.metrics.humi', 'Độ ẩm khí')} value={sensorValue("humi", selectedTelemetry)} tone="blue" />
            <MetricCard icon={<Droplets size={20} />} label={t('history.metrics.soil', 'Độ ẩm đất')} value={sensorValue("soil", selectedTelemetry)} tone="emerald" />
            <MetricCard icon={<Waves size={20} />} label={t('history.metrics.light', 'Ánh sáng')} value={sensorValue("light", selectedTelemetry)} tone="amber" />
          </div>

          {/* System Status Banner */}
          {(() => {
            let status = {
              title: t('dashboard.status.optimalTitle', 'Môi trường tối ưu'),
              desc: t('dashboard.status.optimalDesc', 'Tất cả các chỉ số môi trường đang ở mức lý tưởng. Cây trồng đang phát triển trong điều kiện rất tốt!'),
              color: 'emerald',
              icon: <CheckCircle2 size={22} strokeWidth={2.5} />,
              badgeLabel: t('dashboard.status.badgeOptimal', 'Hệ thống ổn định')
            };

            const { temp, humi, soil, pumpState, fanState, autoMode } = selectedTelemetry;
            if (temp > 40 || temp < 10) {
              status = {
                title: t('dashboard.status.severeTempTitle', 'Cảnh báo nhiệt độ khẩn cấp'),
                desc: t('dashboard.status.severeTempDesc', `Nhiệt độ hiện tại (${temp.toFixed(1)}°C) ở mức nguy hiểm. Hãy kiểm tra hệ thống làm mát/sưởi ấm ngay lập tức.`),
                color: 'red',
                icon: <AlertTriangle size={22} strokeWidth={2.5} />,
                badgeLabel: t('dashboard.status.badgeCritical', 'Hành động ngay')
              };
            } else if (pumpState && fanState) {
              status = {
                title: t('charts.status.pumpFan', 'Đang tưới nước & Làm mát'),
                desc: t('charts.status.pumpFanDesc', 'Hệ thống đang đồng thời bật máy bơm nước để cân bằng độ ẩm và bật quạt thông gió giải nhiệt.'),
                color: 'blue',
                icon: <Droplets size={22} strokeWidth={2.5} />,
                badgeLabel: t('dashboard.status.badgeActive', 'Đang hoạt động')
              };
            } else if (pumpState) {
              status = {
                title: t('charts.status.pumping', 'Đang trong chu kỳ tưới nước'),
                desc: t('charts.status.pumpingDesc', 'Máy bơm nước đang hoạt động để cung cấp độ ẩm cần thiết cho đất.'),
                color: 'blue',
                icon: <Droplets size={22} strokeWidth={2.5} />,
                badgeLabel: t('dashboard.status.badgeActive', 'Đang hoạt động')
              };
            } else if (fanState && !autoMode) {
              status = {
                title: t('charts.status.fanManual', 'Quạt làm mát bật thủ công'),
                desc: t('charts.status.fanManualDesc', 'Quạt thông gió đang được vận hành thủ công bởi quản trị viên.'),
                color: 'purple',
                icon: <Wind size={22} strokeWidth={2.5} />,
                badgeLabel: t('dashboard.status.badgeManual', 'Chế độ thủ công')
              };
            } else if (soil < 20) {
              status = {
                title: t('dashboard.status.mildWarnTitle', 'Cảnh báo môi trường nhẹ'),
                desc: t('dashboard.status.lowSoilDesc', `Phát hiện chỉ số môi trường chưa tối ưu: Đất đang khô dần (${soil.toFixed(0)}%). Hệ thống khuyên bạn nên điều chỉnh nhẹ để giữ cây trồng trong điều kiện tốt nhất.`),
                color: 'amber',
                icon: <AlertTriangle size={22} strokeWidth={2.5} />,
                badgeLabel: t('dashboard.status.badgeSuggest', 'Đề xuất điều chỉnh')
              };
            } else if (humi > 90) {
              status = {
                title: t('dashboard.status.mildWarnTitle', 'Cảnh báo môi trường nhẹ'),
                desc: t('dashboard.status.highHumiDesc', `Độ ẩm không khí quá cao (${humi.toFixed(0)}%). Bạn nên bật quạt thông gió để tránh nấm mốc phát triển.`),
                color: 'amber',
                icon: <AlertTriangle size={22} strokeWidth={2.5} />,
                badgeLabel: t('dashboard.status.badgeSuggest', 'Đề xuất điều chỉnh')
              };
            }

            return (
              <div className={`db-modern-banner ${status.color}`}>
                <div className="banner-icon-wrapper">
                  <div className="banner-icon-bg" />
                  {status.icon}
                </div>
                <div className="banner-content">
                  <div className="banner-header">
                    <h4>{status.title}</h4>
                    <span className="banner-badge">{status.badgeLabel}</span>
                  </div>
                  <p>{status.desc}</p>
                </div>
              </div>
            );
          })()}

          <div className="db-meta-bar">
            <Clock size={14} />
            <span>
              {t('dashboard.lastSeenLabel', 'Lần cuối online: ')}<strong>{formatTime(selectedDevice?.last_seen_at, language === 'vi' ? 'vi-VN' : 'en-US', t('dashboard.noSeenRecord', 'Chưa ghi nhận'))}</strong>
            </span>
          </div>
        </div>

        {/* Devices List Panel */}
        <div className="db-panel db-panel-4">
          <div className="db-panel-header" style={{ marginBottom: "1.25rem" }}>
            <div className="db-panel-title-area">
              <h2 className="db-panel-title">{t('dashboard.devicesTitle', 'Thiết bị')}</h2>
              <p className="db-panel-subtitle">{t('dashboard.quickConfig', 'Quản lý & cấu hình nhanh')}</p>
            </div>
            <Link href="/dashboard/devices" className="db-btn db-btn--secondary" style={{ padding: "0.5rem" }} title={t('dashboard.manageDetailsTitle', 'Quản lý chi tiết')}>
              <ExternalLink size={14} />
            </Link>
          </div>
          
          <div className="db-device-list">
            {devices.slice(0, 5).map((device) => {
              const isDeviceOnline = device.status === "online";
              return (
                <Link
                  key={device.Device_ID}
                  href="/dashboard/devices"
                  className="db-device-item"
                >
                  <div className="db-device-info">
                    <span className="db-device-name">{device.name}</span>
                    <span className="db-device-mac">{device.mac_address}</span>
                  </div>
                  <div className="db-status-indicator">
                    <div className={`db-ring ${isDeviceOnline ? "db-ring--online" : ""}`}>
                      <div className={`db-dot ${isDeviceOnline ? "db-dot--online" : ""}`} />
                    </div>
                    <span className={`db-status-pill ${isDeviceOnline ? "db-status-pill--online" : "db-status-pill--offline"}`}>
                      {device.status === 'online' ? t('deviceList.stats.online', 'Online') : t('deviceList.stats.offline', 'Offline')}
                    </span>
                    <ChevronRight size={13} className="db-link-arrow" />
                  </div>
                </Link>
              );
            })}
            {devices.length === 0 ? (
              <div className="db-empty-state">
                <Cpu size={24} style={{ color: "#d1d5db" }} />
                <h4>{t('dashboard.noEspTitle', 'Chưa có ESP nào')}</h4>
                <p>{t('dashboard.noEspDesc', 'Nhấp vào Quản lý thiết bị để thêm mới.')}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="db-logs-section">
        <div className="db-panel-header" style={{ marginBottom: "1.25rem" }}>
          <div className="db-panel-title-area">
            <h2 className="db-panel-title">{t('dashboard.recentActivity', 'Hoạt động gần đây')}</h2>
            <p className="db-panel-subtitle">{t('dashboard.controlHistory', 'Lịch sử điều khiển & sự kiện tự động hóa')}</p>
          </div>
        </div>
        
        <div className="db-logs-list">
          {visibleLogs.length > 0 ? (
            visibleLogs.map((log) => {
              const { icon, className } = getLogIconAndClass(log);
              return (
                <div key={log.Log_ID} className="db-log-item">
                  <div className="db-log-left">
                    <div className={`db-log-icon-wrap ${className}`}>
                      {icon}
                    </div>
                    <div className="db-log-info">
                      <span className="db-log-desc">{translateLog(log.description || log.status)}</span>
                      <span className="db-log-time-mobile">{formatTime(log.occurred_at, language === 'vi' ? 'vi-VN' : 'en-US', t('dashboard.noSeenRecord', 'Chưa ghi nhận'))}</span>
                    </div>
                  </div>
                  <span className="db-log-time-desktop">{formatTime(log.occurred_at, language === 'vi' ? 'vi-VN' : 'en-US', t('dashboard.noSeenRecord', 'Chưa ghi nhận'))}</span>
                </div>
              );
            })
          ) : (
            <div className="db-empty-state">
              <Info size={28} style={{ color: "#cbd5e1" }} />
              <h4>{t('dashboard.noActivityTitle', 'Chưa có hoạt động')}</h4>
              <p>{t('dashboard.noActivityDesc', 'Chưa có log hoạt động cho thiết bị đang chọn.')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Styled JSX block */}
      <style jsx global>{`
        .db-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: inherit;
        }

        /* ===== Header / Welcome Banner ===== */
        .db-header {
          background: white;
          border-radius: 24px;
          border: 1.5px solid rgba(226, 232, 240, 0.8);
          padding: 1.75rem 2rem;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.025), 0 8px 10px -6px rgba(0,0,0,0.025);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 1280px) {
          .db-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .db-header-left {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .db-header-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .db-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }

        .db-badge-pill--realtime-on {
          background: rgba(34, 197, 94, 0.08);
          color: #16a34a;
          border-color: rgba(34, 197, 94, 0.15);
        }

        .db-badge-pill--realtime-off {
          background: #f3f4f6;
          color: #6b7280;
          border-color: #e5e7eb;
        }

        .db-badge-pill--count {
          background: #f1f5f9;
          color: #475569;
          border-color: #e2e8f0;
        }

        .db-title {
          font-size: 1.875rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .db-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .db-header-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .db-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.25rem;
          border-radius: 14px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          white-space: nowrap;
          border: none;
        }

        .db-btn--primary {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 4px 14px rgba(34,197,94,0.3);
        }

        .db-btn--primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(34,197,94,0.4);
        }

        .db-btn--secondary {
          background: white;
          border: 1.5px solid #e2e8f0;
          color: #334155;
        }

        .db-btn--secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        /* ===== Summary Cards Grid ===== */
        .db-summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .db-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .db-summary-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .db-summary-card {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          min-height: 148px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .db-summary-badge {
          position: absolute;
          top: 14px;
          right: 16px;
          z-index: 10;
        }

        .db-summary-card:hover {
          transform: translateY(-3px);
        }

        /* Hover States for Border & Glow Shadows */
        .db-summary-card--slate:hover {
          border-color: #cbd5e1;
          box-shadow: 0 12px 30px rgba(71, 85, 105, 0.08);
        }
        .db-summary-card--emerald:hover {
          border-color: #bbf7d0;
          box-shadow: 0 12px 30px rgba(34, 197, 94, 0.08);
        }
        .db-summary-card--amber:hover {
          border-color: #fde047;
          box-shadow: 0 12px 30px rgba(245, 158, 11, 0.08);
        }
        .db-summary-card--blue:hover {
          border-color: #bfdbfe;
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.08);
        }

        /* Subtle Radial Glow in Top-Right on Hover */
        .db-summary-card::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          transition: transform 0.25s ease;
          pointer-events: none;
        }

        .db-summary-card--slate::after {
          background: radial-gradient(circle, rgba(71, 85, 105, 0.04) 0%, transparent 70%);
          transform: translate(25px, -25px);
        }
        .db-summary-card--emerald::after {
          background: radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, transparent 70%);
          transform: translate(25px, -25px);
        }
        .db-summary-card--amber::after {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%);
          transform: translate(25px, -25px);
        }
        .db-summary-card--blue::after {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
          transform: translate(25px, -25px);
        }

        .db-summary-card:hover::after {
          transform: translate(15px, -15px) scale(1.1);
        }

        .db-summary-card-inner {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          height: 100%;
        }

        .db-summary-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s;
        }

        .db-summary-card:hover .db-summary-icon-wrap {
          transform: scale(1.08) rotate(3deg);
        }

        .db-summary-icon-wrap--slate { background: rgba(71, 85, 105, 0.08); color: #475569; }
        .db-summary-icon-wrap--emerald { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
        .db-summary-icon-wrap--amber { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
        .db-summary-icon-wrap--blue { background: rgba(14, 165, 233, 0.08); color: #0ea5e9; }
        .db-summary-icon-wrap--violet { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }

        .db-summary-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .db-summary-val {
          font-size: 2.1rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
        }

        .db-summary-label {
          font-size: 0.8rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.3rem;
          line-height: 1.3;
          width: 100%;
          white-space: normal;
        }

        .db-summary-subtext {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          margin-top: 0.2rem;
          line-height: 1.3;
          width: 100%;
          white-space: normal;
        }

        /* ===== Main Dashboard Layout (Split) ===== */
        .db-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 1280px) {
          .db-main-grid {
            grid-template-columns: repeat(12, 1fr);
          }
        }

        .db-panel-8 {
          grid-column: span 1;
        }

        .db-panel-4 {
          grid-column: span 1;
        }

        @media (min-width: 1280px) {
          .db-panel-8 { grid-column: span 8; }
          .db-panel-4 { grid-column: span 4; }
        }

        .db-panel {
          background: white;
          border-radius: 28px;
          border: 1.5px solid #e2e8f0;
          padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }

        .db-panel-header {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 640px) {
          .db-panel-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .db-panel-title-area {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .db-panel-title {
          font-size: 1.25rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .db-panel-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        /* Dropdown Selector styling */
        .db-select {
          padding: 0.65rem 2.25rem 0.65rem 1rem;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background-color: #f8fafc;
          font-size: 0.875rem;
          font-weight: 700;
          outline: none;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1.1rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .db-select:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3.5px rgba(34, 197, 94, 0.12);
          background-color: white;
        }

        .db-select:hover {
          border-color: #cbd5e1;
          background-color: #f1f5f9;
        }

        /* Metric Cards Grid */
        .db-metric-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        /* ===== System Status Banner ===== */
        .db-modern-banner {
          display: flex;
          gap: 1.25rem;
          padding: 1.25rem 1.5rem;
          border-radius: 20px;
          background: white;
          position: relative;
          overflow: hidden;
          margin-top: 0.75rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0,0,0,0.02);
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        
        .db-modern-banner:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0,0,0,0.02);
        }

        .db-modern-banner.amber {
          background-color: #fffbeb;
          border-color: #fde68a;
        }
        .db-modern-banner.red {
          background-color: #fef2f2;
          border-color: #fecaca;
        }
        .db-modern-banner.emerald {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
        }
        .db-modern-banner.blue {
          background-color: #eff6ff;
          border-color: #bfdbfe;
        }
        .db-modern-banner.purple {
          background-color: #f5f3ff;
          border-color: #ddd6fe;
        }

        .banner-icon-wrapper {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 1;
        }

        .banner-icon-bg {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          opacity: 0.15;
          z-index: -1;
        }
        
        .amber .banner-icon-bg { background: #f59e0b; }
        .red .banner-icon-bg { background: #ef4444; }
        .emerald .banner-icon-bg { background: #10b981; }
        .blue .banner-icon-bg { background: #3b82f6; }
        .purple .banner-icon-bg { background: #8b5cf6; }

        .amber .banner-icon-wrapper { color: #d97706; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15); }
        .red .banner-icon-wrapper { color: #dc2626; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15); }
        .emerald .banner-icon-wrapper { color: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); }
        .blue .banner-icon-wrapper { color: #2563eb; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); }
        .purple .banner-icon-wrapper { color: #7c3aed; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15); }
        
        /* Add a subtle pulse ring to the icon wrapper */
        .banner-icon-wrapper::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 20px;
          border: 1.5px solid transparent;
          opacity: 0.5;
        }
        .amber .banner-icon-wrapper::after { border-color: rgba(245, 158, 11, 0.2); }
        .red .banner-icon-wrapper::after { border-color: rgba(239, 68, 68, 0.2); }
        .emerald .banner-icon-wrapper::after { border-color: rgba(16, 185, 129, 0.2); }
        .blue .banner-icon-wrapper::after { border-color: rgba(59, 130, 246, 0.2); }
        .purple .banner-icon-wrapper::after { border-color: rgba(139, 92, 246, 0.2); }

        .banner-content {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 1;
          justify-content: center;
        }

        .banner-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .banner-header h4 {
          font-size: 1.05rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .banner-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.25rem 0.6rem;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .amber .banner-badge { background: #fef3c7; color: #b45309; }
        .red .banner-badge { background: #fee2e2; color: #b91c1c; }
        .emerald .banner-badge { background: #dcfce3; color: #047857; }
        .blue .banner-badge { background: #dbeafe; color: #1d4ed8; }
        .purple .banner-badge { background: #ede9fe; color: #6d28d9; }

        .banner-content p {
          font-size: 0.85rem;
          color: #475569;
          line-height: 1.55;
          margin: 0;
          padding-right: 0.5rem;
        }

        @media (min-width: 640px) {
          .db-metric-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .db-metric-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .db-metric-card {
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
          border-radius: 20px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .db-metric-card:hover {
          transform: translateY(-2px);
          background: white;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }

        .db-metric-card--red:hover { border-color: #fecaca; box-shadow: 0 8px 24px rgba(239,68,68,0.06); }
        .db-metric-card--blue:hover { border-color: #bae6fd; box-shadow: 0 8px 24px rgba(14,165,233,0.06); }
        .db-metric-card--emerald:hover { border-color: #a7f3d0; box-shadow: 0 8px 24px rgba(16,185,129,0.06); }
        .db-metric-card--amber:hover { border-color: #fef08a; box-shadow: 0 8px 24px rgba(245,158,11,0.06); }

        .db-metric-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s;
        }

        .db-metric-card:hover .db-metric-icon-wrap {
          transform: scale(1.06);
        }

        .db-metric-icon-wrap--red { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .db-metric-icon-wrap--blue { background: rgba(14, 165, 233, 0.08); color: #0ea5e9; }
        .db-metric-icon-wrap--emerald { background: rgba(16, 185, 129, 0.08); color: #10b981; }
        .db-metric-icon-wrap--amber { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }

        .db-metric-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .db-metric-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .db-metric-value {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        /* Metric Colors on Active state */
        .db-metric-card--red:hover .db-metric-value { color: #ef4444; }
        .db-metric-card--blue:hover .db-metric-value { color: #0ea5e9; }
        .db-metric-card--emerald:hover .db-metric-value { color: #10b981; }
        .db-metric-card--amber:hover .db-metric-value { color: #f59e0b; }

        /* Status Bar Info */
        .db-meta-bar {
          margin-top: 1.25rem;
          padding: 0.85rem 1.25rem;
          border-radius: 16px;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .db-meta-bar strong {
          color: #0f172a;
          font-weight: 700;
        }

        /* ===== Device List Sidebar ===== */
        .db-device-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .db-device-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 1.25rem;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
          border-radius: 18px;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .db-device-item:hover {
          background: white;
          border-color: #cbd5e1;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          transform: translateX(2px);
        }

        .db-device-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }

        .db-device-name {
          font-weight: 800;
          color: #0f172a;
          font-size: 0.92rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .db-device-mac {
          font-family: monospace;
          font-size: 0.7rem;
          color: #64748b;
          background: #e2e8f0;
          padding: 0.08rem 0.35rem;
          border-radius: 4px;
          width: fit-content;
        }

        /* Status Indicator pulsing rings (exact match to device view) */
        .db-status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .db-ring {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .db-ring--online {
          border-color: rgba(34, 197, 94, 0.25);
          background: rgba(34, 197, 94, 0.04);
          animation: dbRingPulse 2.5s ease-in-out infinite;
        }

        @keyframes dbRingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.15); }
          50% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.05); }
        }

        .db-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #cbd5e1;
          transition: background 0.3s;
        }

        .db-dot--online {
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
          animation: dbDotPulse 2s ease-in-out infinite;
        }

        @keyframes dbDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }

        .db-status-pill {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
        }

        .db-status-pill--online {
          background: #dcfce7;
          color: #16a34a;
        }

        .db-status-pill--offline {
          background: #f1f5f9;
          color: #64748b;
        }

        /* Link arrow */
        .db-link-arrow {
          color: #94a3b8;
          transition: all 0.2s;
        }

        .db-device-item:hover .db-link-arrow {
          color: #16a34a;
          transform: translateX(1.5px);
        }

        /* ===== Recent Activity Logs ===== */
        .db-logs-section {
          background: white;
          border-radius: 28px;
          border: 1.5px solid #e2e8f0;
          padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .db-logs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .db-log-item {
          padding: 0.875rem 1.25rem;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          transition: all 0.2s;
        }

        .db-log-item:hover {
          background: white;
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .db-log-left {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          min-width: 0;
          flex: 1;
        }

        .db-log-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Tone Classes for Logs */
        .db-log-icon--success { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
        .db-log-icon--neutral { background: #e2e8f0; color: #475569; }
        .db-log-icon--danger { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .db-log-icon--info { background: rgba(14, 165, 233, 0.08); color: #0ea5e9; }

        .db-log-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .db-log-desc {
          font-size: 0.875rem;
          font-weight: 750;
          color: #334155;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .db-log-time-mobile {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        @media (min-width: 640px) {
          .db-log-time-mobile {
            display: none;
          }
        }

        .db-log-time-desktop {
          display: none;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          flex-shrink: 0;
        }

        @media (min-width: 640px) {
          .db-log-time-desktop {
            display: block;
          }
        }

        .db-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
          gap: 0.5rem;
          color: #94a3b8;
        }

        .db-empty-state h4 {
          font-size: 0.95rem;
          font-weight: 750;
          color: #64748b;
          margin: 0;
        }

        .db-empty-state p {
          font-size: 0.8rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}



function SummaryCard({
  icon,
  label,
  value,
  subtext,
  badge,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  badge?: React.ReactNode;
  tone: "emerald" | "blue" | "amber" | "violet" | "slate";
}) {
  return (
    <div className={`db-summary-card db-summary-card--${tone}`}>
      {badge && (
        <div className="db-summary-badge select-none">
          {badge}
        </div>
      )}
      <div className="db-summary-card-inner">
        <div className={`db-summary-icon-wrap db-summary-icon-wrap--${tone}`}>
          {icon}
        </div>
        <div className="db-summary-info flex-1 overflow-hidden">
          <div className="db-summary-val">{value}</div>
          <div className="db-summary-label">{label}</div>
          <div className="db-summary-subtext">{subtext}</div>
        </div>
      </div>
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
  return (
    <div className={`db-metric-card db-metric-card--${tone}`}>
      <div className={`db-metric-icon-wrap db-metric-icon-wrap--${tone}`}>
        {icon}
      </div>
      <div className="db-metric-info">
        <div className="db-metric-label">{label}</div>
        <div className="db-metric-value">{value}</div>
      </div>
    </div>
  );
}
