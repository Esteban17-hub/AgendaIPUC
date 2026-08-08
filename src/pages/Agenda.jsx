import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
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
  const [selectedEvent, setSelectedEvent] = useState(null); // null = create, object = edit

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCommittee, setFilterCommittee] = useState('');

  useEffect(() => {
    if (profile?.congregation_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch committees
      const { data: comData } = await supabase
        .from('committees')
        .select('*')
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
      await supabase.from('events').delete().eq('id', id);
      fetchData();
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
    const searchMatch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const committeeMatch = filterCommittee ? event.committee_id === filterCommittee : true;
    return searchMatch && committeeMatch;
  });

  return (
    <div className="agenda-page">
      <div className="page-header">
        <div>
          <h1>Gestión de Eventos</h1>
          <p>Administra toda la programación de la congregación.</p>
        </div>
        <button className="add-btn" onClick={openCreate}>
          <Plus size={18} /> Agregar Evento
        </button>
      </div>

      <div className="agenda-controls">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar evento o lugar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={18} />
          <select 
            value={filterCommittee}
            onChange={(e) => setFilterCommittee(e.target.value)}
          >
            <option value="">Todos los comités</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando eventos...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state" style={{background: 'white', padding: '3rem', borderRadius: '14px', textAlign: 'center'}}>
          {events.length === 0 
            ? 'No hay eventos programados. Haz clic en "Agregar Evento" para comenzar.'
            : 'No se encontraron eventos con los filtros actuales.'}
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <div key={event.id} className="event-card" style={{ borderTop: `4px solid ${event.committees?.color || '#00338D'}`, background: 'white', padding: '1.5rem', borderRadius: '14px', boxShadow: 'var(--shadow-sm)' }}>
              <div className="event-card-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600}}>
                <span className="event-date">{new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}</span>
                <span className="event-time">{event.time.substring(0,5)}</span>
              </div>
              <h3 className="event-title" style={{marginBottom: '0.5rem', fontSize: '1.2rem'}}>{event.name}</h3>
              <div style={{marginBottom: '1rem'}}>
                <span className="event-committee" style={{ backgroundColor: `${event.committees?.color}20`, color: event.committees?.color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {event.committees?.name}
                </span>
              </div>
              <p className="event-desc" style={{fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '1.5rem'}}>{event.location}</p>
              
              <div className="event-actions" style={{display: 'flex', gap: '10px'}}>
                <button className="icon-btn outline" style={{padding: '6px 12px'}} onClick={() => openEdit(event)}><Edit2 size={16} /></button>
                <button className="icon-btn outline danger" style={{padding: '6px 12px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)'}} onClick={() => handleDelete(event.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <h2 style={{marginBottom: '1.5rem'}}>{selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}</h2>
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
