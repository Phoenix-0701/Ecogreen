import { fetcher } from "./api";
import {
  Device,
  CreateDevicePayload,
  CreateComponentPayload,
} from "@/types";

type DeviceResponse = Device | { data: Device };

function unwrapDevice(response: DeviceResponse): Device {
  const device = "data" in response ? response.data : response;

  return {
    ...device,
    status: device.status ?? "offline",
    last_seen_at: device.last_seen_at ?? null,
    sensors: device.sensors ?? [],
    actuators: device.actuators ?? [],
  };
}

// Lấy danh sách tất cả thiết bị của user
export const getDevices = (): Promise<Device[]> => {
  return fetcher<DeviceResponse[]>("/v1/devices").then((devices) =>
    devices.map(unwrapDevice)
  );
};

// Tạo thiết bị mới
export const createDevice = (payload: CreateDevicePayload): Promise<Device> => {
  return fetcher<DeviceResponse>("/v1/devices", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(unwrapDevice);
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
