import React from 'react';

const FilterBar = ({
  tempKeyword,
  tempLocation,
  tempFromDate,
  tempToDate,
  flatLocations,
  onKeywordChange,
  onLocationChange,
  onFromDateChange,
  onToDateChange,
  onSearchKeyDown,
  onDateBlur,
}) => {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-4">
      <div className="md:col-span-2">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm sự kiện (Enter để tìm)..."
          value={tempKeyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onKeyDown={onSearchKeyDown}
          className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#ff6b12] focus:outline-none"
        />
      </div>

      <div>
        <select
          value={tempLocation}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full rounded-full border border-white/15 bg-[#1b1c1d] px-4 py-2 text-sm text-white focus:border-[#ff6b12] focus:outline-none appearance-none cursor-pointer"
          style={{ color: 'white' }}
        >
          <option value="" className="text-white/60 bg-[#1b1c1d]">
            📍 Tất cả địa điểm
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

      <div className="flex gap-2">
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
  );
};

export default FilterBar;