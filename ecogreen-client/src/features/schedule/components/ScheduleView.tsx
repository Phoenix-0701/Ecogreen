"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  PenLine,
  Plus,
  Save,
  Sparkles,
  Sprout,
  TimerReset,
  Trash2,
  Waves,
  X,
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useLanguage } from "@/context/LanguageContext";
import {
  createEmptyScheduleRule,
  loadScheduleState,
  saveScheduleState,
} from "@/services/automation.service";
import { getDevices } from "@/services/device.service";
import type { Device } from "@/types";
import type { ScheduleRule, ScheduleState } from "@/types/automation";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const CHART_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

type ScheduleModalState = {
  mode: "create" | "edit";
  rule: ScheduleRule;
};

function buildProjectedConsumption(schedules: ScheduleRule[]) {
  const series = Array.from({ length: 7 }, () => 0);

  schedules.forEach((schedule) => {
    if (!schedule.enabled) {
      return;
    }

    schedule.days.forEach((day) => {
      const index = day === 0 ? 6 : day - 1;
      series[index] += Math.round(schedule.durationMinutes * 1.35);
    });
  });

  return series.map((value) => Math.max(8, value));
}

function sortSchedules(schedules: ScheduleRule[]) {
  return [...schedules].sort((left, right) => left.time.localeCompare(right.time));
}

