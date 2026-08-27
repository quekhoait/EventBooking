// src/hooks/useEvents.js

import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../services/eventService';

export const useEvents = (initialFilters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (pageNum, reset = false, filters = {}) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        page_size: 8,
        ...filters,
      };

      const response = await eventService.getEvents(params);
      
      let items = [];
      let hasNextPage = false;
      let totalItems = 0;

      if (response?.data?.data) {
        items = response.data.data.items || [];
        hasNextPage = response.data.data.has_next || false;
        totalItems = response.data.data.total || 0;
      } else if (response?.data?.items) {
        items = response.data.items || [];
        hasNextPage = response.data.has_next || false;
        totalItems = response.data.total || 0;
      } else if (response?.data && Array.isArray(response.data)) {
        items = response.data;
        totalItems = items.length;
      } else if (Array.isArray(response)) {
        items = response;
        totalItems = items.length;
      }

      if (reset) {
        setEvents(items);
      } else {
        setEvents(prev => [...prev, ...items]);
      }

      setHasNext(hasNextPage);
      setTotal(totalItems || items.length);
      setPage(pageNum);

    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError(error.response?.data?.message || 'Không thể tải danh sách sự kiện');
      if (reset) {
        setEvents([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasNext) {
      fetchEvents(page + 1, false);
    }
  }, [loadingMore, hasNext, page, fetchEvents]);

  return {
    events,
    loading,
    loadingMore,
    hasNext,
    total,
    error,
    fetchEvents,
    loadMore,
    setEvents,
  };
};