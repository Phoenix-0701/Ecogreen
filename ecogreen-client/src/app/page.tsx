"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth.context";
import { Leaf, Loader2 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a0f] via-[#0d2818] to-[#071510] flex flex-col items-center justify-center text-center p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
          <Leaf size={28} />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
          EcoGreen
        </h1>
      </div>
      <Loader2 size={28} className="text-green-400 animate-spin" />
      <p className="text-white/40 text-sm mt-4">Đang chuyển hướng...</p>
    </div>
  );
}
