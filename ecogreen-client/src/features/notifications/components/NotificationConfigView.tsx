"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldAlert,
  ExternalLink,
  HelpCircle,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  Settings,
} from "lucide-react";
import { NotificationConfig, SaveNotificationPayload } from "@/types";
import {
  getNotificationConfig,
  saveNotificationConfig,
  testNotification,
} from "@/services/notification.service";
import { useLanguage } from "@/context/LanguageContext";

/* ── Brand SVGs ─────────────────────────────────────────────── */
const TelegramLogo = () => (
  <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <defs>
      <linearGradient id="tg-a" x1="120" y1="0" x2="120" y2="240" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2AABEE"/>
        <stop offset="1" stopColor="#229ED9"/>
      </linearGradient>
    </defs>
    <circle cx="120" cy="120" r="120" fill="url(#tg-a)"/>
    <path d="M54 116.5c36.3-15.8 60.6-26.2 72.6-31.3 34.6-14.4 41.8-16.9 46.5-17 1 0 3.3.3 4.8 1.4 1.2.9 1.6 2.2 1.8 3.1.1.9.4 3 .2 4.6-1.8 19-9.5 65.2-13.5 86.5-1.7 9-5 12-8.2 12.3-7 .6-12.3-4.6-19-9-10.6-6.9-16.5-11.2-26.8-17.9-11.8-7.8-4.2-12.1 2.6-19.1 1.8-1.9 33-30.2 33.6-32.8.1-.3.1-.7-.3-1-.4-.3-1-.2-1.4-.1-1.2.3-20.2 12.8-57.1 37.6-5.4 3.7-10.3 5.5-14.7 5.4-4.8-.1-14.1-2.7-21-5-8.4-2.8-15.1-4.3-14.5-9.1.3-2.5 3.8-5 10.4-7.6z" fill="#fff"/>
  </svg>
);

const GmailLogo = () => (
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <path d="M4.5 40h7V23.25L4 18v19.5A2.5 2.5 0 006.5 40z" fill="#4285F4"/>
    <path d="M36.5 40h7A2.5 2.5 0 0046 37.5V18l-9 5.25z" fill="#34A853"/>
    <path d="M36.5 10.5v12.75L46 18v-5a3.75 3.75 0 00-6-3z" fill="#FBBC04"/>
    <path d="M11.5 23.25V10.5l12.5 9 12.5-9v12.75L24 32.25z" fill="#EA4335"/>
    <path d="M2 13v5l9.5 5.25V10.5l-3.5-2.5A3.75 3.75 0 002 13z" fill="#C5221F"/>
  </svg>
);

