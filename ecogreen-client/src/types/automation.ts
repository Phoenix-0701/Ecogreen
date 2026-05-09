export type ControlMode = "auto" | "manual";

export type AccessoryTone = "violet" | "emerald" | "blue";

export type AccessoryIcon =
  | "sun"
  | "mist"
  | "leaf"
  | "fan"
  | "droplet"
  | "thermo";

export interface TelemetrySnapshot {
  temp: number;
  humi: number;
  soil: number;
  light: number;
  updatedAt: string;
  source: "mock" | "socket";
}

export interface DeviceAccessory {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  tone: AccessoryTone;
  icon: AccessoryIcon;
}

export type PrimaryDeviceKind = "pump" | "fan";

export interface PrimaryDevice {
  id: string;
  kind: PrimaryDeviceKind;
  label: string;
  location: string;
  badge: string;
  statusLabel: string;
  running: boolean;
  runtimeLabel: string;
  powerWatts: number;
  flowRate?: number;
  speedPercent?: number;
  zone: string;
  automationHint: string;
}

export interface DeviceControlState {
  mode: ControlMode;
  zone: string;
  manualExpiresInMinutes: number;
  primaryDevices: PrimaryDevice[];
  accessories: DeviceAccessory[];
}

export interface ThresholdState {
  zone: string;
  dryThreshold: number;
  wetThreshold: number;
  maxPumpSeconds: number;
  cooldownHours: number;
  highTempC: number;
  soilBands: number[];
  recommendation: string;
}

export type SmartLogicDecision = "execute" | "skip";

export interface SmartLogicLog {
  id: string;
  time: string;
  message: string;
  level: "success" | "info" | "system";
}

export interface SmartLogicState {
  enabled: boolean;
  providerLabel: string;
  apiKey: string;
  city: string;
  rainThreshold: number;
  lastRainProbability: number;
  projectedSavingsPercent: number;
  decision: SmartLogicDecision;
  logs: SmartLogicLog[];
}

export interface ScheduleRule {
  id: string;
  title: string;
  zone: string;
  icon: "sprout" | "waves";
  time: string;
  durationMinutes: number;
  days: number[];
  enabled: boolean;
}

export interface ScheduleState {
  enabled: boolean;
  schedules: ScheduleRule[];
  dailyConsumptionLiters: number[];
  projectedSavingsPercent: number;
  advisory: string;
}
