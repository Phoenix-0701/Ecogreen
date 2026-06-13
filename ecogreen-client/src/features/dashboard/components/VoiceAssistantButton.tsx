"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Loader2, X, GripVertical } from "lucide-react";
import { toast } from "react-hot-toast";
import { getAccessToken, API_URL } from "@/services/api";

// Mở rộng interface window cho SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceAssistantButton() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [audioLevel, setAudioLevel] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  
  // Trạng thái kéo thả thanh Mic
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const isDraggedRef = useRef(false);
  const btnRef = useRef<HTMLDivElement>(null);

  // Audio Analyzer Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Khởi động bộ phân tích âm lượng Micro
  const startAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Dùng 64 để lấy số lượng dải tần số vừa đủ
      analyser.smoothingTimeConstant = 0.6; // Làm mượt sóng một chút xíu để bớt giật
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;
        // Chuẩn hóa thành tỷ lệ 0-1
        setAudioLevel(average / 255);

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err) {
      console.log("Không thể truy cập luồng phân tích âm thanh:", err);
    }
  };

  const stopAudioAnalyzer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  useEffect(() => {
    // Khởi tạo SpeechRecognition khi component mount
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "vi-VN";

      recognition.onstart = () => {
        setIsListening(true);
        setTimeLeft(30); // Reset timer 30s
        startAudioAnalyzer(); // Bật nhấp nhô sóng âm
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        toast.success(`Bạn nói: "${transcript}"`, { icon: "🎙️" });
        setIsListening(false);
        stopAudioAnalyzer();
        await processCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        stopAudioAnalyzer();
        if (event.error !== "no-speech") {
          toast.error(`Microphone error: ${event.error}`);
          speakText("Microphone error", "en");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioAnalyzer();
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Trình duyệt không hỗ trợ Web Speech API");
    }

    // Load available voices
    if ("speechSynthesis" in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Timer 20s đếm ngược khi đang nghe
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isListening) {
      setTimeLeft(30);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            recognitionRef.current?.stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isListening]);

  // Logic kéo thả (Drag & Drop)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    isDraggedRef.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: offset.x,
      initialY: offset.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDraggedRef.current = true;
    }

    setOffset({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Xử lý hút về 2 mép màn hình (Snap to edge)
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const screenCenterX = window.innerWidth / 2;

      let newOffsetX = offset.x;
      let newOffsetY = offset.y;

      // Hút trái hoặc phải
      if (centerX < screenCenterX) {
        // Dính lề trái (cách 30px)
        newOffsetX = offset.x + (30 - rect.left);
      } else {
        // Dính lề phải (cách 30px)
        newOffsetX = offset.x + ((window.innerWidth - 30) - rect.right);
      }

      // Đảm bảo không văng khỏi màn hình theo chiều dọc
      if (rect.top < 30) {
        newOffsetY = offset.y + (30 - rect.top);
      } else if (rect.bottom > window.innerHeight - 30) {
        newOffsetY = offset.y + ((window.innerHeight - 30) - rect.bottom);
      }

      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const playSiriStartSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };

      // Phát 2 âm thanh bíp bíp (thấp -> cao) giống Siri
      playTone(440, ctx.currentTime);
      playTone(660, ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Không thể phát âm thanh", e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Your browser does not support voice recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        // Phát âm báo ting ting trước
        playSiriStartSound();
        
        // Kèm theo tiếng nói "I'm listening" sau đó mới bắt đầu thu
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("I am listening");
          utterance.lang = "en-US";
          const enVoice = availableVoices.find(
            (voice) => voice.lang.includes("en") || voice.name.toLowerCase().includes("english")
          );
          if (enVoice) utterance.voice = enVoice;

          let hasStarted = false;
          const startListening = () => {
            if (!hasStarted) {
              hasStarted = true;
              try {
                recognitionRef.current?.start();
              } catch(e) {}
            }
          };

          utterance.onend = startListening;
          utterance.onerror = startListening;
          
          // Failsafe: Nếu Chrome bị lỗi không gọi onend thì ép chạy sau 1.5s
          setTimeout(startListening, 1500);
          
          // Giữ tham chiếu để Chrome không tự xóa Utterance gây mất sự kiện onend
          (window as any).currentUtterance = utterance;

          window.speechSynthesis.speak(utterance);
        } else {
          // Bắt đầu nghe ngay nếu không có TTS
          recognitionRef.current.start();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const processCommand = async (text: string) => {
    setIsProcessing(true);
      try {
        const token = getAccessToken();
        if (!token) {
          const msg = "Please login again.";
          toast.error(msg);
          speakText(msg, "en");
          setIsProcessing(false);
          return;
        }

      // Có thể lấy active device id từ localStorage hoặc context nếu có,
      // ở đây backend đã được sửa để tự fallback nếu deviceId undefined.
      const deviceId = localStorage.getItem("lastActiveDeviceId") || undefined;

      const response = await fetch(`${API_URL}/v1/ai-assistant/voice-command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, deviceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi khi xử lý giọng nói");
      }

      // Do TransformInterceptor của NestJS:
      // Nếu backend trả về { message: "Viet", speak: "Eng" }
      // Interceptor sẽ biến thành: { message: "Viet", data: "Eng" }
      const replyMessage = (data.message !== 'Success' && data.message) || data.data?.message || data.reply || "Thành công!";
      const speakMessage = typeof data.data === 'string' ? data.data : (data.data?.english_translation_for_voice || data.data?.speak || data.english_translation_for_voice || data.speak || replyMessage);
      
      console.log("[Voice Debug] Reply Message (Vietnamese):", replyMessage);
      console.log("[Voice Debug] Speak Message (English):", speakMessage);

      toast.success(replyMessage); // Hiện chữ tiếng Việt
      speakText(speakMessage, "en"); // Đọc bằng Google TTS tiếng Anh chuẩn
      
      } catch (error: any) {
        const errMsg = error.response?.data?.message || error.message || "Cannot process your request.";
        toast.error(errMsg);
        speakText(errMsg, "en"); // Đọc tiếng Anh cho lỗi
      } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string, lang: 'vi' | 'en' = 'en') => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      
      // Thuật toán tìm giọng tiếng Anh xịn nhất có thể (Google > Microsoft > bất kỳ)
      let targetVoice;
      if (lang === 'en') {
        targetVoice = 
          availableVoices.find(v => v.name.includes("Google US English")) ||
          availableVoices.find(v => v.name.includes("Google UK English Female")) ||
          availableVoices.find(v => v.lang.startsWith("en-") && v.name.includes("Google")) ||
          availableVoices.find(v => v.name.includes("Zira")) || // Microsoft Zira (Nữ Mỹ)
          availableVoices.find(v => v.name.includes("David")) || // Microsoft David (Nam Mỹ)
          availableVoices.find(v => v.lang.startsWith("en")); // Bất kỳ giọng tiếng Anh nào
      } else {
        targetVoice = availableVoices.find(v => v.lang.includes("vi"));
      }

      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Trình duyệt không hỗ trợ đọc giọng nói.");
    }
  };

  if (!recognitionRef.current && typeof window !== "undefined" && !("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
    return null; // Không render nút nếu trình duyệt không hỗ trợ
  }

  return (
    <>
      {/* Thanh Mic nổi (Draggable) */}
      <div 
        ref={btnRef}
        className={`fixed z-[60] flex items-center justify-center select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          bottom: '30px',
          right: '30px',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div 
          onClick={(e) => {
            // Không kích hoạt nút nếu người dùng vừa mới kéo thả xong
            if (isDraggedRef.current) {
              isDraggedRef.current = false;
              return;
            }
            toggleListening();
          }}
          className={`relative group flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-105' 
              : 'bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-gray-800/90 hover:scale-[1.02]'
          }`}
        >
          {/* Biểu tượng Mic và Vòng xoay */}
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isListening ? 'bg-black/20' : 'bg-emerald-500/20 group-hover:bg-emerald-500/30'}`}>
             {isProcessing ? (
                <Loader2 className="animate-spin text-emerald-400" size={16} />
             ) : (
                <Mic className={isListening ? "text-white" : "text-emerald-400"} size={16} />
             )}
          </div>

          {/* Dòng chữ trạng thái */}
          {(isListening || isProcessing) && (
            <span className="font-medium text-white text-[11px] uppercase tracking-wider mx-1 whitespace-nowrap">
               {isListening ? "Đang nghe..." : "Xử lý..."}
            </span>
          )}
          
          {/* Icon Kéo Thả (Grip) */}
          <div className="ml-1 pl-2.5 py-0.5 border-l border-white/10 text-white/30 group-hover:text-white/60 transition-colors">
            <GripVertical size={16} />
          </div>
        </div>
      </div>

      {/* Giao diện Siri-like khi đang nghe */}
      {isListening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="relative flex flex-col items-center w-full max-w-sm p-8 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
            
            {/* Nút Hủy */}
            <button 
              onClick={(e) => { e.stopPropagation(); recognitionRef.current?.stop(); }}
              className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
              title="Đóng"
            >
              <X size={20} />
            </button>

            <Mic className="text-white mb-4 animate-pulse" size={36} strokeWidth={1.5} />
            <h2 className="text-2xl font-light text-white mb-2 tracking-wide">Đang lắng nghe...</h2>
            <p className="text-white/60 text-lg font-mono mb-8">00:{timeLeft.toString().padStart(2, '0')}</p>
            
            {/* Sóng âm thực tế (Symmetric Waveform) - 11 thanh */}
            <div className="flex items-center justify-center gap-1.5 h-16 mb-8 w-full">
               {[0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 0.9, 0.7, 0.5, 0.3, 0.2].map((sym, i) => {
                 const time = Date.now() / 150; 
                 const noise = audioLevel > 0.02 ? Math.sin(time + i * 0.5) * 0.2 + 0.8 : 0;
                 
                 const bounce = audioLevel * 350 * sym * noise;
                 // Giới hạn max 60px để không tràn cửa sổ
                 const height = Math.min(60, Math.max(6, bounce)); 

                 return (
                   <div
                     key={i}
                     className="w-1.5 rounded-full bg-white transition-all duration-75 ease-out"
                     style={{
                       height: `${height}px`,
                       boxShadow: `0 0 ${height/4}px rgba(255, 255, 255, 0.4)`,
                       opacity: 0.4 + (audioLevel * sym * 0.6)
                     }}
                   ></div>
                 );
               })}
            </div>

            <div className="text-center text-white/50 bg-black/30 w-full rounded-2xl p-4 border border-white/5">
               <p className="mb-3 text-xs uppercase tracking-widest text-white/30">Gợi ý câu lệnh</p>
               <p className="text-sm font-medium mb-2">"Bật máy bơm"</p>
               <p className="text-sm font-medium mb-2">"Tắt quạt tản nhiệt"</p>
               <p className="text-sm font-medium">"Tưới nước trong 5 phút"</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-red {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </>
  );
}
