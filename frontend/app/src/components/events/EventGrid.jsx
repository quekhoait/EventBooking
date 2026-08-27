// src/components/events/EventGrid.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event, onBook }) => {
  const navigate = useNavigate();

  return (
    <article className="group overflow-hidden rounded-2xl bg-[#1b1c1d] transition-transform hover:scale-[1.02]">
      <div className="h-48 overflow-hidden bg-[#272829]">
        <img
          src={event.image || 'https://placehold.co/600x400/1b1c1d/666?text=No+Image'}
          alt={event.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://placehold.co/600x400/1b1c1d/666?text=No+Image';
          }}
        />
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#ff985c]">
          {event.event_start_time
            ? new Date(event.event_start_time).toLocaleDateString('vi-VN')
            : 'Sắp diễn ra'}
        </p>
        <h3 className="mt-2 min-h-14 font-display text-3xl font-bold uppercase leading-none text-white line-clamp-2">
          {event.name}
        </h3>
        <p className="mt-3 text-xs text-white/50">
          {event.event_start_time && event.event_end_time
            ? `${new Date(event.event_start_time).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${new Date(event.event_end_time).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Thời gian chưa cập nhật'}
          · {event.location_name || 'Địa điểm chưa cập nhật'}
        </p>
        <button
          onClick={() => onBook(event.id)}
          className="mt-5 w-full rounded-xl bg-[#ff6b12] py-3 text-xs font-extrabold text-white hover:bg-[#e95b0c] transition-colors"
        >
          ĐẶT VÉ NGAY →
        </button>
      </div>
    </article>
  );
};

const EventGrid = ({ events, onBook }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/50">Không tìm thấy sự kiện nào</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onBook={onBook} />
      ))}
    </div>
  );
};

export default EventGrid;