import React from "react";

export default function UserPreferenceTags({
  allCategories = [],
  selectedIds = [],
  onToggleCategory,
  onOpenModal,
}) {
  return (
    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
   
      {selectedIds.map((prefId) => {
        const cat = allCategories.find((c) => c.id === prefId);
        if (!cat) return null;

        return (
          <span
            key={cat.id}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-[#E85B2A]/20 bg-[#E85B2A]/10 px-2.5 py-1 text-xs font-semibold text-[#E85B2A] transition-all hover:border-[#E85B2A]/40"
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            <button
              type="button"
              title={`Xóa ${cat.name}`}
              onClick={() => onToggleCategory(cat.id)}
              className="ml-0.5 text-[#E85B2A]/60 hover:text-[#E85B2A]"
            >
              ✕
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={onOpenModal}
        className="inline-flex h-7 items-center gap-1 rounded-lg border border-dashed border-[#8A8781] bg-white/60 px-2.5 text-xs font-bold text-[#5F5C57] transition hover:border-[#E85B2A] hover:text-[#E85B2A]"
        title="Thêm sở thích mới"
      >
        <span>+</span>
        <span>Thêm sở thích</span>
      </button>
    </div>
  );
}