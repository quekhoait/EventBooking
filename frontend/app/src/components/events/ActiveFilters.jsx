// src/components/events/ActiveFilters.jsx

import React from 'react';

const ActiveFilters = ({
  keyword,
  locationFilter,
  fromDate,
  toDate,
  getLocationName,
  onClear,
}) => {
  const hasFilters = keyword || locationFilter || fromDate || toDate;

  if (!hasFilters) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="text-xs text-white/40">Bộ lọc:</span>
      {keyword && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b12]/20 px-3 py-1 text-xs text-[#ff985c]">
          {keyword}
        </span>
      )}
      {locationFilter && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b12]/20 px-3 py-1 text-xs text-[#ff985c]">
          {getLocationName(locationFilter)}
        </span>
      )}
      {fromDate && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b12]/20 px-3 py-1 text-xs text-[#ff985c]">
          Từ {new Date(fromDate).toLocaleDateString('vi-VN')}
        </span>
      )}
      {toDate && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b12]/20 px-3 py-1 text-xs text-[#ff985c]">
          Đến {new Date(toDate).toLocaleDateString('vi-VN')}
        </span>
      )}
      <button
        onClick={onClear}
        className="text-xs text-white/40 hover:text-[#ff6b12] transition-colors"
      >
        ✕ Xóa
      </button>
    </div>
  );
};

export default ActiveFilters;