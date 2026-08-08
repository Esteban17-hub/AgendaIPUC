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
    location: '',
    committee_id: '',
    ...initialData,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load committees for the current congregation
  useEffect(() => {
    const fetchCommittees = async () => {
      if (!profile?.congregation_id) return;
      const { data, error } = await supabase
        .from('committees')
        .select('id, name, color')
        .eq('congregation_id', profile.congregation_id);
      if (error) return console.error(error);
      setCommittees(data);
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
      const payload = {
        name: form.name,
        date: form.date,
        time: form.time,
        location: form.location,
        committee_id: form.committee_id,
        congregation_id: profile.congregation_id,
      };

      if (initialData.id) {
        const { error: updError } = await supabase
          .from('events')
          .update(payload)
          .eq('id', initialData.id);
        if (updError) throw updError;
      } else {
        const { error: insError } = await supabase.from('events').insert(payload);
        if (insError) throw insError;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      <label>
        Nombre del evento
        <input type="text" name="name" value={form.name} onChange={handleChange} required />
      </label>
      <label>
        Fecha
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
      </label>
      <label>
        Hora
        <input type="time" name="time" value={form.time} onChange={handleChange} required />
      </label>
      <label>
        Lugar
        <input type="text" name="location" value={form.location} onChange={handleChange} required />
      </label>
      <label>
        Comité
        <select name="committee_id" value={form.committee_id} onChange={handleChange} required>
          <option value="" disabled>Selecciona un comité</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <div className="form-actions" style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
        <button type="button" className="outline" onClick={onClose} disabled={loading} style={{flex: 1}}>Cancelar</button>
        <button type="submit" className="secondary" disabled={loading} style={{flex: 1}}>
          {loading ? 'Guardando…' : (initialData.id ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
