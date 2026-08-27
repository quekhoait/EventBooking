import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import authService from "../../services/authServices";

// Bảng ánh xạ Icon động theo tên thể loại
const getCategoryIcon = (category) => {
  if (category.icon) return category.icon;
  const name = String(category.name || "").toLowerCase();

  if (name.includes("nhạc") || name.includes("music")) return "🎵";
  if (name.includes("thể thao") || name.includes("sport")) return "⚽";
  if (name.includes("công nghệ") || name.includes("tech")) return "💻";
  if (name.includes("kinh doanh") || name.includes("business")) return "💼";
  if (name.includes("nghệ thuật") || name.includes("art")) return "🎨";
  if (name.includes("ẩm thực") || name.includes("food")) return "🍜";
  if (name.includes("giáo dục") || name.includes("edu") || name.includes("học"))
    return "📚";
  if (name.includes("cộng đồng") || name.includes("community")) return "🤝";
  if (name.includes("game") || name.includes("esport")) return "🎮";
  if (name.includes("du lịch") || name.includes("travel")) return "✈️";
  if (name.includes("phim") || name.includes("cinema")) return "🎬";
  if (name.includes("thời trang") || name.includes("fashion")) return "✨";
  return "🎪";
};

export default function SelectPreferencesPage() {
  const navigate = useNavigate();
  const { user, loginUser } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();

  const [selectedIds, setSelectedIds] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lọc bỏ danh mục "Tất cả" (id: null)
  const validCategories = (categories || []).filter((cat) => cat.id !== null);

  // Tải các thể loại người dùng đã chọn trước đó (nếu có)
  useEffect(() => {
    const fetchExistingPreferences = async () => {
      if (!user?.id) {
        setInitialLoading(false);
        return;
      }
      try {
        const res = await authService.getUserPreferences(user.id);
        const data = res?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          const preSelected = data.map((item) => item.category_id);
          setSelectedIds(preSelected);
        }
      } catch (err) {
        console.warn("Không thể tải preferences trước đó:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchExistingPreferences();
  }, [user?.id]);

  // Bật/tắt chọn danh mục
  const toggleCategory = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    if (errorMsg) setErrorMsg("");
  };

  // Chọn tất cả hoặc Bỏ chọn tất cả
  const handleSelectAll = () => {
    if (selectedIds.length === validCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(validCategories.map((cat) => cat.id));
    }
  };

  // Lưu sở thích vào database và chuyển trang
  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 thể loại bạn quan tâm!");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      await authService.updatePreferences({
        userId: user?.id,
        categoryIds: selectedIds,
      });

      // Cập nhật trạng thái has_preferences trong AuthContext
      loginUser({
        ...user,
        has_preferences: true,
      });

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Lỗi khi lưu tùy chọn:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Không thể lưu tùy chọn. Vui lòng thử lại!",
      );
    } finally {
      setSaving(false);
    }
  };

  const isLoading = categoriesLoading || initialLoading;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4 py-12 sm:px-6">
      {/* Background glow décor */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#E85B2A]/10 blur-[140px]" />

      <section className="relative w-full max-w-[620px] rounded-3xl border border-[#2A2A2A] bg-[#161616] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:p-10">
        {/* Header */}
        <header className="text-center">
          <span className="inline-block rounded-full bg-[#E85B2A]/10 px-3.5 py-1 text-[10px] font-bold tracking-[3px] text-[#E85B2A]">
            CÁ NHÂN HÓA TRẢI NGHIỆM
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Bạn quan tâm chủ đề nào?
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#8A8781] sm:text-sm">
            Chọn các thể loại yêu thích để hệ thống gợi ý sự kiện phù hợp nhất
            dành riêng cho bạn.
          </p>
        </header>

        {/* Quick Toolbar */}
        <div className="mt-6 flex items-center justify-between border-b border-[#262626] pb-3 text-xs">
          <span className="text-[#8A8781]">
            Đã chọn:{" "}
            <strong className="text-[#E85B2A]">{selectedIds.length}</strong> thể
            loại
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="font-medium text-[#8A8781] transition hover:text-white"
          >
            {selectedIds.length === validCategories.length
              ? "Bỏ chọn tất cả"
              : "Chọn tất cả"}
          </button>
        </div>

        {/* Thông báo lỗi */}
        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-center text-xs font-semibold text-red-400 animate-fade-in">
            {errorMsg}
          </div>
        )}

        {/* Danh sách danh mục */}
        <div className="mt-4 grid max-h-[48vh] grid-cols-1 gap-2.5 overflow-y-auto pr-1.5 sm:grid-cols-2">
          {isLoading
            ? // Skeleton Loading State
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex h-[62px] animate-pulse items-center rounded-2xl border border-[#262626] bg-[#1E1E1E] p-3.5"
                >
                  <div className="h-9 w-9 rounded-xl bg-[#2C2C2C]" />
                  <div className="ml-3 h-4 w-24 rounded bg-[#2C2C2C]" />
                </div>
              ))
            : validCategories.map((cat) => {
                const isSelected = selectedIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`group flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-[#E85B2A] bg-[#E85B2A]/15 shadow-[0_0_20px_rgba(232,91,42,0.15)]"
                        : "border-[#262626] bg-[#1B1B1B] hover:border-[#3F3F3F] hover:bg-[#202020]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-transform duration-200 group-hover:scale-110 ${
                          isSelected
                            ? "bg-[#E85B2A] text-white"
                            : "bg-[#252525] text-white"
                        }`}
                      >
                        {getCategoryIcon(cat)}
                      </span>
                      <span
                        className={`text-xs font-semibold sm:text-sm ${
                          isSelected ? "text-[#E85B2A]" : "text-white"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>

                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                        isSelected
                          ? "border-[#E85B2A] bg-[#E85B2A] text-white"
                          : "border-[#3A3A3A] bg-transparent text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
        </div>

        {/* Footer Actions */}
        <footer className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled={saving || isLoading}
            onClick={handleSave}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#E85B2A] text-xs font-bold tracking-[2px] text-white transition duration-200 hover:bg-[#D94F22] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "ĐANG LƯU..."
              : `XÁC NHẬN VÀ TIẾP TỤC (${selectedIds.length})`}
          </button>

          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="text-center text-xs font-medium text-[#77736D] transition hover:text-white"
          >
            Để sau, vào trang chủ
          </button>
        </footer>
      </section>
    </main>
  );
}
