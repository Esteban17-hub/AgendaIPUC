import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Calendar.css';
import EventForm from '../components/EventForm';
import { Modal } from '../components/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filter, Calendar as CalendarIcon } from 'lucide-react';
import { getColombianHolidays } from '../utils/colombianHolidays';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

const CalendarMonth = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [filterCommittee, setFilterCommittee] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const params = new URLSearchParams(location.search);
  const [selectedYear, setSelectedYear] = useState(parseInt(params.get('year')) || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(params.get('month') !== null ? parseInt(params.get('month')) : new Date().getMonth());

  const fetchCommittees = async () => {
    if (!profile?.congregation_id) return;
    const { data } = await supabase
      .from('committees')
      .select('id, name')
      .eq('congregation_id', profile.congregation_id)
      .order('name');
    if (data) setCommittees(data);
  };

  const fetchEvents = async (year, month) => {
    const activeYear = year || selectedYear;
    const activeMonth = month !== undefined ? month : selectedMonth;

    // 1. Cargar TODOS los Festivos de Colombia para el año actual, anterior y posterior (365x3 días de rango cubierto)
    const holidaysCurrent = getColombianHolidays(activeYear);
    const holidaysPrev = getColombianHolidays(activeYear - 1);
    const holidaysNext = getColombianHolidays(activeYear + 1);

    const allHolidays = [...holidaysPrev, ...holidaysCurrent, ...holidaysNext];

    const formattedHolidays = allHolidays.map(h => ({
      id: `holiday-${h.date}-${h.name}`,
      title: `🇨🇴 Festivo: ${h.name}`,
      start: h.date,
      allDay: true,
      extendedProps: {
        color: '#EF4444', // Rojo brillante como los domingos
        isHoliday: true,
        holidayName: h.name
      }
    }));

    let formattedUserEvents = [];

    // 2. Eventos de la iglesia desde Supabase para el mes activo
    if (profile?.congregation_id) {
      const mm = String(activeMonth + 1).padStart(2, '0');
      const startStr = `${activeYear}-${mm}-01`;
      const lastDay = new Date(activeYear, activeMonth + 1, 0).getDate();
      const endStr = `${activeYear}-${mm}-${String(lastDay).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('events')
        .select('id, name, date, time, location, committee_id, committees(name, color)')
        .eq('congregation_id', profile.congregation_id)
        .gte('date', startStr)
        .lte('date', endStr);

      if (!error && data) {
        formattedUserEvents = data.map(ev => ({
          id: ev.id,
          title: ev.name,
          start: `${ev.date}T${ev.time || '00:00:00'}`,
          extendedProps: {
            location: ev.location,
            committee_id: ev.committee_id,
            committee: ev.committees?.name,
            color: ev.committees?.color || '#00338D',
            isHoliday: false
          },
        }));
      }
    }

    setEvents([...formattedHolidays, ...formattedUserEvents]);
  };

  useEffect(() => {
    fetchCommittees();
  }, [profile]);

  useEffect(() => {
    fetchEvents(selectedYear, selectedMonth);
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.gotoDate(new Date(selectedYear, selectedMonth, 1));
    }
  }, [profile, selectedYear, selectedMonth]);

  // Escuchar cuando el usuario cambia de mes/año con los botones prev/next de FullCalendar
  const handleDatesSet = (dateInfo) => {
    const currentCalendarDate = dateInfo.view.currentStart;
    const viewYear = currentCalendarDate.getFullYear();
    const viewMonth = currentCalendarDate.getMonth();

    if (viewYear !== selectedYear || viewMonth !== selectedMonth) {
      setSelectedYear(viewYear);
      setSelectedMonth(viewMonth);
      fetchEvents(viewYear, viewMonth);
    }
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setSelectedMonth(newMonth);
    navigate(`/calendario/mes?year=${selectedYear}&month=${newMonth}`, { replace: true });
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setSelectedYear(newYear);
    navigate(`/calendario/mes?year=${newYear}&month=${selectedMonth}`, { replace: true });
  };

  const handleDateClick = (arg) => {
    setSelectedEvent({ date: arg.dateStr, time: '' });
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    if (clickInfo.event.extendedProps?.isHoliday) return;

    const ev = events.find(e => e.id === clickInfo.event.id);
    if (!ev) return;
    setSelectedEvent({
      id: ev.id,
      name: ev.title,
      date: ev.start.split('T')[0],
      time: ev.start.split('T')[1]?.slice(0, 5) || '',
      location: ev.extendedProps?.location || 'En el Templo',
      committee_id: ev.extendedProps?.committee_id || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    fetchEvents(selectedYear, selectedMonth);
  };

  const filteredEvents = filterCommittee 
    ? events.filter(e => e.extendedProps?.isHoliday || e.extendedProps?.committee_id === filterCommittee) 
    : events;

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Eventos de ${MONTH_NAMES[selectedMonth]} ${selectedYear}`, 14, 20);
    
    // Filtrar para el PDF solo los eventos del mes seleccionado
    const pdfEvents = filteredEvents.filter(e => {
      const eMonth = parseInt(e.start.split('-')[1], 10) - 1;
      const eYear = parseInt(e.start.split('-')[0], 10);
      return eMonth === selectedMonth && eYear === selectedYear;
    });

    const rows = pdfEvents.map(ev => [
      ev.title,
      ev.start.split('T')[0],
      ev.extendedProps?.isHoliday ? 'Festivo' : (ev.start.split('T')[1]?.slice(0,5) || 'Todo el día'),
      ev.extendedProps?.location || '-',
      ev.extendedProps?.committee || (ev.extendedProps?.isHoliday ? 'Festivo Oficial' : '-'),
    ]);
    autoTable(doc, {
      head: [['Evento / Festivo', 'Fecha', 'Hora', 'Lugar', 'Comité']],
      body: rows,
      startY: 30,
    });
    doc.save(`eventos_${selectedYear}_${selectedMonth + 1}.pdf`);
  };

  const renderEventChip = (eventInfo) => {
    const isHoliday = eventInfo.event.extendedProps?.isHoliday;
    const color = eventInfo.event.extendedProps?.color || '#00338D';
    return (
      <div
        style={{
          backgroundColor: isHoliday ? '#EF4444' : color,
          color: '#FFFFFF',
          padding: '3px 6px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          boxShadow: isHoliday ? '0 2px 6px rgba(239, 68, 68, 0.4)' : 'none',
        }}
      >
        {eventInfo.event.title}
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="calendar-title" style={{ margin: 0 }}>Calendario Mensual</h2>
        
        {/* Selectores de Mes, Año y Filtro */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector de Mes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-surface)', padding: '6px 12px', borderRadius: '8px', border: '1.8px solid var(--color-secondary)' }}>
            <CalendarIcon size={16} color="var(--color-secondary)" />
            <select value={selectedMonth} onChange={handleMonthChange} style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, cursor: 'pointer' }}>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          {/* Selector de Año */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-surface)', padding: '6px 12px', borderRadius: '8px', border: '1.8px solid var(--color-secondary)' }}>
            <select value={selectedYear} onChange={handleYearChange} style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, cursor: 'pointer' }}>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Comité */}
          <div className="filter-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-surface)', padding: '6px 12px', borderRadius: '8px', border: '1.8px solid var(--color-secondary)' }}>
            <Filter size={16} color="var(--color-text-muted)" />
            <select 
              value={filterCommittee} 
              onChange={(e) => setFilterCommittee(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              <option value="">Todos los comités</option>
              {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button className="secondary" onClick={exportPdf}>Exportar PDF</button>
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="es"
        locales={[esLocale]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        buttonText={{ today: 'Hoy' }}
        events={filteredEvents}
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={renderEventChip}
        height="auto"
        dayMaxEvents={true}
        initialDate={new Date(selectedYear, selectedMonth, 1)}
      />

      {modalOpen && (
        <Modal onClose={closeModal}>
          <h2 style={{ marginBottom: '1.5rem' }}>{selectedEvent?.id ? 'Editar Evento' : 'Nuevo Evento'}</h2>
          <EventForm
            initialData={selectedEvent || {}}
            onClose={closeModal}
            onSuccess={() => fetchEvents(selectedYear, selectedMonth)}
          />
        </Modal>
      )}
    </div>
  );
};

export default CalendarMonth;
