import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Calendar.css';

const CalendarYear = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  // Fetch all events for the congregation (once) to feed mini calendars
  useEffect(() => {
    const fetchAll = async () => {
      if (!profile?.congregation_id) return;
      const { data, error } = await supabase
        .from('events')
        .select('id, name, date, time, committees(name, color)')
        .eq('congregation_id', profile.congregation_id);
      if (error) return console.error(error);
      const formatted = data.map(ev => ({
        id: ev.id,
        title: ev.name,
        start: `${ev.date}T${ev.time}`,
        extendedProps: {
          color: ev.committees?.color || '#00338D',
        },
      }));
      setEvents(formatted);
    };
    fetchAll();
  }, [profile]);

  const handleMonthClick = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    navigate(`/calendario/mes?year=${year}&month=${month}`);
  };

  // Render 12 mini calendars (one per month)
  const months = Array.from({ length: 12 }, (_, i) => new Date(new Date().getFullYear(), i, 1));

  return (
    <div className="calendar-year-page">
      <h2 className="calendar-title">Calendario Anual</h2>
      <div className="year-grid">
        {months.map((monthDate) => (
          <div
            key={monthDate.getMonth()}
            className="mini-calendar-wrapper"
            onClick={() => handleMonthClick(monthDate)}
          >
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={events}
              defaultDate={monthDate.toISOString()}
              height="auto"
              dayMaxEvents={true}
              displayEventEnd={false}
              titleFormat={{ month: 'short', year: 'numeric' }}
              // hide navigation controls
              showNonCurrentDates={false}
            />
            <div className="mini-month-label">
              {monthDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarYear;
