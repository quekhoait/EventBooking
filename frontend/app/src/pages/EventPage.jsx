import React from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useFilters } from "../hooks/useFilters";
import { useCategories } from "../hooks/useCategories";
import { useLocations } from "../hooks/useLocations";
import CategoryFilter from "../components/events/CategoryFilter";
import FilterBar from "../components/events/FilterBar";
import ActiveFilters from "../components/events/ActiveFilters";
import EventGrid from "../components/events/EventGrid";
import LoadMoreButton from "../components/events/LoadMoreButton";

function EventPage() {
  const navigate = useNavigate();

  const { categories, getCategoryId } = useCategories();
  const { flatLocations, getLocationName } = useLocations();

  const { filters, tempFilters, updateTempFilter, applyFilters, clearFilters, handleCategoryChange, handleDateBlur } =
    useFilters();

  const { events, loading, loadingMore, hasNext, total, error, fetchEvents, loadMore } = useEvents();

  // Fetch lại sự kiện mỗi khi state filters (đã đồng bộ với URL) thay đổi
  React.useEffect(() => {
    if (categories.length > 0) {
      const categoryId = getCategoryId(filters.category);
      const eventFilters = {
        keyword: filters.keyword || undefined,
        category_id: categoryId || undefined,
        location_id: filters.location ? parseInt(filters.location) : undefined,
        event_from_date: filters.fromDate || undefined,
        event_to_date: filters.toDate || undefined,
      };
      fetchEvents(1, true, eventFilters);
    }
  }, [filters, categories]);

  // Xử lý lọc địa điểm ngay lập tức khi thay đổi Select Box
  const handleLocationChange = (locationId) => {
    updateTempFilter("location", locationId);
    applyFilters({ ...tempFilters, location: locationId });
  };

  const handleBook = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-[1240px] px-5 py-9 lg:px-10 lg:py-12">
        <div className="flex flex-col justify-center items-center h-96 gap-4">
          <div className="text-white">Đang tải sự kiện...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-9 lg:px-10 lg:py-12">
      {/* Header */}
      <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <button
            onClick={() => navigate("/")}
            className="mb-6 text-xs font-bold uppercase text-[#ff985c] hover:text-[#ff6b12] transition-colors">
            ← Về trang chủ
          </button>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">Khám phá sự kiện</p>
          <h1 className="font-display text-6xl font-extrabold uppercase leading-none text-white">Event collection</h1>
        </div>
        <p className="max-w-xs text-sm text-white/45">Tìm cảm hứng cho lịch trình tiếp theo của bạn.</p>
      </div>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        activeCategory={filters.category}
        onCategoryChange={handleCategoryChange}
      />

      {/* Filter Bar */}
      <FilterBar
        category={filters.category}
        total={total}
        tempLocation={tempFilters.location}
        tempFromDate={tempFilters.fromDate}
        tempToDate={tempFilters.toDate}
        flatLocations={flatLocations}
        onLocationChange={handleLocationChange}
        onFromDateChange={(value) => updateTempFilter("fromDate", value)}
        onToDateChange={(value) => updateTempFilter("toDate", value)}
        onDateBlur={handleDateBlur}
      />

      {/* Active Filters */}
      <ActiveFilters
        keyword={filters.keyword}
        locationFilter={filters.location}
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        getLocationName={getLocationName}
        onClear={clearFilters}
      />

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() =>
              fetchEvents(1, true, {
                keyword: filters.keyword,
                category_id: getCategoryId(filters.category),
                location_id: filters.location ? parseInt(filters.location) : undefined,
              })
            }
            className="mt-4 text-[#ff985c] hover:text-[#ff6b12] transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {/* Event Grid */}
      <EventGrid events={events} onBook={handleBook} />

      {/* Empty State Action */}
      {!error && events.length === 0 && (
        <div className="text-center pb-16 -mt-8">
          {(filters.keyword || filters.location || filters.fromDate || filters.toDate) && (
            <button onClick={clearFilters} className="text-[#ff985c] hover:text-[#ff6b12] transition-colors">
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Load More */}
      <LoadMoreButton hasNext={hasNext} loadingMore={loadingMore} onLoadMore={loadMore} />
    </main>
  );
}

export default EventPage;
