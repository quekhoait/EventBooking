import React, { useState } from "react";
import AuthButton from "../Auth/AuthButton";

export default function CompanyProfileForm({
  company = {},
  locations = [],
  onSubmit,
}) {
  const [logoPreview, setLogoPreview] = useState(
    company.logo || "/static/image/icon_company.png",
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);

  // Upload Logo: Hiệu ứng tròn quanh Logo
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoPreview(URL.createObjectURL(file));
    setIsUploadingLogo(true);
    setLogoProgress(0);

    const interval = setInterval(() => {
      setLogoProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploadingLogo(false), 300);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  // Submit Form: Hiệu ứng thanh ngang dưới đáy
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateProgress(0);

    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onSubmit) onSubmit(e);
          setTimeout(() => {
            setIsUpdating(false);
            setUpdateProgress(0);
          }, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (logoProgress / 100) * circumference;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] shadow-xl">
   
      <div className="flex flex-wrap items-center justify-between border-b border-[#D6D1C8] bg-white/40 px-6 py-4 sm:px-8">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#171717] sm:text-lg">
            HỒ SƠ DOANH NGHIỆP / BAN TỔ CHỨC
          </h2>
          <p className="text-[11px] text-[#5F5C57]">
            Thông tin pháp lý và thương hiệu đại diện cho các sự kiện bạn tổ
            chức.
          </p>
        </div>

        {company.id && (
          <span className="rounded-full bg-[#E85B2A]/10 px-3 py-1 font-mono text-xs font-bold text-[#E85B2A]">
            COMPANY ID: #{company.id}
          </span>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
   
          <div className="flex flex-col items-center border-b border-[#D6D1C8] pb-6 sm:pb-0 lg:col-span-4 lg:border-b-0 lg:border-r lg:pr-8">
            <div className="relative flex h-32 w-32 items-center justify-center">
              {isUploadingLogo && (
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

              <div className="group relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-[#D6D1C8] bg-white p-1 shadow-md">
                <img
                  src={logoPreview}
                  alt="Company Logo"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80";
                  }}
                  className={`h-full w-full rounded-xl object-contain transition duration-200 ${
                    isUploadingLogo
                      ? "opacity-30 blur-[1px]"
                      : "group-hover:opacity-80"
                  }`}
                />

                {isUploadingLogo ? (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-[#E85B2A]">
                    {logoProgress}%
                  </div>
                ) : (
                  <label
                    htmlFor="logo-upload"
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/40 text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Đổi Logo
                  </label>
                )}
              </div>

              <input
                id="logo-upload"
                name="logo"
                type="file"
                accept="image/*"
                disabled={isUploadingLogo || isUpdating}
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            <p className="mt-3 text-center text-xs font-bold text-[#171717]">
              {company.name || "Chưa có tên tổ chức"}
            </p>
            <span className="mt-0.5 rounded bg-[#E85B2A]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#E85B2A]">
              ORGANIZER
            </span>

            <p className="mt-4 text-center text-[10px] text-[#8A8781] leading-relaxed">
              Logo hiển thị trên vé và trang sự kiện. <br /> Định dạng
              PNG/JPG/SVG.
            </p>
          </div>

   
          <div className="flex flex-col justify-between space-y-5 lg:col-span-8 lg:pl-2">
   
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                  Tên công ty / Đơn vị tổ chức *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  disabled={isUpdating}
                  defaultValue={company.name}
                  placeholder="Công ty TNHH Sự Kiện ABC"
                  className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                  Mã số thuế (Tax Code) *
                </label>
                <input
                  type="text"
                  name="tax_code"
                  required
                  disabled={isUpdating}
                  defaultValue={company.tax_code}
                  placeholder="0101234567"
                  className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 font-mono text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
                />
              </div>
            </div>

   
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                  Khu vực / Tỉnh thành
                </label>
                <select
                  name="location_id"
                  disabled={isUpdating}
                  defaultValue={company.location_id || locations[0]?.id}
                  className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                  Địa chỉ trụ sở
                </label>
                <input
                  type="text"
                  name="address"
                  disabled={isUpdating}
                  defaultValue={company.address}
                  placeholder="Tầng 5, Tòa nhà Landmark, Q.1, TP.HCM"
                  className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
                />
              </div>
            </div>

   
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                Mô tả giới thiệu đơn vị
              </label>
              <textarea
                name="description"
                rows={3}
                disabled={isUpdating}
                defaultValue={company.description}
                placeholder="Giới thiệu sơ lược về kinh nghiệm, quy mô và các loại sự kiện đơn vị thường tổ chức..."
                className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#D6D1C8] pt-4">
              <button
                type="reset"
                disabled={isUpdating}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#5F5C57] transition hover:bg-black/5 disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <div className="w-48">
                <AuthButton disabled={isUpdating || isUploadingLogo}>
                  {isUpdating ? "ĐANG LƯU HỒ SƠ..." : "LƯU HỒ SƠ CÔNG TY"}
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
