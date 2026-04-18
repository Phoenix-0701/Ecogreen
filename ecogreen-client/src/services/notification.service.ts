import { fetcher } from "./api";
import { NotificationConfig, SaveNotificationPayload } from "@/types";

// Lấy cấu hình thông báo hiện tại
export const getNotificationConfig = (): Promise<NotificationConfig | null> => {
  return fetcher("/v1/notifications/config");
};

// Lưu / cập nhật cấu hình thông báo
export const saveNotificationConfig = (
  payload: SaveNotificationPayload
): Promise<NotificationConfig> => {
  return fetcher("/v1/notifications/config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

// Gửi thông báo test
export const testNotification = (
  channel: "telegram" | "email"
): Promise<{ success: boolean; message: string }> => {
  return fetcher("/v1/notifications/test", {
    method: "POST",
    body: JSON.stringify({ channel }),
  });
};
