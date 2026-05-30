"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth.context";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Leaf, 
  Sprout, 
  Thermometer, 
  Droplets, 
  Activity, 
  Cpu, 
  TrendingUp, 
  ArrowRight, 
  Settings, 
  Sun, 
  ShieldCheck, 
  Globe, 
  Lock, 
  Menu, 
  X, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Database, 
  Smartphone, 
  Play, 
  Wind, 
  Power 
} from "lucide-react";

// Scroll Reveal Wrapper Component
function ScrollReveal({ 
  children, 
  delay = 0, 
  duration = 800,
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  duration?: number;
  className?: string; 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { 
        threshold: 0.05, 
        rootMargin: "0px 0px -40px 0px"
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-16 scale-[0.98]"
      } ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { language, changeLanguage, t, formatTemp } = useLanguage();
  const router = useRouter();

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ROI Calculator State
  const [farmSize, setFarmSize] = useState(350); // m²

  // Virtual ESP32 Node States (Hero section interactive preview)
  const [virtualSoilMoisture, setVirtualSoilMoisture] = useState(68);
  const [virtualTemp, setVirtualTemp] = useState(28.4);
  const [virtualHumi] = useState(62);
  const [pumpActive, setPumpActive] = useState(false);
  const [fanActive, setFanActive] = useState(false);

  // Active status text for virtual preview
  const [previewMsg, setPreviewMsg] = useState("");

  // Simulated graph path data for sparkline (10 data points)
  const [sparkPoints, setSparkPoints] = useState([40, 45, 42, 50, 48, 55, 60, 58, 62, 68]);

  // Refs for virtual simulation loops
  const pumpIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set initial preview message based on language
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: derived state sync with language/pump/fan
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: derived state from language/pump/fan */
    if (pumpActive) {
      setPreviewMsg(t("landing.preview.wateringMsg", "Đang tưới nước... Độ ẩm đất đang tăng!"));
    } else if (fanActive) {
      setPreviewMsg(t("landing.preview.coolingMsg", "Đang bật quạt... Đang hạ nhiệt độ!"));
    } else {
      setPreviewMsg(t("landing.preview.normalMsg", "Hệ sinh thái ổn định. Đang giám sát cảm biến..."));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [language, pumpActive, fanActive]);

  // Virtual Node watering simulator loop
  useEffect(() => {
    if (pumpActive) {
      pumpIntervalRef.current = setInterval(() => {
        setVirtualSoilMoisture((prev) => {
          const next = prev >= 85 ? 85 : prev + 1;
          if (next >= 85) setPumpActive(false); // Auto shutoff
          
          // Add moisture point to graph
          setSparkPoints(pts => [...pts.slice(1), next]);
          return next;
        });
      }, 300);
    } else {
      if (pumpIntervalRef.current) clearInterval(pumpIntervalRef.current);
      const dryTimer = setInterval(() => {
        setVirtualSoilMoisture((prev) => {
          const next = prev <= 55 ? 55 : prev - 1;
          setSparkPoints(pts => [...pts.slice(1), next]);
          return next;
        });
      }, 5000);
      return () => clearInterval(dryTimer);
    }
    return () => {
      if (pumpIntervalRef.current) clearInterval(pumpIntervalRef.current);
    };
  }, [pumpActive]);

  // Virtual Node cooling fan simulator loop
  useEffect(() => {
    if (fanActive) {
      fanIntervalRef.current = setInterval(() => {
        setVirtualTemp((prev) => {
          const next = prev <= 24.5 ? 24.5 : Math.round((prev - 0.2) * 10) / 10;
          if (next <= 24.5) setFanActive(false);
          return next;
        });
      }, 300);
    } else {
      if (fanIntervalRef.current) clearInterval(fanIntervalRef.current);
      const warmTimer = setInterval(() => {
        setVirtualTemp((prev) => {
          const next = prev >= 32.2 ? 32.2 : Math.round((prev + 0.1) * 10) / 10;
          return next;
        });
      }, 4000);
      return () => clearInterval(warmTimer);
    }
    return () => {
      if (fanIntervalRef.current) clearInterval(fanIntervalRef.current);
    };
  }, [fanActive]);

  // Generate SVG path from spark points
  const generateSvgPath = () => {
    const width = 120;
    const height = 30;
    const minVal = 40;
    const maxVal = 90;
    const pointsCount = sparkPoints.length;
    
    return sparkPoints.map((val, idx) => {
      const x = (idx / (pointsCount - 1)) * width;
      const y = height - ((val - minVal) / (maxVal - minVal)) * height;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  // ROI calculations
  const waterSavedPerDay = Math.round(farmSize * 4.2); // 4.2 liters per m2 saved
  const electricitySavedPerMonth = Math.round(farmSize * 0.15); // 0.15 kWh saved per m2
  const yieldPercentage = Math.min(45, Math.max(25, Math.round(20 + farmSize / 150))); 
  
  // Cost savings in VND
  const vndSavings = Math.round((waterSavedPerDay * 30 * 15) + (electricitySavedPerMonth * 3000));
  const formattedSavings = new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(vndSavings);

  const toggleLanguage = () => {
    changeLanguage(language === "vi" ? "en" : "vi");
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800 relative overflow-x-hidden">
      
      {/* Upgraded Background Animations & Dynamic Patterns (Using relative layering z-0) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-b from-[#f2faf5] via-[#ffffff] via-[#ebfaf0] via-[#ffffff] to-[#eafcf0]">
        {/* Modern Dotted Grid Overlay - Made more visible */}
        <div 
          className="absolute inset-0 opacity-[0.55] bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_15%,#000_85%,transparent_100%)]" 
        />
        
        {/* Wavy line / Linear grid */}
        <div 
          className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#059669_1px,transparent_1px),linear-gradient(to_bottom,#059669_1px,transparent_1px)] bg-[size:5rem_5rem]" 
        />

        {/* Topography Contour Line 1 - Near Hero/Features */}
        <svg className="absolute top-[8%] right-[-5%] w-[650px] h-[450px] text-emerald-500/[0.06] pointer-events-none" viewBox="0 0 500 300" fill="none">
          <path d="M -50 120 C 100 40, 250 180, 450 100 C 500 80, 550 120, 600 90" stroke="currentColor" strokeWidth="1.5" />
          <path d="M -50 140 C 100 60, 250 200, 450 120 C 500 100, 550 140, 600 110" stroke="currentColor" strokeWidth="1.5" />
          <path d="M -50 160 C 100 80, 250 220, 450 140 C 500 120, 550 160, 600 130" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M -50 100 C 100 20, 250 160, 450 80 C 500 60, 550 100, 600 70" stroke="currentColor" strokeWidth="1" />
        </svg>

        {/* Topography Contour Line 2 - Near ROI */}
        <svg className="absolute top-[42%] left-[-8%] w-[600px] h-[400px] text-teal-500/[0.05] pointer-events-none" viewBox="0 0 500 300" fill="none">
          <path d="M 0 150 C 150 220, 250 80, 450 200 C 500 220, 550 180, 600 210" stroke="currentColor" strokeWidth="1.5" />
          <path d="M 0 170 C 150 240, 250 100, 450 220 C 500 240, 550 200, 600 230" stroke="currentColor" strokeWidth="1.2" />
          <path d="M 0 130 C 150 200, 250 60, 450 180 C 500 200, 550 160, 600 190" stroke="currentColor" strokeWidth="1" />
          <circle cx="280" cy="120" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="280" cy="120" r="20" stroke="currentColor" strokeWidth="1" />
        </svg>

        {/* Topography Contour Line 3 - Near Stats */}
        <svg className="absolute top-[75%] right-[-10%] w-[700px] h-[500px] text-emerald-500/[0.06] pointer-events-none" viewBox="0 0 500 300" fill="none">
          <path d="M -100 100 Q 120 180, 250 100 T 600 80" stroke="currentColor" strokeWidth="1.5" />
          <path d="M -100 120 Q 120 200, 250 120 T 600 100" stroke="currentColor" strokeWidth="1.5" />
          <path d="M -100 140 Q 120 220, 250 140 T 600 120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M -100 80 Q 120 160, 250 80 T 600 60" stroke="currentColor" strokeWidth="1" />
        </svg>

        {/* Large pulsating neon orbs in background - Made richer & distributed */}
        <div className="absolute top-[2%] left-[-10%] w-[800px] h-[800px] bg-emerald-400/[0.12] rounded-full blur-[130px] animate-pulse-glow-1" />
        <div className="absolute top-[25%] right-[-5%] w-[750px] h-[750px] bg-teal-400/[0.09] rounded-full blur-[125px] animate-pulse-glow-2" />
        <div className="absolute top-[50%] left-[-8%] w-[700px] h-[700px] bg-emerald-300/[0.08] rounded-full blur-[120px] animate-pulse-glow-3" />
        <div className="absolute top-[72%] right-[-8%] w-[800px] h-[800px] bg-teal-300/[0.08] rounded-full blur-[130px] animate-pulse-glow-1" />
        <div className="absolute bottom-[2%] left-[2%] w-[650px] h-[650px] bg-green-400/[0.09] rounded-full blur-[115px] animate-pulse-glow-3" />

        {/* Floating premium leaf/sparkle elements in the background */}
        <div className="absolute top-[12%] left-[8%] text-emerald-500/22 animate-float-slow-1"><Leaf size={32} /></div>
        <div className="absolute top-[28%] right-[10%] text-emerald-600/18 animate-float-slow-2"><Sprout size={28} /></div>
        <div className="absolute top-[45%] left-[12%] text-teal-500/18 animate-float-slow-3"><Sparkles size={24} /></div>
        <div className="absolute top-[60%] right-[8%] text-emerald-500/20 animate-float-slow-4"><Leaf size={36} /></div>
        <div className="absolute top-[78%] left-[6%] text-emerald-600/18 animate-float-slow-2"><Sprout size={30} /></div>
        <div className="absolute top-[88%] right-[12%] text-teal-500/20 animate-float-slow-1"><Sparkles size={26} /></div>
      </div>

      {/* Main Content Container (z-10 sits on top of z-0 background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* 1. Floating Glassmorphic Header/Navigation Bar */}
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl bg-white/75 backdrop-blur-md border border-emerald-500/10 shadow-[0_12px_35px_rgba(5,95,59,0.06)] rounded-2xl text-slate-800 transition-all duration-300">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Leaf size={18} className="animate-pulse fill-white text-white" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900 hover:text-emerald-700 transition-colors">
                  EcoGreen
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2 font-bold">
                <a href="#features" className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 px-3.5 py-1.5 rounded-xl transition-all text-sm">
                  {t("landing.nav.features", "Tính năng")}
                </a>
                <a href="#roi" className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 px-3.5 py-1.5 rounded-xl transition-all text-sm">
                  {t("landing.nav.roi", "Tính toán ROI")}
                </a>
                <a href="#preview" className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 px-3.5 py-1.5 rounded-xl transition-all text-sm">
                  {t("landing.nav.preview", "Bản xem thử")}
                </a>
                <a href="#stats" className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 px-3.5 py-1.5 rounded-xl transition-all text-sm">
                  {t("landing.nav.technology", "Hiệu suất")}
                </a>
              </nav>

              {/* Actions */}
              <div className="hidden md:flex items-center gap-3">
                <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-xl transition-all border border-slate-200/80"
                >
                  <Globe size={14} />
                  <span>{language === "vi" ? "EN" : "VI"}</span>
                </button>

                {isLoading ? (
                  <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-xl" />
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link 
                      href="/dashboard"
                      className="flex items-center gap-1.5 px-4.5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                      <span>{t("landing.nav.dashboard", "Vào Dashboard")}</span>
                      <ArrowRight size={14} />
                    </Link>
                    <button 
                      onClick={logout}
                      className="px-3 py-2 text-sm font-bold text-slate-500 hover:text-red-650 rounded-xl hover:bg-red-50/40 transition-all"
                    >
                      {t("landing.nav.logout", "Đăng xuất")}
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/login"
                    className="flex items-center gap-1.5 px-4.5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <span>{t("landing.nav.login", "Đăng nhập / Dùng thử")}</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center gap-1.5 md:hidden">
                <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-655 bg-slate-100 rounded-lg border border-slate-200/60"
                >
                  <Globe size={12} />
                  <span>{language === "vi" ? "EN" : "VI"}</span>
                </button>
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Panel */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 bg-white/95 px-4 py-4 space-y-1 rounded-b-2xl shadow-xl">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-bold text-slate-655 hover:text-emerald-600 hover:bg-emerald-50/40 rounded-xl transition-all"
              >
                {t("landing.nav.features", "Tính năng")}
              </a>
              <a 
                href="#roi" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-bold text-slate-655 hover:text-emerald-600 hover:bg-emerald-50/40 rounded-xl transition-all"
              >
                {t("landing.nav.roi", "Tính toán ROI")}
              </a>
              <a 
                href="#preview" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-bold text-slate-655 hover:text-emerald-600 hover:bg-emerald-50/40 rounded-xl transition-all"
              >
                {t("landing.nav.preview", "Bản xem thử")}
              </a>
              <a 
                href="#stats" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-bold text-slate-655 hover:text-emerald-600 hover:bg-emerald-50/40 rounded-xl transition-all"
              >
                {t("landing.nav.technology", "Hiệu suất")}
              </a>
              <div className="pt-2 mt-2 border-t border-slate-100">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <Link 
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 text-center text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-md"
                    >
                      <span>{t("landing.nav.dashboard", "Vào Dashboard")}</span>
                      <ArrowRight size={14} />
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full py-2 text-center text-sm font-bold text-slate-500 hover:text-red-650"
                    >
                      {t("landing.nav.logout", "Đăng xuất")}
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 text-center text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/10"
                  >
                    <span>{t("landing.nav.login", "Đăng nhập / Dùng thử")}</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>

        {/* 2. Hero Section */}
        <section className="relative pt-28 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Hero Left Content */}
              <div className="lg:col-span-6 xl:col-span-7 space-y-8 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold rounded-full mx-auto lg:mx-0 shadow-sm">
                  <Sparkles size={13} className="text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>{t("landing.hero.badge", "Nền Tảng IoT Nông Nghiệp Thông Minh")}</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-6xl font-black font-heading text-slate-900 tracking-tight leading-[1.1] max-w-2xl">
                  {t("landing.hero.title", "Nông Nghiệp Thông Minh, Khởi Đầu Từ Sự Đơn Giản.")}
                </h1>

                {/* Subheading */}
                <p className="text-base sm:text-xl text-slate-655 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  {t("landing.hero.subtitle", "EcoGreen giúp tối ưu hóa năng suất cây trồng, tự động hóa chu kỳ tưới và giám sát các chỉ số vi khí hậu trong nhà kính thông qua công nghệ IoT thời gian thực tiên tiến.")}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link 
                    href={isAuthenticated ? "/dashboard" : "/login"}
                    className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-10 py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-98 transition-all text-base"
                  >
                    <span>{t("landing.hero.startBtn", "Bắt đầu ngay")}</span>
                    <ArrowRight size={18} />
                  </Link>
                  <a 
                    href="#preview"
                    className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl shadow-sm hover:shadow active:scale-98 transition-all text-base"
                  >
                    <span>{t("landing.hero.viewDocs", "Xem bản chạy thử")}</span>
                  </a>
                </div>

                {/* Social / Proof stats */}
                <div className="flex items-center justify-center lg:justify-start gap-8 pt-6 border-t border-slate-200 max-w-xl mx-auto lg:mx-0">
                  <div>
                    <div className="text-2xl font-black text-emerald-800">1,200+</div>
                    <div className="text-xs text-slate-500 font-bold">{t("landing.hero.activeUsers", "Trang trại hoạt động")}</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <div className="text-2xl font-black text-emerald-850">99.9%</div>
                    <div className="text-xs text-slate-500 font-bold">Uptime SLA</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-600">{t("landing.hero.realtimeSync", "Đồng bộ thời gian thực")}</span>
                  </div>
                </div>
              </div>

              {/* Hero Right Content - Redesigned High-Tech Dark ESP32 Node Form */}
              <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
                <div className="w-full max-w-lg bg-[#07130c]/95 border border-emerald-900/60 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.65)] p-6 relative overflow-hidden ring-4 ring-emerald-500/10">
                  
                  {/* Simulated hardware elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="absolute top-4 left-6 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Node Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-emerald-950 mb-6 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-950/80 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-900">
                        <Cpu size={22} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-emerald-100 leading-tight">
                          {t("landing.preview.nodeName", "Thiết bị ảo: ESP32-ZONE_A")}
                        </h4>
                        <p className="text-[10px] text-emerald-500/70 font-mono">MAC: 24:0A:C4:B2:D6:78 | RSSI: -58 dBm</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 text-emerald-440 text-[10px] font-bold rounded-full border border-emerald-800/40">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      <span>{t("landing.preview.statusOnline", "Trực tuyến")}</span>
                    </div>
                  </div>

                  {/* Sensor Readings Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* Temp */}
                    <div className="bg-[#0b1c12] border border-emerald-900/60 p-4 rounded-2xl hover:bg-emerald-950/40 transition-all shadow-inner animate-[pulseGlow_8s_ease-in-out_infinite]">
                      <div className="text-emerald-500/50 flex justify-between items-start mb-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest font-mono">TEMPERATURE</span>
                        <Thermometer size={14} className="text-orange-400" />
                      </div>
                      <div className="text-xl font-bold text-orange-400 font-mono tracking-tight glow-amber">
                        {formatTemp(virtualTemp, 1)}
                      </div>
                    </div>

                    {/* Soil Moisture */}
                    <div className="bg-[#0b1c12] border border-emerald-900/60 p-4 rounded-2xl hover:bg-emerald-950/40 transition-all shadow-inner">
                      <div className="text-emerald-500/50 flex justify-between items-start mb-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest font-mono">SOIL MOST</span>
                        <Droplets size={14} className="text-blue-400" />
                      </div>
                      <div className="text-xl font-bold text-blue-400 font-mono tracking-tight glow-blue">
                        {virtualSoilMoisture}%
                      </div>
                    </div>

                    {/* Air Humidity */}
                    <div className="bg-[#0b1c12] border border-emerald-900/60 p-4 rounded-2xl hover:bg-emerald-950/40 transition-all shadow-inner">
                      <div className="text-emerald-500/50 flex justify-between items-start mb-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest font-mono">AIR HUMIDITY</span>
                        <Activity size={14} className="text-emerald-400" />
                      </div>
                      <div className="text-xl font-bold text-emerald-400 font-mono tracking-tight glow-green">
                        {virtualHumi}%
                      </div>
                    </div>
                  </div>

                  {/* Sensor Progress Visual */}
                  <div className="mb-6 bg-[#0b1c12] border border-emerald-900/60 p-4.5 rounded-2xl relative">
                    <div className="flex justify-between text-xs mb-2.5 font-bold">
                      <span className="text-emerald-300">{t("landing.preview.soil", "Độ ẩm đất")}</span>
                      <span className={virtualSoilMoisture < 60 ? "text-orange-400 font-extrabold" : "text-emerald-400 font-extrabold"}>
                        {virtualSoilMoisture}% {virtualSoilMoisture < 60 ? t("common.dry", "Khô") : t("common.stable", "Ổn định")}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden mb-4 border border-emerald-900/40">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          virtualSoilMoisture < 60 ? "bg-orange-500 shadow-[0_0_8px_#f97316]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                        }`}
                        style={{ width: `${virtualSoilMoisture}%` }}
                      />
                    </div>

                    {/* Live Sparkline Graph */}
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-900/40">
                      <span className="text-[10px] text-emerald-500/60 font-mono uppercase tracking-wider">Lịch sử sóng cảm biến</span>
                      <svg className="w-[120px] h-[30px] overflow-visible">
                        <path
                          d={generateSvgPath()}
                          fill="none"
                          stroke={virtualSoilMoisture < 60 ? "#f97316" : "#10b981"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-300"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Actuator Controllers */}
                  <div className="space-y-3.5">
                    {/* Pump Control Button */}
                    <div className="flex items-center justify-between p-4 bg-[#0a1e12] border border-emerald-900/40 rounded-2xl hover:border-emerald-700/60 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${pumpActive ? "bg-blue-955 text-blue-400 border border-blue-900" : "bg-emerald-955/40 text-emerald-700 border border-emerald-900/30"}`}>
                          <Droplets size={18} className={pumpActive ? "animate-bounce" : ""} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-100">{t("landing.preview.pump", "Máy bơm nước (Relay 1)")}</div>
                          <div className="text-[10px] text-emerald-500/60 font-mono font-bold mt-0.5">{pumpActive ? t("landing.preview.statusOn", "Đang hoạt động") : t("landing.preview.statusOff", "Đang chờ")}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setPumpActive(!pumpActive)}
                        className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          pumpActive 
                            ? "bg-red-650 hover:bg-red-700 text-white shadow-lg shadow-red-950/40 active:scale-95" 
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-95"
                        }`}
                      >
                        <Power size={18} />
                      </button>
                    </div>

                    {/* Fan Control Button */}
                    <div className="flex items-center justify-between p-4 bg-[#0a1e12] border border-emerald-900/40 rounded-2xl hover:border-emerald-700/60 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${fanActive ? "bg-orange-955 text-orange-400 border border-orange-900" : "bg-emerald-955/40 text-emerald-700 border border-emerald-900/30"}`}>
                          <Wind size={18} className={fanActive ? "animate-spin" : ""} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-100">{t("landing.preview.fan", "Quạt thông gió (Relay 2)")}</div>
                          <div className="text-[10px] text-emerald-500/60 font-mono font-bold mt-0.5">{fanActive ? t("landing.preview.statusOn", "Đang hoạt động") : t("landing.preview.statusOff", "Đang chờ")}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setFanActive(!fanActive)}
                        className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          fanActive 
                            ? "bg-red-655 hover:bg-red-700 text-white shadow-lg shadow-red-950/40 active:scale-95" 
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-95"
                        }`}
                      >
                        <Power size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Console Log status bar */}
                  <div className="mt-5 pt-3.5 border-t border-emerald-955 flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] text-emerald-400/80 font-mono font-bold line-clamp-1 italic">
                      {previewMsg}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. Upgraded Features Section */}
        <section id="features" className="py-28 bg-[#fcfefe]/35 border-y border-emerald-500/10 scroll-mt-16 backdrop-blur-md relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
          
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
            
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight">
                  {t("landing.features.title", "Giải Pháp IoT Nông Nghiệp Toàn Diện")}
                </h2>
                <div className="w-16 h-1 bg-emerald-650 mx-auto rounded-full mt-2" />
                <p className="text-slate-600 text-base sm:text-lg font-semibold max-w-2xl mx-auto leading-relaxed">
                  {t("landing.features.subtitle", "Được phát triển với mục tiêu giúp tối ưu hóa tài nguyên nước, điện năng và nâng cao sản lượng nông sản.")}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Feature 1 */}
              <ScrollReveal delay={0}>
                <div className="group relative p-8 bg-white/80 border border-slate-200/80 hover:border-emerald-500/30 rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.08)] transition-all duration-300 overflow-hidden min-h-[320px] flex flex-col justify-between">
                  <svg className="absolute bottom-[-15px] right-[-15px] w-28 h-28 text-slate-200/50 group-hover:text-emerald-500/[0.04] transition-colors pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
                    <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="1" />
                  </svg>

                  <div>
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-650 border border-emerald-100 shadow-sm relative group-hover:scale-105 transition-transform">
                      <span className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 animate-ping opacity-60" />
                      <Activity size={26} />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900 mt-6 mb-3">
                      {t("landing.features.monitor", "Giám sát thời gian thực")}
                    </h3>
                    <p className="text-slate-655 text-sm leading-relaxed font-semibold">
                      {t("landing.features.monitorDesc", "Theo dõi nhiệt độ, độ ẩm đất, ánh sáng và độ ẩm không khí liên tục với độ trễ phản hồi dưới 1 giây.")}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-700 cursor-pointer mt-4">
                    <span>Khám phá thêm</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 2 */}
              <ScrollReveal delay={150}>
                <div className="group relative p-8 bg-white/80 border border-slate-200/80 hover:border-emerald-500/30 rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.08)] transition-all duration-300 overflow-hidden min-h-[320px] flex flex-col justify-between">
                  <svg className="absolute bottom-[-10px] right-[-10px] w-28 h-28 text-slate-200/50 group-hover:text-emerald-500/[0.04] transition-colors pointer-events-none" viewBox="0 0 100 100">
                    <rect x="15" y="15" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="50" cy="50" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M 27 21 L 44 21 L 47 24 L 47 44" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M 50 56 L 50 80 L 70 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="70" cy="80" r="3" fill="currentColor" />
                  </svg>

                  <div>
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-650 border border-emerald-100 shadow-sm relative group-hover:scale-105 transition-transform">
                      <span className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 animate-ping opacity-60" style={{ animationDelay: "0.2s" }} />
                      <Cpu size={26} />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900 mt-6 mb-3">
                      {t("landing.features.auto", "Tự động hóa thông minh")}
                    </h3>
                    <p className="text-slate-655 text-sm leading-relaxed font-semibold">
                      {t("landing.features.autoDesc", "Thiết lập các ngưỡng an toàn để kích hoạt máy bơm nước hoặc quạt tản nhiệt tự động khi điều kiện thay đổi.")}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-700 cursor-pointer mt-4">
                    <span>Cấu hình tự động</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 3 */}
              <ScrollReveal delay={300}>
                <div className="group relative p-8 bg-white/80 border border-slate-200/80 hover:border-emerald-500/30 rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.08)] transition-all duration-300 overflow-hidden min-h-[320px] flex flex-col justify-between">
                  <svg className="absolute bottom-[-10px] right-[-10px] w-28 h-28 text-slate-200/50 group-hover:text-emerald-500/[0.04] transition-colors pointer-events-none" viewBox="0 0 100 100">
                    <path d="M 10 90 L 90 90 M 10 90 L 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M 10 80 Q 25 40, 40 60 T 70 20 T 90 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
                    <path d="M 10 80 Q 25 40, 40 60 T 70 20 T 90 40" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>

                  <div>
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-650 border border-emerald-100 shadow-sm relative group-hover:scale-105 transition-transform">
                      <span className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 animate-ping opacity-60" style={{ animationDelay: "0.4s" }} />
                      <TrendingUp size={26} />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900 mt-6 mb-3">
                      {t("landing.features.analytics", "Biểu đồ phân tích")}
                    </h3>
                    <p className="text-slate-655 text-sm leading-relaxed font-semibold">
                      {t("landing.features.analyticsDesc", "Lưu trữ lịch sử đo lường, trực quan hóa xu hướng tăng trưởng bằng biểu đồ và xuất báo cáo dữ liệu định kỳ.")}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-700 cursor-pointer mt-4">
                    <span>Xem báo cáo</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 4 */}
              <ScrollReveal delay={450}>
                <div className="group relative p-8 bg-white/80 border border-slate-200/80 hover:border-emerald-500/30 rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.08)] transition-all duration-300 overflow-hidden min-h-[320px] flex flex-col justify-between">
                  <svg className="absolute bottom-[-10px] right-[-10px] w-28 h-28 text-slate-200/50 group-hover:text-emerald-500/[0.04] transition-colors pointer-events-none" viewBox="0 0 100 100">
                    <path d="M 30 60 A 15 15 0 0 1 45 45 A 20 20 0 0 1 80 50 A 15 15 0 0 1 75 75 L 35 75 A 15 15 0 0 1 30 60 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="45" y1="80" x2="40" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="60" y1="80" x2="55" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="70" y1="80" x2="65" y2="90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>

                  <div>
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-650 border border-emerald-100 shadow-sm relative group-hover:scale-105 transition-transform">
                      <span className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 animate-ping opacity-60" style={{ animationDelay: "0.6s" }} />
                      <Sun size={26} />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900 mt-6 mb-3">
                      {t("landing.features.smartLogic", "AI tránh tưới khi trời mưa")}
                    </h3>
                    <p className="text-slate-655 text-sm leading-relaxed font-semibold">
                      {t("landing.features.smartLogicDesc", "Tích hợp thuật toán dự báo thời tiết cục bộ, tự động tạm hoãn chu kỳ tưới khi trời sắp mưa giúp tiết kiệm nước.")}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-700 cursor-pointer mt-4">
                    <span>Trải nghiệm AI</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </section>

        {/* 4. ROI / Interactive Savings Calculator */}
        <section id="roi" className="py-24 bg-transparent scroll-mt-16 relative">
          <div className="absolute bottom-[5%] left-[5%] w-[450px] h-[450px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left side text and slider */}
              <div className="lg:col-span-7">
                <ScrollReveal delay={0}>
                  <div className="space-y-6">
                    <h2 className="text-3xl sm:text-4xl font-black font-heading text-slate-900">
                      {t("landing.roi.title", "Ước Tính Tài Nguyên Tiết Kiệm")}
                    </h2>
                    <p className="text-slate-650 text-base sm:text-lg leading-relaxed font-semibold">
                      {t("landing.roi.subtitle", "EcoGreen giúp bạn tối ưu lượng nước tưới và tiết kiệm điện năng cho hệ thống bơm quạt. Hãy kéo thanh trượt điều chỉnh diện tích nông trại của bạn dưới đây để xem số liệu tiết kiệm ước tính:")}
                    </p>

                    {/* Slider Controller Card */}
                    <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-100/50">
                      <div className="flex justify-between items-center mb-5">
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                          {t("landing.roi.farmSize", "Diện tích vườn canh tác")}
                        </span>
                        <span className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl font-black font-mono text-base border border-emerald-100 shadow-sm">
                          {farmSize} m²
                        </span>
                      </div>

                      <div className="relative mb-8">
                        {/* Slider Fill Track */}
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 h-2.5 bg-emerald-100/85 rounded-full w-full pointer-events-none" />
                        <div 
                          className="absolute top-1/2 left-0 -translate-y-1/2 h-2.5 bg-emerald-600 rounded-full pointer-events-none"
                          style={{ width: `${Math.min(100, Math.max(0, (farmSize - 20) / (2000 - 20) * 100))}%` }}
                        />
                        
                        <input 
                          type="range"
                          min={20}
                          max={2000}
                          step={10}
                          value={farmSize}
                          onChange={(e) => setFarmSize(parseInt(e.target.value))}
                          className="w-full h-2.5 opacity-0 cursor-pointer relative z-10"
                        />
                      </div>

                      {/* Labels */}
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>20 m²</span>
                        <span>500 m²</span>
                        <span>1000 m²</span>
                        <span>1500 m²</span>
                        <span>2000 m²</span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Right side outputs */}
              <div className="lg:col-span-5">
                <ScrollReveal delay={150}>
                  <div className="bg-[#062c19]/95 border border-emerald-800/80 p-7 sm:p-8 rounded-3xl shadow-[0_20px_45px_rgba(0,0,0,0.2)] text-white space-y-6 relative overflow-hidden">
                    
                    {/* Glowing light detail */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Metric 1 */}
                    <div className="flex items-center gap-4.5 pb-4.5 border-b border-emerald-800/50">
                      <div className="w-12 h-12 bg-emerald-950/80 text-emerald-400 border border-emerald-900/30 rounded-2xl flex items-center justify-center shadow-md animate-pulse">
                        <Droplets size={22} className="fill-emerald-500/10" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
                          {t("landing.roi.waterSaved", "Nước tiết kiệm / Ngày")}
                        </div>
                        <div className="text-2xl font-black tracking-tight mt-0.5">
                          {waterSavedPerDay.toLocaleString()} {t("landing.roi.liters", "Lít")}
                        </div>
                      </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="flex items-center gap-4.5 pb-4.5 border-b border-emerald-800/50">
                      <div className="w-12 h-12 bg-emerald-950/80 text-emerald-400 border border-emerald-900/30 rounded-2xl flex items-center justify-center shadow-md">
                        <Sun size={22} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
                          {t("landing.roi.powerSaved", "Điện năng tiết kiệm / Tháng")}
                        </div>
                        <div className="text-2xl font-black tracking-tight mt-0.5">
                          {electricitySavedPerMonth.toLocaleString()} {t("landing.roi.kwh", "kWh")}
                        </div>
                      </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="flex items-center gap-4.5 pb-4.5 border-b border-emerald-800/50">
                      <div className="w-12 h-12 bg-emerald-950/80 text-emerald-450 border border-emerald-900/30 rounded-2xl flex items-center justify-center shadow-md">
                        <Sprout size={22} className="fill-emerald-500/10" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
                          {t("landing.roi.yieldIncrease", "Năng suất tăng trưởng")}
                        </div>
                        <div className="text-2xl font-black tracking-tight text-emerald-400 mt-0.5">
                          + {yieldPercentage}%
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="bg-[#031c0e] border border-emerald-800/60 p-4.5 rounded-2xl text-center shadow-inner">
                        <div className="text-xs text-emerald-400/80 font-bold mb-1">
                          {t("landing.roi.moneySaved", "Tiết kiệm ước tính / Tháng")}
                        </div>
                        <div className="text-3xl font-black text-emerald-300 tracking-tight glow-green">
                          {formattedSavings}
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-emerald-555 text-center italic font-semibold">
                      {t("landing.roi.calcNote", "* Chỉ số ước tính trên thực tế áp dụng cơ chế tưới nhỏ giọt và quạt đối lưu.")}
                    </p>
                  </div>
                </ScrollReveal>
              </div>
            </div>

          </div>
        </section>

        {/* 5. Refined Metrics & Impact Stats */}
        <section id="stats" className="py-28 bg-[#fcfefe]/35 border-t border-emerald-500/10 scroll-mt-16 backdrop-blur-md relative">
          <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
            
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight">
                  {t("landing.stats.title", "Độ Bền Bỉ Và Chỉ Số Vận Hành")}
                </h2>
                <div className="w-16 h-1 bg-emerald-650 mx-auto rounded-full mt-2" />
                <p className="text-slate-600 text-base sm:text-lg font-semibold">
                  {t("landing.stats.subtitle", "Hệ thống EcoGreen được thiết kế với chuẩn công nghiệp, hoạt động trơn tru 24/7.")}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Stat 1 */}
              <ScrollReveal delay={0}>
                <div className="bg-white/80 border border-slate-200/80 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 relative group flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="40" 
                        stroke="#059669" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray="251.2" 
                        strokeDashoffset="0.25" 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out group-hover:stroke-emerald-655"
                      />
                    </svg>
                    <span className="absolute font-black text-slate-900 text-base tracking-tighter">99.9%</span>
                  </div>

                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 absolute top-4 right-4 shadow-sm">
                    <ShieldCheck size={16} />
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 mb-2">
                    {t("landing.stats.uptime", "Cam kết hoạt động Uptime")}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {t("landing.stats.uptimeDesc", "Bộ điều khiển hỗ trợ tự lưu trữ lịch trình và tự chạy offline ngay cả khi mất mạng internet.")}
                  </p>
                </div>
              </ScrollReveal>

              {/* Stat 2 */}
              <ScrollReveal delay={150}>
                <div className="bg-white/80 border border-slate-200/80 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 relative group flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-6 bg-emerald-50/50 rounded-full border border-emerald-100/50 shadow-inner">
                    <svg className="w-12 h-16 text-emerald-600 overflow-hidden relative" viewBox="0 0 30 40">
                      <path 
                        d="M15,3 C15,3 3,18 3,26 C3,32 8,37 15,37 C22,37 27,32 27,26 C27,18 15,3 15,3 Z" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                      />
                      <path 
                        d="M15,3 C15,3 3,18 3,26 C3,32 8,37 15,37 C22,37 27,32 27,26 C27,18 15,3 15,3 Z" 
                        fill="currentColor" 
                        className="text-emerald-500/80 animate-[liquidWave_8s_ease-in-out_infinite]"
                        clipPath="inset(50% 0% 0% 0%)"
                      />
                    </svg>
                    <span className="absolute font-black text-emerald-955 text-sm tracking-tighter mt-4">+30%</span>
                  </div>

                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 absolute top-4 right-4 shadow-sm">
                    <Droplets size={16} />
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 mb-2">
                    {t("landing.stats.waterSaved", "Tiết kiệm nước tưới")}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {t("landing.stats.waterSavedDesc", "Tưới chính xác dựa trên phản hồi của cảm biến độ ẩm đất ẩm, tránh lãng phí nước thừa.")}
                  </p>
                </div>
              </ScrollReveal>

              {/* Stat 3 */}
              <ScrollReveal delay={300}>
                <div className="bg-white/80 border border-slate-200/80 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 relative group flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-6 bg-emerald-50/50 rounded-full border border-emerald-100/50 shadow-inner">
                    <svg className="w-12 h-12 text-emerald-600" viewBox="0 0 40 40">
                      <line x1="5" y1="35" x2="35" y2="35" stroke="currentColor" strokeWidth="2" />
                      <rect x="8" y="22" width="6" height="13" fill="currentColor" className="opacity-40" />
                      <rect x="17" y="14" width="6" height="21" fill="currentColor" className="opacity-60 animate-[pulse_2s_infinite]" />
                      <rect x="26" y="6" width="6" height="29" fill="currentColor" />
                      <path d="M 8 20 L 17 12 L 27 4 L 32 8" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                      <polygon points="32,2 35,8 29,8" fill="#059669" />
                    </svg>
                    <span className="absolute font-black text-emerald-955 text-xs tracking-tighter mt-12 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">+45%</span>
                  </div>

                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 absolute top-4 right-4 shadow-sm">
                    <Sprout size={16} />
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 mb-2">
                    {t("landing.stats.yield", "Gia tăng năng suất trung bình")}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {t("landing.stats.yieldDesc", "Giữ các điều kiện vi khí hậu tối ưu liên tục giúp cây trồng sinh trưởng khỏe mạnh nhất.")}
                  </p>
                </div>
              </ScrollReveal>

              {/* Stat 4 */}
              <ScrollReveal delay={450}>
                <div className="bg-white/80 border border-slate-200/80 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 relative group flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-6 bg-emerald-50/50 rounded-full border border-emerald-100/50 shadow-inner">
                    <svg className="w-14 h-14 text-emerald-600" viewBox="0 0 40 40">
                      <circle cx="20" cy="22" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
                      <line x1="20" y1="8" x2="20" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="14" y1="5" x2="26" y2="5" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M 20 22 L 27 15" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: "20px 22px" }} />
                    </svg>
                    <span className="absolute font-black text-emerald-955 text-sm tracking-tighter mt-12 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-250">&lt; 2s</span>
                  </div>

                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 absolute top-4 right-4 shadow-sm">
                    <Clock size={16} />
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 mb-2">
                    {t("landing.stats.latency", "Độ trễ điều khiển")}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {t("landing.stats.latencyDesc", "Sử dụng giao thức WebSocket kết nối trực tiếp, bật/tắt thiết bị tức thì qua bảng điều khiển.")}
                  </p>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </section>

        {/* 6. Contact & Footer */}
        <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
              {/* Brand and tagline */}
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                    <Leaf size={18} className="fill-white" />
                  </div>
                  <span className="text-lg font-bold text-white font-heading tracking-tight">EcoGreen</span>
                </div>
                <p className="text-sm text-slate-455 max-w-sm font-semibold leading-relaxed">
                  {t("landing.footer.tagline", "Đồng hành cùng nhà nông ứng dụng công nghệ IoT và AI để xây dựng tương lai nông nghiệp thông minh bền vững.")}
                </p>
              </div>

              {/* Footer columns */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                    {t("landing.footer.product", "Sản phẩm")}
                  </h5>
                  <ul className="space-y-2 text-xs font-bold">
                    <li><a href="#features" className="hover:text-white transition-colors">{t("landing.nav.features", "Tính năng")}</a></li>
                    <li><a href="#roi" className="hover:text-white transition-colors">{t("landing.nav.roi", "ROI")}</a></li>
                    <li><a href="#preview" className="hover:text-white transition-colors">{t("landing.nav.preview", "ESP32 Node")}</a></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                    {t("landing.footer.support", "Hỗ trợ")}
                  </h5>
                  <ul className="space-y-2 text-xs font-bold">
                    <li><a href="#" className="hover:text-white transition-colors">{t("landing.hero.viewDocs", "Tài liệu kỹ thuật")}</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">API References</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                  </ul>
                </div>

                <div className="space-y-3 col-span-2 sm:col-span-1">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                    {t("landing.footer.contact", "Liên hệ")}
                  </h5>
                  <ul className="space-y-2 text-xs font-bold text-slate-400">
                    <li>Email: support@ecogreen.io</li>
                    <li>Hotline: 1900-5888</li>
                    <li>Q.9, TP. Hồ Chí Minh, Việt Nam</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Copyright bar */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
              <p>{t("landing.footer.copyright", "© 2026 EcoGreen System. Bảo lưu mọi quyền.")}</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
                <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
              </div>
            </div>

          </div>
        </footer>

      </div>

      {/* Styled JSX for Glow and Floating elements */}
      <style jsx global>{`
        .glow-amber {
          text-shadow: 0 0 10px rgba(251, 146, 60, 0.4);
        }
        .glow-blue {
          text-shadow: 0 0 10px rgba(96, 165, 250, 0.4);
        }
        .glow-green {
          text-shadow: 0 0 10px rgba(52, 211, 153, 0.4);
        }

        /* Upgraded animations */
        @keyframes floatSlow1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-40px) rotate(15deg); opacity: 0.3; }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
          50% { transform: translateY(-30px) rotate(-10deg); opacity: 0.25; }
        }
        @keyframes floatSlow3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
          50% { transform: translateY(-35px) rotate(12deg); opacity: 0.25; }
        }
        @keyframes floatSlow4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-45px) rotate(-15deg); opacity: 0.3; }
        }

        @keyframes pulseGlowSlow1 {
          0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.8; }
          50% { transform: scale(1.1) translate(30px, -30px); opacity: 1; }
        }
        @keyframes pulseGlowSlow2 {
          0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.7; }
          50% { transform: scale(1.15) translate(-30px, 20px); opacity: 0.9; }
        }
        @keyframes pulseGlowSlow3 {
          0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.6; }
          50% { transform: scale(1.08) translate(20px, 30px); opacity: 0.8; }
        }

        @keyframes liquidWave {
          0%, 100% { clip-path: inset(55% 0% 0% 0%); }
          50% { clip-path: inset(45% 0% 0% 0%); }
        }

        .animate-float-slow-1 {
          animation: floatSlow1 16s ease-in-out infinite;
        }
        .animate-float-slow-2 {
          animation: floatSlow2 20s ease-in-out infinite;
        }
        .animate-float-slow-3 {
          animation: floatSlow3 18s ease-in-out infinite;
        }
        .animate-float-slow-4 {
          animation: floatSlow4 22s ease-in-out infinite;
        }

        .animate-pulse-glow-1 {
          animation: pulseGlowSlow1 18s ease-in-out infinite;
        }
        .animate-pulse-glow-2 {
          animation: pulseGlowSlow2 22s ease-in-out infinite;
        }
        .animate-pulse-glow-3 {
          animation: pulseGlowSlow3 20s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}
