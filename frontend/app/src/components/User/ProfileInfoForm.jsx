import React, { useState, useEffect } from "react";
import AuthButton from "../Auth/AuthButton";

export default function ProfileInfoForm({ user = {}, onSubmit }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
  });

  const [avatarPreview, setAvatarPreview] = useState("/static/image/icon_user.png");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  // 1. Log dữ liệu props user nhận vào
  useEffect(() => {
    console.group("📥 [ProfileInfoForm] Nhận Props User Mới");
    console.log("Raw user object:", user);
    console.log("ID:", user.id);
    console.log("Full Name:", user.full_name);
    console.log("Phone Number:", user.phone_number);
    console.log("Avatar URL:", user.avatar);
    console.log("Role:", user.role);
    console.log("Has Preferences:", user.has_preferences);
    console.groupEnd();

    if (user) {
      setFormData({
        full_name: user.full_name || user.username || "",
        phone_number: user.phone_number || "",
      });
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  // 2. Log khi người dùng gõ vào các ô input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`✍️ [Input Change] ${name} ->`, value);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. Log khi chọn file Avatar mới
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.group("🖼️ [Avatar Change] Tải ảnh đại diện");
    console.log("File Name:", file.name);
    console.log("File Size:", (file.size / 1024).toFixed(2) + " KB");
    console.log("File Type:", file.type);
    console.groupEnd();

    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingAvatar(true);
    setAvatarProgress(0);

    const interval = setInterval(() => {
      setAvatarProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploadingAvatar(false), 300);
          return 100;
        }
        return prev + 25;
      });
    }, 100);
  };

  // 4. Log toàn bộ dữ liệu gói tin chuẩn bị Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    const rawFormData = new FormData(formElement);

    console.group("🚀 [ProfileInfoForm] Bắt đầu Submit Form");
    console.log("Dữ liệu State hiện tại:", formData);
    console.log("Dữ liệu FormData (full_name):", rawFormData.get("full_name"));
    console.log("Dữ liệu FormData (phone_number):", rawFormData.get("phone_number"));
    console.log("File Avatar đính kèm:", rawFormData.get("avatar_file"));
    console.groupEnd();

    setIsUpdating(true);
    setUpdateProgress(15);

    

    const interval = setInterval(() => {
      setUpdateProgress((prev) => (prev >= 85 ? 85 : prev + 20));
    }, 100);

    try {
      if (onSubmit) {
        await onSubmit(e);
      }
      clearInterval(interval);
      setUpdateProgress(100);
      console.log("✅ [ProfileInfoForm] Submit thành công!");
    } catch (error) {
      clearInterval(interval);
      console.error("❌ [ProfileInfoForm] Lỗi khi Submit:", error);
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
        setUpdateProgress(0);
      }, 400);
    }
  };

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avatarProgress / 100) * circumference;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#F4F1EB] shadow-xl">
      {/* Header Form & Badges Trạng Thái */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6D1C8] bg-white/40 px-6 py-4 sm:px-8">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#171717] sm:text-lg">
            HỒ SƠ TÀI KHOẢN
          </h2>
          <p className="text-[11px] text-[#5F5C57]">
            Cập nhật thông tin định danh và quản lý trạng thái tài khoản.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Badge Xác thực */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              user.is_verified
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                user.is_verified ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {user.is_verified ? "Đã xác thực" : "Chưa xác thực"}
          </span>

          {/* Badge Hoạt động */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              user.is_active
                ? "bg-blue-100 text-blue-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                user.is_active ? "bg-blue-500" : "bg-rose-500"
              }`}
            />
            {user.is_active ? "Hoạt động" : "Tạm khóa"}
          </span>

          {/* Badge Sở thích */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              user.has_preferences
                ? "bg-[#E85B2A]/10 text-[#E85B2A]"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                user.has_preferences ? "bg-[#E85B2A]" : "bg-gray-400"
              }`}
            />
            {user.has_preferences ? "Đã cá nhân hóa" : "Chưa cá nhân hóa"}
          </span>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Cột trái: Avatar & Vai trò */}
          <div className="flex flex-col items-center border-b border-[#D6D1C8] pb-6 sm:pb-0 lg:col-span-4 lg:border-b-0 lg:border-r lg:pr-8">
            <div className="relative flex h-32 w-32 items-center justify-center">
              {isUploadingAvatar && (
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-[#D6D1C8]"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-[#E85B2A] transition-all duration-200 ease-out"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              <div className="group relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#D6D1C8] shadow-md">
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                  }}
                  className={`h-full w-full object-cover transition duration-200 ${
                    isUploadingAvatar ? "opacity-30 blur-[1px]" : "group-hover:opacity-80"
                  }`}
                />

                {isUploadingAvatar ? (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-[#E85B2A]">
                    {avatarProgress}%
                  </div>
                ) : (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Đổi ảnh
                  </label>
                )}
              </div>

              <input
                id="avatar-upload"
                name="avatar_file"
                type="file"
                accept="image/*"
                disabled={isUploadingAvatar || isUpdating}
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <p className="mt-3 font-mono text-xs font-bold text-[#171717]">
              @{user.username || "user"}
            </p>
            <span className="mt-1 rounded-md bg-[#E85B2A]/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#E85B2A]">
              {user.role || "USER"}
            </span>
          </div>

          {/* Cột phải: Form nhập dữ liệu */}
          <div className="flex flex-col justify-between space-y-6 lg:col-span-8 lg:pl-2">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A8781]">
                Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    disabled={isUpdating}
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên..."
                    className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    disabled={isUpdating}
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="0901234567"
                    className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A8781]">
                Thông tin định danh hệ thống
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8A8781]">
                    Email (Cố định)
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-[#D6D1C8] bg-[#EAE6DF] px-3.5 py-2.5 text-xs font-medium text-[#736F68] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8A8781]">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={user.id ? `#${user.id}` : "N/A"}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-[#D6D1C8] bg-[#EAE6DF] px-3.5 py-2.5 text-xs font-medium text-[#736F68] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#D6D1C8] pt-4">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => {
                  console.log("↩️ [ProfileInfoForm] Reset lại form về giá trị ban đầu");
                  setFormData({
                    full_name: user.full_name || user.username || "",
                    phone_number: user.phone_number || "",
                  });
                }}
                className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-[#5F5C57] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <div className="w-40">
                <AuthButton disabled={isUpdating || isUploadingAvatar}>
                  {isUpdating ? `ĐANG LƯU (${updateProgress}%)` : "LƯU HỒ SƠ"}
                </AuthButton>
              </div>
            </div>
          </div>
        </div>
      </form>

      {isUpdating && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#D6D1C8]">
          <div
            className="h-full bg-[#E85B2A] transition-all duration-200 ease-out"
            style={{ width: `${updateProgress}%` }}
          />
        </div>
      )}
    </section>
  );
}