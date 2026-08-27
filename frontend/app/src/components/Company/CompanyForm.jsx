import React from "react";
import AuthButton from "../Auth/AuthButton";

export default function CompanyForm({
  formData,
  locations = [],
  onChange,
  onSubmit,
  loading = false,
  progress = 0,
  isEdit = false,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Tên đơn vị & Mã số thuế */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
            Tên Công Ty / Đơn Vị Tổ Chức <span className="text-[#E85B2A]">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            disabled={loading}
            value={formData.name}
            onChange={onChange}
            placeholder="VD: Công ty Cổ phần Truyền thông ABC"
            className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
            Mã Số Thuế <span className="text-[#E85B2A]">*</span>
          </label>
          <input
            type="text"
            name="tax_code"
            required
            disabled={loading}
            value={formData.tax_code}
            onChange={onChange}
            placeholder="VD: 0312345678"
            className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
          />
        </div>
      </div>

      {/* Địa chỉ & Tỉnh / Thành phố */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
            Địa Chỉ Trụ Sở Chính <span className="text-[#E85B2A]">*</span>
          </label>
          <input
            type="text"
            name="address"
            required
            disabled={loading}
            value={formData.address}
            onChange={onChange}
            placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1"
            className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
            Khu Vực Hoạt Động Chính
          </label>
          <select
            name="location_id"
            disabled={loading}
            value={formData.location_id}
            onChange={onChange}
            className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
          >
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mô tả */}
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
          Mô Tả Giới Thiệu Đơn Vị <span className="text-[#E85B2A]">*</span>
        </label>
        <textarea
          name="description"
          rows={4}
          required
          disabled={loading}
          value={formData.description}
          onChange={onChange}
          placeholder="Giới thiệu năng lực tổ chức sự kiện, quy mô và các chương trình tiêu biểu..."
          className="w-full rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2.5 text-xs text-[#171717] outline-none transition focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A] disabled:bg-[#EAE6DF]"
        />
      </div>

      <div className="pt-3">
        <AuthButton disabled={loading}>
          {loading
            ? `ĐANG XỬ LÝ (${progress}%)`
            : isEdit
            ? "CẬP NHẬT THÔNG TIN"
            : "HOÀN TẤT ĐĂNG KÝ DOANH NGHIỆP"}
        </AuthButton>
      </div>
    </form>
  );
}