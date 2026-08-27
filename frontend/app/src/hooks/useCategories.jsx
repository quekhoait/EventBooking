// src/hooks/useCategories.js

import { useState, useEffect } from 'react';
import { baseDataService } from '../services/baseDataService.jsx';

export const useCategories = () => {
  const [categories, setCategories] = useState([{ id: null, name: 'Tất cả' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await baseDataService.getAllCategories();
        let categoryList = [];

        if (response?.data?.data && Array.isArray(response.data.data)) {
          categoryList = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          categoryList = response.data;
        } else if (Array.isArray(response)) {
          categoryList = response;
        }

        const formattedCategories = [
          { id: null, name: 'Tất cả' },
          ...categoryList.map(cat => ({ id: cat.id, name: cat.name })),
        ];
        setCategories(formattedCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([{ id: null, name: 'Tất cả' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryId = (categoryName) => {
    if (categoryName === 'Tất cả') return null;
    const category = categories.find(c => c.name === categoryName);
    return category ? category.id : null;
  };

  return {
    categories,
    loading,
    getCategoryId,
  };
};