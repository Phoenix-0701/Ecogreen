import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-5xl font-bold text-green-700 mb-4">
        🌿 EcoGreen IoT System
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl">
        Hệ thống quản lý và giám sát nông nghiệp thông minh. Giám sát nhiệt độ,
        độ ẩm và điều khiển máy bơm tự động.
      </p>

      {/* Nút bấm chuyển hướng sang trang Dashboard */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full font-semibold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
      >
        Dashboard
        <ArrowRight size={20} />
      </Link>
    </div>
  );
}
