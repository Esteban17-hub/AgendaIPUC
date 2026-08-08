import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Calendar.css';
import EventForm from '../components/EventForm';
import { Modal } from '../components/Modal'; // assumes you have a generic modal component
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CalendarMonth = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Parse query params ?year=2027&month=0 (0‑based month)
  const params = new URLSearchParams(location.search);
  const yearParam = parseInt(params.get('year')) || new Date().getFullYear();
  const monthParam = params.get('month') !== null ? parseInt(params.get('month')) : new Date().getMonth();
  const defaultDate = new Date(yearParam, monthParam, 1);

  const fetchEvents = async () => {
    if (!profile?.congregation_id) return;
    const start = new Date(yearParam, monthParam, 1);
    const end = new Date(yearParam, monthParam + 1, 0);
    const { data, error } = await supabase
      .from('events')
      .select('id, name, date, time, location, committees(name, color)')
      .eq('congregation_id', profile.congregation_id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]);
    if (error) return console.error(error);
    const formatted = data.map(ev => ({
      id: ev.id,
      title: ev.name,
      start: `${ev.date}T${ev.time}`,
      extendedProps: {
        location: ev.location,
        committee: ev.committees?.name,
        color: ev.committees?.color || '#00338D',
      },
    }));
    setEvents(formatted);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, yearParam, monthParam]);

  const handleDateClick = (arg) => {
    setSelectedEvent({ date: arg.dateStr, time: '' });
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const ev = events.find(e => e.id === clickInfo.event.id);
    if (!ev) return;
    setSelectedEvent({
      id: ev.id,
      name: ev.title,
      date: ev.start.split('T')[0],
      time: ev.start.split('T')[1].slice(0, 5),
      location: ev.extendedProps.location,
      committee_id: ev.extendedProps.committee,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Eventos de ${defaultDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`, 14, 20);
    const rows = events.map(ev => [
      ev.title,
      ev.start.split('T')[0],
      ev.start.split('T')[1].slice(0,5),
      ev.extendedProps.location || '-',
      ev.extendedProps.committee || '-',
    ]);
    autoTable(doc, {
      head: [['Evento', 'Fecha', 'Hora', 'Lugar', 'Comité']],
      body: rows,
      startY: 30,
    });
    doc.save(`eventos_${yearParam}_${monthParam + 1}.pdf`);
  };

  // Render event as a colored chip
  const renderEventChip = (eventInfo) => (
    <div
      style={{
        backgroundColor: eventInfo.event.extendedProps.color,
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {eventInfo.event.title}
    </div>
  );

  return (
    <div className="calendar-page">
      <div className="calendar-header flex-center">
        <h2 className="calendar-title">Calendario Mensual</h2>
        <button className="secondary" onClick={exportPdf}>Exportar PDF</button>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="es"
        headerToolbar={false}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={renderEventChip}
        height="auto"
        dayMaxEvents={true}
        defaultDate={defaultDate}
      />
      {modalOpen && (
        <Modal onClose={closeModal}>
          <EventForm
            initialData={selectedEvent || {}}
            onClose={closeModal}
            onSuccess={fetchEvents}
          />
        </Modal>
      )}
    </div>
  );
};

export default CalendarMonth;
