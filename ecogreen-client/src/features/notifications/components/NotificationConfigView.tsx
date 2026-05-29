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
  HelpCircle,
  Leaf,
  X,
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
      showNotification(
        "success",
        "Lưu cấu hình thành công",
        "Thông số kênh thông báo và cảnh báo đã được lưu lại hệ thống."
      );
    } catch (err) {
      console.error("Lỗi lưu cấu hình:", err);
      showNotification(
        "error",
        "Lỗi lưu cấu hình",
        "Không thể lưu cấu hình thông báo. Vui lòng kiểm tra kết nối."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTg(true);
    try {
      const result = await testNotification("telegram");
      showNotification(
        "success",
        "Gửi thử nghiệm thành công",
        result.message || "Đã gửi tin nhắn kiểm tra qua Telegram."
      );
    } catch (err: unknown) {
      showNotification(
        "error",
        "Gửi thử nghiệm thất bại",
        err instanceof Error ? err.message : "Gửi thử nghiệm qua Telegram thất bại."
      );
    } finally {
      setTestingTg(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const result = await testNotification("email");
      showNotification(
        "success",
        "Gửi thử nghiệm thành công",
        result.message || "Đã gửi email kiểm tra đến hòm thư SMTP."
      );
    } catch (err: unknown) {
      showNotification(
        "error",
        "Gửi thử nghiệm thất bại",
        err instanceof Error ? err.message : "Gửi email thử nghiệm SMTP thất bại."
      );
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
          <span className="notif-badge-pill">
            <Bell size={11} /> Cấu hình hệ thống
          </span>
          <h2 className="notif-header-title">Cấu hình thông báo</h2>
          <p className="notif-header-desc">
            Thiết lập kênh nhận cảnh báo qua Telegram hoặc Email khi hệ thống
            phát hiện sự cố hoặc thực hiện hành động tự động.
          </p>
        </div>
      </div>

      <div className="notif-grid">
        {/* Left Column: Form Config */}
        <div className="notif-config-form">
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
        </div>

        {/* Right Column: Guide Panel */}
        <aside className="notif-guide-panel">
          <div className="notif-guide-header">
            <HelpCircle size={20} className="text-emerald-600" />
            <h3>Hướng dẫn liên kết</h3>
          </div>

          <div className="notif-guide-section">
            <div className="notif-guide-section-title">
              <MessageCircle size={16} className="text-sky-500" />
              <h4>Cấu hình Telegram Bot</h4>
            </div>
            <ol className="notif-guide-steps">
              <li>
                <strong>Bước 1:</strong> Chat với <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a>, gửi lệnh <code>/newbot</code> để tạo và nhận <strong>Bot Token</strong>.
              </li>
              <li>
                <strong>Bước 2:</strong> Nhấp vào link bot vừa tạo và nhấn <strong>Bắt đầu (/start)</strong> để kích hoạt.
              </li>
              <li>
                <strong>Bước 3:</strong> Chat hoặc chuyển tiếp tin nhắn bất kỳ tới <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer">@userinfobot</a> để nhận <strong>Chat ID</strong> của bạn.
              </li>
              <li>
                <strong>Bước 4:</strong> Điền thông tin vào form và nhấn <strong>Gửi tin nhắn test</strong> để kiểm tra.
              </li>
            </ol>
          </div>

          <div className="notif-guide-section">
            <div className="notif-guide-section-title">
              <Mail size={16} className="text-amber-500" />
              <h4>Cấu hình Email (SMTP)</h4>
            </div>
            <ol className="notif-guide-steps">
              <li>
                <strong>Bước 1:</strong> Truy cập tài khoản Google của bạn, đảm bảo đã bật <strong>Xác minh 2 bước</strong>.
              </li>
              <li>
                <strong>Bước 2:</strong> Truy cập trang <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">Mật khẩu ứng dụng</a>.
              </li>
              <li>
                <strong>Bước 3:</strong> Tạo một mật khẩu ứng dụng mới với tên gợi nhớ (VD: <em>EcoGreen App</em>).
              </li>
              <li>
                <strong>Bước 4:</strong> Copy mật khẩu 16 chữ số được tạo và dán vào ô <strong>App Password</strong> bên trái.
              </li>
            </ol>
          </div>

          {/* Visual Alert Flow Diagram */}
          <div className="notif-guide-visual">
            <h5>Quy trình gửi cảnh báo</h5>
            <div className="notif-flow-diagram">
              <div className="notif-flow-node notif-flow-node--sensor">
                <Leaf size={14} />
                <span>Cảnh báo lỗi</span>
              </div>
              <span className="notif-flow-arrow">➔</span>
              <div className="notif-flow-node notif-flow-node--engine">
                <Zap size={14} />
                <span>Xử lý & Lọc</span>
              </div>
              <span className="notif-flow-arrow">➔</span>
              <div className="notif-flow-node notif-flow-node--channel">
                <Bell size={14} />
                <span>Telegram / Email</span>
              </div>
            </div>
          </div>
        </aside>
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

      <style jsx>{`
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

         .notif-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        /* ===== Grid Layout ===== */
        .notif-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .notif-grid {
            grid-template-columns: 1.4fr 1fr;
            align-items: start;
          }
        }

        .notif-config-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ===== Guide Panel ===== */
        .notif-guide-panel {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .notif-guide-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 0.75rem;
        }

        .notif-guide-header h3 {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
        }

        .notif-guide-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notif-guide-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .notif-guide-section-title h4 {
          font-size: 0.95rem;
          font-weight: 750;
          color: #0f172a;
        }

        .notif-guide-steps {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .notif-guide-steps li {
          font-size: 0.8rem;
          color: #475569;
          line-height: 1.5;
          position: relative;
          padding-left: 0.25rem;
        }

        .notif-guide-steps a {
          color: #10b981;
          font-weight: 600;
          text-decoration: underline;
        }

        .notif-guide-steps a:hover {
          color: #059669;
        }

        .notif-guide-steps code {
          background: #f1f5f9;
          color: #0f172a;
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.75rem;
        }

        /* ===== Visual Flow Diagram ===== */
        .notif-guide-visual {
          background: #f8fafc;
          border-radius: 16px;
          padding: 1rem;
          border: 1px dashed #e2e8f0;
        }

        .notif-guide-visual h5 {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .notif-flow-diagram {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .notif-flow-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.6rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
          flex: 1;
          min-width: 0;
          text-align: center;
        }

        .notif-flow-node span {
          font-size: 0.65rem;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .notif-flow-node--sensor {
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .notif-flow-node--sensor :global(svg) {
          color: #ef4444;
        }

        .notif-flow-node--engine {
          border-color: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .notif-flow-node--engine :global(svg) {
          color: #f59e0b;
        }

        .notif-flow-node--channel {
          border-color: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .notif-flow-node--channel :global(svg) {
          color: #10b981;
        }

        .notif-flow-arrow {
          color: #cbd5e1;
          font-weight: bold;
          font-size: 0.875rem;
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
          padding: 1.75rem 2rem;
          border-radius: 24px;
          background: white;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .notif-badge-pill {
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

        .notif-header-icon {
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

        .notif-header-title {
          font-size: 1.875rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .notif-header-desc {
          font-size: 0.8125rem;
          color: #64748b;
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
          border-radius: 20px;
          border: 1.5px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }

        .notif-channel-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
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
          font-weight: 750;
          color: #0f172a;
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
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .notif-field input {
          padding: 0.65rem 0.875rem;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #0f172a;
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
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .notif-triggers-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
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
