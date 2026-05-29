"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Leaf,
  Loader2,
  Save,
  SlidersHorizontal,
  Thermometer,
  TimerReset,
  X,
} from "lucide-react";
import { RangeField } from "@/components/ui/RangeField";
import {
  loadThresholdState,
  saveThresholdState,
} from "@/services/automation.service";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { ThresholdState } from "@/types/automation";

export function ThresholdsView() {
  const { telemetry } = useRealtimeTelemetry();
  const [draft, setDraft] = useState<ThresholdState | null>(null);
  const [saved, setSaved] = useState<ThresholdState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const showNotification = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
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

  useEffect(() => {
    let mounted = true;

    loadThresholdState().then((result) => {
      if (!mounted) {
        return;
      }

      setDraft(result);
      setSaved(result);
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
          Đang tải cấu hình ngưỡng tưới...
        </div>
      </div>
    );
  }

  const previewBands = [...draft.soilBands];
  previewBands[previewBands.length - 2] = telemetry.soil;

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveThresholdState(draft);
      setDraft(result);
      setSaved(result);
      showNotification(
        "success",
        "Lưu cấu hình thành công",
        "Ngưỡng tưới và thông số an toàn đã được cập nhật thành công.",
      );
    } catch (error) {
      console.error("Error saving thresholds:", error);
      showNotification(
        "error",
        "Lỗi lưu cấu hình",
        "Không thể kết nối với máy chủ để lưu cấu hình. Vui lòng thử lại sau.",
      );
    } finally {
      setSaving(false);
    }
  };

  const moistureNote =
    telemetry.soil < draft.dryThreshold
      ? "Độ ẩm đất đang thấp hơn ngưỡng khô, bơm nên được ưu tiên."
      : telemetry.soil > draft.wetThreshold
        ? "Độ ẩm đất đã vượt ngưỡng ướt, có thể tạm khóa chu kỳ bơm."
        : "Độ ẩm đang nằm trong dải an toàn, hệ thống có thể tiếp tục theo lịch.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section
        style={{
          background: "white",
          borderRadius: "24px",
          border: "1.5px solid #e2e8f0",
          padding: "1.75rem 2rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.25rem",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "100px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              border: "1px solid rgba(16,185,129,0.15)",
              background: "rgba(16,185,129,0.08)",
              color: "#10b981",
              width: "fit-content",
            }}
          >
            <SlidersHorizontal size={13} /> Kiểm soát môi trường
          </span>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 850,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Ngưỡng tưới & Logic
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
            Thiết lập ngưỡng độ ẩm đất và thông số an toàn cho hệ thống tưới tự
            động.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setDraft(saved)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "16px",
              border: "1.5px solid #e2e8f0",
              background: "white",
              color: "#475569",
              fontSize: "0.875rem",
              fontWeight: 700,
              padding: "0.75rem 1.25rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "16px",
              background: "#0b7a50",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 700,
              padding: "0.75rem 1.5rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(11,122,80,0.22)",
              transition: "all 0.2s",
              opacity: !dirty || saving ? 0.55 : 1,
            }}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section
          style={{
            background: "white",
            borderRadius: "24px",
            border: "1.5px solid #e2e8f0",
            padding: "1.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
          className="xl:col-span-7"
        >
          <div className="mb-8 flex items-start gap-4">
            <div
              style={{
                flexShrink: 0,
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                background: "rgba(16,185,129,0.08)",
                color: "#10b981",
              }}
            >
              <Droplets className="size-6" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                Logic độ ẩm đất
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  marginTop: "0.375rem",
                }}
              >
                Khu vực theo dõi: {draft.zone}. Giá trị cảm biến hiện tại đang ở
                mức{" "}
                <span style={{ fontWeight: 700, color: "#059669" }}>
                  {telemetry.soil.toFixed(0)}%
                </span>
                .
              </p>
            </div>
          </div>

          <div className="space-y-10">
            <RangeField
              label="Ngưỡng khô (Bật)"
              hint="Máy bơm bắt đầu khi độ ẩm giảm xuống dưới mức này"
              min={10}
              max={70}
              value={draft.dryThreshold}
              suffix="%"
              onChange={(value) => {
                const newDry = value;
                const newWet = newDry >= draft.wetThreshold ? newDry + 1 : draft.wetThreshold;
                setDraft({ ...draft, dryThreshold: newDry, wetThreshold: newWet });
              }}
            />
            <RangeField
              label="Ngưỡng ướt (Tắt)"
              hint="Máy bơm dừng khi độ ẩm đất đạt tới mức bão hòa này"
              min={20}
              max={90}
              value={draft.wetThreshold}
              suffix="%"
              onChange={(value) => {
                const newWet = value;
                const newDry = newWet <= draft.dryThreshold ? newWet - 1 : draft.dryThreshold;
                setDraft({ ...draft, wetThreshold: newWet, dryThreshold: newDry });
              }}
            />
          </div>
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "24px",
            border: "1.5px solid #e2e8f0",
            padding: "1.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
          className="xl:col-span-5"
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Xem trước ngưỡng trực quan
          </h3>
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#d9e2dc] bg-[#fbfcfb] p-5">
            <div className="mb-6 flex justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8b81]">
              <span>Ngưỡng khô {draft.dryThreshold}%</span>
              <span>Ngưỡng ướt {draft.wetThreshold}%</span>
            </div>
            <div className="flex h-56 items-end gap-2">
              {previewBands.map((value, index) => {
                const belowDry = value <= draft.dryThreshold;
                const aboveWet = value >= draft.wetThreshold;
                const isCurrent = index === previewBands.length - 2;

                return (
                  <div
                    key={`${value}-${index}`}
                    className="flex flex-1 flex-col items-center justify-end"
                  >
                    <div
                      className={`w-full rounded-t-2xl transition-all ${
                        belowDry
                          ? "bg-[#ef4444]/45"
                          : aboveWet
                            ? "bg-[#9dcfc0]"
                            : "bg-[#dfe4e1]"
                      } ${isCurrent ? "ring-2 ring-[#0b7a50]/40" : ""}`}
                      style={{ height: `${Math.max(36, value * 1.8)}px` }}
                    />
                    {isCurrent ? (
                      <span className="mt-2 rounded-full bg-[#0b7a50] px-2 py-1 text-[10px] font-bold text-white">
                        Hiện tại
                      </span>
                    ) : (
                      <span className="mt-2 text-[10px] text-[#98a59d]">•</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-5 text-sm italic text-[#66756b]">{moistureNote}</p>
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "24px",
            border: "1.5px solid #e2e8f0",
            padding: "1.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
          className="xl:col-span-7"
        >
          <div className="mb-8 flex items-start gap-4">
            <div
              style={{
                flexShrink: 0,
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                background: "rgba(14,116,144,0.08)",
                color: "#0e7490",
              }}
            >
              <TimerReset className="size-6" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                Thông số thời gian & an toàn
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  marginTop: "0.375rem",
                }}
              >
                Giới hạn thời gian mỗi phiên bơm và độ trễ giữa hai lần tưới.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <RangeField
              label="Thời gian bơm tối đa"
              hint="Giới hạn mỗi phiên bơm"
              min={15}
              max={120}
              step={5}
              value={draft.maxPumpSeconds}
              suffix="giây"
              onChange={(value) =>
                setDraft({ ...draft, maxPumpSeconds: value })
              }
            />
            <RangeField
              label="Thời gian nghỉ"
              hint="Độ trễ giữa hai phiên tưới"
              min={1}
              max={30}
              step={1}
              value={draft.cooldownMinutes}
              suffix="phút"
              onChange={(value) =>
                setDraft({ ...draft, cooldownMinutes: value })
              }
            />
          </div>
        </section>

        {/* Right column — must come before fan card so row-span-2 spans both rows */}
        <section className="space-y-6 xl:col-span-5 xl:row-span-2 xl:self-start">
          <div className="rounded-[2rem] border border-[#dcd6fb] bg-[#f3efff] p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-[#5b3ab4]">
              <Leaf className="size-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                Trí tuệ thực vật
              </span>
            </div>
            <p className="text-base leading-7 text-[#4b4d67]">
              {draft.recommendation}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <InsightCard
                label="Độ ẩm đất"
                value={`${telemetry.soil.toFixed(0)}%`}
              />
              <InsightCard
                label="Nhiệt độ"
                value={`${telemetry.temp.toFixed(1)}°C`}
              />
              <InsightCard
                label="Không khí"
                value={`${telemetry.humi.toFixed(0)}%`}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#214c38,#7db08f)] p-6 text-white shadow-sm">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              Mô phỏng khu trồng
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1rem] bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                    Mốc bật bơm
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {draft.dryThreshold}%
                  </p>
                </div>
                <div className="rounded-[1rem] bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                    Mốc ngắt bơm
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {draft.wetThreshold}%
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-[1rem] bg-white/10 p-4">
                <Thermometer className="size-5 text-[#ffc6c6]" />
                <div>
                  <p className="text-sm font-semibold">Điều hòa nhiệt độ</p>
                  <p className="text-sm text-white/70">
                    Tự động bật quạt khi {draft.highTempC}°C và ngắt khi{" "}
                    {draft.lowTempC}°C.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fan card — goes into row 3, col 1-7 thanks to right panel's row-span-2 */}
        <section
          style={{
            background: "white",
            borderRadius: "24px",
            border: "1.5px solid #e2e8f0",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
          className="xl:col-span-7 xl:self-start"
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              style={{
                flexShrink: 0,
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                background: "rgba(234,88,12,0.08)",
                color: "#ea580c",
              }}
            >
              <Thermometer className="size-4" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                Ngưỡng điều khiển quạt
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                Tự động bật/ngắt quạt theo nhiệt độ nhà kính.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RangeField
              label="Ngưỡng bật quạt"
              hint="Bật quạt khi nhiệt độ vượt mức này"
              min={24}
              max={42}
              value={draft.highTempC}
              suffix="°C"
              onChange={(value) => {
                const newHigh = value;
                const newLow = newHigh <= draft.lowTempC ? newHigh - 1 : draft.lowTempC;
                setDraft({ ...draft, highTempC: newHigh, lowTempC: newLow });
              }}
            />
            <RangeField
              label="Ngưỡng ngắt quạt"
              hint="Tắt quạt khi nhiệt độ xuống dưới mức"
              min={20}
              max={40}
              value={draft.lowTempC}
              suffix="°C"
              onChange={(value) => {
                const newLow = value;
                const newHigh = newLow >= draft.highTempC ? newLow + 1 : draft.highTempC;
                setDraft({ ...draft, lowTempC: newLow, highTempC: newHigh });
              }}
            />
          </div>
        </section>
      </div>

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

      {/* @ts-expect-error styled-jsx is not typed */}
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
      `}</style>
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-white/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[#7d8297]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#27263a]">{value}</p>
    </div>
  );
}
