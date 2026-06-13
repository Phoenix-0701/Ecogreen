"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Leaf, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleGoogleCallback } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const code = searchParams?.get("code") ?? "";
  const callbackError = searchParams?.get("error");
  const validationError = !searchParams
    ? "Khong the doc tham so callback tu Google."
    : callbackError
      ? "Ban da huy dang nhap Google."
      : !code
        ? "Khong tim thay ma xac thuc tu Google."
        : "";

  useEffect(() => {
    if (validationError || !code) {
      return;
    }

    let mounted = true;

    handleGoogleCallback(code)
      .then(() => {
        if (!mounted) return;
        setStatus("success");
        setTimeout(() => router.replace("/dashboard"), 1500);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Dang nhap Google that bai!",
        );
      });

    return () => {
      mounted = false;
    };
  }, [code, validationError, handleGoogleCallback, router]);

  const currentStatus = validationError ? "error" : status;
  const currentErrorMsg = validationError || errorMsg;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0f] via-[#0d2818] to-[#071510]">
      <div className="text-center p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
            <Leaf size={24} />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
            EcoGreen
          </span>
        </div>

        {currentStatus === "loading" && (
          <div className="space-y-4">
            <Loader2 size={48} className="mx-auto text-green-400 animate-spin" />
            <h2 className="text-xl font-semibold text-white/90">
              Dang xac thuc...
            </h2>
            <p className="text-white/40 text-sm">
              Vui long cho trong khi he thong hoan tat dang nhap Google.
            </p>
          </div>
        )}

        {currentStatus === "success" && (
          <div className="space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-green-400" />
            <h2 className="text-xl font-semibold text-white/90">
              Dang nhap thanh cong!
            </h2>
            <p className="text-white/40 text-sm">
              Dang chuyen huong den dashboard...
            </p>
          </div>
        )}

        {currentStatus === "error" && (
          <div className="space-y-4">
            <XCircle size={48} className="mx-auto text-red-400" />
            <h2 className="text-xl font-semibold text-white/90">
              Dang nhap that bai
            </h2>
            <p className="text-red-300/70 text-sm">{currentErrorMsg}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/15 transition-all border border-white/10 text-sm font-medium"
              type="button"
            >
              Quay lai trang dang nhap
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
