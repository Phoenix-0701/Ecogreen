"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  CloudRain,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  Slash,
} from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import {
  evaluateSmartLogic,
  loadSmartLogicState,
  saveSmartLogicState,
} from "@/services/automation.service";
import { useRealtimeTelemetry } from "@/features/shared/useRealtimeTelemetry";
import type { SmartLogicState } from "@/types/automation";
import { useLanguage } from "@/context/LanguageContext";

export function SmartLogicView() {
  const { t } = useLanguage();
  const { telemetry, connected } = useRealtimeTelemetry();
  const [draft, setDraft] = useState<SmartLogicState | null>(null);
  const [saved, setSaved] = useState<SmartLogicState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadSmartLogicState().then((result) => {
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
          {t('smartLogic.loading', 'Đang tải màn Smart Logic...')}
        </div>
      </div>
    );
  }

  const blockWeather = draft.decision === "skip";

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSmartLogicState(draft);
    setDraft(result);
    setSaved(result);
    setSaving(false);
  };

  const handleCheckWeather = async () => {
    setChecking(true);
    const result = await evaluateSmartLogic(draft, telemetry);
    setDraft(result);
    setChecking(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #e2e8f0', padding: '1.75rem 2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.08)', color: '#10b981', width: 'fit-content' }}>
            <BrainCircuit size={13} /> {t('smartLogic.badge', 'Tưới thông minh')}
          </span>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 850, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            {t('smartLogic.title', 'Smart Logic - Tưới thông minh')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            {t('smartLogic.subtitle', 'Cho phép AI đánh chặn lịch tưới khi dự báo thời tiết đủ điều kiện.')}
          </p>
        </div>

        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '0.875rem 1.25rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#10b981', margin: 0 }}>
            {t('smartLogic.systemStatus', 'Trạng thái hệ thống')}
          </p>
          <p style={{ marginTop: '0.125rem', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
            {draft.enabled ? t('smartLogic.optimizing', "Đang tối ưu") : t('smartLogic.paused', "Tạm dừng")}
            <span style={{ padding: '0 0.5rem', color: '#94a3b8' }}>•</span>
            {connected ? "Realtime online" : t('smartLogic.waitingData', "Đang chờ dữ liệu")}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }} className="xl:col-span-5">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
                {t('smartLogic.autonomousSystem', 'Hệ thống tự chủ')}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.375rem' }}>
                {t('smartLogic.autonomousDesc', 'Cho phép AI ghi đè lịch trình khi dự báo mưa đủ lớn.')}
              </p>
            </div>
            <ToggleSwitch
              checked={draft.enabled}
              onChange={(value) => setDraft({ ...draft, enabled: value })}
            />
          </div>

          <div className="space-y-5">
            <FormField
              label={`${t('smartLogic.apiKeyLabel', 'Khóa dự báo')} ${draft.providerLabel}`}
              value={draft.apiKey}
              onChange={(value) => setDraft({ ...draft, apiKey: value })}
              placeholder={t('smartLogic.apiKeyPlaceholder', 'Nhập khóa dự báo')}
              type="password"
            />
            <FormField
              label={t('smartLogic.cityLabel', 'Thành phố triển khai')}
              value={draft.city}
              onChange={(value) => setDraft({ ...draft, city: value })}
              placeholder={t('smartLogic.cityPlaceholder', 'Ví dụ: Ho Chi Minh City')}
            />

            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <label className="text-sm font-semibold text-[#1d2420]">
                    {t('smartLogic.rainThresholdLabel', 'Ngưỡng xác suất mưa')}
                  </label>
                  <p className="mt-1 text-sm text-[#66756b]">
                    {t('smartLogic.rainThresholdDesc', 'Trên mức này, hệ thống sẽ ưu tiên đánh chặn chu kỳ tưới.')}
                  </p>
                </div>
                <div
                  className="text-4xl text-[#0b7a50]"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {draft.rainThreshold}%
                </div>
              </div>
              <input
                type="range"
                min={20}
                max={95}
                value={draft.rainThreshold}
                onChange={(event) =>
                  setDraft({ ...draft, rainThreshold: Number(event.target.value) })
                }
                className="h-3 w-full cursor-pointer appearance-none rounded-full bg-[#e7ece9] accent-[#14b36d]"
              />
              <div className="mt-2 flex justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[#8c9a91]">
                <span>{t('smartLogic.alwaysWater', 'Luôn tưới')}</span>
                <span>{t('smartLogic.onlyDrought', 'Chỉ khi hạn hán')}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-[#0b7a50] px-5 py-4 font-semibold text-white shadow-[0_14px_28px_rgba(11,122,80,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t('smartLogic.applySettings', 'Áp dụng thiết lập')}
            </button>
            <button
              type="button"
              onClick={handleCheckWeather}
              disabled={checking}
              className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-[#d6ddd8] bg-white px-5 py-4 font-semibold text-[#0b7a50] transition hover:bg-[#f2f7f4]"
            >
              {checking ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {t('smartLogic.checkWeather', 'Kiểm tra thời tiết')}
            </button>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[#ddd7fb] bg-[#f4efff] p-5">
            <div className="mb-2 flex items-center gap-2 text-[#603cc8]">
              <Bot className="size-4" />
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                {t('smartLogic.efficiencyForecast', 'Dự báo hiệu quả')}
              </span>
            </div>
            <p className="text-base leading-7 text-[#484969]">
              {t('smartLogic.efficiency.prefix', 'Với ngưỡng mưa ')}{draft.rainThreshold}%{t('smartLogic.efficiency.soil', ' và độ ẩm đất hiện tại ')}{telemetry.soil.toFixed(0)}%,{t('smartLogic.efficiency.estimate', ' hệ thống đang ước tính có thể giảm khoảng ')}
              <span className="font-semibold text-[#3821a7]">
                {draft.projectedSavingsPercent}%
              </span>{" "}
              {t('smartLogic.efficiency.suffix', 'lượng nước lãng phí trong 72 giờ tới.')}
            </p>
          </div>
        </section>

        <section style={{ borderRadius: '24px', border: '1.5px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)' }} className="xl:col-span-7">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
                {t('smartLogic.interceptionFlow', 'Luồng đánh chặn')}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.375rem' }}>
                {t('smartLogic.interceptionDesc', 'Mô tả trực quan quyết định thời gian thực từ cảm biến và nguồn dự báo.')}
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c9a91]">
                {t('smartLogic.inputA1', 'Đầu vào A1')}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[#1d2420]">
                {t('smartLogic.soilText', 'Đất ')}{telemetry.soil.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
            <div className="rounded-[1.8rem] bg-[#0b7a50] p-8 text-white shadow-[0_16px_32px_rgba(11,122,80,0.22)]">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/12">
                <CloudRain className="size-7" />
              </div>
              <h3 style={{ marginTop: '2rem', textAlign: 'center', fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>
                {t('smartLogic.weatherInterception', 'Đánh chặn thời tiết')}
              </h3>
              <p className="mt-3 text-center text-sm leading-6 text-white/80">
                {t('smartLogic.monitoringCity', 'Thành phố đang theo dõi: ')}{draft.city}{t('smartLogic.rainProbText', '. Xác suất mưa gần nhất được ghi nhận là ')}
                <span className="font-semibold text-white">{draft.lastRainProbability}%</span>.
              </p>
            </div>

            <DecisionCard
              active={!blockWeather}
              title={t('smartLogic.decisionCard.title', 'Kết quả')}
              label={t('smartLogic.decisionCard.run', 'Thực hiện chu kỳ')}
              icon={<ShieldCheck className="size-6" />}
              tone="green"
            />
            <DecisionCard
              active={blockWeather}
              title={t('smartLogic.decisionCard.title', 'Kết quả')}
              label={t('smartLogic.decisionCard.wait', 'Chờ mưa')}
              icon={<Slash className="size-6" />}
              tone="gray"
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricTile label={t('smartLogic.metrics.rainProb', 'Xác suất mưa')} value={`${draft.lastRainProbability}%`} />
            <MetricTile label={t('smartLogic.metrics.blockThreshold', 'Ngưỡng chặn')} value={`${draft.rainThreshold}%`} />
            <MetricTile label={t('smartLogic.metrics.decision', 'Quyết định')} value={blockWeather ? t('smartLogic.metrics.skip', "Bỏ qua") : t('smartLogic.metrics.allow', "Cho tưới")} />
          </div>
        </section>

        <section style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }} className="xl:col-span-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
              {t('smartLogic.liveLog', 'Nhật ký thực thi trực tiếp')}
            </h2>
            <div className="rounded-full bg-[#eef7f1] px-4 py-2 text-sm font-semibold text-[#0b7a50]">
              {draft.enabled ? t('smartLogic.monitoring', "Đang giám sát") : t('smartLogic.disabled', "Đã tắt Smart Logic")}
            </div>
          </div>

          <div className="space-y-4">
            {draft.logs.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-[#eef2ef] px-4 py-4 sm:flex-row sm:items-center"
              >
                <div className="w-24 text-sm text-[#96a49b]">{entry.time}</div>
                <div
                  className={`size-2.5 rounded-full ${
                    entry.level === "success"
                      ? "bg-[#0b7a50]"
                      : entry.level === "info"
                        ? "bg-[#b7c4bc]"
                        : "bg-[#6c59c8]"
                  }`}
                />
                <p className="flex-1 text-sm text-[#33423a]">{entry.message}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    entry.level === "success"
                      ? "bg-[#eef7f1] text-[#0b7a50]"
                      : entry.level === "info"
                        ? "bg-[#f3f6f4] text-[#66756b]"
                        : "bg-[#f4efff] text-[#6c59c8]"
                  }`}
                >
                  {entry.level === "success"
                    ? t('smartLogic.levels.intercepted', "Đã ngăn chặn")
                    : entry.level === "info"
                      ? t('smartLogic.levels.stable', "Ổn định")
                      : t('smartLogic.levels.system', "Hệ thống")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DecisionCard({
  active,
  title,
  label,
  icon,
  tone,
}: {
  active: boolean;
  title: string;
  label: string;
  icon: ReactNode;
  tone: "green" | "gray";
}) {
  return (
    <div className="rounded-[1.8rem] bg-white p-6 shadow-sm">
      <div
        className={`mb-4 flex size-11 items-center justify-center rounded-full ${
          tone === "green" ? "bg-[#e7f7ef] text-[#0b7a50]" : "bg-[#eef2ef] text-[#7c8880]"
        }`}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#97a69e]">
        {title}
      </p>
      <p
        className={`mt-3 text-xl font-bold ${
          tone === "green" ? "text-[#0f172a]" : "text-[#64748b]"
        }`}
      >
        {label}
      </p>
      <div className="mt-6 h-1.5 rounded-full bg-[#edf1ee]">
        <div
          className={`h-full rounded-full ${
            active ? "w-3/4 bg-[#0b7a50]" : "w-1/3 bg-[#b6c2bb]"
          }`}
        />
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] bg-white px-4 py-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c9a91]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[#18241c]">{value}</div>
    </div>
  );
}
