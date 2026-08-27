
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useFilters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const [filters, setFilters] = useState({
    keyword: query.get('keyword') || '',
    category: query.get('category') || 'Tất cả',
    location: query.get('location') || '',
    fromDate: query.get('from_date') || '',
    toDate: query.get('to_date') || '',
  });

  const [tempFilters, setTempFilters] = useState({
    keyword: filters.keyword,
    location: filters.location,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  // Sync temp filters with URL params
  useEffect(() => {
    setTempFilters({
      keyword: filters.keyword,
      location: filters.location,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateTempFilter = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.category !== 'Tất cả') params.append('category', filters.category);
    if (tempFilters.keyword.trim()) params.append('keyword', tempFilters.keyword.trim());
    if (tempFilters.location) params.append('location', tempFilters.location);
    if (tempFilters.fromDate) params.append('from_date', tempFilters.fromDate);
    if (tempFilters.toDate) params.append('to_date', tempFilters.toDate);
    navigate(`/events?${params.toString()}`);
  };

  const clearFilters = () => {
    setTempFilters({
      keyword: '',
      location: '',
      fromDate: '',
      toDate: '',
    });
    setFilters({
      keyword: '',
      category: 'Tất cả',
      location: '',
      fromDate: '',
      toDate: '',
    });
    navigate('/events');
  };

  const handleCategoryChange = (category) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const handleDateBlur = () => {
    if (tempFilters.fromDate !== filters.fromDate || tempFilters.toDate !== filters.toDate) {
      applyFilters();
    }
  };

  return {
    filters,
    tempFilters,
    updateFilter,
    updateTempFilter,
    applyFilters,
    clearFilters,
    handleCategoryChange,
    handleSearchKeyDown,
    handleDateBlur,
  };
};