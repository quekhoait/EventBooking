import React from "react";

export default function PreferenceModal({
  isOpen,
  onClose,
  categories = [],
  selectedIds = [],
  onToggleCategory,
  onSave,
  loading = false,
  saveProgress = 0, // Phần trăm tiến độ (0 -> 100)
}) {
  if (!isOpen) return null;

  const isSaveDisabled = selectedIds.length === 0 || loading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm transition-all"
      onClick={!loading ? onClose : undefined}
    >
      <div
        className="relative w-full max-w-[540px] rounded-3xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng modal */}
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg font-bold text-[#8A8781] transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✕
        </button>

        <header className="mb-5">
          <span className="text-[10px] font-bold tracking-[3px] text-[#E85B2A]">
            TÙY CHỌN SỞ THÍCH
          </span>
          <h2 className="mt-1 text-xl font-extrabold text-[#171717] sm:text-2xl">
            Chọn các chủ đề bạn quan tâm
          </h2>
          <p className="mt-1 text-xs text-[#5F5C57]">
            Vui lòng chọn ít nhất 1 thể loại để tiếp tục.
          </p>
        </header>

        {/* Danh sách categories */}
        <div className="grid max-h-[45vh] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {categories.map((cat) => {
            const isSelected = selectedIds.includes(Number(cat.id));
            return (
              <button
                key={cat.id}
                type="button"
                disabled={loading}
                onClick={() => onToggleCategory(Number(cat.id))}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#E85B2A] disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? "border-[#E85B2A] bg-[#E85B2A]/10 font-bold text-[#E85B2A] ring-1 ring-[#E85B2A]"
                    : "border-[#D6D1C8] bg-white text-[#171717] hover:border-[#8A8781]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{cat.icon || "🎪"}</span>
                  <span className="text-xs font-semibold sm:text-sm">{cat.name}</span>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                    isSelected
                      ? "border-[#E85B2A] bg-[#E85B2A] text-white"
                      : "border-[#D6D1C8]"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Thanh Progress Bar hiển thị % khi đang lưu */}
        {loading && (
          <div className="mt-4 rounded-xl border border-[#E85B2A]/20 bg-white p-3 shadow-inner">
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#171717]">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#E85B2A]" />
                Đang lưu thay đổi...
              </span>
              <span className="font-mono text-sm font-extrabold text-[#E85B2A]">
                {saveProgress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E0D8]">
              <div
                className="h-full bg-[#E85B2A] transition-all duration-150 ease-out"
                style={{ width: `${saveProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#D6D1C8]/60 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#D6D1C8] bg-white px-4 py-2.5 text-xs font-bold text-[#5F5C57] transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            HỦY BỎ
          </button>

          <button
            type="button"
            disabled={isSaveDisabled}
            onClick={onSave}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold tracking-wider text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#E85B2A] focus:ring-offset-2 ${
              isSaveDisabled
                ? "cursor-not-allowed bg-[#E85B2A]/50 opacity-60"
                : "cursor-pointer bg-[#E85B2A] shadow-md hover:bg-[#d44d1e] hover:shadow-lg active:scale-95"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>ĐANG XỬ LÝ ({saveProgress}%)</span>
              </>
            ) : (
              `LƯU THAY ĐỔI (${selectedIds.length})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}