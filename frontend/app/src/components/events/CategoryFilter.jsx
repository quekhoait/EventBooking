
import React from 'react';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
      {categories.map((category) => (
        <button
          key={category.id || category.name}
          onClick={() => onCategoryChange(category.name)}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all ${
            activeCategory === category.name
              ? 'border-[#ff6b12] bg-[#ff6b12] text-white'
              : 'border-white/15 text-white/55 hover:border-[#ff985c] hover:text-[#ff985c]'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;