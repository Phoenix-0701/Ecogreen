"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
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

type ToastState = {
  show: boolean;
  type: "success" | "error";
  title: string;
  message: string;
} | null;

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
  const [toast, setToast] = useState<ToastState>(null);

  const isDateRangeInvalid = startDate > endDate;

  const showNotification = (type: "success" | "error", title: string, message: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

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
      const fileName = `ecogreen-report-${deviceName ?? deviceId}-${startDate}-${endDate}.${ext}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      showNotification("success", "Xuất báo cáo thành công!", `File ${fileName} đã được tải xuống.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      setError(msg);
      showNotification("error", "Xuất báo cáo thất bại", msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
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

            {/* Date validation warning — kept inline */}
            {isDateRangeInvalid && (
              <div className="export-card__error">
                ⚠️ Ngày bắt đầu không được lớn hơn ngày kết thúc. Vui lòng chọn lại hoặc dùng nút preset.
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
              💡 Dữ liệu bao gồm: trung bình nhiệt độ, độ ẩm, ánh sáng, số lần bật bơm và ước tính lượng nước &amp; điện năng tiêu thụ.
            </p>
          </div>
        )}
      </div>

      {/* ===== Toast — đồng bộ với ScheduleView / ProfileView / ThresholdsView ===== */}
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
            <h4 className={`text-sm font-extrabold tracking-tight ${toast.type === "success" ? "text-emerald-900" : "text-red-950"}`}>
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
    </>
  );
}
