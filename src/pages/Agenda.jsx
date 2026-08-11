import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Edit2, Trash2, Clock, MapPin } from 'lucide-react';
import './Agenda.css';
import EventForm from '../components/EventForm';
import { Modal } from '../components/Modal';

const Agenda = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCommittee, setFilterCommittee] = useState('');

  useEffect(() => {
    if (profile?.congregation_id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch committees
      const { data: comData } = await supabase
        .from('committees')
        .select('*')
        .eq('congregation_id', profile.congregation_id)
        .order('name');
      if (comData) setCommittees(comData);

      // Fetch events
      const { data: evtData } = await supabase
        .from('events')
        .select(`*, committees(name, color)`)
        .eq('congregation_id', profile.congregation_id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (evtData) setEvents(evtData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este evento?')) {
      try {
        await supabase.from('events').delete().eq('id', id);
        fetchData();
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  const openCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const openEdit = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Filter the events
  const filteredEvents = events.filter(event => {
    const searchMatch = (event.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const committeeMatch = filterCommittee ? event.committee_id === filterCommittee : true;
    return searchMatch && committeeMatch;
  });

  const formatDisplayTime = (timeStr) => {
    if (!timeStr || timeStr === '00:00:00') return 'Todo el día';
    return timeStr.substring(0, 5);
  };

  return (
    <div className="agenda-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-primary)' }}>Gestión de Agenda</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>Administra la programación de eventos de la congregación.</p>
        </div>
        <button className="add-btn" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
          <Plus size={18} /> Agregar Evento
        </button>
      </div>

      <div className="agenda-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" 
            placeholder="Buscar evento o lugar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
          />
        </div>
        <div className="filter-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
          <Filter size={18} color="var(--color-text-muted)" />
          <select 
            value={filterCommittee}
            onChange={(e) => setFilterCommittee(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <option value="">Todos los comités</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando eventos...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          {events.length === 0 
            ? 'No hay eventos programados. Haz clic en "Agregar Evento" para comenzar.'
            : 'No se encontraron eventos con los filtros actuales.'}
        </div>
      ) : (
        <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredEvents.map(event => (
            <div key={event.id} className="event-card glass-card" style={{ borderTop: `5px solid ${event.committees?.color || '#00338D'}`, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <span className="event-date">{new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}</span>
                  <span className="event-time" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-secondary)' }}>
                    <Clock size={14} /> {formatDisplayTime(event.time)}
                  </span>
                </div>
                <h3 className="event-title" style={{ marginBottom: '0.6rem', fontSize: '1.25rem', color: 'var(--color-text-main)' }}>{event.name}</h3>
                
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="event-committee" style={{ backgroundColor: `${event.committees?.color || '#00338D'}25`, color: event.committees?.color || '#00338D', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {event.committees?.name || 'General'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {event.location || 'En el Templo'}
                  </span>
                </div>
              </div>
              
              <div className="event-actions" style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <button className="icon-btn outline" style={{ padding: '6px 12px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => openEdit(event)}>
                  <Edit2 size={16} /> Editar
                </button>
                <button className="icon-btn outline danger" style={{ padding: '6px 12px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleDelete(event.id)}>
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <h2 style={{ marginBottom: '1.5rem' }}>{selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}</h2>
          <EventForm 
            initialData={selectedEvent || {}} 
            onClose={closeModal} 
            onSuccess={fetchData} 
          />
        </Modal>
      )}
    </div>
  );
};

export default Agenda;