/* ── Component ──────────────────────────────────────────────── */
export function NotificationConfigView() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTg, setTestingTg] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [showTgToken, setShowTgToken] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  const showToast = (type: "success" | "error", title: string, message: string) =>
    setToast({ type, title, message });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const [tgChatId, setTgChatId] = useState("");
  const [tgBotToken, setTgBotToken] = useState("");
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [notifyOnAction, setNotifyOnAction] = useState(false);
  const [notifyOnConfig, setNotifyOnConfig] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotificationConfig();
      if (data) {
        setConfig(data);
        setTgChatId(data.tg_chat_id || "");
        setTgBotToken(data.tg_bot_token_encrypted ? "••••••••••••" : "");
        setSmtpEmail(data.smtp_email || "");
        setSmtpPassword(data.smtp_password_encrypted ? "••••••••••••" : "");
        setNotifyOnError(data.notify_on_error);
        setNotifyOnAction(data.notify_on_action);
        setNotifyOnConfig(data.notify_on_config ?? false);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: SaveNotificationPayload = { notify_on_error: notifyOnError, notify_on_action: notifyOnAction, notify_on_config: notifyOnConfig };
      if (tgChatId) payload.tg_chat_id = tgChatId;
      if (tgBotToken && tgBotToken !== "••••••••••••") payload.tg_bot_token = tgBotToken;
      if (smtpEmail) payload.smtp_email = smtpEmail;
      if (smtpPassword && smtpPassword !== "••••••••••••") payload.smtp_password = smtpPassword;
      const updated = await saveNotificationConfig(payload);
      setConfig(updated);
      showToast("success", "Lưu thành công!", "Cấu hình thông báo đã được cập nhật và áp dụng.");
    } catch (err: unknown) {
      showToast("error", "Không thể lưu", err instanceof Error ? err.message : "Vui lòng kiểm tra kết nối và thử lại.");
    } finally { setSaving(false); }
  };

  const handleTestTelegram = async () => {
    setTestingTg(true);
    try {
      const r = await testNotification("telegram");
      showToast("success", "Gửi thành công!", r.message || "Tin nhắn test đã đến Telegram của bạn.");
    } catch (e: unknown) {
      showToast("error", "Gửi thất bại", e instanceof Error ? e.message : "Không gửi được. Kiểm tra lại Bot Token và Chat ID.");
    } finally { setTestingTg(false); }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const r = await testNotification("email");
      showToast("success", "Gửi thành công!", r.message || "Email test đã gửi thành công.");
    } catch (e: unknown) {
      showToast("error", "Gửi thất bại", e instanceof Error ? e.message : "Không gửi được. Kiểm tra lại địa chỉ và App Password.");
    } finally { setTestingEmail(false); }
  };

  const isTgOk = !!(config?.tg_chat_id && config?.tg_bot_token_encrypted);
  const isEmailOk = !!(config?.smtp_email && config?.smtp_password_encrypted);

  const errorEvents = [
    { icon: "🚨", label: "Vượt ngưỡng cảm biến", desc: "Nhiệt độ / độ ẩm / ánh sáng vượt mức Max — thiết bị tự bật" },
    { icon: "✅", label: "Trở về ngưỡng an toàn", desc: "Giá trị cảm biến xuống dưới Min — thiết bị tự tắt" },
  ];
  const actionEvents = [
    { icon: "💧", label: "Điều khiển máy bơm thủ công", desc: "Người dùng bật / tắt máy bơm từ giao diện" },
    { icon: "🌀", label: "Điều khiển quạt thủ công", desc: "Người dùng bật / tắt quạt từ giao diện" },
    { icon: "🤖", label: "Đổi chế độ Auto / Manual", desc: "Chuyển đổi giữa tự động và điều khiển thủ công" },
    { icon: "💦", label: "Lịch tưới bắt đầu / kết thúc", desc: "Thông báo khi chu kỳ tưới khởi động và hoàn thành" },
    { icon: "🌧️", label: "SmartLogic hoãn tưới vì mưa", desc: "Dự báo mưa → hệ thống tự bỏ qua lịch hôm đó" },
  ];
  const configEvents = [
    { icon: "⚙️", label: "Cập nhật ngưỡng cảnh báo", desc: "Lưu cấu hình ngưỡng mới cho cảm biến" },
    { icon: "📅", label: "Cập nhật lịch tưới", desc: "Thêm, sửa hoặc xóa chu kỳ tưới tự động" },
  ];

  if (loading) return (
    <div className="nc-loading">
      <div className="nc-loading-spinner" />
      <p>Đang tải cấu hình...</p>
    </div>
  );

  return (
    <div className="nc-root">

      {/* ─── Page Header ─── */}
      <div className="nc-page-header">
        <div className="nc-page-header-left">
          <div className="nc-page-header-icon"><Bell size={20} strokeWidth={2.2} /></div>
          <div>
            <h1 className="nc-page-title">Cấu hình thông báo</h1>
            <p className="nc-page-sub">Nhận cảnh báo tức thì qua Telegram hoặc Gmail khi vườn của bạn cần chú ý.</p>
          </div>
        </div>
        <button className="nc-save-btn" onClick={handleSave} disabled={saving} id="save-notification-config-btn">
          {saving ? <Loader2 size={15} className="nc-spin" /> : <Save size={15} />}
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>

      {/* ─── Main Grid ─── */}
      <div className="nc-grid">

        {/* ══ LEFT ══ */}
        <div className="nc-col">

          {/* ── Telegram Card ── */}
          <div className="nc-card">
            <div className="nc-card-header nc-card-header--tg">
              <div className="nc-brand-logo">
                <TelegramLogo />
              </div>
              <div className="nc-card-header-info">
                <div className="nc-card-header-top">
                  <h2>Telegram</h2>
                  <span className={`nc-chip ${isTgOk ? "nc-chip--ok" : "nc-chip--idle"}`}>
                    {isTgOk ? <><CheckCircle2 size={10} />Đã kết nối</> : <><div className="nc-dot" />Chưa cấu hình</>}
                  </span>
                </div>
                <p>Nhận cảnh báo tức thì qua bot Telegram riêng của bạn.</p>
              </div>
            </div>

            <div className="nc-card-body">
              <div className="nc-row-2">
                <div className="nc-field">
                  <label>Bot Token <span className="nc-required">*</span></label>
                  <div className="nc-input-group">
                    <input
                      type={showTgToken ? "text" : "password"}
                      placeholder="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
                      value={tgBotToken}
                      onChange={e => setTgBotToken(e.target.value)}
                      onFocus={e => { if (e.target.value === "••••••••••••") setTgBotToken(""); }}
                    />
                    <button type="button" className="nc-icon-btn" onClick={() => setShowTgToken(v => !v)}>
                      {showTgToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="nc-field">
                  <label>Chat ID <span className="nc-required">*</span></label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 123456789"
                    value={tgChatId}
                    onChange={e => setTgChatId(e.target.value)}
                  />
                </div>
              </div>

              <div className="nc-guide-inline">
                <div className="nc-guide-inline-step">
                  <span className="nc-step-num">1</span>
                  <span>Chat với <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather <ExternalLink size={10} /></a> → gửi <code>/newbot</code> → nhận <strong>Bot Token</strong></span>
                </div>
                <div className="nc-guide-inline-step">
                  <span className="nc-step-num">2</span>
                  <span>Nhắn bất kỳ tới <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer">@userinfobot <ExternalLink size={10} /></a> → nhận <strong>Chat ID</strong></span>
                </div>
                <div className="nc-guide-inline-step">
                  <span className="nc-step-num">3</span>
                  <span>Mở bot bạn tạo và nhấn <strong>/start</strong> để kích hoạt nhận tin</span>
                </div>
              </div>

              <button
                className="nc-action-btn nc-action-btn--tg"
                onClick={handleTestTelegram}
                disabled={testingTg || !tgChatId || !tgBotToken}
              >
                {testingTg ? <Loader2 size={14} className="nc-spin" /> : <Send size={14} />}
                {testingTg ? "Đang gửi..." : "Gửi tin nhắn test"}
              </button>
            </div>
          </div>

          {/* ── Gmail Card ── */}
          <div className="nc-card">
            <div className="nc-card-header nc-card-header--gmail">
              <div className="nc-brand-logo">
                <GmailLogo />
              </div>
              <div className="nc-card-header-info">
                <div className="nc-card-header-top">
                  <h2>Gmail</h2>
                  <span className={`nc-chip ${isEmailOk ? "nc-chip--ok" : "nc-chip--idle"}`}>
                    {isEmailOk ? <><CheckCircle2 size={10} />Đã kết nối</> : <><div className="nc-dot" />Chưa cấu hình</>}
                  </span>
                </div>
                <p>Gửi cảnh báo qua email bằng tính năng App Password của Google.</p>
              </div>
            </div>

            <div className="nc-card-body">
              <div className="nc-row-2">
                <div className="nc-field">
                  <label>Địa chỉ Gmail <span className="nc-required">*</span></label>
                  <input
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={smtpEmail}
                    onChange={e => setSmtpEmail(e.target.value)}
                  />
                </div>
                <div className="nc-field">
                  <label>App Password <span className="nc-required">*</span></label>
                  <div className="nc-input-group">
                    <input
                      type={showSmtpPass ? "text" : "password"}
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={smtpPassword}
                      onChange={e => setSmtpPassword(e.target.value)}
                      onFocus={e => { if (e.target.value === "••••••••••••") setSmtpPassword(""); }}
                    />
                    <button type="button" className="nc-icon-btn" onClick={() => setShowSmtpPass(v => !v)}>
                      {showSmtpPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="nc-guide-inline">
                <div className="nc-guide-inline-step">
                  <span className="nc-step-num">1</span>
                  <span>Vào <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">Bảo mật Google <ExternalLink size={10} /></a> → bật <strong>Xác minh 2 bước</strong></span>
                </div>
                <div className="nc-guide-inline-step">
                  <span className="nc-step-num">2</span>
                  <span>Truy cập <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">App Passwords <ExternalLink size={10} /></a> → tạo mới với tên <em>EcoGreen</em></span>
                </div>
                <div className="nc-guide-inline-step">
                  <span className="nc-step-num">3</span>
                  <span>Copy 16 ký tự hiển thị và dán vào ô <strong>App Password</strong> bên trên</span>
                </div>
              </div>

              <button
                className="nc-action-btn nc-action-btn--gmail"
                onClick={handleTestEmail}
                disabled={testingEmail || !smtpEmail || !smtpPassword}
              >
                {testingEmail ? <Loader2 size={14} className="nc-spin" /> : <Send size={14} />}
                {testingEmail ? "Đang gửi..." : "Gửi email test"}
              </button>
            </div>
          </div>

          {/* ── Trigger Switches ── */}
          <div className="nc-card">
            <div className="nc-card-header nc-card-header--plain">
              <div className="nc-brand-logo nc-brand-logo--plain">
                <Zap size={18} className="text-amber-500" />
              </div>
              <div className="nc-card-header-info">
                <div className="nc-card-header-top"><h2>Điều kiện gửi</h2></div>
                <p>Chọn loại sự kiện bạn muốn nhận thông báo.</p>
              </div>
            </div>
            <div className="nc-trigger-list">
              <div className="nc-trigger-item">
                <div className="nc-trigger-indicator nc-trigger-indicator--red" />
                <div className="nc-trigger-body">
                  <div className="nc-trigger-icon-wrap nc-trigger-icon-wrap--red">
                    <ShieldAlert size={15} />
                  </div>
                  <div className="nc-trigger-text">
                    <strong>Cảnh báo lỗi &amp; vượt ngưỡng</strong>
                    <span>Gửi khi cảm biến vượt Max và khi trở về trạng thái an toàn</span>
                  </div>
                </div>
                <label className="nc-switch">
                  <input type="checkbox" checked={notifyOnError} onChange={e => setNotifyOnError(e.target.checked)} id="notify-on-error-toggle" />
                  <span className="nc-switch-rail"><span className="nc-switch-thumb" /></span>
                </label>
              </div>

              <div className="nc-trigger-sep" />

              <div className="nc-trigger-item">
                <div className="nc-trigger-indicator nc-trigger-indicator--amber" />
                <div className="nc-trigger-body">
                  <div className="nc-trigger-icon-wrap nc-trigger-icon-wrap--amber">
                    <Zap size={15} />
                  </div>
                  <div className="nc-trigger-text">
                    <strong>Bơm/quạt bật tắt &amp; đổi chế độ</strong>
                    <span>Gửi khi bơm/quạt bật tắt, đổi Auto/Manual, lịch chạy</span>
                  </div>
                </div>
                <label className="nc-switch">
                  <input type="checkbox" checked={notifyOnAction} onChange={e => setNotifyOnAction(e.target.checked)} id="notify-on-action-toggle" />
                  <span className="nc-switch-rail"><span className="nc-switch-thumb" /></span>
                </label>
              </div>

              <div className="nc-trigger-sep" />

              <div className="nc-trigger-item">
                <div className="nc-trigger-indicator nc-trigger-indicator--blue" />
                <div className="nc-trigger-body">
                  <div className="nc-trigger-icon-wrap nc-trigger-icon-wrap--blue">
                    <Settings size={15} />
                  </div>
                  <div className="nc-trigger-text">
                    <strong>Cài đặt ngưỡng &amp; lịch</strong>
                    <span>Gửi khi lưu ngưỡng cảm biến hoặc cập nhật lịch tưới</span>
                  </div>
                </div>
                <label className="nc-switch">
                  <input type="checkbox" checked={notifyOnConfig} onChange={e => setNotifyOnConfig(e.target.checked)} id="notify-on-config-toggle" />
                  <span className="nc-switch-rail"><span className="nc-switch-thumb" /></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="nc-col">

          {/* ── Events Catalog ── */}
          <div className="nc-card">
            <div className="nc-card-header nc-card-header--plain">
              <div className="nc-brand-logo nc-brand-logo--plain">
                <Bell size={18} className="text-emerald-600" />
              </div>
              <div className="nc-card-header-info">
                <div className="nc-card-header-top"><h2>Sự kiện thông báo</h2></div>
                <p>Tất cả các sự kiện hệ thống sẽ gửi tin tức thì về thiết bị của bạn.</p>
              </div>
            </div>
            <div className="nc-events-wrap">

              {/* Error group */}
              <div className="nc-events-section">
                <div className="nc-events-group-label nc-events-group-label--red">
                  <ShieldAlert size={10} />
                  <span>Cảnh báo lỗi · Cần bật toggle đỏ</span>
                </div>
                {errorEvents.map(ev => (
                  <div className="nc-event-row" key={ev.label}>
                    <span className="nc-event-glyph">{ev.icon}</span>
                    <div className="nc-event-content">
                      <strong>{ev.label}</strong>
                      <span>{ev.desc}</span>
                    </div>
                    <ChevronRight size={13} className="nc-event-arrow" />
                  </div>
                ))}
              </div>

              <div className="nc-events-divider" />

              {/* Action group */}
              <div className="nc-events-section">
                <div className="nc-events-group-label nc-events-group-label--amber">
                  <Zap size={10} />
                  <span>Bơm/quạt &amp; chế độ · Cần bật toggle vàng</span>
                </div>
                {actionEvents.map(ev => (
                  <div className="nc-event-row" key={ev.label}>
                    <span className="nc-event-glyph">{ev.icon}</span>
                    <div className="nc-event-content">
                      <strong>{ev.label}</strong>
                      <span>{ev.desc}</span>
                    </div>
                    <ChevronRight size={13} className="nc-event-arrow" />
                  </div>
                ))}
              </div>

              <div className="nc-events-divider" />

              {/* Config group */}
              <div className="nc-events-section">
                <div className="nc-events-group-label nc-events-group-label--blue">
                  <Settings size={10} />
                  <span>Cài đặt ngưỡng &amp; lịch · Cần bật toggle xanh</span>
                </div>
                {configEvents.map(ev => (
                  <div className="nc-event-row" key={ev.label}>
                    <span className="nc-event-glyph">{ev.icon}</span>
                    <div className="nc-event-content">
                      <strong>{ev.label}</strong>
                      <span>{ev.desc}</span>
                    </div>
                    <ChevronRight size={13} className="nc-event-arrow" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Quick Tips ── */}
          <div className="nc-tips-card">
            <div className="nc-tips-header">
              <HelpCircle size={15} className="text-emerald-600" />
              <strong>Mẹo sử dụng</strong>
            </div>
            <div className="nc-tips-list">
              <div className="nc-tip"><span>💡</span><span>Bật cả 3 toggle để nhận đầy đủ thông báo.</span></div>
              <div className="nc-tip"><span>🔕</span><span>Hệ thống áp dụng <strong>cooldown 5 phút</strong> để tránh spam.</span></div>
              <div className="nc-tip"><span>🔒</span><span>Bot Token và App Password được <strong>mã hoá AES</strong> trước khi lưu.</span></div>
              <div className="nc-tip"><span>🌐</span><span>Cần kết nối Internet để bot gửi được tin nhắn Telegram.</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Toast ─── */}
      {toast && (
        <div className={`nc-toast ${toast.type === "success" ? "nc-toast--ok" : "nc-toast--err"}`}>
          <div className="nc-toast-ico">
            {toast.type === "success" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          </div>
          <div className="nc-toast-body">
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button className="nc-toast-x" onClick={() => setToast(null)}><X size={13} /></button>
        </div>
      )}

      {/* ─── Styles ─── */}
      <style jsx>{`
        /* ── Tokens ── */
        .nc-root {
          --tg: #229ED9;
          --tg-bg: #EFF8FD;
          --tg-border: #BAE6FD;
          --gmail-bg: #FEF2F2;
          --gmail-border: #FCA5A5;
          --ok: #059669;
          --ok-bg: #ECFDF5;
          --ok-border: #A7F3D0;
          --red: #DC2626;
          --red-bg: #FEF2F2;
          --red-border: #FECACA;
          --amber: #D97706;
          --amber-bg: #FFFBEB;
          --amber-border: #FDE68A;
          --border: #E2E8F0;
          --surface: #F8FAFC;
          --text: #0F172A;
          --muted: #64748B;
          --sm: 0.78rem;
          --xs: 0.71rem;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ── Page Header ── */
        .nc-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 20px;
          padding: 1.25rem 1.75rem;
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
        }

        .nc-page-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nc-page-header-icon {
          width: 44px; height: 44px; min-width: 44px;
          border-radius: 13px;
          background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
          border: 1.5px solid var(--ok-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--ok);
        }

        .nc-page-title {
          font-size: 1.2rem; font-weight: 800; color: var(--text); margin: 0 0 0.2rem 0;
        }

        .nc-page-sub {
          font-size: var(--xs); color: var(--muted); margin: 0; line-height: 1.5; max-width: 480px;
        }

        /* ── Save Button ── */
        .nc-save-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1.4rem;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white; border: none; border-radius: 11px;
          font-size: 0.85rem; font-weight: 700; cursor: pointer;
          box-shadow: 0 3px 12px rgba(16,185,129,0.35);
          transition: all 0.18s; white-space: nowrap;
        }
        .nc-save-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669, #047857);
          box-shadow: 0 5px 18px rgba(16,185,129,0.45);
          transform: translateY(-1px);
        }
        .nc-save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── Grid ── */
        .nc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 1024px) {
          .nc-grid { grid-template-columns: 1fr 1fr; align-items: start; }
        }
        .nc-col { display: flex; flex-direction: column; gap: 1.25rem; }

        /* ── Card ── */
        .nc-card {
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          overflow: hidden;
        }

        .nc-card-header {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.1rem 1.4rem;
          border-bottom: 1.5px solid var(--border);
        }

        .nc-card-header--tg { background: linear-gradient(135deg, var(--tg-bg), #F0F9FF); }
        .nc-card-header--gmail { background: linear-gradient(135deg, var(--gmail-bg), #FFF5F5); }
        .nc-card-header--plain { background: white; }

        .nc-brand-logo {
          width: 44px; height: 44px; min-width: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          background: white;
          box-shadow: 0 1px 6px rgba(0,0,0,0.1);
          border: 1px solid var(--border);
        }

        .nc-brand-logo--plain {
          background: var(--surface);
          box-shadow: none;
          border-color: var(--border);
        }

        .nc-card-header-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }

        .nc-card-header-top {
          display: flex; align-items: center; gap: 0.75rem;
        }

        .nc-card-header-top h2 {
          font-size: 0.95rem; font-weight: 800; color: var(--text); margin: 0;
        }

        .nc-card-header-info > p {
          font-size: var(--xs); color: var(--muted); margin: 0; line-height: 1.4;
        }

        /* ── Chip ── */
        .nc-chip {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.18rem 0.55rem; border-radius: 99px;
          font-size: 0.67rem; font-weight: 700; white-space: nowrap;
        }
        .nc-chip--ok { background: var(--ok-bg); color: var(--ok); border: 1px solid var(--ok-border); }
        .nc-chip--idle { background: #F1F5F9; color: #94A3B8; border: 1px solid #E2E8F0; }
        .nc-dot { width: 6px; height: 6px; border-radius: 50%; background: #94A3B8; }

        /* ── Card Body ── */
        .nc-card-body {
          padding: 1.25rem 1.4rem;
          display: flex; flex-direction: column; gap: 1rem;
        }

        /* ── Fields ── */
        .nc-row-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem;
        }
        @media (max-width: 600px) { .nc-row-2 { grid-template-columns: 1fr; } }

        .nc-field { display: flex; flex-direction: column; gap: 0.38rem; }

        .nc-field label {
          font-size: 0.76rem; font-weight: 700; color: #374151;
          display: flex; align-items: center; gap: 0.25rem;
        }
        .nc-required { color: #EF4444; }

        .nc-field input, .nc-input-group input {
          width: 100%;
          padding: 0.58rem 0.85rem;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: var(--sm);
          color: var(--text);
          background: var(--surface);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .nc-field input:focus, .nc-input-group input:focus {
          border-color: #10B981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
          background: white;
        }
        ::placeholder { color: #94A3B8; }

        .nc-input-group { position: relative; display: flex; align-items: center; }
        .nc-input-group input { padding-right: 2.4rem; }

        .nc-icon-btn {
          position: absolute; right: 0.6rem;
          background: none; border: none; cursor: pointer;
          color: #94A3B8; padding: 0.15rem;
          display: flex; align-items: center; transition: color 0.15s;
        }
        .nc-icon-btn:hover { color: #475569; }

        /* ── Inline Guide ── */
        .nc-guide-inline {
          display: flex; flex-direction: column; gap: 0.4rem;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 0.875rem 1rem;
        }

        .nc-guide-inline-step {
          display: flex; align-items: flex-start; gap: 0.65rem;
          font-size: var(--xs); color: var(--muted); line-height: 1.5;
        }

        .nc-step-num {
          min-width: 18px; height: 18px;
          background: #10B981; color: white;
          border-radius: 50%;
          font-size: 0.65rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 0.05rem;
        }

        .nc-guide-inline a {
          color: #059669; font-weight: 600; text-decoration: underline;
          display: inline-flex; align-items: center; gap: 0.2rem;
        }
        .nc-guide-inline a:hover { color: #047857; }

        .nc-guide-inline code {
          background: #E2E8F0; color: #1E293B;
          padding: 0.05rem 0.3rem; border-radius: 4px;
          font-family: monospace; font-size: 0.73rem;
        }

        /* ── Action Buttons ── */
        .nc-action-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1.25rem;
          border-radius: 10px; border: none; cursor: pointer;
          font-size: var(--sm); font-weight: 700;
          transition: all 0.18s; align-self: flex-start;
        }

        .nc-action-btn--tg {
          background: linear-gradient(135deg, #2AABEE, #229ED9);
          color: white;
          box-shadow: 0 3px 10px rgba(34,158,217,0.35);
        }
        .nc-action-btn--tg:hover:not(:disabled) {
          background: linear-gradient(135deg, #1E96D8, #1A8EC9);
          box-shadow: 0 5px 15px rgba(34,158,217,0.45);
          transform: translateY(-1px);
        }

        .nc-action-btn--gmail {
          background: linear-gradient(135deg, #EA4335, #C5221F);
          color: white;
          box-shadow: 0 3px 10px rgba(234,67,53,0.35);
        }
        .nc-action-btn--gmail:hover:not(:disabled) {
          background: linear-gradient(135deg, #D93025, #B31C12);
          box-shadow: 0 5px 15px rgba(234,67,53,0.45);
          transform: translateY(-1px);
        }

        .nc-action-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Trigger List ── */
        .nc-trigger-list { display: flex; flex-direction: column; }

        .nc-trigger-item {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.05rem 1.4rem;
          position: relative;
        }

        .nc-trigger-indicator {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 32px; border-radius: 0 4px 4px 0;
        }
        .nc-trigger-indicator--red { background: #EF4444; }
        .nc-trigger-indicator--amber { background: #F59E0B; }
        .nc-trigger-indicator--blue { background: #3B82F6; }

        .nc-trigger-body { display: flex; align-items: center; gap: 0.875rem; flex: 1; }

        .nc-trigger-icon-wrap {
          width: 36px; height: 36px; min-width: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .nc-trigger-icon-wrap--red { background: var(--red-bg); color: var(--red); border: 1.5px solid var(--red-border); }
        .nc-trigger-icon-wrap--amber { background: var(--amber-bg); color: var(--amber); border: 1.5px solid var(--amber-border); }
        .nc-trigger-icon-wrap--blue { background: #EFF6FF; color: #2563EB; border: 1.5px solid #BFDBFE; }

        .nc-trigger-text { display: flex; flex-direction: column; gap: 0.15rem; }
        .nc-trigger-text strong { font-size: var(--sm); font-weight: 700; color: var(--text); }
        .nc-trigger-text span { font-size: var(--xs); color: var(--muted); line-height: 1.4; }

        .nc-trigger-sep { height: 1px; background: var(--surface); margin: 0 1.4rem; }

        /* ── Switch ── */
        .nc-switch { position: relative; display: inline-flex; cursor: pointer; flex-shrink: 0; }
        .nc-switch input { position: absolute; opacity: 0; width: 0; height: 0; }

        .nc-switch-rail {
          width: 44px; height: 24px; border-radius: 99px;
          background: #CBD5E1;
          transition: background 0.22s;
          position: relative;
        }
        .nc-switch input:checked + .nc-switch-rail {
          background: linear-gradient(135deg, #10B981, #059669);
        }

        .nc-switch-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px; border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.22);
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .nc-switch input:checked ~ .nc-switch-rail .nc-switch-thumb {
          transform: translateX(20px);
        }

        /* ── Events Catalog ── */
        .nc-events-wrap { display: flex; flex-direction: column; }

        .nc-events-section { padding: 0.875rem 1.25rem; display: flex; flex-direction: column; gap: 0.45rem; }
        .nc-events-divider { height: 1px; background: var(--surface); }

        .nc-events-group-label {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.2rem 0.6rem; border-radius: 99px;
          font-size: 0.67rem; font-weight: 700; width: fit-content;
          letter-spacing: 0.02em; text-transform: uppercase; margin-bottom: 0.15rem;
        }
        .nc-events-group-label--red { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
        .nc-events-group-label--amber { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
        .nc-events-group-label--blue { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }

        .nc-event-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.55rem 0.75rem;
          border-radius: 10px; border: 1px solid #F1F5F9;
          background: var(--surface);
          cursor: default;
          transition: all 0.15s;
        }
        .nc-event-row:hover { background: white; border-color: var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

        .nc-event-glyph { font-size: 1rem; line-height: 1; flex-shrink: 0; }

        .nc-event-content { flex: 1; display: flex; flex-direction: column; gap: 0.08rem; }
        .nc-event-content strong { font-size: 0.78rem; font-weight: 700; color: var(--text); }
        .nc-event-content span { font-size: 0.7rem; color: var(--muted); line-height: 1.4; }

        .nc-event-arrow { color: #CBD5E1; flex-shrink: 0; }

        /* ── Tips Card ── */
        .nc-tips-card {
          background: linear-gradient(135deg, #F0FDF4, #ECFDF5);
          border: 1.5px solid var(--ok-border);
          border-radius: 16px;
          padding: 1.1rem 1.25rem;
          display: flex; flex-direction: column; gap: 0.75rem;
        }

        .nc-tips-header {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: var(--sm); font-weight: 800; color: #065F46;
        }

        .nc-tips-list { display: flex; flex-direction: column; gap: 0.45rem; }

        .nc-tip {
          display: flex; gap: 0.65rem;
          font-size: var(--xs); color: #166534; line-height: 1.5;
        }
        .nc-tip > span:first-child { flex-shrink: 0; }

        /* ── Toast ── */
        .nc-toast {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
          display: flex; align-items: flex-start; gap: 0.875rem;
          padding: 0.9rem 1.1rem;
          border-radius: 16px; max-width: 340px; width: max-content;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          background: white;
          animation: ncSlide 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .nc-toast--ok { border: 1.5px solid var(--ok-border); }
        .nc-toast--err { border: 1.5px solid var(--red-border); }

        .nc-toast-ico {
          width: 34px; height: 34px; min-width: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .nc-toast--ok .nc-toast-ico { background: var(--ok-bg); color: var(--ok); }
        .nc-toast--err .nc-toast-ico { background: var(--red-bg); color: var(--red); }

        .nc-toast-body { flex: 1; display: flex; flex-direction: column; gap: 0.12rem; }
        .nc-toast-body strong { font-size: var(--sm); font-weight: 800; color: var(--text); }
        .nc-toast-body p { font-size: var(--xs); color: var(--muted); margin: 0; line-height: 1.4; }

        .nc-toast-x {
          background: none; border: none; cursor: pointer; color: #94A3B8;
          padding: 0.2rem; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; transition: all 0.15s;
        }
        .nc-toast-x:hover { color: #475569; background: #F1F5F9; }

        @keyframes ncSlide {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Loading ── */
        .nc-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 5rem; gap: 1rem;
          color: #94A3B8; font-size: 0.875rem;
        }

        .nc-loading-spinner {
          width: 32px; height: 32px;
          border: 3px solid #E2E8F0; border-top-color: #10B981;
          border-radius: 50%;
          animation: ncSpin 0.7s linear infinite;
        }

        @keyframes ncSpin { to { transform: rotate(360deg); } }
        .nc-spin { animation: ncSpin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}