export function ScheduleView() {
  const { t, language } = useLanguage();

  // Translate advisory text (from mock/backend - Vietnamese)
  const translateAdvisory = (text: string): string => {
    if (language === "vi" || !text) return text;
    const lower = text.toLowerCase();
    if (lower.includes("độ ẩm đất") && lower.includes("cao")) {
      return "Soil moisture is high in the West wing. AI recommends skipping the 04:30 PM cycle today to prevent root rot.";
    }
    if (lower.includes("độ ẩm đất") && lower.includes("thấp")) {
      return "Soil moisture is lower than optimal. AI recommends increasing watering frequency.";
    }
    if (lower.includes("nguy cơ mưa")) {
      return "Rain risk detected. AI recommends skipping the upcoming watering cycle.";
    }
    return text;
  };

  // Translate schedule title (Vietnamese names from backend)
  const translateScheduleTitle = (title: string): string => {
    if (language === "vi" || !title) return title;
    const lower = title.toLowerCase();
    if (lower.includes("chu kỳ tưới mới") || lower.includes("chu ky tuoi moi")) {
      return "New Watering Cycle";
    }
    if (lower.includes("phun sương")) return title.replace(/phun sương/gi, "Misting");
    if (lower.includes("tưới đẫm")) return title.replace(/tưới đẫm/gi, "Deep irrigation");
    return title;
  };
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const CHART_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const [draft, setDraft] = useState<ScheduleState | null>(null);
  const [saved, setSaved] = useState<ScheduleState | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", title: string, message: string) => {
    setToast({ show: true, type, title, message });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([loadScheduleState(), getDevices().catch(() => [])]).then(([result, deviceData]) => {
      if (!mounted) {
        return;
      }

      const normalized = {
        ...result,
        schedules: sortSchedules(result.schedules),
      };

      setDraft(normalized);
      setSaved(normalized);
      setDevices(deviceData);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  const zoneOptions = useMemo(() => {
    const deviceNames = devices.map((device) => device.name).filter(Boolean);
    const scheduleZones = draft?.schedules.map((schedule) => schedule.zone).filter(Boolean) ?? [];
    return Array.from(new Set([...deviceNames, ...scheduleZones]));
  }, [devices, draft?.schedules]);

  if (loading || !draft || !saved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[2rem] bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-[#5d6c63]">
          <Loader2 className="size-4 animate-spin" />
          {t("schedule.loading", "Đang tải màn lịch trình...")}
        </div>
      </div>
    );
  }

  const consumption = buildProjectedConsumption(draft.schedules);
  const totalConsumption = consumption.reduce((sum, value) => sum + value, 0);
  const peakValue = Math.max(...consumption);
  const peakIndex = consumption.findIndex((value) => value === peakValue);

  const updateSchedules = (updater: (current: ScheduleRule[]) => ScheduleRule[]) => {
    const nextSchedules = sortSchedules(updater(draft.schedules));
    setDraft({
      ...draft,
      schedules: nextSchedules,
      dailyConsumptionLiters: buildProjectedConsumption(nextSchedules),
    });
  };

  const openCreateScheduleModal = () => {
    const nextRule = createEmptyScheduleRule();
    setScheduleModal({
      mode: "create",
      rule: {
        ...nextRule,
        zone: zoneOptions[0] ?? nextRule.zone,
      },
    });
  };

  const checkOverlap = (rule: ScheduleRule, currentRules: ScheduleRule[]) => {
    return currentRules.some((item) => {
      if (item.id === rule.id) return false;
      const sameTime = item.time === rule.time;
      const shareDays = item.days.some((day) => rule.days.includes(day));
      return sameTime && shareDays;
    });
  };

  const handleSubmitSchedule = (rule: ScheduleRule) => {
    const hasOverlap = checkOverlap(rule, draft.schedules);
    if (hasOverlap) {
      showNotification(
        "error",
        t("schedule.overlapTitle", "Lịch trùng thời gian"),
        t("schedule.overlapMsg", "Không thể {mode} vì đã có lịch trùng giờ ({time}) vào ngày được chọn.")
          .replace("{mode}", scheduleModal?.mode === "edit" ? t("schedule.modal.edit", "cập nhật").toLowerCase() : t("schedule.modal.createNew", "thêm").toLowerCase())
          .replace("{time}", formatTime(rule.time))
      );
      return;
    }

    updateSchedules((current) => {
      if (scheduleModal?.mode === "edit") {
        return current.map((item) => (item.id === rule.id ? rule : item));
      }

      return [...current, rule];
    });
    
    showNotification(
      "success",
      scheduleModal?.mode === "edit" ? t("schedule.updateSuccessTitle", "Cập nhật thành công") : t("schedule.addSuccessTitle", "Thêm lịch thành công"),
      scheduleModal?.mode === "edit"
        ? t("schedule.updateSuccessMsg", 'Lịch trình "{title}" đã được cập nhật nháp.').replace("{title}", rule.title)
        : t("schedule.addSuccessMsg", 'Lịch trình "{title}" đã được thêm nháp thành công.').replace("{title}", rule.title)
    );
    
    setScheduleModal(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveScheduleState({
        ...draft,
        dailyConsumptionLiters: buildProjectedConsumption(draft.schedules),
      });
      const normalized = {
        ...result,
        schedules: sortSchedules(result.schedules),
      };
      setDraft(normalized);
      setSaved(normalized);
      showNotification(
        "success",
        t("schedule.saveSuccessTitle", "Lưu lịch trình thành công"),
        t("schedule.saveSuccessMsg", "Cấu hình lịch tưới tự động đã được lưu lại hệ thống.")
      );
    } catch (error) {
      showNotification(
        "error",
        t("schedule.saveFailTitle", "Lỗi lưu lịch trình"),
        t("schedule.saveFailMsg", "Không thể lưu lịch trình tới máy chủ. Vui lòng kiểm tra lại kết nối.")
      );
    } finally {
      setSaving(false);
    }
  };

  const applySkipSuggestion = () => {
    const lastAfternoon = sortSchedules(draft.schedules)
      .filter((schedule) => schedule.time >= "16:00")
      .slice(-1)[0];

    if (!lastAfternoon) {
      return;
    }

    updateSchedules((current) =>
      current.map((schedule) =>
        schedule.id === lastAfternoon.id ? { ...schedule, enabled: false } : schedule,
      ),
    );
  };

  return (
    <div className="sc-container">
      {/* ===== Header Banner ===== */}
      <section className="sc-header">
        <div className="sc-header-left">
          <span className="sc-badge-pill">
            <CalendarClock size={13} /> {t("schedule.autoWatering", "Lịch tưới tự động")}
          </span>
          <h1 className="sc-title">{t("schedule.title", "Quản lý lịch tưới")}</h1>
          <p className="sc-subtitle">
            {t("schedule.subtitle", "Thiết lập chu kỳ tưới tiêu tự động cho các khu vực canh tác.")}
          </p>
        </div>
        <div className="sc-header-actions">
          <div className="sc-toggle-card">
            <div>
              <span className="sc-toggle-label">{t("schedule.activate", "Kích hoạt lịch tưới")}</span>
              <p className="sc-toggle-status">
                {draft.enabled ? t("schedule.active", "Đang hoạt động") : t("schedule.paused", "Tạm dừng")}
              </p>
            </div>
            <ToggleSwitch
              checked={draft.enabled}
              onChange={(value) => setDraft({ ...draft, enabled: value })}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="sc-save-btn"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("schedule.saveChanges", "Lưu thay đổi")}
          </button>
        </div>
      </section>

      {/* ===== Main Content Grid ===== */}
      <div className="sc-grid">
        {/* Left: Schedule List */}
        <section className="sc-left">
          <div className="sc-section-header">
            <h2 className="sc-section-title">{t("schedule.upcomingCycles", "Chu kỳ sắp tới")}</h2>
            <button
              type="button"
              onClick={openCreateScheduleModal}
              className="sc-add-btn"
            >
              <Plus className="size-4" />
              {t("schedule.addNew", "Thêm lịch mới")}
            </button>
          </div>

          {draft.schedules.map((schedule) => {
            const Icon = schedule.icon === "sprout" ? Sprout : Waves;

            return (
              <article key={schedule.id} className="sc-card">
                <div className="sc-card-body">
                  <div className="sc-card-info">
                    <div className="sc-card-icon">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="sc-card-title">{translateScheduleTitle(schedule.title)}</h3>
                      <p className="sc-card-zone">{schedule.zone}</p>
                      <div className="sc-card-meta">
                        <span className="sc-meta-item">
                          <Clock3 className="size-3.5" />
                          {formatTime(schedule.time)}
                        </span>
                        <span className="sc-meta-item">
                          <TimerReset className="size-3.5" />
                          {schedule.durationMinutes} {t("schedule.minutesLabel", "phút")}
                        </span>
                      </div>
                      <div className="sc-day-pills">
                        {DAY_LABELS.map((day, index) => (
                          <span
                            key={`${schedule.id}-${day}`}
                            className={`sc-day-pill ${
                              schedule.days.includes(index) ? "sc-day-pill--active" : ""
                            }`}
                          >
                            {t(`schedule.days.${DAY_KEYS[index]}`, day)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="sc-card-actions">
                    <ToggleSwitch
                      checked={schedule.enabled}
                      onChange={(value) =>
                        updateSchedules((current) =>
                          current.map((item) =>
                            item.id === schedule.id ? { ...item, enabled: value } : item,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setScheduleModal({ mode: "edit", rule: schedule })}
                      className="sc-icon-btn"
                    >
                      <PenLine className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSchedules((current) => current.filter((item) => item.id !== schedule.id))}
                      className="sc-icon-btn sc-icon-btn--danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="sc-ai-banner">
            <p className="sc-ai-text">
              <Sparkles className="size-4 text-emerald-500" />
              {t("schedule.aiOptimization", "Tối ưu hóa lịch trình dựa trên thông tin AI về khí hậu địa phương.")}
            </p>
            <button
              type="button"
              onClick={applySkipSuggestion}
              className="sc-ai-btn"
            >
              {t("schedule.applySuggestion", "Áp dụng gợi ý")}
            </button>
          </div>
        </section>

        {/* Right: Forecast + Advisory */}
        <section className="sc-right">
          <div className="sc-panel">
            <div className="sc-panel-header">
              <h2 className="sc-panel-title">{t("schedule.consumptionForecast", "Dự báo tiêu thụ")}</h2>
              <p className="sc-panel-subtitle">
                {t("schedule.consumptionDesc", "Lít nước mỗi giờ theo lịch hiện tại trong 7 ngày gần nhất.")}
              </p>
            </div>

            <div className="sc-bar-chart">
              {consumption.map((value, index) => {
                const isPeak = value === peakValue;
                return (
                  <div key={`${value}-${index}`} className="sc-bar-col">
                    <span className={`sc-bar-value ${isPeak ? "sc-bar-value--peak" : ""}`}>
                      {isPeak ? `${value}L` : ""}
                    </span>
                    <div
                      className={`sc-bar ${isPeak ? "sc-bar--peak" : ""}`}
                      style={{ height: `${peakValue > 0 ? Math.max(12, (value / peakValue) * 110) : 12}px` }}
                    />
                    <span className="sc-bar-label">{t(`schedule.days.${CHART_KEYS[index]}`, CHART_LABELS[index])}</span>
                  </div>
                );
              })}
            </div>

            <div className="sc-summary-row">
              <SummaryCard label={t("schedule.totalVolume", "Tổng thể tích")} value={`${totalConsumption}L`} tone="green" />
              <SummaryCard label={t("schedule.savings", "Tiết kiệm")} value={`${draft.projectedSavingsPercent}%`} tone="violet" />
            </div>
          </div>

          <div className="sc-advisory">
            <div className="sc-advisory-icon">
              <Sparkles className="size-5" />
            </div>
            <h3 className="sc-advisory-title">{t("schedule.moistureWarning", "Cảnh báo độ ẩm")}</h3>
            <p className="sc-advisory-text">{translateAdvisory(draft.advisory)}</p>
            <div className="sc-advisory-tag">
              {t("schedule.peakConsumption", "Đỉnh tiêu thụ tuần này: ")}{t(`schedule.days.${CHART_KEYS[peakIndex]}`, CHART_LABELS[peakIndex])}
            </div>
          </div>
        </section>
      </div>

      {scheduleModal ? (
        <ScheduleRuleModal
          mode={scheduleModal.mode}
          rule={scheduleModal.rule}
          zoneOptions={zoneOptions}
          onClose={() => setScheduleModal(null)}
          onSubmit={handleSubmitSchedule}
        />
      ) : null}

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

      {/* ===== Scoped Styles ===== */}
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-in-up {
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .sc-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: inherit;
        }

        /* ===== Header ===== */
        .sc-header {
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
          .sc-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .sc-header-left {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sc-badge-pill {
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
        .sc-title {
          font-size: 1.875rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .sc-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }
        .sc-header-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: stretch;
        }
        .sc-toggle-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 0.875rem 1.25rem;
        }
        .sc-toggle-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }
        .sc-toggle-status {
          margin-top: 0.125rem;
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
        }
        .sc-save-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 16px;
          background: #0b7a50;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.875rem 1.5rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(11, 122, 80, 0.22);
          transition: all 0.2s;
        }
        .sc-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(11,122,80,0.28); }
        .sc-save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ===== Grid ===== */
        .sc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 1280px) {
          .sc-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
        .sc-left, .sc-right {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ===== Section Header ===== */
        .sc-section-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .sc-section-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .sc-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          border-radius: 12px;
          background: #10b981;
          color: white;
          font-size: 0.8125rem;
          font-weight: 700;
          padding: 0.625rem 1.125rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(16,185,129,0.2);
          transition: all 0.2s;
        }
        .sc-add-btn:hover { transform: translateY(-1px); }

        /* ===== Schedule Card ===== */
        .sc-card {
          background: white;
          border-radius: 20px;
          border: 1.5px solid #e2e8f0;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }
        .sc-card:hover { border-color: #cbd5e1; box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
        .sc-card-body {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .sc-card-info { display: flex; align-items: flex-start; gap: 1rem; }
        .sc-card-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
        }
        .sc-card-title {
          font-size: 1rem;
          font-weight: 750;
          color: #0f172a;
          margin: 0;
        }
        .sc-card-zone {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0.125rem 0 0;
        }
        .sc-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.625rem;
        }
        .sc-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
        }
        .sc-day-pills { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.625rem; }
        .sc-day-pill {
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          font-size: 0.6875rem;
          font-weight: 700;
          background: #f1f5f9;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }
        .sc-day-pill--active {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }
        .sc-card-actions { display: flex; align-items: center; gap: 0.375rem; }
        .sc-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sc-icon-btn:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
        .sc-icon-btn--danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

        /* ===== AI Banner ===== */
        .sc-ai-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          border-radius: 16px;
          padding: 1rem 1.25rem;
        }
        .sc-ai-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: #475569;
          margin: 0;
        }
        .sc-ai-btn {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #10b981;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
        }
        .sc-ai-btn:hover { color: #059669; }

        /* ===== Right Panel ===== */
        .sc-panel {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .sc-panel-header { margin-bottom: 1.5rem; }
        .sc-panel-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .sc-panel-subtitle {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0.375rem 0 0;
        }

        /* ===== Bar Chart ===== */
        .sc-bar-chart { display: flex; align-items: flex-end; gap: 0.5rem; height: 200px; }
        .sc-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
        }
        .sc-bar-value {
          margin-bottom: 0.375rem;
          font-size: 0.6875rem;
          font-weight: 700;
          color: transparent;
        }
        .sc-bar-value--peak { color: #059669; }
        .sc-bar {
          width: 100%;
          border-radius: 10px 10px 0 0;
          background: #e2e8f0;
          transition: all 0.3s;
        }
        .sc-bar--peak { background: linear-gradient(180deg, #10b981, #059669); }
        .sc-bar-label {
          margin-top: 0.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        /* ===== Summary Row ===== */
        .sc-summary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }

        /* ===== Advisory Card ===== */
        .sc-advisory {
          background: linear-gradient(145deg, #ede9fe, #e0e7ff 60%, #dbeafe);
          border-radius: 24px;
          padding: 1.5rem;
          border: 1.5px solid rgba(139, 92, 246, 0.1);
        }
        .sc-advisory-icon {
          width: 44px; height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: white;
          color: #7c3aed;
          box-shadow: 0 2px 8px rgba(124,58,237,0.1);
        }
        .sc-advisory-title {
          margin: 1rem 0 0;
          font-size: 1.125rem;
          font-weight: 800;
          color: #3b0764;
          letter-spacing: -0.01em;
        }
        .sc-advisory-text {
          margin: 0.75rem 0 0;
          font-size: 0.875rem;
          line-height: 1.7;
          color: #5b21b6;
        }
        .sc-advisory-tag {
          margin-top: 1rem;
          background: rgba(255,255,255,0.7);
          border-radius: 12px;
          padding: 0.625rem 1rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #7c3aed;
        }
      `}</style>
    </div>
  );
}

function ScheduleRuleModal({
  mode,
  rule,
  zoneOptions,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  rule: ScheduleRule;
  zoneOptions: string[];
  onClose: () => void;
  onSubmit: (rule: ScheduleRule) => void;
}) {
  const { t } = useLanguage();
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const [form, setForm] = useState<ScheduleRule>(rule);
  const resolvedZoneOptions = Array.from(
    new Set([form.zone, ...zoneOptions].filter(Boolean)),
  );

  const updateField = <K extends keyof ScheduleRule>(
    key: K,
    value: ScheduleRule[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleDay = (dayIndex: number) => {
    setForm((current) => {
      const active = current.days.includes(dayIndex);
      return {
        ...current,
        days: active
          ? current.days.filter((value) => value !== dayIndex)
          : [...current.days, dayIndex].sort((left, right) => left - right),
      };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      ...form,
      title: form.title.trim() || t("schedule.modal.defaultTitle", "Chu kỳ tưới mới"),
      zone: form.zone || resolvedZoneOptions[0] || t("schedule.modal.defaultZone", "Khu canh tác"),
      durationMinutes: Math.max(5, Math.min(180, form.durationMinutes)),
      days: form.days.length > 0 ? form.days : [1],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-7 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              {mode === "create" ? t("schedule.modal.createNew", "Tạo mới") : t("schedule.modal.edit", "Chỉnh sửa")}
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              {mode === "create" ? t("schedule.modal.addTitle", "Thêm lịch tưới") : t("schedule.modal.updateTitle", "Cập nhật lịch tưới")}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {t("schedule.modal.areaHelp", "Khu vực được lấy theo tên thiết bị đã đăng ký.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="grid gap-5 px-7 py-6 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("schedule.modal.nameLabel", "Tên lịch")}</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={t("schedule.modal.namePlaceholder", "VD: Tưới sáng sớm")}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("schedule.modal.areaLabel", "Khu vực")}</span>
            <select
              value={form.zone}
              onChange={(event) => updateField("zone", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
            >
              {resolvedZoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("schedule.modal.startTimeLabel", "Giờ bắt đầu")}</span>
            <input
              type="time"
              value={form.time}
              onChange={(event) => updateField("time", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("schedule.modal.durationLabel", "Thời lượng (phút)")}</span>
            <input
              type="number"
              min={5}
              max={180}
              value={form.durationMinutes}
              onChange={(event) =>
                updateField("durationMinutes", Number(event.target.value) || 5)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("schedule.modal.typeLabel", "Loại lịch")}</span>
            <select
              value={form.icon}
              onChange={(event) =>
                updateField("icon", event.target.value as ScheduleRule["icon"])
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
            >
              <option value="sprout">{t("schedule.modal.typeSprout", "🌱  Tưới cây")}</option>
              <option value="waves">{t("schedule.modal.typeWaves", "💧  Tưới nước")}</option>
            </select>
          </label>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("schedule.modal.activateLabel", "Kích hoạt lịch")}</span>
              <p className="mt-0.5 text-xs text-slate-400">{t("schedule.modal.activateHelp", "Có hiệu lực khi ở chế độ tự động.")}</p>
            </div>
            <ToggleSwitch
              checked={form.enabled}
              onChange={(value) => updateField("enabled", value)}
            />
          </div>

          <div className="md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("schedule.modal.daysLabel", "Ngày tưới trong tuần")}</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {DAY_LABELS.map((day, index) => {
                const active = form.days.includes(index);
                return (
                  <button
                    key={`modal-${day}`}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition ${
                      active
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    {t(`schedule.days.${DAY_KEYS[index]}`, day)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-7 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            {t("schedule.modal.cancel", "Hủy bỏ")}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#0b7a50] px-7 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,122,80,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(11,122,80,0.28)]"
          >
            {mode === "create" ? t("schedule.modal.submitAdd", "✓  Thêm lịch") : t("schedule.modal.submitSave", "✓  Lưu thay đổi")}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#18241c]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-[1.1rem] border border-[#e4e9e5] bg-[#f5f7f6] px-4 py-3 outline-none transition focus:border-[#0b7a50] focus:bg-white"
      />
    </label>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "violet";
}) {
  return (
    <div
      className={`rounded-[1.4rem] px-4 py-4 ${
        tone === "green" ? "bg-[#eef7f1] text-[#0b7a50]" : "bg-[#f4efff] text-[#6c59c8]"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
        {label}
      </div>
      <div
        className="mt-2 text-3xl"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {value}
      </div>
    </div>
  );
}

function formatTime(time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")} ${suffix}`;
}
