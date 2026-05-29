# HƯỚNG DẪN CHẠY DỰ ÁN ECOGREEN (ĐẦY ĐỦ)

## KIẾN TRÚC HỆ THỐNG

```
ESP32 ──> broker.emqx.io (internet) ──> NestJS Backend (Port 3001)
                                              │
                                         WebSocket
                                              │
                                       Next.js Frontend (Port 3000)
```

* **ESP32 không kết nối thẳng đến máy tính** — đi qua broker MQTT công cộng (`broker.emqx.io`).
* **ESP32 chỉ cần có internet** là có thể gửi dữ liệu telemetry.
* **Trình duyệt (Browser) và máy chạy Backend** phải cùng kết nối mạng LAN để truy cập được dashboard.

---

## ⚡ PHƯƠNG ÁN 1: KHỞI CHẠY TỰ ĐỘNG BẰNG SCRIPT (KHUYÊN DÙNG)

Dự án đã tích hợp sẵn script PowerShell để tự động hóa toàn bộ: dò IP mạng LAN, tạo file cấu hình môi trường, khởi chạy Docker, cài đặt dependencies, migrate cơ sở dữ liệu và khởi động các ứng dụng.

### Lệnh chạy duy nhất:
Mở PowerShell tại thư mục gốc của dự án (`Ecogreen`) và chạy:
```powershell
.\start.ps1
```

### Các bước tự động thực hiện:
1. **Docker**: Khởi động database PostgreSQL (`localhost:5433`) và local MQTT broker (`localhost:1883`).
2. **Cài đặt thư viện**: Tự động chạy `npm install` cho cả backend và frontend.
3. **Cấu hình IP LAN**: Tự động dò IP WiFi/LAN hiện tại của máy tính, tự động tạo/cập nhật `.env` (backend), `.env.local` (frontend) và `next.config.ts`.
4. **Prisma Migrate**: Đồng bộ cấu trúc bảng và migrate cơ sở dữ liệu.
5. **Khởi chạy ứng dụng**: Tự động mở 2 cửa sổ terminal mới chạy NestJS Backend và Next.js Frontend.

> 💡 **Mỗi khi đổi mạng WiFi hoặc IP thay đổi:** Bạn chỉ cần tắt các terminal cũ đi và chạy lại `.\start.ps1` (hoặc chạy lẻ `.\update-ip.ps1`) để tự động cập nhật IP mới mà không cần chỉnh sửa tay.

---

## 🛠️ PHƯƠNG ÁN 2: KHỞI CHẠY THỦ CÔNG (TỪNG BƯỚC)

Nếu muốn tự chạy từng bước thủ công, bạn thực hiện theo quy trình sau:

### BƯỚC 0 — Tạo cấu hình môi trường (Chỉ làm lần đầu)

1. Tạo file `.env` trong thư mục `ecogreen-server/`:
   ```env
   PORT=3001
   HOST=0.0.0.0
   DATABASE_URL="postgresql://admin:admin123@localhost:5433/ecogreendb"
   ```

2. Tạo file `.env.local` trong thư mục `ecogreen-client/`:
   ```env
   # Có thể dùng NEXT_PUBLIC_API_URL hoặc NEXT_PUBLIC_BACKEND_URL (Khuyên dùng NEXT_PUBLIC_API_URL để đồng bộ với script update-ip)
   NEXT_PUBLIC_API_URL=http://<IP_MÁY_TÍNH>:3001
   ```

---

### BƯỚC 0.5 — Khi đổi mạng WiFi (Đổi IP)
> Thực hiện mỗi khi bạn đổi mạng hoặc IP máy tính thay đổi.

1. **Tìm IP mới:**
   Mở terminal chạy lệnh:
   ```bash
   ipconfig
   ```
   Tìm dòng **IPv4 Address** của card mạng đang kết nối WiFi (ví dụ: `192.168.1.18`).

2. **Cập nhật `.env.local` trong `ecogreen-client/`:**
   ```env
   NEXT_PUBLIC_API_URL=http://<IP_MỚI>:3001
   ```

3. **Cập nhật `next.config.ts` trong `ecogreen-client/`:**
   Thêm hoặc cập nhật IP mới vào mục `allowedDevOrigins` để Next.js cho phép truy cập qua mạng LAN:
   ```typescript
   allowedDevOrigins: ['<IP_MỚI>'],
   ```

4. **Restart frontend:**
   ```bash
   npm run dev
   ```

