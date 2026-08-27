import React, { useState } from "react";
import { Link } from "react-router-dom";

import UserTicketCard from "../../components/User/UserTicketCard";
import UserPreferenceTags from "../../components/User/UserPreferenceTags";
import PreferenceModal from "../../components/User/PreferenceModal";
import ProfileInfoForm from "../../components/User/ProfileInfoForm";

const ALL_CATEGORIES = [
  { id: "music", name: "Âm nhạc & Live Concert", icon: "🎵" },
  { id: "tech", name: "Công nghệ & Startup", icon: "💻" },
  { id: "art", name: "Nghệ thuật & Triển lãm", icon: "🎨" },
  { id: "workshop", name: "Workshop & Giáo dục", icon: "📚" },
  { id: "sports", name: "Thể thao & Fitness", icon: "⚽" },
  { id: "networking", name: "Giao lưu & Doanh nghiệp", icon: "🤝" },
  { id: "food", name: "Ẩm thực & Đồ uống", icon: "🍷" },
  { id: "gaming", name: "Esports & Gaming", icon: "🎮" },
];

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("tickets"); // "tickets" | "profile"
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);

  const [user, setUser] = useState({
    username: "nguyenvana",
    full_name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    phone_number: "0901234567",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    role: "USER",
    is_active: true,
    is_verified: true,
    company_id: null,
    preferences: ["music", "tech", "gaming"],
  });

  const [tickets] = useState([
    {
      id: "TKT-2026-9871",
      eventName: "TechFest Vietnam 2026: AI & The Future",
      organizer: "Hokinuva Media",
      category: "Công nghệ & Startup",
      date: "15/10/2026",
      time: "08:30 - 17:30",
      location: "Trung tâm SECC, Quận 7, TP.HCM",
      ticketType: "VIP Pass",
      quantity: 1,
      totalPrice: "850.000đ",
      status: "CONFIRMED",
      qrCodeUrl:
        "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-2026-9871",
    },
    {
      id: "TKT-2026-4412",
      eventName: "Indie Acoustic Night - Saigon Sunset Live",
      organizer: "Acoustic Hub",
      category: "Âm nhạc & Live Concert",
      date: "28/09/2026",
      time: "19:30 - 22:00",
      location: "Nhà hát Bến Thành, Quận 1, TP.HCM",
      ticketType: "Standard - Early Bird",
      quantity: 2,
      totalPrice: "600.000đ",
      status: "CONFIRMED",
      qrCodeUrl:
        "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-2026-4412",
    },
  ]);

  const handleToggleCategory = (id) => {
    setUser((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(id)
        ? prev.preferences.filter((item) => item !== id)
        : [...prev.preferences, id],
    }));
  };

  const handleSavePreferences = () => {
    console.log("Saved Preferences to Backend:", user.preferences);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUser((prev) => ({
      ...prev,
      full_name: formData.get("full_name"),
      phone_number: formData.get("phone_number"),
    }));
    alert("Đã cập nhật thông tin thành công!");
  };

  return (
    <>
      <main className="min-h-screen bg-[#0D0D0D] px-4 py-8 text-[#171717] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          
   
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8A8781] hover:text-[#E85B2A]"
            >
              ← QUAY LẠI TRANG CHỦ
            </Link>
            <span className="text-[10px] font-bold tracking-[4px] text-[#8A8781]">
              HOKINUVA ACCOUNT
            </span>
          </div>

   
          <section className="mb-8 overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.3)] sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              
   
              <div className="relative">
                <img
                  src={user.avatar || "/static/image/icon_user.png"}
                  alt={user.full_name || user.username}
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                  }}
                  className="h-24 w-24 rounded-full border-2 border-[#E85B2A] object-cover shadow-md"
                />
                <span className="absolute bottom-0 right-0 rounded-full bg-[#E85B2A] px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {user.role === "USER" ? "Cá nhân" : user.role}
                </span>
              </div>

   
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-black tracking-tight text-[#171717] sm:text-3xl">
                  {user.full_name || user.username}
                </h1>
                <p className="mt-1 text-sm font-medium text-[#5F5C57]">
                  {user.email}
                </p>

   
                <div className="mt-3 flex justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D1C8] bg-white px-3 py-1 text-xs font-semibold text-[#171717] shadow-sm">
                    <span className="text-[#E85B2A]">🎟️</span> {tickets.length} Vé đã đăng ký
                  </span>
                </div>

   
                <UserPreferenceTags
                  allCategories={ALL_CATEGORIES}
                  selectedIds={user.preferences}
                  onToggleCategory={handleToggleCategory}
                  onOpenModal={() => setIsPreferenceModalOpen(true)}
                />
              </div>
            </div>

   
            <div className="mt-8 flex border-b border-[#D6D1C8]">
              <button
                type="button"
                onClick={() => setActiveTab("tickets")}
                className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                  activeTab === "tickets"
                    ? "border-[#E85B2A] text-[#E85B2A]"
                    : "border-transparent text-[#5F5C57] hover:text-[#171717]"
                }`}
              >
                VÉ CỦA TÔI ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                  activeTab === "profile"
                    ? "border-[#E85B2A] text-[#E85B2A]"
                    : "border-transparent text-[#5F5C57] hover:text-[#171717]"
                }`}
              >
                THÔNG TIN TÀI KHOẢN
              </button>
            </div>
          </section>

   
          {activeTab === "tickets" && (
            <div className="space-y-6">
              {tickets.length === 0 ? (
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-12 text-center">
                  <p className="text-4xl">🎫</p>
                  <h3 className="mt-3 text-lg font-bold text-[#171717]">
                    Chưa có vé nào
                  </h3>
                  <p className="mt-1 text-xs text-[#5F5C57]">
                    Bạn chưa đăng ký hoặc mua vé cho sự kiện nào.
                  </p>
                  <Link
                    to="/"
                    className="mt-5 inline-block rounded-xl bg-[#E85B2A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#d44d1e]"
                  >
                    KHÁM PHÁ SỰ KIỆN
                  </Link>
                </div>
              ) : (
                tickets.map((tkt) => (
                  <UserTicketCard key={tkt.id} ticket={tkt} />
                ))
              )}
            </div>
          )}

   
          {activeTab === "profile" && (
            <ProfileInfoForm user={user} onSubmit={handleUpdateProfile} />
          )}

        </div>
      </main>

   
      <PreferenceModal
        isOpen={isPreferenceModalOpen}
        onClose={() => setIsPreferenceModalOpen(false)}
        categories={ALL_CATEGORIES}
        selectedIds={user.preferences}
        onToggleCategory={handleToggleCategory}
        onSave={handleSavePreferences}
      />
    </>
  );
}