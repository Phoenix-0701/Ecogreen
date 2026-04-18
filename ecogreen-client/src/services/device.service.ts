import { fetcher } from "./api";
import {
  Device,
  CreateDevicePayload,
  CreateComponentPayload,
} from "@/types";

// Lấy danh sách tất cả thiết bị của user
export const getDevices = (): Promise<Device[]> => {
  return fetcher("/v1/devices");
};

// Tạo thiết bị mới
export const createDevice = (payload: CreateDevicePayload): Promise<Device> => {
  return fetcher("/v1/devices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// Xóa thiết bị
export const deleteDevice = (deviceId: string): Promise<void> => {
  return fetcher(`/v1/devices/${deviceId}`, {
    method: "DELETE",
  });
};

// Thêm sensor / actuator vào thiết bị
export const addComponent = (
  deviceId: string,
  payload: CreateComponentPayload
): Promise<any> => {
  return fetcher(`/v1/devices/${deviceId}/components`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// Xóa sensor / actuator khỏi thiết bị
export const removeComponent = (
  deviceId: string,
  componentId: string,
  componentType: "sensor" | "actuator"
): Promise<void> => {
  return fetcher(
    `/v1/devices/${deviceId}/components/${componentId}?type=${componentType}`,
    { method: "DELETE" }
  );
};
