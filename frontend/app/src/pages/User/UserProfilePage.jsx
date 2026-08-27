import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import authService from "../../services/authServices";
import companyServices from "../../services/companyServices";
import ProfileHeader from "../../components/User/ProfileHeader";
import ProfileInfoForm from "../../components/User/ProfileInfoForm";
import UserTicketList from "../../components/User/UserTicketList";
import PreferenceModal from "../../components/User/PreferenceModal";
import GlobalLoadingOverlay from "../../components/Common/GlobalLoadingOverlay";

const getCategoryIcon = (category) => {
  if (category?.icon) return category.icon;
  const name = String(category?.name || "").toLowerCase();
  if (name.includes("nhạc") || name.includes("music")) return "🎵";
  if (name.includes("thể thao") || name.includes("sport")) return "⚽";
  if (name.includes("công nghệ") || name.includes("tech")) return "💻";
  if (name.includes("kinh doanh") || name.includes("business")) return "💼";
  if (name.includes("nghệ thuật") || name.includes("art")) return "🎨";
  if (name.includes("ẩm thực") || name.includes("food")) return "🍜";
  return "🎪";
};

const mapUserResponse = (data = {}) => ({
  id: Number(data.id) || "",
  username: data.username || "",
  full_name: data.full_name || data.username || "",
  phone_number: data.phone_number || "",
  email: data.email || "",
  avatar: data.avatar || "",
  role: String(data.role || "USER").replace("RoleEnum.", "").toUpperCase(),
  is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
  is_verified: data.is_verified !== undefined ? Boolean(data.is_verified) : false,
  has_preferences: Boolean(data.has_preferences),
  has_company: Boolean(data.has_company),
});

