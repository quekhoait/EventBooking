import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const useFilters = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Đọc query params từ URL
  const getURLFilters = () => {
    const query = new URLSearchParams(location.search);
    return {
      keyword: query.get("keyword") || "",
      category: query.get("category") || "Tất cả",
      location: query.get("location") || "",
      fromDate: query.get("from_date") || "",
      toDate: query.get("to_date") || "",
    };
  };

  const [filters, setFilters] = useState(getURLFilters);
  const [tempFilters, setTempFilters] = useState(getURLFilters);

  useEffect(() => {
    const urlFilters = getURLFilters();
    setFilters(urlFilters);
    setTempFilters(urlFilters);
  }, [location.search]);

  const updateTempFilter = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = (overrideTemp) => {
    const activeTemp = overrideTemp || tempFilters;
    const params = new URLSearchParams();

    if (filters.category && filters.category !== "Tất cả") {
      params.append("category", filters.category);
    }
    if (activeTemp.keyword?.trim()) {
      params.append("keyword", activeTemp.keyword.trim());
    }
    if (activeTemp.location) {
      params.append("location", activeTemp.location);
    }
    if (activeTemp.fromDate) {
      params.append("from_date", activeTemp.fromDate);
    }
    if (activeTemp.toDate) {
      params.append("to_date", activeTemp.toDate);
    }

    const searchString = params.toString();
    navigate(`/events${searchString ? `?${searchString}` : ""}`);
  };

  const clearFilters = () => {
    navigate("/events");
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(location.search);
    if (category && category !== "Tất cả") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    navigate(`/events?${params.toString()}`);
  };

  const handleDateBlur = () => {
    if (tempFilters.fromDate !== filters.fromDate || tempFilters.toDate !== filters.toDate) {
      applyFilters();
    }
  };

  return {
    filters,
    tempFilters,
    updateTempFilter,
    applyFilters,
    clearFilters,
    handleCategoryChange,
    handleDateBlur,
  };
};
