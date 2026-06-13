"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Droplets,
  Wind,
  AlertCircle,
  Activity,
  Clock,
  Loader2,
  Search,
  ScrollText,
  CheckCircle2,
  ShieldAlert,
  SlidersHorizontal,
  CalendarCheck,
  Layers,
  CalendarRange,
  XCircle,
  Wifi,
  WifiOff,
  Timer,
  Bell,
} from "lucide-react";
import { getDevices } from "@/services/device.service";
import { requestJson } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";

interface LogRow {
  id: string;
  time: string;
  eventType: string;
  description: string;
  status: string;
}

interface LogApiRow {
  Log_ID: string;
  occurred_at: string;
  event_type: string;
  description: string;
  status: string;
}

export function LogsView() {
  const { t, translateLog } = useLanguage();
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchLogs() {
    try {
      const devices = await getDevices();
      if (devices.length > 0) {
        const firstDevice = devices[0];
        const data = await requestJson<LogApiRow[]>(
          `/v1/devices/${firstDevice.Device_ID}/logs?limit=100`
        );
        if (Array.isArray(data)) {
          const mapped = data.map((item) => ({
            id: item.Log_ID,
            time: item.occurred_at,
            eventType: item.event_type,
            description: item.description,
            status: item.status,
          }));
          setLogs(mapped);
        }
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();

    let refreshSec = 5;
    try {
      const saved = localStorage.getItem("pref_refresh_interval");
      if (saved) {
        refreshSec = Number(saved);
      }
    } catch (e) {
      console.error(e);
    }

    const interval = setInterval(fetchLogs, refreshSec * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Compute stats metrics dynamically
  const metrics = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === "success").length;
    const warning = logs.filter((l) => l.status === "warning" || l.status === "warning-dark").length;
    const error = logs.filter((l) => l.status === "error").length;
    return { total, success, warning, error };
  }, [logs]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return t('activityLogs.status.success', "Thành công");
      case "warning":
      case "warning-dark":
        return t('activityLogs.status.warning', "Cảnh báo");
      case "error":
        return t('activityLogs.status.error', "Lỗi");
      default:
        return t('activityLogs.status.info', "Thông tin");
    }
  };

  const getEventStyle = (eventType: string) => {
    const type = eventType.toUpperCase();

    // ── Device connectivity ─────────────────────────────────────────
    const isOnline =
      type.includes("ONLINE") ||
      type.includes("RECONNECT") ||
      type.includes("KẾT NỐI LẠI") ||
      type.includes("CONNECTED");
    if (isOnline) {
      return {
        icon: <Wifi size={16} />,
        textColor: "#16a34a",  // Green
        bgColor: "#dcfce7",
        cooldown: false,
        isAlert: false,
      };
    }

    const isOffline =
      type.includes("OFFLINE") ||
      type.includes("DISCONNECT") ||
      type.includes("MẤT KẾT NỐI") ||
      type.includes("LOST");
    if (isOffline) {
      return {
        icon: <WifiOff size={16} />,
        textColor: "#dc2626",  // Red
        bgColor: "#fee2e2",
        cooldown: false,
        isAlert: false,
      };
    }

    // ── Threshold alerts — phân biệt Fan/nhiệt (cam) vs Bơm/ẩm/đất (vàng) ──
    // Server ghi: 'CẢNH BÁO NHIỆT ĐỘ' | 'CẢNH BÁO ĐỘ ẨM' | 'CẢNH BÁO ĐẤT KHÔ' | 'CẢNH BÁO ÁNH SÁNG'
    const isThresholdAlert =
      type.includes("CẢNH BÁO") ||
      type.includes("ALERT") ||
      type.includes("WARNING") ||
      type.includes("VƯỢT NGƯỠNG");

    if (isThresholdAlert) {
      // Quạt / nhiệt độ / ánh sáng → Cam
      if (
        type.includes("NHIỆT ĐỘ") ||
        type.includes("NHIET DO") ||
        type.includes("ÁNH SÁNG") ||
        type.includes("ANH SANG") ||
        type.includes("FAN") ||
        type.includes("TEMP") ||
        type.includes("LIGHT")
      ) {
        return {
          icon: <AlertCircle size={16} />,
          textColor: "#ea580c",  // Orange — quạt / nhiệt
          bgColor: "#fff7ed",
          cooldown: true,
          isAlert: true,
        };
      }
      // Bơm / đất / độ ẩm → Vàng
      if (
        type.includes("ĐẤT KHÔ") ||
        type.includes("DAT KHO") ||
        type.includes("ĐỘ ẨM") ||
        type.includes("DO AM") ||
        type.includes("PUMP") ||
        type.includes("MOISTURE") ||
        type.includes("SOIL") ||
        type.includes("HUMIDITY")
      ) {
        return {
          icon: <AlertCircle size={16} />,
          textColor: "#ca8a04",  // Yellow-amber — bơm / đất
          bgColor: "#fefce8",
          cooldown: true,
          isAlert: true,
        };
      }
      // Fallback generic alert → Cam
      return {
        icon: <AlertCircle size={16} />,
        textColor: "#ea580c",
        bgColor: "#fff7ed",
        cooldown: true,
        isAlert: true,
      };
    }

    // ── Pump actions (non-alert) ───────────────────────────────────
    if (type.includes("PUMP")) {
      return {
        icon: <Droplets size={16} />,
        textColor: "#2563eb",
        bgColor: "#eff6ff",
        cooldown: false,
        isAlert: false,
      };
    }

    // ── Fan actions (non-alert) ────────────────────────────────────
    if (type.includes("FAN")) {
      return {
        icon: <Wind size={16} />,
        textColor: "#0d9488",
        bgColor: "#f0fdfa",
        cooldown: false,
        isAlert: false,
      };
    }

    // ── Schedule ──────────────────────────────────────────────────
    if (type.includes("SCHEDULE_WATERING")) {
      return {
        icon: <CalendarCheck size={16} />,
        textColor: "#059669",
        bgColor: "#ecfdf5",
        cooldown: false,
        isAlert: false,
      };
    }
    if (type.includes("SCHEDULE")) {
      return {
        icon: <Clock size={16} />,
        textColor: "#0f172a",
        bgColor: "#f1f5f9",
        cooldown: false,
        isAlert: false,
      };
    }

    // ── Threshold settings change (not alert) ──────────────────────
    if (
      type.includes("THRESHOLD") &&
      (type.includes("UPDATE") || type.includes("CHANGE") || type.includes("SAVE"))
    ) {
      return {
        icon: <SlidersHorizontal size={16} />,
        textColor: "#d97706",
        bgColor: "#fffbeb",
        cooldown: false,
        isAlert: false,
      };
    }

    // ── Notification channel configuration ─────────────────────────
    if (type.includes("CẤU HÌNH KÊNH THÔNG BÁO") || type.includes("NOTIFICATION")) {
      return {
        icon: <Bell size={16} />,
        textColor: "#4f46e5",  // Indigo
        bgColor: "#e0e7ff",
        cooldown: false,
        isAlert: false,
      };
    }

    // ── Default ───────────────────────────────────────────────────
    return {
      icon: <Activity size={16} />,
      textColor: "#475569",
      bgColor: "#f8fafc",
      cooldown: false,
      isAlert: false,
    };
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleString("vi-VN");
  };

  // Filter logs by status, search text, event type and date range
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesFilter = filter === "all" || log.status === filter;
      const matchesSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.eventType.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesFilter || !matchesSearch) return false;

      if (eventTypeFilter !== "all") {
        const type = log.eventType.toUpperCase();
        if (eventTypeFilter === "PUMP" && !type.includes("PUMP")) return false;
        if (eventTypeFilter === "FAN" && !type.includes("FAN")) return false;
        if (eventTypeFilter === "SCHEDULE" && !type.includes("SCHEDULE")) return false;
        if (eventTypeFilter === "THRESHOLD" && !type.includes("THRESHOLD")) return false;
        if (eventTypeFilter === "ALERT" && !type.includes("ALERT") && !type.includes("WARNING") && !type.includes("CẢNH BÁO")) return false;
      }

      const logDate = new Date(log.time);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }

      return true;
    });
  }, [logs, filter, searchTerm, eventTypeFilter, startDate, endDate]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, eventTypeFilter, startDate, endDate]);

  const hasActiveFilters = useMemo(() => {
    return (
      filter !== "all" ||
      searchTerm.trim() !== "" ||
      eventTypeFilter !== "all" ||
      startDate !== "" ||
      endDate !== ""
    );
  }, [filter, searchTerm, eventTypeFilter, startDate, endDate]);

  const itemsPerPage = 25;
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const filterPills = [
    {
      value: "all",
      label: t('activityLogs.status.all', "Tất cả"),
      count: metrics.total,
      activeClass: "bg-slate-900 text-white border-slate-900",
      inactiveClass:
        "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border-slate-200",
    },
    {
      value: "success",
      label: t('activityLogs.status.success', "Thành công"),
      count: metrics.success,
      activeClass: "bg-emerald-600 text-white border-emerald-600",
      inactiveClass:
        "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200",
    },
    {
      value: "warning",
      label: t('activityLogs.status.warning', "Cảnh báo"),
      count: metrics.warning,
      activeClass: "bg-amber-500 text-white border-amber-500",
      inactiveClass:
        "bg-amber-50 hover:bg-amber-100/80 text-amber-700 border-amber-200",
    },
    {
      value: "error",
      label: t('activityLogs.status.error', "Lỗi"),
      count: metrics.error,
      activeClass: "bg-red-600 text-white border-red-600",
      inactiveClass:
        "bg-red-50 hover:bg-red-100/80 text-red-700 border-red-200",
    },
  ];

  return (
    <div className="logs-view-container">
      {/* Header */}
      <div className="logs-header-card">
        <div className="logs-header-icon">
          <ScrollText size={24} />
        </div>
        <div>
          <span className="logs-badge-pill">
            <Activity size={11} /> {t('activityLogs.monitoringSystem', 'Hệ thống giám sát')}
          </span>
          <h2 className="logs-header-title">{t('activityLogs.title', 'Nhật ký hoạt động')}</h2>
          <p className="logs-header-desc">
            {t('activityLogs.desc', 'Tra cứu chi tiết các sự kiện tự động, trạng thái thiết bị và cảnh báo lỗi trong quá trình vận hành.')}
          </p>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="logs-stats-grid">
        <div className="logs-stat-card logs-stat-card--total">
          <div className="logs-stat-icon">
            <Activity size={20} />
          </div>
          <div>
            <span className="logs-stat-label">{t('activityLogs.stats.total', 'Tổng sự kiện')}</span>
            <span className="logs-stat-value">{metrics.total}</span>
          </div>
        </div>

        <div className="logs-stat-card logs-stat-card--success">
          <div className="logs-stat-icon">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="logs-stat-label">{t('activityLogs.stats.healthy', 'Vận hành tốt')}</span>
            <span className="logs-stat-value">{metrics.success}</span>
          </div>
        </div>

        <div className="logs-stat-card logs-stat-card--warning">
          <div className="logs-stat-icon">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="logs-stat-label">{t('activityLogs.stats.warning', 'Cảnh báo')}</span>
            <span className="logs-stat-value">{metrics.warning}</span>
          </div>
        </div>

        <div className="logs-stat-card logs-stat-card--error">
          <div className="logs-stat-icon">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="logs-stat-label">{t('activityLogs.stats.error', 'Lỗi hệ thống')}</span>
            <span className="logs-stat-value">{metrics.error}</span>
          </div>
        </div>
      </div>

      {/* Main Logs Table Card */}
      <div className="logs-main-card">
        {/* ====== Unified Filter Toolbar ====== */}
        <div className="logs-toolbar-wrap">

          {/* Row 1: Status pills + Search */}
          <div className="logs-toolbar-row">
            <div className="logs-filter-pills">
              {filterPills.map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setFilter(pill.value)}
                  className={`logs-pill ${
                    filter === pill.value ? `logs-pill--active logs-pill--${pill.value}` : "logs-pill--idle"
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`logs-pill-count ${
                    filter === pill.value ? "logs-pill-count--active" : ""
                  }`}>{pill.count}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="logs-search-wrap">
              <Search size={15} className="logs-search-icon" />
              <input
                type="text"
                placeholder={t('activityLogs.searchPlaceholder', 'Tìm kiếm sự kiện, mô tả...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="logs-search-input"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")} className="logs-search-clear">
                  <XCircle size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Advanced Filters */}
          <div className="logs-advanced-filters">
            {/* Event type */}
            <div className="logs-filter-group">
              <Layers size={15} className="logs-filter-icon" />
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="logs-select-filter"
              >
                <option value="all">{t('activityLogs.filters.allTypes', 'Tất cả loại sự kiện')}</option>
                <option value="PUMP">{t('activityLogs.filters.pump', 'Thiết bị bơm (PUMP)')}</option>
                <option value="FAN">{t('activityLogs.filters.fan', 'Quạt làm mát (FAN)')}</option>
                <option value="SCHEDULE">{t('activityLogs.filters.schedule', 'Lịch trình tưới (SCHEDULE)')}</option>
                <option value="THRESHOLD">{t('activityLogs.filters.threshold', 'Cài đặt ngưỡng (THRESHOLD)')}</option>
                <option value="ALERT">{t('activityLogs.filters.alert', 'Cảnh báo / Lỗi (ALERT)')}</option>
              </select>
            </div>

            {/* Date range */}
            <div className="logs-date-group-wrapper">
              <div className="logs-filter-group">
                <CalendarRange size={15} className="logs-filter-icon" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="logs-date-filter"
                  title="Từ ngày"
                />
              </div>
              <span className="logs-date-sep">→</span>
              <div className="logs-filter-group">
                <CalendarRange size={15} className="logs-filter-icon" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="logs-date-filter"
                  title="Đến ngày"
                />
              </div>

              {(startDate || endDate || eventTypeFilter !== "all") && (
                <button
                  type="button"
                  className="logs-clear-filters-btn"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setEventTypeFilter("all");
                  }}
                >
                  <XCircle size={14} />
                  Đặt lại
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logs List Row Layout */}
        <div className="logs-list">
          {loading ? (
            <div className="logs-loading-state">
              <Loader2 size={32} className="animate-spin text-emerald-500" />
              <p className="text-xs font-semibold text-slate-400 mt-2">
                {t('activityLogs.loading', 'Đang tải nhật ký hoạt động...')}
              </p>
            </div>
          ) : logs.length === 0 && !hasActiveFilters ? (
            <div className="logs-empty-state">
              <ScrollText size={48} className="text-slate-200 mb-2" />
              <p className="text-sm font-semibold text-slate-400">
                {t('activityLogs.noLogs', 'Chưa có nhật ký hoạt động nào được ghi nhận')}
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="logs-empty-state">
              <ScrollText size={48} className="text-slate-200 mb-2" />
              <p className="text-sm font-semibold text-slate-400">
                {t('activityLogs.empty', 'Không tìm thấy nhật ký phù hợp')}
              </p>
            </div>
          ) : (
            paginatedLogs.map((log) => {
              const eventStyle = getEventStyle(log.eventType);
              return (
                <div
                  key={log.id}
                  className="log-item-row hover:translate-x-1 transition-transform duration-200"
                >
                  {/* Status indicator bar on the left */}
                  <div
                    className="log-status-bar"
                    style={{ backgroundColor: eventStyle.textColor }}
                  />

                  {/* Left side: Icon & Event type */}
                  <div className="log-item-meta">
                    <div
                      className="log-event-icon-wrapper"
                      style={{
                        backgroundColor: eventStyle.bgColor,
                        color: eventStyle.textColor,
                      }}
                    >
                      {eventStyle.icon}
                    </div>
                    <div className="log-event-info">
                      <span
                        className="log-event-name"
                        style={{ color: eventStyle.textColor }}
                      >
                        {translateLog(log.eventType)}
                      </span>
                      <div className="log-time-wrapper">
                        <Clock size={12} className="text-slate-400" />
                        <span className="log-time">{formatTime(log.time)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Description */}
                  <div className="log-item-desc">
                    <p className="font-medium text-slate-600">
                      {translateLog(log.description)}
                    </p>
                  </div>

                  {/* Right: Status Badge + Cooldown chip */}
                  <div className="log-item-status">
                    {eventStyle.cooldown && (
                      <span className="log-cooldown-chip">
                        <Timer size={11} />
                        30s
                      </span>
                    )}
                    <span className={`log-badge log-badge--${log.status}`}>
                      {getStatusLabel(log.status)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination controls */}
        {!loading && filteredLogs.length > 0 && (
          <div className="logs-pagination">
            <div className="logs-pagination-info">
              {t('activityLogs.pagination.showing', 'Hiển thị từ')}{" "}
              <strong>
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredLogs.length
                )}
              </strong>{" "}
              {t('activityLogs.pagination.to', 'đến')}{" "}
              <strong>
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </strong>{" "}
              {t('activityLogs.pagination.of', 'trên tổng số')}{" "}
              <strong>{filteredLogs.length}</strong>{" "}
              {t('activityLogs.pagination.events', 'sự kiện')}
            </div>

            {totalPages > 1 && (
              <div className="logs-pagination-pages">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="logs-page-nav-btn"
                  title={t('activityLogs.pagination.prevTitle', 'Trang trước')}
                >
                  &larr; {t('activityLogs.pagination.prev', 'Trước')}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`logs-page-number-btn ${
                        currentPage === page ? "logs-page-number-btn--active" : ""
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="logs-page-nav-btn"
                  title={t('activityLogs.pagination.nextTitle', 'Trang sau')}
                >
                  {t('activityLogs.pagination.next', 'Sau')} &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .logs-view-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        /* ===== Header Card ===== */
        .logs-header-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.75rem 2rem;
          border-radius: 24px;
          background: white;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .logs-badge-pill {
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
          margin-bottom: 0.25rem;
        }

        .logs-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(16, 185, 129, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          flex-shrink: 0;
        }

        .logs-header-title {
          font-size: 1.875rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .logs-header-desc {
          font-size: 0.8125rem;
          color: #64748b;
          line-height: 1.5;
        }

        /* ===== Stats Grid ===== */
        .logs-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .logs-stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .logs-stat-card {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .logs-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .logs-stat-card--total .logs-stat-icon {
          background: #f1f5f9;
          color: #475569;
        }

        .logs-stat-card--success .logs-stat-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        .logs-stat-card--warning .logs-stat-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .logs-stat-card--error .logs-stat-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .logs-stat-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .logs-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 850;
          color: #0f172a;
          line-height: 1.2;
          margin-top: 2px;
        }

        /* ===== Main Logs Card ===== */
        .logs-main-card {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ===== Unified Toolbar ===== */
        .logs-toolbar-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .logs-toolbar-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        @media (min-width: 640px) {
          .logs-toolbar-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        /* ===== Status Pills ===== */
        .logs-filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .logs-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.85rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }

        .logs-pill--idle {
          background: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
        }
        .logs-pill--idle:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        /* Active states per type */
        .logs-pill--active.logs-pill--all    { background: #0f172a; color: white; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15,23,42,0.2); }
        .logs-pill--active.logs-pill--success { background: #059669; color: white; border-color: #059669; box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
        .logs-pill--active.logs-pill--warning { background: #d97706; color: white; border-color: #d97706; box-shadow: 0 4px 12px rgba(217,119,6,0.25); }
        .logs-pill--active.logs-pill--error   { background: #dc2626; color: white; border-color: #dc2626; box-shadow: 0 4px 12px rgba(220,38,38,0.25); }

        .logs-pill-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 100px;
          font-size: 0.65rem;
          font-weight: 800;
          background: rgba(0,0,0,0.08);
          color: inherit;
          transition: background 0.15s;
        }
        .logs-pill-count--active {
          background: rgba(255,255,255,0.22);
        }

        /* ===== Search ===== */
        .logs-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        @media (min-width: 640px) {
          .logs-search-wrap { width: 260px; }
        }
        .logs-search-wrap :global(.logs-search-icon) {
          position: absolute;
          left: 0.75rem;
          color: #94a3b8;
          pointer-events: none;
          flex-shrink: 0;
        }
        .logs-search-input {
          width: 100%;
          padding: 0.5rem 2.25rem 0.5rem 2.25rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: all 0.18s;
        }
        .logs-search-input::placeholder { color: #94a3b8; }
        .logs-search-input:focus {
          border-color: #10b981;
          background: white;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .logs-search-clear {
          position: absolute;
          right: 0.65rem;
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .logs-search-clear:hover { color: #475569; }

        /* ===== Advanced Filters Row ===== */
        .logs-advanced-filters {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 0.875rem 1rem;
          border-radius: 14px;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
        }

        @media (min-width: 1024px) {
          .logs-advanced-filters {
            flex-direction: row;
            align-items: center;
            gap: 0.75rem;
          }
        }

        .logs-filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border: 1.5px solid #e8edf2;
          border-radius: 10px;
          padding: 0.45rem 0.85rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          transition: border-color 0.18s, box-shadow 0.18s;
          flex: 1;
          min-width: 0;
        }
        .logs-filter-group:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }

        .logs-filter-group :global(.logs-filter-icon) {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .logs-select-filter,
        .logs-date-filter {
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
          width: 100%;
          cursor: pointer;
        }

        .logs-date-group-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 2;
          width: 100%;
        }

        .logs-date-sep {
          color: #94a3b8;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .logs-clear-filters-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.45rem 0.875rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .logs-clear-filters-btn:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .log-item-row {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 1rem 1.25rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        }

        @media (min-width: 768px) {
          .log-item-row {
            flex-direction: row;
            align-items: center;
            gap: 1.5rem;
          }
        }

        .log-status-bar {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 4px;
        }

        .log-status-bar--success {
          background-color: #10b981;
        }
        .log-status-bar--warning {
          background-color: #f59e0b;
        }
        .log-status-bar--error {
          background-color: #ef4444;
        }
        .log-status-bar--info {
          background-color: #3b82f6;
        }

        .log-item-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
        }

        @media (min-width: 768px) {
          .log-item-meta {
            width: 220px;
            flex-shrink: 0;
          }
        }

        .log-event-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .log-event-icon-wrapper--success {
          background-color: #ecfdf5;
          color: #059669;
        }
        .log-event-icon-wrapper--warning {
          background-color: #fffbeb;
          color: #d97706;
        }
        .log-event-icon-wrapper--error {
          background-color: #fef2f2;
          color: #dc2626;
        }
        .log-event-icon-wrapper--info {
          background-color: #eff6ff;
          color: #2563eb;
        }

        .log-event-info {
          display: flex;
          flex-direction: column;
        }

        .log-event-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0f172a;
        }

        .log-time-wrapper {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 2px;
        }

        .log-time {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .log-item-desc {
          flex: 1;
          font-size: 0.85rem;
          color: #334155;
          line-height: 1.5;
        }

        .log-item-status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          width: 100%;
          flex-wrap: wrap;
        }

        @media (min-width: 768px) {
          .log-item-status {
            width: auto;
            min-width: 130px;
            flex-shrink: 0;
            justify-content: flex-end;
          }
        }

        .log-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.65rem;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          border: 1px solid transparent;
        }

        .log-badge--success {
          background-color: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .log-badge--warning {
          background-color: #fff7ed;
          color: #ea580c;
          border-color: #ffedd5;
        }
        .log-badge--warning-dark {
          background-color: #ffedd5;
          color: #c2410c;
          border-color: #fed7aa;
        }
        .log-badge--error {
          background-color: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }
        .log-badge--info {
          background-color: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        /* Cooldown chip */
        .log-cooldown-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
          white-space: nowrap;
        }

        .logs-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          gap: 1rem;
          color: #64748b;
        }

        .logs-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          text-align: center;
          color: #64748b;
        }

        /* ===== Pagination ===== */
        .logs-pagination {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 1.25rem;
          border-top: 1.5px solid #f1f5f9;
          margin-top: 0.5rem;
          width: 100%;
        }

        @media (min-width: 640px) {
          .logs-pagination {
            flex-direction: row;
          }
        }

        .logs-pagination-info {
          font-size: 0.8rem;
          color: #64748b;
        }

        .logs-pagination-info strong {
          color: #0f172a;
          font-weight: 700;
        }

        .logs-pagination-pages {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .logs-page-nav-btn {
          padding: 0.4rem 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logs-page-nav-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .logs-page-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .logs-page-number-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logs-page-number-btn:hover:not(.logs-page-number-btn--active) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .logs-page-number-btn--active {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #16a34a;
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.25);
        }

        .logs-advanced-filters {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
        }

        @media (min-width: 1024px) {
          .logs-advanced-filters {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          }
        }

        .logs-filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.4rem 0.75rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          transition: all 0.2s;
          flex: 1;
        }

        .logs-filter-group:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .logs-filter-icon-label {
          font-size: 0.9rem;
          user-select: none;
        }

        .logs-select-filter,
        .logs-date-filter {
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
          width: 100%;
          cursor: pointer;
        }

        .logs-date-group-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 2;
          width: 100%;
        }

        .logs-date-sep {
          color: #94a3b8;
          font-weight: bold;
        }

        .logs-clear-filters-btn {
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .logs-clear-filters-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}