export default function UserProfilePage() {
  const { user: authUser, loginUser } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();

  const user = mapUserResponse(authUser);
  const isStaff = ["STAFF", "ORGANIZER", "ADMIN"].includes(user.role);

  const [activeTab, setActiveTab] = useState(isStaff ? "company" : "tickets");

  // State Preferences (User)
  const [userPreferences, setUserPreferences] = useState([]);
  const [tempPreferences, setTempPreferences] = useState([]);
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // State Company & Locations (Staff)
  const [company, setCompany] = useState(null);
  const [locations, setLocations] = useState([]);

  // Loading States
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [globalProgress, setGlobalProgress] = useState(15);
  const isInitialLoadRef = useRef(true);

  const formattedCategories = (categories || [])
    .filter((cat) => cat.id !== null)
    .map((cat) => ({ ...cat, icon: getCategoryIcon(cat) }));

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
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-2026-9871",
    },
  ]);

  // Nạp Preferences (User)
  const fetchPreferences = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setLoadingPreferences(true);
      const res = await authService.getUserPreferences(userId);
      const list = Array.isArray(res) ? res : res?.data || res?.data?.data || [];
      const prefIds = list.map((item) => Number(item.category_id || item.id || item));
      setUserPreferences(prefIds);
      setTempPreferences(prefIds);
    } catch (error) {
      console.error("Lỗi khi tải preferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  // Nạp Company & Locations (Staff)
  const fetchCompanyData = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const [compRes, locRes] = await Promise.all([
        companyServices.getCompanyByUserId(userId),
        companyServices.getLocations(),
      ]);

      const compData = compRes?.data || null;
      setCompany(compData);

      if (locRes?.data) setLocations(locRes.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu công ty:", error);
    }
  }, []);

  useEffect(() => {
    if (!authUser?.id) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;

      const timer = setInterval(() => {
        setGlobalProgress((prev) => (prev >= 85 ? 85 : prev + 15));
      }, 100);

      const loader = isStaff ? fetchCompanyData(authUser.id) : fetchPreferences(authUser.id);

      loader.finally(() => {
        clearInterval(timer);
        setGlobalProgress(100);
        setTimeout(() => {
          setIsGlobalLoading(false);
          setGlobalProgress(0);
        }, 250);
      });
    }
  }, [authUser, isStaff, fetchCompanyData, fetchPreferences]);

  // Cập nhật Profile cá nhân
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedName = formData.get("full_name")?.trim();
    const updatedPhone = formData.get("phone_number")?.trim();

    loginUser({
      ...authUser,
      full_name: updatedName || authUser.full_name,
      phone_number: updatedPhone || authUser.phone_number,
    });
    alert("Đã cập nhật thông tin cá nhân thành công!");
  };

  // Lưu sở thích (User)
  const handleSavePreferences = async () => {
    if (!user.id) return;
    setIsPreferenceModalOpen(false);
    try {
      await authService.updatePreferences({
        userId: user.id,
        categoryIds: tempPreferences,
      });
      const hasPref = tempPreferences.length > 0;
      loginUser({ ...authUser, has_preferences: hasPref });
      setUserPreferences([...tempPreferences]);
      await fetchPreferences(user.id);
    } catch (error) {
      console.error("Lỗi khi lưu preferences:", error);
    }
  };

  const selectedLocationName =
    locations.find((l) => l.id === company?.location_id)?.name || "Chưa xác định";

  return (
    <>
      <GlobalLoadingOverlay
        isLoading={isGlobalLoading}
        progress={globalProgress}
        title="Đang tải dữ liệu hồ sơ..."
        description="Đồng bộ thông tin từ hệ thống"
      />

      <main className="min-h-screen bg-[#0D0D0D] px-4 py-8 text-[#171717] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Top Bar */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to={isStaff ? "/dashboard/organizer" : "/"}
              className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8A8781] transition hover:text-[#E85B2A]"
            >
              {isStaff ? "← VỀ TRANG QUẢN TRỊ" : "← QUAY LẠI TRANG CHỦ"}
            </Link>
            <span className="text-[10px] font-bold tracking-[4px] text-[#8A8781]">
              {isStaff ? "ORGANIZER PORTAL" : "HOKINUVA ACCOUNT"}
            </span>
          </div>

          {/* Profile Header (Đã truyền company={company}) */}
          <ProfileHeader
            user={user}
            company={company}
            ticketCount={tickets.length}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            formattedCategories={formattedCategories}
            userPreferences={userPreferences}
            loadingPreferences={loadingPreferences || categoriesLoading}
            onDeletePreference={(id) => {
              const numId = Number(id);
              setUserPreferences((prev) => prev.filter((item) => item !== numId));
            }}
            onOpenPreferenceModal={() => {
              setTempPreferences([...userPreferences]);
              setIsPreferenceModalOpen(true);
            }}
          />

          {/* TAB CONTENT: THÔNG TIN DOANH NGHIỆP (STAFF - READ ONLY & CHỜ DUYỆT) */}
          {isStaff && activeTab === "company" && (
            <section className="relative overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-xl sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6D1C8] pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#171717]">HỒ SƠ PHÁP NHÂN & TỔ CHỨC</h2>
                  <p className="text-[11px] text-[#5F5C57]">
                    Thông tin pháp nhân do Ban tổ chức đăng ký (Chỉ Admin mới có quyền cập nhật).
                  </p>
                </div>

                {/* Badge trạng thái */}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Đang chờ duyệt từ Admin
                </span>
              </div>

              {/* Banner thông báo chờ xét duyệt */}
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
                <span className="font-bold">⏳ Lưu ý:</span> Hồ sơ doanh nghiệp đang trong quá trình đối soát pháp lý từ Quản trị viên Hokinuva. Trong thời gian này, thông tin công ty sẽ ở trạng thái <strong>Chỉ đọc (Read-only)</strong>.
              </div>

              {/* Form hiển thị Read-only */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#8A8781]">TÊN CÔNG TY</label>
                    <input
                      type="text"
                      disabled
                      value={company?.name || ""}
                      className="w-full cursor-not-allowed rounded-xl border border-[#D6D1C8] bg-[#EAE6DF] px-3.5 py-2.5 text-xs font-semibold text-[#171717]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#8A8781]">MÃ SỐ THUẾ</label>
                    <input
                      type="text"
                      disabled
                      value={company?.tax_code || ""}
                      className="w-full cursor-not-allowed rounded-xl border border-[#D6D1C8] bg-[#EAE6DF] px-3.5 py-2.5 text-xs font-semibold text-[#171717]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#8A8781]">ĐỊA CHỈ TRỤ SỞ</label>
                    <input
                      type="text"
                      disabled
                      value={company?.address || ""}
                      className="w-full cursor-not-allowed rounded-xl border border-[#D6D1C8] bg-[#EAE6DF] px-3.5 py-2.5 text-xs font-semibold text-[#171717]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#8A8781]">KHU VỰC HOẠT ĐỘNG</label>
                    <input
                      type="text"
                      disabled
                      value={selectedLocationName}
                      className="w-full cursor-not-allowed rounded-xl border border-[#D6D1C8] bg-[#EAE6DF] px-3.5 py-2.5 text-xs font-semibold text-[#171717]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#8A8781]">MÔ TẢ GIỚI THIỆU</label>
                  <textarea
                    rows={3}
                    disabled
                    value={company?.description || ""}
                    className="w-full cursor-not-allowed rounded-xl border border-[#D6D1C8] bg-[#EAE6DF] px-3.5 py-2.5 text-xs font-semibold text-[#171717]"
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB CONTENT: VÉ CỦA TÔI (USER) */}
          {!isStaff && activeTab === "tickets" && <UserTicketList tickets={tickets} />}

          {/* TAB CONTENT: PROFILE THÔNG TIN CÁ NHÂN (USER & STAFF) */}
          {activeTab === "profile" && (
            <ProfileInfoForm user={user} onSubmit={handleUpdateProfile} />
          )}
        </div>
      </main>

      {/* Modal Preferences (User) */}
      {!isStaff && (
        <PreferenceModal
          isOpen={isPreferenceModalOpen}
          onClose={() => setIsPreferenceModalOpen(false)}
          categories={formattedCategories}
          selectedIds={tempPreferences}
          onToggleCategory={(id) => {
            const numId = Number(id);
            setTempPreferences((prev) =>
              prev.includes(numId) ? prev.filter((i) => i !== numId) : [...prev, numId]
            );
          }}
          onSave={handleSavePreferences}
          loading={false}
        />
      )}
    </>
  );
}