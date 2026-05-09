"use client";

import { useEffect, useMemo, useState } from "react";
import {
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
} from "lucide-react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import {
  createEmptyScheduleRule,
  loadScheduleState,
  saveScheduleState,
} from "@/services/automation.service";
import type { ScheduleRule, ScheduleState } from "@/types/automation";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const CHART_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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
  const [draft, setDraft] = useState<ScheduleState | null>(null);
  const [saved, setSaved] = useState<ScheduleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loadScheduleState().then((result) => {
      if (!mounted) {
        return;
      }

      const normalized = {
        ...result,
        schedules: sortSchedules(result.schedules),
      };

      setDraft(normalized);
      setSaved(normalized);
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

  if (loading || !draft || !saved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[2rem] bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-[#5d6c63]">
          <Loader2 className="size-4 animate-spin" />
          Đang tải màn lịch trình...
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

  const handleSave = async () => {
    setSaving(true);
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
    setSaving(false);
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
    <div className="space-y-8 rounded-[2rem] bg-[#f7f9fb] p-4 shadow-[0_24px_60px_rgba(20,57,43,0.05)] sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p
            className="text-4xl italic text-[#0b7a50] md:text-5xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Quản lý lịch tưới
          </p>
          <h1
            className="mt-10 text-4xl text-[#1d2420] md:text-5xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Kiểm soát tưới tiêu
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.6rem] bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#33423a]">
                  Bật lịch tưới tự động
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#0b7a50]">
                  {draft.enabled ? "Hệ thống đang hoạt động" : "Tạm dừng"}
                </p>
              </div>
              <ToggleSwitch
                checked={draft.enabled}
                onChange={(value) => setDraft({ ...draft, enabled: value })}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center justify-center gap-2 rounded-[1.6rem] bg-[#0b7a50] px-5 py-5 font-semibold text-white shadow-[0_14px_28px_rgba(11,122,80,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Lưu lịch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="space-y-6 xl:col-span-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2
              className="text-3xl text-[#1d2420]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Chu kỳ sắp tới
            </h2>
            <button
              type="button"
              onClick={() => {
                const nextRule = createEmptyScheduleRule();
                updateSchedules((current) => [...current, nextRule]);
                setExpandedId(nextRule.id);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#18b973] px-5 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(24,185,115,0.22)] transition hover:translate-y-[-1px]"
            >
              <Plus className="size-4" />
              Thêm lịch mới
            </button>
          </div>

          {draft.schedules.map((schedule) => {
            const editing = expandedId === schedule.id;
            const Icon = schedule.icon === "sprout" ? Sprout : Waves;

            return (
              <article
                key={schedule.id}
                className="rounded-[2rem] bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-[#eef4f0] text-[#0b7a50]">
                      <Icon className="size-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-[#18241c]">
                        {schedule.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#66756b]">{schedule.zone}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#33423a]">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="size-4 text-[#516258]" />
                          {formatTime(schedule.time)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <TimerReset className="size-4 text-[#516258]" />
                          {schedule.durationMinutes} phút
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {DAY_LABELS.map((day, index) => (
                          <span
                            key={`${schedule.id}-${day}`}
                            className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                              schedule.days.includes(index)
                                ? "bg-[#ddf5e7] text-[#0b7a50]"
                                : "bg-[#eef2ef] text-[#91a097]"
                            }`}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                      onClick={() => setExpandedId(editing ? null : schedule.id)}
                      className="rounded-full p-3 text-[#33423a] transition hover:bg-[#eff4f1]"
                    >
                      <PenLine className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSchedules((current) => current.filter((item) => item.id !== schedule.id))}
                      className="rounded-full p-3 text-[#33423a] transition hover:bg-[#fff1f1] hover:text-[#dc2626]"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </div>

                {editing ? (
                  <div className="mt-6 grid gap-4 border-t border-[#eef2ef] pt-6 md:grid-cols-2">
                    <EditField
                      label="Tên lịch"
                      value={schedule.title}
                      onChange={(value) =>
                        updateSchedules((current) =>
                          current.map((item) =>
                            item.id === schedule.id ? { ...item, title: value } : item,
                          ),
                        )
                      }
                    />
                    <EditField
                      label="Khu vực"
                      value={schedule.zone}
                      onChange={(value) =>
                        updateSchedules((current) =>
                          current.map((item) =>
                            item.id === schedule.id ? { ...item, zone: value } : item,
                          ),
                        )
                      }
                    />
                    <label className="block">
                      <span className="text-sm font-semibold text-[#18241c]">Giờ bắt đầu</span>
                      <input
                        type="time"
                        value={schedule.time}
                        onChange={(event) =>
                          updateSchedules((current) =>
                            current.map((item) =>
                              item.id === schedule.id
                                ? { ...item, time: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="mt-2 w-full rounded-[1.1rem] border border-[#e4e9e5] bg-[#f5f7f6] px-4 py-3 outline-none transition focus:border-[#0b7a50] focus:bg-white"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-[#18241c]">Thời lượng (phút)</span>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={schedule.durationMinutes}
                        onChange={(event) =>
                          updateSchedules((current) =>
                            current.map((item) =>
                              item.id === schedule.id
                                ? {
                                    ...item,
                                    durationMinutes: Math.max(
                                      5,
                                      Math.min(180, Number(event.target.value) || 5),
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        className="mt-2 w-full rounded-[1.1rem] border border-[#e4e9e5] bg-[#f5f7f6] px-4 py-3 outline-none transition focus:border-[#0b7a50] focus:bg-white"
                      />
                    </label>
                    <div className="md:col-span-2">
                      <span className="text-sm font-semibold text-[#18241c]">Ngày tưới</span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {DAY_LABELS.map((day, index) => {
                          const active = schedule.days.includes(index);
                          return (
                            <button
                              key={`${schedule.id}-edit-${day}`}
                              type="button"
                              onClick={() =>
                                updateSchedules((current) =>
                                  current.map((item) => {
                                    if (item.id !== schedule.id) {
                                      return item;
                                    }

                                    return {
                                      ...item,
                                      days: active
                                        ? item.days.filter((value) => value !== index)
                                        : [...item.days, index].sort((left, right) => left - right),
                                    };
                                  }),
                                )
                              }
                              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                active
                                  ? "bg-[#18b973] text-white"
                                  : "bg-[#eef2ef] text-[#617168] hover:bg-[#dff0e8]"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}

          <div className="rounded-[2rem] border border-dashed border-[#d7ded9] bg-[#fbfcfb] px-6 py-6 text-[#55635a]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-base italic">
                Tối ưu hóa lịch trình dựa trên thông tin AI về khí hậu địa phương.
              </p>
              <button
                type="button"
                onClick={applySkipSuggestion}
                className="inline-flex items-center gap-2 font-semibold text-[#0b7a50]"
              >
                <Sparkles className="size-4" />
                Áp dụng bỏ qua gợi ý
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6 xl:col-span-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2
              className="text-3xl text-[#1d2420]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Dự báo tiêu thụ
            </h2>
            <p className="mt-2 text-sm text-[#66756b]">
              Lít nước mỗi giờ theo lịch hiện tại trong 7 ngày gần nhất.
            </p>

            <div className="mt-8 flex h-56 items-end gap-3">
              {consumption.map((value, index) => {
                const isPeak = value === peakValue;
                return (
                  <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center justify-end">
                    <span
                      className={`mb-2 text-xs font-semibold ${
                        isPeak ? "text-[#0b7a50]" : "text-[#94a29a]"
                      }`}
                    >
                      {isPeak ? `${value}L` : ""}
                    </span>
                    <div
                      className={`w-full rounded-t-2xl ${
                        isPeak ? "bg-[#1f8a5a]" : "bg-[#dde3df]"
                      }`}
                      style={{ height: `${Math.max(42, value * 2)}px` }}
                    />
                    <span className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c9a91]">
                      {CHART_LABELS[index]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <SummaryCard label="Tổng thể tích" value={`${totalConsumption}L`} tone="green" />
              <SummaryCard label="Tiết kiệm" value={`${draft.projectedSavingsPercent}%`} tone="violet" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#d9e6ff,#d7e5ff_60%,#cfe1ff)] p-6 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/80 text-[#5b45d0]">
              <Sparkles className="size-5" />
            </div>
            <h3
              className="mt-6 text-3xl text-[#35218d]"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Cảnh báo độ ẩm
            </h3>
            <p className="mt-4 text-base leading-7 text-[#514c84]">{draft.advisory}</p>
            <div className="mt-6 rounded-[1.3rem] bg-white/70 px-4 py-3 text-sm font-semibold text-[#5b45d0]">
              Đỉnh tiêu thụ tuần này: {CHART_LABELS[peakIndex]}
            </div>
          </div>
        </section>
      </div>
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
