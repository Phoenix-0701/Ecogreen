import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActuatorsService } from '../actuators/actuators.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiAssistantService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly actuatorsService: ActuatorsService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async processVoiceCommand(text: string, deviceId: string | undefined, userId: string) {
    if (!this.genAI) {
      throw new BadRequestException('GEMINI_API_KEY is not configured. Please set it in the server .env file to use the smart AI.');
    }

    try {
      const prompt = `
Bạn là "Eco", bộ não AI của hệ thống nhà kính thông minh EcoGreen.
Nhiệm vụ của bạn là lắng nghe câu lệnh (bằng Tiếng Việt) của người dùng và quyết định xem có cần điều khiển thiết bị nào không.
Hệ thống hiện tại có 2 thiết bị: "pump" (Máy bơm nước tưới cây) và "fan" (Quạt thông gió tản nhiệt).

Câu nói của người dùng (Tiếng Việt): "${text}"

Hãy phân tích ngữ cảnh. Ví dụ:
- "Trời nóng quá" -> Cần bật quạt.
- "Đất khô quá", "tưới cây đi" -> Cần bật máy bơm.
- "Lạnh rồi" -> Tắt quạt.
- "Chào bạn" -> Không điều khiển gì, chỉ chào lại.

Trả về kết quả DƯỚI DẠNG CHUỖI JSON DUY NHẤT (không bọc trong markdown \`\`\` hay thẻ code), theo ĐÚNG định dạng sau:
{
  "action": "turn_on" | "turn_off" | "none",
  "device": "pump" | "fan" | "none",
  "duration_minutes": số nguyên (mặc định 0),
  "english_reply": "Câu trả lời hiển thị trên màn hình BẰNG TIẾNG ANH (Ví dụ: 'Yes sir, since it is hot, I will turn on the fan for you.').",
  "english_translation_for_voice": "Giống hệt câu trên để hệ thống đọc lên bằng Tiếng Anh."
}
CHÚ Ý: Người dùng nói Tiếng Việt, nhưng bạn BẮT BUỘC phải trả lời bằng Tiếng Anh.
`;

    // Ưu tiên chạy Model cấu hình trong .env, nếu lỗi sẽ lần lượt thử các model dự phòng
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const fallbacks = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
    
    // Tạo danh sách các model duy nhất
    const modelsToTry: string[] = [primaryModel];
    for (const fb of fallbacks) {
      if (!modelsToTry.includes(fb)) {
        modelsToTry.push(fb);
      }
    }

    let parsedData: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI-Assistant] Đang thử kết nối tới model: ${modelName}`);
        const modelInstance = this.genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await modelInstance.generateContent(prompt);
        const textResponse = result.response.text();
        const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleanedText);
        console.log(`[AI-Assistant] Xử lý thành công bằng model: ${modelName}. Dữ liệu:`, parsedData);
        break; // Thoát vòng lặp khi thành công
      } catch (error) {
        console.warn(`[AI-Assistant] Model ${modelName} gặp lỗi:`, error?.message || error);
        lastError = error;
      }
    }

    if (!parsedData) {
      console.error("Tất cả các model Gemini dự phòng đều thất bại.", lastError);
      throw new BadRequestException('Sorry, my AI brain is having some connection issues, please try again later!');
    }

      // Nếu AI quyết định điều khiển thiết bị
      if (parsedData.action !== 'none' && parsedData.device !== 'none') {
        const state = parsedData.action === 'turn_on';
        const durationMs = parsedData.duration_minutes ? parsedData.duration_minutes * 60 * 1000 : undefined;
        
        // Tìm Actuator tương ứng
        let actuator;
        if (deviceId) {
          actuator = await this.prisma.aCTUATORS.findFirst({
            where: { Device_ID: deviceId, type: parsedData.device },
          });
        } else {
          // Fallback tìm actuator đầu tiên của user nếu không có deviceId
          actuator = await this.prisma.aCTUATORS.findFirst({
            where: { type: parsedData.device, device: { User_ID: userId } },
            orderBy: { created_at: 'desc' }
          });
        }

        if (actuator) {
          // Bật/tắt thiết bị
          await this.actuatorsService.toggle(actuator.Actuator_ID, state, userId || 'VOICE_CONTROL');
          
          // Xử lý hẹn giờ tự động tắt nếu AI trả về duration_minutes > 0
          if (state && durationMs && durationMs > 0) {
            setTimeout(async () => {
              try {
                console.log(`[VOICE-AUTO-OFF] Tự động tắt ${parsedData.device} sau ${parsedData.duration_minutes} phút`);
                await this.actuatorsService.toggle(actuator.Actuator_ID, false, 'VOICE_AUTO_OFF');
              } catch (error) {
                console.error(`[VOICE-AUTO-OFF] Lỗi khi tự động tắt:`, error);
              }
            }, durationMs);
          }
        } else {
          // Báo cho AI biết là không tìm thấy thiết bị để trả lời khác đi
          return { message: `I understand you want to control the ${parsedData.device}, but I couldn't find this device in the system!` };
        }
      }

      const fallbackSpeak = `I understand, I am executing the action for the ${parsedData.device || 'device'} now.`;

      return {
        message: parsedData.english_reply || "Success!",
        speak: parsedData.english_translation_for_voice || fallbackSpeak
      };

    } catch (error) {
      console.error("Lỗi khi xử lý AI Gemini:", error);
      throw new BadRequestException('Sorry, my AI brain is having some connection issues, please try again later!');
    }
  }
}
