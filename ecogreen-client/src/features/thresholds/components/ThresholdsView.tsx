"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Droplets,
  Leaf,
  Loader2,
  Save,
  Thermometer,
  TimerReset,
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
    const result = await saveThresholdState(draft);
    setDraft(result);
    setSaved(result);
    setSaving(false);
  };

  const moistureNote =
    telemetry.soil < draft.dryThreshold
      ? "Độ ẩm đất đang thấp hơn ngưỡng khô, bơm nên được ưu tiên."
      : telemetry.soil > draft.wetThreshold
        ? "Độ ẩm đất đã vượt ngưỡng ướt, có thể tạm khóa chu kỳ bơm."
        : "Độ ẩm đang nằm trong dải an toàn, hệ thống có thể tiếp tục theo lịch.";

  return (
    <div className="space-y-8 rounded-[2rem] bg-[#f7f9fb] p-4 shadow-[0_24px_60px_rgba(20,57,43,0.05)] sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b7a50]">
            Kiểm soát môi trường
          </p>
          <h1
            className="mt-2 text-4xl text-[#1d2420] md:text-5xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Ngưỡng tưới & Logic
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDraft(saved)}
            className="rounded-full border border-[#d6ddd8] bg-white px-6 py-3 font-semibold text-[#445148] transition hover:bg-[#f2f5f3]"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#0b7a50] px-6 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(11,122,80,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm xl:col-span-7">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#dff2ea] text-[#0b7a50]">
              <Droplets className="size-6" />
            </div>
            <div>
              <h2
                className="text-3xl text-[#1d2420]"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                Logic độ ẩm đất
              </h2>
              <p className="mt-2 text-sm text-[#66756b]">
                Khu vực theo dõi: {draft.zone}. Giá trị cảm biến hiện tại đang ở mức{" "}
                <span className="font-semibold text-[#0b7a50]">{telemetry.soil}%</span>.
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
              onChange={(value) => setDraft({ ...draft, dryThreshold: Math.min(value, draft.wetThreshold - 1) })}
            />
            <RangeField
              label="Ngưỡng ướt (Tắt)"
              hint="Máy bơm dừng khi độ ẩm đất đạt tới mức bão hòa này"
              min={20}
              max={90}
              value={draft.wetThreshold}
              suffix="%"
              onChange={(value) => setDraft({ ...draft, wetThreshold: Math.max(value, draft.dryThreshold + 1) })}
            />
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm xl:col-span-5">
          <h3
            className="text-2xl text-[#1d2420]"
            style={{ fontFamily: "var(--font-fraunces)" }}
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
                  <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center justify-end">
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

        <section className="rounded-[2rem] bg-white p-6 shadow-sm xl:col-span-7">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#dff0fb] text-[#0e7490]">
              <TimerReset className="size-6" />
            </div>
            <div>
              <h2
                className="text-3xl text-[#1d2420]"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                Thông số thời gian & an toàn
              </h2>
              <p className="mt-2 text-sm text-[#66756b]">
                Đồng bộ ngưỡng bảo vệ bơm và chặn tưới khi nhiệt độ nhà kính vượt giới hạn.
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
              onChange={(value) => setDraft({ ...draft, maxPumpSeconds: value })}
            />
            <RangeField
              label="Thời gian nghỉ"
              hint="Độ trễ giữa hai phiên tưới"
              min={0.5}
              max={6}
              step={0.5}
              value={draft.cooldownHours}
              suffix="giờ"
              onChange={(value) => setDraft({ ...draft, cooldownHours: value })}
            />
          </div>

          <div className="mt-8 border-t border-[#edf1ee] pt-8">
            <RangeField
              label="Ngưỡng nhiệt độ cao"
              hint="Tạm ngắt tưới khi nhiệt độ môi trường vượt giá trị này"
              min={24}
              max={42}
              value={draft.highTempC}
              suffix="°C"
              onChange={(value) => setDraft({ ...draft, highTempC: value })}
            />
          </div>
        </section>

        <section className="space-y-6 xl:col-span-5">
          <div className="rounded-[2rem] border border-[#dcd6fb] bg-[#f3efff] p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-[#5b3ab4]">
              <Leaf className="size-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                Trí tuệ thực vật
              </span>
            </div>
            <p className="text-base leading-7 text-[#4b4d67]">{draft.recommendation}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <InsightCard label="Độ ẩm đất" value={`${telemetry.soil}%`} />
              <InsightCard label="Nhiệt độ" value={`${telemetry.temp.toFixed(1)}°C`} />
              <InsightCard label="Không khí" value={`${telemetry.humi}%`} />
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
                  <p className="mt-2 text-2xl font-semibold">{draft.dryThreshold}%</p>
                </div>
                <div className="rounded-[1rem] bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                    Mốc ngắt bơm
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{draft.wetThreshold}%</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-[1rem] bg-white/10 p-4">
                <Thermometer className="size-5 text-[#ffc6c6]" />
                <div>
                  <p className="text-sm font-semibold">Bảo vệ nhiệt độ</p>
                  <p className="text-sm text-white/70">
                    Tự ngắt tưới nếu vượt {draft.highTempC}°C để tránh sốc rễ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] bg-white/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[#7d8297]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#27263a]">{value}</p>
    </div>
  );
}
