import React from "react";
import AuthButton from "../Auth/AuthButton";

export default function PreferenceModal({
  isOpen = false,
  onClose,
  categories = [],
  selectedIds = [],
  onToggleCategory,
  onSave,
}) {
  if (!isOpen) return null;

  const handleSaveAndClose = () => {
    if (onSave) onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <section className="relative w-full max-w-[560px] rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)] sm:p-8">
        
   
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-[#8A8781] transition hover:bg-black/5 hover:text-[#171717]"
        >
          ✕
        </button>

   
        <header className="mb-6">
          <span className="text-[10px] font-bold tracking-[4px] text-[#171717]">
            TÙY CHỈNH SỰ KIỆN
          </span>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#E85B2A]">
            Chọn thể loại yêu thích
          </h2>
          <p className="mt-1 text-xs text-[#5F5C57]">
            Chọn các chủ đề bạn quan tâm để hệ thống gợi ý sự kiện phù hợp nhất.
          </p>
        </header>

   
        <div className="grid max-h-[55vh] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {categories.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggleCategory(cat.id)}
                className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-[#E85B2A] bg-[#E85B2A]/10 font-bold text-[#E85B2A] ring-1 ring-[#E85B2A]"
                    : "border-[#D6D1C8] bg-white text-[#171717] hover:border-[#8A8781]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-semibold sm:text-sm">{cat.name}</span>
                </div>

                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                    isSelected
                      ? "border-[#E85B2A] bg-[#E85B2A] text-white"
                      : "border-[#D6D1C8] bg-transparent"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

   
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#D6D1C8] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#5F5C57] transition hover:bg-black/5"
          >
            Đóng
          </button>
          <div className="w-44">
            <AuthButton onClick={handleSaveAndClose}>
              XÁC NHẬN ({selectedIds.length})
            </AuthButton>
          </div>
        </div>

      </section>
    </div>
  );
}