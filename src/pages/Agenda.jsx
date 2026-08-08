import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import './Agenda.css';

const Agenda = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    committee_id: '',
    location: 'Templo',
    custom_location: '',
    description: '',
    observations: ''
  });

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
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (evtData) setEvents(evtData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalLocation = formData.location === 'Otro' ? formData.custom_location : formData.location;
      
      const newEvent = {
        congregation_id: profile.congregation_id,
        committee_id: formData.committee_id,
        name: formData.name,
        date: formData.date,
        time: formData.time,
        location: finalLocation,
        description: formData.description,
        observations: formData.observations,
        created_by: profile.id
      };

      const { error } = await supabase.from('events').insert([newEvent]);
      if (error) throw error;
      
      setIsModalOpen(false);
      resetForm();
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error al guardar el evento. Verifica los datos e inténtalo nuevamente.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este evento?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', date: '', time: '', committee_id: '',
      location: 'Templo', custom_location: '', description: '', observations: ''
    });
  };

  return (
    <div className="agenda-page">
      <div className="page-header">
        <div>
          <h1>Gestión de Eventos</h1>
          <p>Administra toda la programación de la congregación.</p>
        </div>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Agregar Evento
        </button>
      </div>

      <div className="agenda-controls">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Buscar evento..." />
        </div>
        <div className="filter-box">
          <Filter size={18} />
          <select>
            <option value="">Todos los comités</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando eventos...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          No hay eventos programados. Haz clic en "Agregar Evento" para comenzar.
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event.id} className="event-card" style={{ borderTop: `4px solid ${event.committees?.color || '#00338D'}` }}>
              <div className="event-card-header">
                <span className="event-date">{new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span className="event-time">{event.time.substring(0,5)}</span>
              </div>
              <h3 className="event-title">{event.name}</h3>
              <span className="event-committee" style={{ backgroundColor: `${event.committees?.color}20`, color: event.committees?.color }}>
                {event.committees?.name}
              </span>
              <p className="event-desc">{event.description}</p>
              
              <div className="event-actions">
                <button className="icon-btn outline" onClick={() => {}}><Edit2 size={16} /></button>
                <button className="icon-btn outline danger" onClick={() => handleDelete(event.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Evento */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Crear Nuevo Evento</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" name="date" required value={formData.date} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Hora *</label>
                  <input type="time" name="time" required value={formData.time} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Comité *</label>
                <select name="committee_id" required value={formData.committee_id} onChange={handleInputChange}>
                  <option value="">Selecciona un comité...</option>
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Nombre del evento *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Ej. Programa de integración familiar" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Lugar *</label>
                  <select name="location" required value={formData.location} onChange={handleInputChange}>
                    <option value="Templo">Templo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                {formData.location === 'Otro' && (
                  <div className="form-group">
                    <label>Especificar lugar *</label>
                    <input type="text" name="custom_location" required value={formData.custom_location} onChange={handleInputChange} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="outline" onClick={() => {setIsModalOpen(false); resetForm();}}>Cancelar</button>
                <button type="submit">Guardar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
