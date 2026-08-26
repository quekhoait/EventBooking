import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PreferenceCard from "../../components/User/PreferenceCard";

const categories = [
  {
    id: 1,
    title: "Âm nhạc",
    description: "Concert, festival và live music",
    icon: "🎵",
  },
  {
    id: 2,
    title: "Thể thao",
    description: "Các giải đấu và sự kiện thể thao",
    icon: "⚽",
  },
  {
    id: 3,
    title: "Công nghệ",
    description: "Tech, startup và innovation",
    icon: "💻",
  },
  {
    id: 4,
    title: "Kinh doanh",
    description: "Business, networking và workshop",
    icon: "💼",
  },
  {
    id: 5,
    title: "Nghệ thuật",
    description: "Triển lãm và nghệ thuật",
    icon: "🎨",
  },
  {
    id: 6,
    title: "Ẩm thực",
    description: "Food festival và trải nghiệm ẩm thực",
    icon: "🍜",
  },
  {
    id: 7,
    title: "Giáo dục",
    description: "Seminar, talkshow và workshop",
    icon: "📚",
  },
  {
    id: 8,
    title: "Cộng đồng",
    description: "Hoạt động cộng đồng và networking",
    icon: "🤝",
  },
];

export default function PreferencePage() {
  const navigate = useNavigate();

  const [selectedCategories, setSelectedCategories] = useState([]);

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

    // Tạm thời chuyển sang events
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
            Chọn một hoặc nhiều thể loại bạn quan tâm để có
            trải nghiệm phù hợp hơn.
          </p>
        </header>

        {/* Categories */}
        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <PreferenceCard
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              selected={selectedCategories.includes(category.id)}
              onClick={() => toggleCategory(category.id)}
            />
          ))}
        </section>

        {/* Actions */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleContinue}
            className="h-[52px] w-full max-w-[320px] rounded-lg bg-[#E85B2A] text-[10px] font-bold tracking-[3px] text-white transition hover:bg-[#D94F22] active:scale-[0.99]"
          >
            TIẾP TỤC
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