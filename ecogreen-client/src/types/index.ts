// ===== USER =====
export interface User {
  User_ID: string;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url?: string;
}

// ===== DEVICE =====
export type DeviceStatus = "online" | "offline";

export interface Device {
  Device_ID: string;
  User_ID: string;
  name: string;
  mac_address: string;
  status: DeviceStatus;
  last_seen_at: string | null;
  created_at: string;
  sensors?: Sensor[];
  actuators?: Actuator[];
}

export interface Sensor {
  Sensor_ID: string;
  Device_ID: string;
  name: string;
  type: string;
  unit: string;
  pin_connection: number;
  created_at: string;
}

export interface Actuator {
  Actuator_ID: string;
  Device_ID: string;
  name: string;
  type: string;
  pin_connection: number;
  created_at: string;
}

export interface CreateDevicePayload {
  name: string;
  mac_address: string;
}

export interface CreateComponentPayload {
  name: string;
  type: string;
  pin_connection: number;
  unit?: string;           // required for sensor
  component_type: "sensor" | "actuator";
}

// ===== NOTIFICATION CONFIG =====
export interface NotificationConfig {
  Config_ID: string;
  User_ID: string;
  tg_chat_id: string | null;
  tg_bot_token_encrypted: string | null;
  smtp_email: string | null;
  smtp_password_encrypted: string | null;
  notify_on_error: boolean;
  notify_on_action: boolean;
}

export interface SaveNotificationPayload {
  tg_chat_id?: string;
  tg_bot_token?: string;
  smtp_email?: string;
  smtp_password?: string;
  notify_on_error: boolean;
  notify_on_action: boolean;
}

// ===== AUTH =====
export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  user: User;
}

export interface GoogleLoginPayload {
  credential: string; // Google ID token
}
