"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth.context";
import { Leaf, Loader2, CheckCircle2, XCircle } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleGoogleCallback } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMsg("Bạn đã hủy đăng nhập Google.");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMsg("Không tìm thấy mã xác thực từ Google.");
      return;
    }

    // Gửi code lên backend để đổi lấy JWT
    handleGoogleCallback(code)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.replace("/dashboard"), 1500);
      })
      .catch((err: any) => {
        setStatus("error");
        setErrorMsg(err.message || "Đăng nhập Google thất bại!");
      });
  }, [searchParams, handleGoogleCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0f] via-[#0d2818] to-[#071510]">
      <div className="text-center p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl max-w-md w-full mx-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
            <Leaf size={24} />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
            EcoGreen
          </span>
        </div>

        {/* Status */}
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 size={48} className="mx-auto text-green-400 animate-spin" />
            <h2 className="text-xl font-semibold text-white/90">
              Đang xác thực...
            </h2>
            <p className="text-white/40 text-sm">
              Vui lòng chờ trong khi chúng tôi hoàn tất đăng nhập Google
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-green-400" />
            <h2 className="text-xl font-semibold text-white/90">
              Đăng nhập thành công! 🎉
            </h2>
            <p className="text-white/40 text-sm">
              Đang chuyển hướng đến Dashboard...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle size={48} className="mx-auto text-red-400" />
            <h2 className="text-xl font-semibold text-white/90">
              Đăng nhập thất bại
            </h2>
            <p className="text-red-300/70 text-sm">{errorMsg}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/15 transition-all border border-white/10 text-sm font-medium"
            >
              ← Quay lại trang đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0f] via-[#0d2818] to-[#071510]">
          <Loader2 size={40} className="text-green-400 animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
