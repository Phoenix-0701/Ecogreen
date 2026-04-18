"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Send,
  Mail,
  MessageCircle,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import {
  NotificationConfig,
  SaveNotificationPayload,
} from "@/types";
import {
  getNotificationConfig,
  saveNotificationConfig,
  testNotification,
} from "@/services/notification.service";

export function NotificationConfigView() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTg, setTestingTg] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [tgChatId, setTgChatId] = useState("");
  const [tgBotToken, setTgBotToken] = useState("");
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [notifyOnAction, setNotifyOnAction] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotificationConfig();
      if (data) {
        setConfig(data);
        setTgChatId(data.tg_chat_id || "");
        setTgBotToken(data.tg_bot_token_encrypted ? "••••••••" : "");
        setSmtpEmail(data.smtp_email || "");
        setSmtpPassword(data.smtp_password_encrypted ? "••••••••" : "");
        setNotifyOnError(data.notify_on_error);
        setNotifyOnAction(data.notify_on_action);
      }
    } catch (err) {
      console.error("Lỗi tải cấu hình thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload: SaveNotificationPayload = {
        notify_on_error: notifyOnError,
        notify_on_action: notifyOnAction,
      };

      // Chỉ gửi nếu user đã nhập mới (không phải ••••••••)
      if (tgChatId) payload.tg_chat_id = tgChatId;
      if (tgBotToken && tgBotToken !== "••••••••")
        payload.tg_bot_token = tgBotToken;
      if (smtpEmail) payload.smtp_email = smtpEmail;
      if (smtpPassword && smtpPassword !== "••••••••")
        payload.smtp_password = smtpPassword;

      const updated = await saveNotificationConfig(payload);
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Lỗi lưu cấu hình:", err);
      alert("Không thể lưu cấu hình thông báo!");
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTg(true);
    try {
      const result = await testNotification("telegram");
      alert(result.message || "Đã gửi tin nhắn test qua Telegram!");
    } catch (err: any) {
      alert(err.message || "Gửi test Telegram thất bại!");
    } finally {
      setTestingTg(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const result = await testNotification("email");
      alert(result.message || "Đã gửi email test!");
    } catch (err: any) {
      alert(err.message || "Gửi test Email thất bại!");
    } finally {
      setTestingEmail(false);
    }
  };

  const isTelegramConfigured = !!(config?.tg_chat_id && config?.tg_bot_token_encrypted);
  const isEmailConfigured = !!(config?.smtp_email && config?.smtp_password_encrypted);

  if (loading) {
    return (
      <div className="notif-loading">
        <Loader2 size={32} className="animate-spin text-green-500" />
        <p>Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div className="notif-view">
      {/* Header */}
      <div className="notif-header-card">
        <div className="notif-header-icon">
          <Bell size={24} />
        </div>
        <div>
          <h2 className="notif-header-title">Cấu hình thông báo</h2>
          <p className="notif-header-desc">
            Thiết lập kênh nhận cảnh báo qua Telegram hoặc Email khi hệ thống
            phát hiện sự cố hoặc thực hiện hành động tự động.
          </p>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="notif-channels">
        {/* Telegram Card */}
        <div className="notif-channel-card">
          <div className="notif-channel-header">
            <div className="notif-channel-icon notif-channel-icon--tg">
              <MessageCircle size={22} />
            </div>
            <div className="notif-channel-title-wrap">
              <h3>Telegram</h3>
              <span
                className={`notif-channel-status ${
                  isTelegramConfigured
                    ? "notif-channel-status--ok"
                    : "notif-channel-status--warn"
                }`}
              >
                {isTelegramConfigured ? (
                  <>
                    <CheckCircle2 size={12} /> Đã cấu hình
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} /> Chưa cấu hình
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="notif-channel-body">
            <div className="notif-field">
              <label htmlFor="tg-bot-token">Bot Token</label>
              <input
                id="tg-bot-token"
                type="password"
                placeholder="Nhập Bot Token từ @BotFather..."
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === "••••••••") {
                    setTgBotToken("");
                  }
                }}
              />
            </div>

            <div className="notif-field">
              <label htmlFor="tg-chat-id">Chat ID</label>
              <input
                id="tg-chat-id"
                type="text"
                placeholder="VD: 123456789"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
              />
            </div>

            <div className="notif-channel-hint">
              <Info size={14} />
              <span>
                Tạo bot qua{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @BotFather <ExternalLink size={10} />
                </a>{" "}
                và lấy Chat ID qua{" "}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @userinfobot <ExternalLink size={10} />
                </a>
              </span>
            </div>

            <button
              className="notif-test-btn"
              onClick={handleTestTelegram}
              disabled={testingTg || !tgChatId || !tgBotToken}
            >
              {testingTg ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Gửi tin nhắn test
            </button>
          </div>
        </div>

        {/* Email Card */}
        <div className="notif-channel-card">
          <div className="notif-channel-header">
            <div className="notif-channel-icon notif-channel-icon--email">
              <Mail size={22} />
            </div>
            <div className="notif-channel-title-wrap">
              <h3>Email (SMTP)</h3>
              <span
                className={`notif-channel-status ${
                  isEmailConfigured
                    ? "notif-channel-status--ok"
                    : "notif-channel-status--warn"
                }`}
              >
                {isEmailConfigured ? (
                  <>
                    <CheckCircle2 size={12} /> Đã cấu hình
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} /> Chưa cấu hình
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="notif-channel-body">
            <div className="notif-field">
              <label htmlFor="smtp-email">Địa chỉ Email</label>
              <input
                id="smtp-email"
                type="email"
                placeholder="VD: your.email@gmail.com"
                value={smtpEmail}
                onChange={(e) => setSmtpEmail(e.target.value)}
              />
            </div>

            <div className="notif-field">
              <label htmlFor="smtp-password">App Password</label>
              <input
                id="smtp-password"
                type="password"
                placeholder="Nhập App Password..."
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === "••••••••") {
                    setSmtpPassword("");
                  }
                }}
              />
            </div>

            <div className="notif-channel-hint">
              <Info size={14} />
              <span>
                Sử dụng{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  App Password <ExternalLink size={10} />
                </a>{" "}
                thay cho mật khẩu Gmail thông thường (cần bật 2FA trước).
              </span>
            </div>

            <button
              className="notif-test-btn"
              onClick={handleTestEmail}
              disabled={testingEmail || !smtpEmail || !smtpPassword}
            >
              {testingEmail ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Gửi email test
            </button>
          </div>
        </div>
      </div>

      {/* Notification Triggers */}
      <div className="notif-triggers-card">
        <h3 className="notif-triggers-title">
          <Zap size={18} /> Điều kiện gửi thông báo
        </h3>

        <div className="notif-triggers-list">
          <div className="notif-trigger-item">
            <div className="notif-trigger-info">
              <ShieldAlert size={18} className="text-red-500" />
              <div>
                <h4>Khi có lỗi / sự cố</h4>
                <p>Thông báo khi cảm biến mất kết nối, thiết bị offline, hoặc giá trị vượt ngưỡng.</p>
              </div>
            </div>
            <label className="notif-switch">
              <input
                type="checkbox"
                checked={notifyOnError}
                onChange={(e) => setNotifyOnError(e.target.checked)}
                id="notify-on-error-toggle"
              />
              <span className="notif-switch-slider" />
            </label>
          </div>

          <div className="notif-trigger-item">
            <div className="notif-trigger-info">
              <Zap size={18} className="text-amber-500" />
              <div>
                <h4>Khi thực hiện hành động tự động</h4>
                <p>Thông báo khi hệ thống tự bật/tắt máy bơm, quạt, hoặc thiết bị khác.</p>
              </div>
            </div>
            <label className="notif-switch">
              <input
                type="checkbox"
                checked={notifyOnAction}
                onChange={(e) => setNotifyOnAction(e.target.checked)}
                id="notify-on-action-toggle"
              />
              <span className="notif-switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="notif-save-bar">
        {saveSuccess && (
          <span className="notif-save-success">
            <CheckCircle2 size={16} /> Đã lưu thành công!
          </span>
        )}
        <button
          className="notif-save-btn"
          onClick={handleSave}
          disabled={saving}
          id="save-notification-config-btn"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Lưu cấu hình
        </button>
      </div>

      <style jsx>{`
        .notif-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 900px;
        }

        .notif-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          gap: 1rem;
          color: #9ca3af;
        }

        /* ===== Header Card ===== */
        .notif-header-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 16px;
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1px solid #dcfce7;
        }

        .notif-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .notif-header-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .notif-header-desc {
          font-size: 0.85rem;
          color: #6b7280;
          line-height: 1.5;
        }

        /* ===== Channel Cards ===== */
        .notif-channels {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .notif-channel-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #f0f0f0;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: all 0.2s;
        }

        .notif-channel-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .notif-channel-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1.25rem 1.25rem 0;
        }

        .notif-channel-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-channel-icon--tg {
          background: linear-gradient(135deg, #e0f2fe, #bae6fd);
          color: #0284c7;
        }

        .notif-channel-icon--email {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #d97706;
        }

        .notif-channel-title-wrap h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
        }

        .notif-channel-status {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
        }

        .notif-channel-status--ok {
          background: #dcfce7;
          color: #16a34a;
        }

        .notif-channel-status--warn {
          background: #fef3c7;
          color: #d97706;
        }

        .notif-channel-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notif-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .notif-field label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .notif-field input {
          padding: 0.65rem 0.875rem;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fafafa;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s;
        }

        .notif-field input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
          background: white;
        }

        .notif-channel-hint {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          background: #f8fafc;
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .notif-channel-hint a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }

        .notif-channel-hint a:hover {
          text-decoration: underline;
        }

        .notif-test-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.55rem 1rem;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notif-test-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .notif-test-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== Triggers Card ===== */
        .notif-triggers-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #f0f0f0;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .notif-triggers-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 1.25rem;
        }

        .notif-triggers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notif-trigger-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          background: #fafafa;
          border: 1px solid #f3f4f6;
        }

        .notif-trigger-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .notif-trigger-info h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 2px;
        }

        .notif-trigger-info p {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
        }

        /* ===== Toggle Switch ===== */
        .notif-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          flex-shrink: 0;
        }

        .notif-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .notif-switch-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #e5e7eb;
          border-radius: 100px;
          transition: 0.3s;
        }

        .notif-switch-slider::before {
          content: "";
          position: absolute;
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .notif-switch input:checked + .notif-switch-slider {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        .notif-switch input:checked + .notif-switch-slider::before {
          transform: translateX(22px);
        }

        /* ===== Save Bar ===== */
        .notif-save-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
        }

        .notif-save-success {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #16a34a;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .notif-save-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.75rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }

        .notif-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
        }

        .notif-save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ===== Responsive ===== */
        @media (max-width: 768px) {
          .notif-channels {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
