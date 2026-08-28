import React from "react";

const FilterBar = ({
  category,
  total,
  tempLocation,
  tempFromDate,
  tempToDate,
  flatLocations,
  onLocationChange,
  onFromDateChange,
  onToDateChange,
  onDateBlur,
}) => {
  return (
    <div className="mb-6">
      {/* Cả 3 phần cùng nằm trong 1 Grid (Cột 1: Tên/Số lượng, Cột 2: Chọn địa điểm, Cột 3: Chọn ngày) */}
      <div className="grid items-center gap-3 md:grid-cols-4">
        
        {/* 1. Results Title & Count (Chiếm 1 cột) */}
        <div className="flex items-baseline gap-5 md:col-span-1">
          <h2 className="font-display text-2xl font-bold uppercase text-white truncate">
            {category}
          </h2>
          <span className="text-xs whitespace-nowrap text-white/40">{total} sự kiện</span>
        </div>

        {/* 2. Lọc theo Địa điểm (Chiếm 1 cột) */}
        <div className="md:col-span-1">
          <select
            value={tempLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full rounded-full border border-white/15 bg-[#1b1c1d] px-4 py-2 text-sm text-white focus:border-[#ff6b12] focus:outline-none appearance-none cursor-pointer"
            style={{ color: "white" }}
          >
            <option value="" className="text-white/60 bg-[#1b1c1d]">
              Tất cả địa điểm
            </option>
            {flatLocations.length > 0 ? (
              flatLocations.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-white bg-[#1b1c1d]">
                  {loc.full_name}
                </option>
              ))
            ) : (
              <option value="" disabled className="text-white/40 bg-[#1b1c1d]">
                Đang tải địa điểm...
              </option>
            )}
          </select>
        </div>

        {/* 3. Lọc theo Khoảng thời gian (Chiếm 2 cột) */}
        <div className="flex gap-2 md:col-span-2">
          <input
            type="date"
            value={tempFromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            onBlur={onDateBlur}
            className="w-full rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#ff6b12] focus:outline-none [color-scheme:dark]"
          />
          <input
            type="date"
            value={tempToDate}
            onChange={(e) => onToDateChange(e.target.value)}
            onBlur={onDateBlur}
            className="w-full rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#ff6b12] focus:outline-none [color-scheme:dark]"
          />
        </div>

      </div>
    </div>
  );
};

export default FilterBar;