> ⚠️ **Backend và ESP32 không cần sửa gì khi đổi mạng.** ESP32 kết nối đến broker công cộng (`broker.emqx.io`), hoàn toàn độc lập với IP LAN của máy tính.

---

### BƯỚC 1 — Khởi động Docker (PostgreSQL + MQTT)
```bash
cd ecogreen-server
docker compose up -d
```
*Kiểm tra trạng thái bằng lệnh `docker ps`. Cả hai container `ecogreen-postgres` và `ecogreen-mqtt` phải có trạng thái **Up**.*

---

### BƯỚC 2 — Setup CSDL & Prisma (Chỉ làm lần đầu)
```bash
cd ecogreen-server
npm install
npx prisma generate
npx prisma migrate deploy
```

---

### BƯỚC 3 — Chạy Backend (NestJS)
```bash
cd ecogreen-server
npm run start:dev
```
*Đảm bảo log terminal in ra thông báo đã khởi tạo microservice, HTTP server và kết nối thành công tới Database qua Prisma.*

---

### BƯỚC 4 — Chạy Frontend (Next.js)
Mở cửa sổ terminal mới:
```bash
cd ecogreen-client
npm install
npm run dev
```
Truy cập qua trình duyệt:
* **Tại máy chạy backend:** `http://localhost:3000`
* **Tại các thiết bị khác trong mạng LAN:** `http://<IP_MÁY_TÍNH>:3000`

---

### BƯỚC 5 — Flash ESP32 & Kiểm tra kết nối

1. Mở thư mục `ecogreen-iot/` bằng VSCode (yêu cầu đã cài đặt extension **PlatformIO**).
2. Kết nối board ESP32 vào máy tính và nhấn **Upload** để nạp firmware.
3. Mở **Serial Monitor** để kiểm tra log:
   ```text
   [WiFi] Connected! IP: 192.168.1.x
   [MQTT] Connecting to CoreIoT... OK
   [MQTT-LOCAL] Connecting to Mosquitto... OK
   [MQTT] Published: T=... H=... Soil=... Light=...
   [MQTT-LOCAL] connected=1
   ```

---

### BƯỚC 6 — Kiểm tra luồng dữ liệu MQTT

1. Kiểm tra log của local MQTT Broker:
   ```bash
   docker logs ecogreen-mqtt --tail 10
   ```
   Phải thấy các log kết nối từ client của ESP32 (`GH-LOCAL-xxxx`) và NestJS Backend.

2. Kiểm tra log nhận dữ liệu tại cửa sổ chạy NestJS:
   ```text
   📬 Telemetry từ ESP32: { temperature: ..., humidity: ..., ... }
   ```

---

## 📌 KIỂM TRA NHANH KHI CÓ LỖI

| Vấn đề | Cách khắc phục & Kiểm tra |
| :--- | :--- |
| **Docker chạy chưa** | Chạy lệnh `docker ps` để xem các container đang chạy. |
| **Lỗi log Mosquitto** | Chạy lệnh `docker logs ecogreen-mqtt --tail 20` để xem chi tiết log của MQTT broker. |
| **Cổng 1883 có mở không** | Chạy lệnh PowerShell: `Test-NetConnection -ComputerName <IP_MÁY> -Port 1883` để kiểm tra kết nối tới broker. |
| **Lỗi DB kết nối** | Đảm bảo thông tin kết nối trong file `.env` trùng với cấu hình Docker (mặc định là `admin:admin123`). |
| **Dashboard không load / lỗi API** | Kiểm tra IP LAN trong `.env.local` và `next.config.ts` có khớp với IP hiện tại (`ipconfig`) không. |
| **Không hiển thị biểu đồ telemetry** | Kiểm tra ESP32 đã có internet để truyền dữ liệu lên broker MQTT chưa. |
| **Cách tắt toàn bộ nhanh** | Chạy file `.\stop.ps1` ở thư mục gốc của dự án. |

---

## LƯU Ý QUAN TRỌNG
* Trình duyệt và máy chạy Backend phải **ở cùng mạng LAN**.
* ESP32 chỉ cần **có kết nối Internet** (bất kỳ WiFi nào có mạng), không cần thiết phải chung mạng LAN với máy tính.
* Nếu cổng `3000` bị chiếm dụng, Next.js sẽ tự động chuyển sang cổng khác (ví dụ: `3001`), lúc đó hãy điều chỉnh file cấu hình và URL truy cập cho tương xứng.
* `npm install` và các lệnh khởi tạo Prisma chỉ cần chạy lần đầu tiên setup dự án.
