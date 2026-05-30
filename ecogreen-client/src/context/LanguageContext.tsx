"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "@/locales/en";

type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string, defaultText: string) => string;
  translateLog: (text: string) => string;
  tempUnit: "C" | "F";
  convertTemp: (celsius: number) => number;
  formatTemp: (celsius: number, decimals?: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("vi");
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: hydration-safe localStorage init after mount */
    // Read preference on client mount
    const savedLanguage = localStorage.getItem("pref_language") as Language;
    if (savedLanguage && (savedLanguage === "vi" || savedLanguage === "en")) {
      setLanguage(savedLanguage);
    }
    const savedUnit = localStorage.getItem("pref_temp_unit") as "C" | "F";
    if (savedUnit && (savedUnit === "C" || savedUnit === "F")) {
      setTempUnit(savedUnit);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const handlePrefChange = () => {
      const current = localStorage.getItem("pref_language") as Language;
      if (current && (current === "vi" || current === "en")) {
        setLanguage(current);
      }
      const currentUnit = localStorage.getItem("pref_temp_unit") as "C" | "F";
      if (currentUnit && (currentUnit === "C" || currentUnit === "F")) {
        setTempUnit(currentUnit);
      }
    };

    window.addEventListener("ecogreen_preferences_updated", handlePrefChange);
    return () => {
      window.removeEventListener("ecogreen_preferences_updated", handlePrefChange);
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("pref_language", lang);
    // Dispatch custom event to notify other non-context modules/listeners
    window.dispatchEvent(new Event("ecogreen_preferences_updated"));
  };

  const convertTemp = (celsius: number): number => {
    if (tempUnit === "F") {
      return celsius * 1.8 + 32;
    }
    return celsius;
  };

  const formatTemp = (celsius: number, decimals: number = 1): string => {
    const val = convertTemp(celsius);
    return `${val.toFixed(decimals)}°${tempUnit}`;
  };

  const t = (key: string, defaultText: string): string => {
    if (language === "vi") return defaultText;

    type LocaleNode = string | Record<string, unknown>;
    const parts = key.split(".");
    let current: LocaleNode = en as LocaleNode;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, LocaleNode>)[part];
      } else {
        return defaultText;
      }
    }

    return typeof current === "string" ? current : defaultText;
  };

  const translateLog = (text: string): string => {
    if (language === "vi" || !text) return text;

    const clean = text.trim();
    const lower = clean.toLowerCase();

    // ===== Event Types mapping =====
    if (clean === "CẢNH BÁO ĐẤT KHÔ") return "Dry Soil Warning";
    if (clean === "CẢNH BÁO NHIỆT ĐỘ") return "Temperature Warning";
    if (clean === "CẢNH BÁO ĐỘ ẨM") return "Humidity Warning";
    if (clean === "CẢNH BÁO") return "Warning";
    if (clean === "PUMP_START") return "Pump Started";
    if (clean === "PUMP_STOP") return "Pump Stopped";
    if (clean === "FAN_START") return "Fan Started";
    if (clean === "FAN_STOP") return "Fan Stopped";
    if (clean === "SCHEDULE_UPDATE") return "Schedule Updated";
    if (clean === "THRESHOLD_UPDATE") return "Thresholds Updated";
    if (clean === "WARNING") return "Warning";
    if (clean === "INFO") return "Info";
    if (clean === "SUCCESS") return "Success";

    // ===== Descriptions with regex =====
    if (lower.includes("độ ẩm đất hiện tại đang ở mức quá thấp")) {
      const match = clean.match(/(\d+)\s*%/);
      const val = match ? match[1] : "0";
      return `Current soil moisture is too low (${val}%), below the safe threshold!`;
    }
    if (lower.includes("nhiệt độ hiện tại đang ở mức quá cao")) {
      const match = clean.match(/([\d.]+)\s*°C/);
      const val = match ? parseFloat(match[1]) : 0;
      return `Current temperature is too high (${formatTemp(val, 1)}), exceeding the safe threshold!`;
    }
    if (lower.includes("độ ẩm không khí hiện tại đang ở mức quá thấp")) {
      const match = clean.match(/(\d+)\s*%/);
      const val = match ? match[1] : "0";
      return `Current air humidity is too low (${val}%), below the safe threshold!`;
    }

    // ===== BE auto-action logs: "Thiết bị tự ghi nhận: TẮT/BẬT ... từ Chế độ Tự động (ESP32)" =====
    // Pattern: "Thiết bị tự ghi nhận: TẮT Máy bơm nước từ Chế độ Tự động (ESP32)."
    if (lower.includes("thiết bị tự ghi nhận")) {
      // TẮT = OFF, BẬT = ON
      const isOff = lower.includes("tắt");
      const isOn = lower.includes("bật");
      const isPump = lower.includes("máy bơm") || lower.includes("bom");
      const isFan = lower.includes("quạt") || lower.includes("quat");
      const action = isOff ? "OFF" : isOn ? "ON" : "changed";
      const device = isPump ? "Water Pump" : isFan ? "Fan" : "Device";
      // Extract device name from parentheses if present e.g. (ESP32)
      const nameMatch = clean.match(/\(([^)]+)\)/);
      const deviceName = nameMatch ? ` (${nameMatch[1]})` : "";
      return `System auto-recorded: ${action} ${device} from Automatic mode${deviceName}.`;
    }

    // ===== User mode switch logs =====
    // Pattern: "vopham đã chuyển thiết bị sang chế độ Tự động (AUTO)."
    if (lower.includes("chuyển thiết bị sang chế độ")) {
      const isAuto = lower.includes("tự động") || lower.includes("auto");
      const mode = isAuto ? "Automatic (AUTO)" : "Manual (MANUAL)";
      // Extract username (everything before "đã chuyển")
      const nameMatch = clean.match(/^(.+?)\s+đã chuyển/i);
      const username = nameMatch ? nameMatch[1] : "User";
      return `${username} switched the device to ${mode} mode.`;
    }

    // ===== Generic manual actuator commands =====
    if (lower === "bật máy bơm nước") return "Turn on water pump";
    if (lower === "tắt máy bơm nước") return "Turn off water pump";
    if (lower === "bật quạt thông gió") return "Turn on ventilation fan";
    if (lower === "tắt quạt thông gió") return "Turn off ventilation fan";
    
    if (lower.includes("tự động bật máy bơm") || lower.includes("he thong tu dong bat may bom")) return "Automatically turn on pump";
    if (lower.includes("tự động tắt máy bơm") || lower.includes("he thong tu dong tat may bom")) return "Automatically turn off pump";
    if (lower.includes("tự động bật quạt") || lower.includes("he thong tu dong bat quat")) return "Automatically turn on fan";
    if (lower.includes("tự động tắt quạt") || lower.includes("he thong tu dong tat quat")) return "Automatically turn off fan";

    // ===== Schedule / Threshold update logs =====
    if (lower.includes("lịch tưới") && lower.includes("cập nhật")) return "Watering schedule updated.";
    if (lower.includes("ngưỡng") && lower.includes("cập nhật")) return "Threshold configuration updated.";

    return clean;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        translateLog,
        tempUnit,
        convertTemp,
        formatTemp,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
