import React from "react";

export default function GlobalLoadingOverlay({
  isLoading = false,
  progress = 0,
  title = "Đang lưu thay đổi...",
  description = "Vui lòng chờ trong giây lát",
}) {
  if (!isLoading) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all duration-300 animate-fade-in"
    >
      <div className="relative flex w-full max-w-[360px] flex-col items-center rounded-3xl border border-[#2A2A2A] bg-[#161616] p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
        {/* Vòng tròn loading xoay kết hợp logo icon */}
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#2A2A2A]" />
          <div
            className="absolute inset-0 rounded-full border-4 border-[#E85B2A] border-t-transparent transition-all duration-200 animate-spin"
          />
          <span className="font-mono text-base font-extrabold text-[#E85B2A]">
            {Math.min(Math.max(progress, 0), 100)}%
          </span>
        </div>

        {/* Tiêu đề & mô tả */}
        <h3 className="text-base font-bold text-white sm:text-lg">{title}</h3>
        <p className="mt-1 text-xs text-[#8A8781]">{description}</p>

        {/* Thanh Progress Bar */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[#262626]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E85B2A] to-[#FF8C61] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(232,91,42,0.6)]"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      </div>
    </aside>
  );
}