import React, { useState } from "react";
import authService from "../../services/authServices";

const getCategoryIcon = (category) => {
  if (category?.icon) return category.icon;
  const name = String(category?.name || "").toLowerCase();

  if (name.includes("nhạc") || name.includes("music")) return "🎵";
  if (name.includes("thể thao") || name.includes("sport")) return "⚽";
  if (name.includes("công nghệ") || name.includes("tech")) return "💻";
  if (name.includes("kinh doanh") || name.includes("business")) return "💼";
  if (name.includes("nghệ thuật") || name.includes("art")) return "🎨";
  if (name.includes("ẩm thực") || name.includes("food")) return "🍜";
  if (name.includes("giáo dục") || name.includes("học")) return "📚";
  if (name.includes("cộng đồng")) return "🤝";
  if (name.includes("game") || name.includes("esport")) return "🎮";
  if (name.includes("du lịch") || name.includes("travel")) return "✈️";
  if (name.includes("phim") || name.includes("cinema")) return "🎬";
  if (name.includes("thời trang")) return "✨";
  return "🎪";
};

export default function UserPreferenceTags({
  userId,
  allCategories = [],
  selectedIds = [], // Nhận trực tiếp danh sách ID từ cha
  onCategoryDeleted,
  onOpenModal,
  loading = false,
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteItem = async (catId) => {
    if (!userId) return;
    try {
      setDeletingId(catId);
      await authService.deletePreference(catId, userId);
      if (onCategoryDeleted) {
        onCategoryDeleted(catId);
      }
    } catch (error) {
      console.error("Lỗi khi xóa preference:", error);
      alert("Không thể xóa thể loại này. Vui lòng thử lại!");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-3.5 flex items-center gap-2">
        <span className="h-7 w-24 animate-pulse rounded-lg bg-[#E5E0D8]" />
        <span className="h-7 w-28 animate-pulse rounded-lg bg-[#E5E0D8]" />
      </div>
    );
  }

  return (
    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      {selectedIds.length === 0 ? (
        <span className="text-xs italic text-[#8A8781]">Chưa chọn thể loại yêu thích</span>
      ) : (
        selectedIds.map((prefId) => {
          const cat = allCategories.find((c) => Number(c.id) === Number(prefId));
          if (!cat) return null;

          const isDeleting = deletingId === cat.id;

          return (
            <span
              key={cat.id}
              className={`group inline-flex items-center gap-1.5 rounded-lg border border-[#E85B2A]/20 bg-[#E85B2A]/10 px-2.5 py-1 text-xs font-semibold text-[#E85B2A] transition-all hover:border-[#E85B2A]/40 ${
                isDeleting ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span>{cat.name}</span>
              <button
                type="button"
                disabled={isDeleting}
                title={`Xóa ${cat.name}`}
                onClick={() => handleDeleteItem(cat.id)}
                className="ml-0.5 cursor-pointer text-[#E85B2A]/60 hover:text-[#E85B2A]"
              >
                {isDeleting ? "..." : "✕"}
              </button>
            </span>
          );
        })
      )}

      <button
        type="button"
        onClick={onOpenModal}
        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-dashed border-[#8A8781] bg-white/60 px-2.5 text-xs font-bold text-[#5F5C57] transition hover:border-[#E85B2A] hover:text-[#E85B2A]"
      >
        <span>+</span>
        <span>Thêm sở thích</span>
      </button>
    </div>
  );
}