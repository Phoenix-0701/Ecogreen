"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Download, Calendar, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getAccessToken } from "@/services/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

interface ExportReportCardProps {
  deviceId: string;
  deviceName?: string;
}

type ExportFormat = "excel" | "pdf";

const PRESETS = [
  { label: "7 ngày qua", days: 7 },
  { label: "30 ngày qua", days: 30 },
  { label: "3 tháng qua", days: 90 },
];

function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

export function ExportReportCard({ deviceId, deviceName }: ExportReportCardProps) {
  // Dùng local date (không dùng UTC) để tránh lệch ngày theo timezone
  function toLocalDateInputValue(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const [startDate, setStartDate] = useState(toLocalDateInputValue(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(toLocalDateInputValue(today));
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isDateRangeInvalid = startDate > endDate;

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setStartDate(toLocalDateInputValue(start));
    setEndDate(toLocalDateInputValue(end));
    setError(null);
  };

  const handleExport = async (format: ExportFormat) => {
    if (!deviceId) return;

    if (isDateRangeInvalid) {
      setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return;
    }

    setLoading(format);
    setError(null);

    try {
      const token = getAccessToken();
      const url = `${API_URL}/v1/analytics/devices/${deviceId}/export/${format}?startDate=${startDate}&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(
          errBody?.message ?? `Xuất báo cáo thất bại (HTTP ${res.status})`
        );
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const ext = format === "excel" ? "xlsx" : "pdf";
      a.download = `ecogreen-report-${deviceName ?? deviceId}-${startDate}-${endDate}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="export-card">
      {/* Header */}
      <div className="export-card__header" onClick={() => setExpanded((v) => !v)}>
        <div className="export-card__header-left">
          <div className="export-card__icon-wrap">
            <Download size={18} />
          </div>
          <div>
            <h3 className="export-card__title">Xuất Báo Cáo</h3>
            <p className="export-card__subtitle">Excel &amp; PDF • Thống kê theo kỳ</p>
          </div>
        </div>
        <button type="button" className="export-card__toggle-btn">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="export-card__body">
          {/* Preset buttons */}
          <div className="export-card__presets">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                className="export-card__preset-btn"
                onClick={() => applyPreset(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="export-card__date-row">
            <div className="export-card__date-group">
              <label className="export-card__date-label">
                <Calendar size={13} /> Từ ngày
              </label>
              <input
                type="date"
                className="export-card__date-input"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="export-card__date-sep">→</div>
            <div className="export-card__date-group">
              <label className="export-card__date-label">
                <Calendar size={13} /> Đến ngày
              </label>
              <input
                type="date"
                className="export-card__date-input"
                value={endDate}
                min={startDate}
                max={toDateInputValue(today)}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Date validation warning */}
          {isDateRangeInvalid && (
            <div className="export-card__error">
              ⚠️ Ngày bắt đầu không được lớn hơn ngày kết thúc. Vui lòng chọn lại hoặc dùng nút preset.
            </div>
          )}

          {/* Error message */}
          {error && !isDateRangeInvalid && (
            <div className="export-card__error">
              ⚠️ {error}
            </div>
          )}

          {/* Export buttons */}
          <div className="export-card__actions">
            <button
              type="button"
              className="export-card__btn export-card__btn--excel"
              onClick={() => handleExport("excel")}
              disabled={loading !== null || !deviceId}
            >
              {loading === "excel" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              {loading === "excel" ? "Đang xuất..." : "Tải Excel (.xlsx)"}
            </button>

            <button
              type="button"
              className="export-card__btn export-card__btn--pdf"
              onClick={() => handleExport("pdf")}
              disabled={loading !== null || !deviceId}
            >
              {loading === "pdf" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              {loading === "pdf" ? "Đang xuất..." : "Tải PDF"}
            </button>
          </div>

          <p className="export-card__note">
            💡 Dữ liệu bao gồm: trung bình nhiệt độ, độ ẩm, ánh sáng, số lần bật bơm và ước tính lượng nước & điện năng tiêu thụ.
          </p>
        </div>
      )}
    </div>
  );
}
