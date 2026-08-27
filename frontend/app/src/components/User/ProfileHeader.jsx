import React, { memo } from "react";
import UserPreferenceTags from "./UserPreferenceTags";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

function ProfileHeader({
  user = {},
  company = null,
  ticketCount = 0,
  activeTab = "tickets",
  onTabChange = () => {},
  formattedCategories = [],
  userPreferences = [],
  loadingPreferences = false,
  onDeletePreference = () => {},
  onOpenPreferenceModal = () => {},
}) {
  const currentRole = String(user?.role || "USER")
    .replace("RoleEnum.", "")
    .toUpperCase();
  const isStaff = ["STAFF", "ORGANIZER", "ADMIN"].includes(currentRole);

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.3)] sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar & Role Badge */}
        <div className="relative">
          <img
            src={user?.avatar || DEFAULT_AVATAR}
            alt={user?.full_name || user?.username || "Avatar"}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
            className="h-24 w-24 rounded-full border-2 border-[#E85B2A] object-cover shadow-md"
          />
          <span className="absolute bottom-0 right-0 rounded-full bg-[#E85B2A] px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
            {isStaff ? "Ban Tổ Chức" : "Cá nhân"}
          </span>
        </div>

        {/* User Details */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-black tracking-tight text-[#171717] sm:text-3xl">
            {user?.full_name || user?.username || "Người dùng"}
          </h1>
          <p className="mt-1 text-sm font-medium text-[#5F5C57]">{user?.email}</p>

          {isStaff ? (
            /* Thông tin Công ty liên kết của Staff */
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D1C8] bg-white px-3 py-1 text-xs font-semibold text-[#171717] shadow-sm">
                <span className="text-[#E85B2A]">🏢</span>{" "}
                {company?.name || "Đang tải công ty..."}
              </span>
              {company?.tax_code && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D1C8] bg-white px-3 py-1 text-xs font-semibold text-[#5F5C57] shadow-sm">
                  MST: {company.tax_code}
                </span>
              )}
            </div>
          ) : (
            /* Thông tin Vé & Sở thích của User */
            <>
              <div className="mt-3 flex justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D1C8] bg-white px-3 py-1 text-xs font-semibold text-[#171717] shadow-sm">
                  <span className="text-[#E85B2A]">🎟️</span> {ticketCount} Vé đã đăng ký
                </span>
              </div>

              <div className="mt-4">
                <UserPreferenceTags
                  userId={user?.id}
                  allCategories={formattedCategories}
                  selectedIds={userPreferences}
                  loading={loadingPreferences}
                  onCategoryDeleted={onDeletePreference}
                  onOpenModal={onOpenPreferenceModal}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-[#D6D1C8]">
        {isStaff ? (
          <>
            <button
              type="button"
              onClick={() => onTabChange("company")}
              className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                activeTab === "company"
                  ? "border-[#E85B2A] text-[#E85B2A]"
                  : "border-transparent text-[#5F5C57] hover:text-[#171717]"
              }`}
            >
              THÔNG TIN DOANH NGHIỆP
            </button>
            <button
              type="button"
              onClick={() => onTabChange("profile")}
              className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                activeTab === "profile"
                  ? "border-[#E85B2A] text-[#E85B2A]"
                  : "border-transparent text-[#5F5C57] hover:text-[#171717]"
              }`}
            >
              TÀI KHOẢN ĐẠI DIỆN
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onTabChange("tickets")}
              className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                activeTab === "tickets"
                  ? "border-[#E85B2A] text-[#E85B2A]"
                  : "border-transparent text-[#5F5C57] hover:text-[#171717]"
              }`}
            >
              VÉ CỦA TÔI ({ticketCount})
            </button>
            <button
              type="button"
              onClick={() => onTabChange("profile")}
              className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                activeTab === "profile"
                  ? "border-[#E85B2A] text-[#E85B2A]"
                  : "border-transparent text-[#5F5C57] hover:text-[#171717]"
              }`}
            >
              THÔNG TIN TÀI KHOẢN
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default memo(ProfileHeader);