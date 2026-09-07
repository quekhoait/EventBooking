import { createContext, useState, useContext } from "react";
import { eventService } from "../services/eventService.jsx";

export const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [eventDetail, setEventDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEventDetail = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await eventService.getEventDetail(id);
      if (response?.status === 200) {
        setEventDetail(response?.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch event detail:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventContext.Provider
      value={{
        eventDetail,
        setEventDetail,
        fetchEventDetail,
        loading,
        error,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};