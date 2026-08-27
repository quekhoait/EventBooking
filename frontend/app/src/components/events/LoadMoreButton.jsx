// src/components/events/LoadMoreButton.jsx

import React from 'react';

const LoadMoreButton = ({ hasNext, loadingMore, onLoadMore }) => {
  if (!hasNext) return null;

  return (
    <div className="mt-8 text-center">
      <button
        onClick={onLoadMore}
        disabled={loadingMore}
        className="rounded-full border border-white/15 px-8 py-3 text-sm text-white hover:border-[#ff6b12] hover:text-[#ff6b12] transition-all disabled:opacity-50"
      >
        {loadingMore ? 'Đang tải...' : 'Xem thêm'}
      </button>
    </div>
  );
};

export default LoadMoreButton;