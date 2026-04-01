#include "wifi_greenhouse.h"
#include "iot_bridge.h"   // xWiFiEventGroup, WIFI_CONNECTED_BIT
#include "check_info.h"
#include <WiFiManager.h>   // WIFI_SSID, WIFI_PASS (đọc từ /info.dat trên LittleFS)
 
/* ============================================================
   wifi_greenhouse.cpp
   Quản lý toàn bộ kết nối WiFi cho hệ thống Greenhouse IoT.
 
   Gồm 2 phần:
     1. initWiFi()              — Gọi từ setup(), kết nối lần đầu
     2. greenhouse_wifi_task()  — FreeRTOS task Core 0, tự reconnect
============================================================ */

// ============================================================================
//KHỞI TẠO WIFI (gọi từ setup())
// ============================================================================
void initWiFi() {
    Serial.println("Đang kết nối WiFi...");
    
    // Khởi tạo WiFiManager
    WiFiManager wm;
    
    // Tự động kết nối WiFi cũ, nếu không có/đổi pass thì phát WiFi tên "EcoGreen_Setup"
    bool res = wm.autoConnect("EcoGreen_Setup"); 
    
    if(!res) {
        Serial.println("Không thể kết nối WiFi. Hãy khởi động lại mạch!");
        ESP.restart();
    } 
    else {
        Serial.println("Đã kết nối WiFi thành công!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    }
}

// ============================================================================
// WIFI MONITOR TASK (Core 0)
// ============================================================================
void greenhouse_wifi_task(void *pvParameters)
{
    Serial.println("[WiFi] Monitor task started");

    for (;;)
    {
        vTaskDelay(pdMS_TO_TICKS(10000));

        if (WIFI_SSID[0] == '\0') continue;

        if (WiFi.status() != WL_CONNECTED)
        {
            Serial.println("[WiFi] Disconnected! Reconnecting...");

            // Reset WiFi về AP+STA và bật lại AP trước
            // (AP có thể bị tắt khi mất kết nối trên một số firmware)
            WiFi.mode(WIFI_AP_STA);
            WiFi.softAP("Greenhouse-AP", "12345678");

            // Thử kết nối lại STA với cùng config cũ
            if (WIFI_PASS[0] == '\0') WiFi.begin(WIFI_SSID);
            else                      WiFi.begin(WIFI_SSID, WIFI_PASS);

            uint32_t t = millis();
            while (WiFi.status() != WL_CONNECTED && millis() - t < 15000)
                vTaskDelay(pdMS_TO_TICKS(500));

            if (WiFi.status() == WL_CONNECTED)
            {
                Serial.printf("[WiFi] Reconnected! IP: %s\n",
                              WiFi.localIP().toString().c_str());
                if (xWiFiEventGroup)
                    xEventGroupSetBits(xWiFiEventGroup, WIFI_CONNECTED_BIT);
            }
            else
            {
                Serial.println("[WiFi] Reconnect failed - retry in 10s");
            }
        }
    }
}