import { useNavigate } from "react-router-dom";

const categories = [
  {
    name: "Nhạc sống",
    color: "from-[#ff6b12] to-[#8e2412]",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Sân khấu & nghệ thuật",
    color: "from-[#e44b32] to-[#461b20]",
    image:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Thể thao",
    color: "from-[#336d5b] to-[#172d2b]",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Hội thảo & workshop",
    color: "from-[#bd7942] to-[#3c2820]",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=700&q=80",
  },
];

function HomePage({ onCategorySelect }) {
  const navigate = useNavigate();
  const selectCategory = onCategorySelect || ((category) => navigate(`/events?category=${encodeURIComponent(category)}`));
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
      <section
        className="relative overflow-hidden rounded-3xl bg-cover bg-center px-6 py-16 sm:px-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(16,17,18,.96), rgba(16,17,18,.2)), url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1500&q=80')",
        }}
      >
        <div className="relative max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-[#ff985c]">
            Nền tảng trải nghiệm sự kiện
          </p>
          <h1 className="font-display text-6xl font-extrabold uppercase leading-[.85] text-white sm:text-8xl">
            Đi đâu tối nay?
          </h1>
          <p className="mt-5 max-w-md text-sm text-white/65">
            Khám phá những sự kiện đáng nhớ và đặt chỗ cho khoảnh khắc tiếp theo
            của bạn.
          </p>
        </div>
      </section>
      <div className="mb-7 mt-12 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">
            Khám phá
          </p>
          <h2 className="font-display text-4xl font-bold uppercase text-white">
            Chọn thể loại
          </h2>
        </div>
        <span className="text-xs text-white/40">04 danh mục</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => selectCategory(category.name)}
            className={`group relative h-72 overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} text-left`}
          >
            <img
              src={category.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-70 transition duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-x-5 bottom-5 font-display text-3xl font-bold uppercase leading-none text-white">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default HomePage;
