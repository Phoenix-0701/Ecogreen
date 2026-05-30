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

export function LogsView() {
  const { t, translateLog } = useLanguage();
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchLogs() {
    try {
      const devices = await getDevices();
      if (devices.length > 0) {
        const firstDevice = devices[0];
        const data = await requestJson<any[]>(
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
    if (type.includes("PUMP")) {
      return {
        icon: <Droplets size={16} />,
        textColor: "#2563eb", // Blue
        bgColor: "#eff6ff",
      };
    }
    if (type.includes("FAN")) {
      return {
        icon: <Wind size={16} />,
        textColor: "#0d9488", // Teal
        bgColor: "#f0fdfa",
      };
    }
    if (type.includes("SCHEDULE_UPDATE") || type.includes("SCHEDULE")) {
      return {
        icon: <Clock size={16} />,
        textColor: "#0f172a", // Black
        bgColor: "#f1f5f9",
      };
    }
    if (
      type.includes("THRESHOLD") &&
      (type.includes("UPDATE") || type.includes("CHANGE") || type.includes("SAVE"))
    ) {
      return {
        icon: <SlidersHorizontal size={16} />,
        textColor: "#d97706", // Amber
        bgColor: "#fffbeb",
      };
    }
    if (type.includes("ALERT") || type.includes("WARNING") || type.includes("CẢNH BÁO")) {
      const isSoil = type.includes("ĐẤT");
      return {
        icon: <AlertCircle size={16} />,
        textColor: isSoil ? "#c2410c" : "#ea580c", // Cam đậm cho đất, cam thường cho nhiệt
        bgColor: isSoil ? "#ffedd5" : "#fff7ed",
      };
    }
    return {
      icon: <Activity size={16} />,
      textColor: "#475569", // Gray
      bgColor: "#f8fafc",
    };
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleString("vi-VN");
  };

  // Filter logs by status and search text
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesFilter = filter === "all" || log.status === filter;
      const matchesSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.eventType.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [logs, filter, searchTerm]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

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
        {/* Toolbar */}
        <div className="logs-toolbar">
          {/* Filter Pills */}
          <div className="logs-filter-pills">
            {filterPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setFilter(pill.value)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer focus:outline-none ${
                  filter === pill.value ? pill.activeClass : pill.inactiveClass
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    filter === pill.value
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex items-center relative w-full sm:w-64">
            <span className="absolute left-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={t('activityLogs.searchPlaceholder', 'Tìm kiếm sự kiện, mô tả...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition-all placeholder-slate-400"
            />
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
          ) : filteredLogs.length === 0 ? (
            <div className="logs-empty-state">
              <ScrollText size={48} className="text-slate-200 mb-2" />
              <p className="text-sm font-semibold text-slate-400">
                {t('activityLogs.empty', 'Không tìm thấy sự kiện nào khớp với bộ lọc.')}
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

                  {/* Left side details: Icon & Event type */}
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

                  {/* Center details: Description */}
                  <div className="log-item-desc">
                    <p className="font-medium text-slate-600">
                      {translateLog(log.description)}
                    </p>
                  </div>

                  {/* Right details: Status Badge */}
                  <div className="log-item-status">
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

        .logs-toolbar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .logs-toolbar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .logs-filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        /* ===== List Layout ===== */
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
          width: 100%;
        }

        @media (min-width: 768px) {
          .log-item-status {
            width: 110px;
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
      `}</style>
    </div>
  );
}
