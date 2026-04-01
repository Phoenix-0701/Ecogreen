#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h> // Thư viện MQTT

// Thông tin WiFi nhà bạn (Nhập tạm vào đây để test cho nhanh)
const char* ssid = "Tên_WiFi_Nha_Ban";
const char* password = "Mat_Khau_WiFi";

// Thông tin Trạm bưu điện (Khớp với NestJS)
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// Hàm kết nối WiFi
void setup_wifi() {
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi da ket noi!");
}

// Hàm kết nối MQTT
void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("Dang ket noi MQTT Broker...");
    // Tạo một cái tên ngẫu nhiên cho ESP32
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println(" Thanh cong!");
    } else {
      Serial.print(" That bai, ma loi=");
      Serial.print(client.state());
      Serial.println(" Thu lai sau 5 giay");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  
  // Cấu hình địa chỉ trạm bưu điện
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop(); // Lệnh bắt buộc để duy trì kết nối

  // Cứ 5 giây, gửi 1 bức thư lên NestJS
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    
    // Gửi dòng chữ này vào hòm thư "ecogreen/test"
    String tinNhan = "Xin chao NestJS! Toi la ESP32 day, nhiet do dang la 30 do C";
    client.publish("ecogreen/test", tinNhan.c_str());
    
    Serial.println("Da gui thu len mây: " + tinNhan);
  }
}