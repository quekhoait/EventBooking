import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import PreferenceCard from "../../components/User/PreferenceCard";

// Bảng ánh xạ icon & mô tả bổ trợ cho các danh mục từ API
const CATEGORY_META = {
  "Âm nhạc": { icon: "🎵", description: "Concert, festival và live music" },
  "Thể thao": { icon: "⚽", description: "Các giải đấu và sự kiện thể thao" },
  "Công nghệ": { icon: "💻", description: "Tech, startup và innovation" },
  "Kinh doanh": { icon: "💼", description: "Business, networking và workshop" },
  "Nghệ thuật": { icon: "🎨", description: "Triển lãm và nghệ thuật" },
  "Ẩm thực": { icon: "🍜", description: "Food festival và trải nghiệm ẩm thực" },
  "Giáo dục": { icon: "📚", description: "Seminar, talkshow và workshop" },
  "Cộng đồng": { icon: "🤝", description: "Hoạt động cộng đồng và networking" },
};

export default function PreferencePage() {
  const navigate = useNavigate();
  const { categories, loading } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Lọc bỏ mục "Tất cả" (id: null) lấy từ hook useCategories
  const displayCategories = categories.filter((cat) => cat.id !== null);

  const toggleCategory = (id) => {
    setSelectedCategories((current) => {
      if (current.includes(id)) {
        return current.filter((categoryId) => categoryId !== id);
      }
      return [...current, id];
    });
  };

  const handleContinue = () => {
    console.log("Selected categories:", selectedCategories);
    navigate("/events");
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-5xl flex-col justify-center">
        {/* Header */}
        <header className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] font-bold tracking-[4px] text-[#E85B2A]">
            HOKIINUVA EVENTS
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-[-1px] text-white sm:text-4xl">
            Bạn yêu thích thể loại nào
            <span className="text-[#E85B2A]">?</span>
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#8A8781]">
            Chọn một hoặc nhiều thể loại bạn quan tâm để có trải nghiệm phù hợp
            hơn.
          </p>
        </header>

        {/* Dynamic Categories Grid */}
        {loading ? (
          <div className="mt-10 py-16 text-center text-sm text-[#8A8781]">
            Đang tải danh sách thể loại...
          </div>
        ) : (
          <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayCategories.map((category) => {
              const meta = CATEGORY_META[category.name] || {};
              const title = category.name || category.title;
              const description =
                category.description ||
                meta.description ||
                "Khám phá các sự kiện hấp dẫn";
              const icon = category.icon || meta.icon || "🏷️";

              return (
                <PreferenceCard
                  key={category.id}
                  title={title}
                  description={description}
                  icon={icon}
                  selected={selectedCategories.includes(category.id)}
                  onClick={() => toggleCategory(category.id)}
                />
              );
            })}
          </section>
        )}

        {/* Actions */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading || selectedCategories.length === 0}
            className="h-[52px] w-full max-w-[320px] rounded-lg bg-[#E85B2A] text-[10px] font-bold tracking-[3px] text-white transition hover:bg-[#D94F22] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            TIẾP TỤC ({selectedCategories.length})
          </button>

          <button
            type="button"
            onClick={() => navigate("/events")}
            className="text-xs text-[#77736D] transition hover:text-white"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </main>
  );
}