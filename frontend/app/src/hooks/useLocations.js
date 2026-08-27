// src/hooks/useLocations.js

import { useState, useEffect, useMemo, useCallback } from 'react';
import { baseDataService } from '../services/baseDataService';

export const useLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await baseDataService.getAllLocations();
        let locationData = [];

        if (response?.data?.data && Array.isArray(response.data.data)) {
          locationData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          locationData = response.data;
        } else if (Array.isArray(response)) {
          locationData = response;
        }

        setLocations(locationData);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const flattenLocations = useCallback((locationTree, prefix = '') => {
    let result = [];
    if (!locationTree || !Array.isArray(locationTree)) return result;

    for (const loc of locationTree) {
      const label = prefix ? `${prefix} > ${loc.name}` : loc.name;
      result.push({ id: loc.id, name: loc.name, full_name: label });
      if (loc.children && loc.children.length > 0) {
        result = result.concat(flattenLocations(loc.children, label));
      }
    }
    return result;
  }, []);

  const flatLocations = useMemo(() => {
    return flattenLocations(locations);
  }, [locations, flattenLocations]);

  const getLocationName = useCallback((id) => {
    if (!id) return '';
    const loc = flatLocations.find(l => l.id === parseInt(id));
    return loc ? loc.full_name : '';
  }, [flatLocations]);

  return {
    locations,
    flatLocations,
    loading,
    getLocationName,
  };
};