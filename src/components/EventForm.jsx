import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const EventForm = ({ initialData = {}, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [committees, setCommittees] = useState([]);
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    location: 'En el Templo',
    committee_id: '',
    ...initialData,
  });

  // Re-sync form state when initialData changes
  useEffect(() => {
    setForm({
      name: initialData.name || '',
      date: initialData.date || '',
      time: initialData.time ? initialData.time.substring(0, 5) : '',
      location: initialData.location || 'En el Templo',
      committee_id: initialData.committee_id || '',
    });
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCommittees = async () => {
      if (!profile?.congregation_id) return;
      const { data, error } = await supabase
        .from('committees')
        .select('id, name, color')
        .eq('congregation_id', profile.congregation_id)
        .order('name');
      if (error) return console.error(error);
      setCommittees(data || []);
      if (!form.committee_id && data && data.length > 0) {
        setForm(prev => ({ ...prev, committee_id: data[0].id }));
      }
    };
    fetchCommittees();
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const validCommitteeId = (form.committee_id && !form.committee_id.startsWith('def-') && !form.committee_id.startsWith('local-')) 
        ? form.committee_id 
        : null;

      const payload = {
        name: form.name.trim(),
        date: form.date,
        time: form.time ? form.time : '00:00:00',
        location: form.location,
        committee_id: validCommitteeId,
        congregation_id: profile?.congregation_id || '22222222-2222-2222-2222-222222222222',
      };

      if (initialData.id) {
        // Actualizar evento existente
        const { error: updError } = await supabase
          .from('events')
          .update(payload)
          .eq('id', initialData.id);
        if (updError) throw updError;
      } else {
        // Insertar nuevo evento
        const { error: insError } = await supabase.from('events').insert([payload]);
        if (insError) throw insError;
      }

      if (onSuccess) await onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error in EventForm submission:', err);
      setError(err.message || 'Error inesperado al guardar el evento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div className="form-error" style={{ color: 'var(--color-danger)', fontSize: '0.9rem', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>{error}</div>}
      
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nombre del Evento *</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Ej. Culto Evangelístico de la Juventud"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Fecha *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Hora (Opcional)</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            placeholder="Sin hora especificada"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Comité *</label>
        <select
          name="committee_id"
          value={form.committee_id}
          onChange={handleChange}
          required
          style={{ width: '100%' }}
        >
          <option value="">General (Sin comité específico)</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Lugar (Opcional)</label>
        <select
          name="location"
          value={form.location}
          onChange={handleChange}
          style={{ width: '100%' }}
        >
          <option value="En el Templo">En el Templo</option>
          <option value="Fuera del Templo">Fuera del Templo</option>
        </select>
      </div>

      <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
        <button type="button" className="outline" onClick={onClose} disabled={loading} style={{ flex: 1 }}>
          Cancelar
        </button>
        <button type="submit" className="secondary" disabled={loading} style={{ flex: 1 }}>
          {loading ? 'Guardando…' : (initialData.id ? 'Actualizar Evento' : 'Crear Evento')}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
