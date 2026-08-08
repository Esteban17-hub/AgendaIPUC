import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Building, Plus, Check, Edit3 } from 'lucide-react';

const Settings = () => {
  const { profile, refreshProfile } = useAuth();
  const [congregations, setCongregations] = useState([]);
  const [currentCongregationName, setCurrentCongregationName] = useState('');
  const [newCongregationName, setNewCongregationName] = useState('');
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCongregations();
  }, [profile]);

  const fetchCongregations = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('congregations').select('*').order('name');
      if (data) {
        setCongregations(data);
      }
      if (profile?.congregation_id) {
        setSelectedCongregationId(profile.congregation_id);
        const current = data?.find(c => c.id === profile.congregation_id);
        if (current) setCurrentCongregationName(current.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrentCongregation = async (e) => {
    e.preventDefault();
    if (!profile?.congregation_id || !currentCongregationName.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('congregations')
        .update({ name: currentCongregationName.trim() })
        .eq('id', profile.congregation_id);
      if (error) throw error;

      await refreshProfile(); // Refresca inmediatamente la barra lateral e inicio
      setMessage('¡Nombre de la congregación actualizado exitosamente!');
      fetchCongregations();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar la congregación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCongregation = async (e) => {
    e.preventDefault();
    if (!newCongregationName.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase
        .from('congregations')
        .insert([{ name: newCongregationName.trim() }])
        .select()
        .single();
      if (error) throw error;

      if (data && profile?.id) {
        await supabase
          .from('profiles')
          .update({ congregation_id: data.id })
          .eq('id', profile.id);
      }

      await refreshProfile();
      setNewCongregationName('');
      setMessage('¡Nueva congregación creada y asignada!');
      fetchCongregations();
    } catch (err) {
      console.error(err);
      alert('Error al crear la congregación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchCongregation = async (e) => {
    e.preventDefault();
    if (!selectedCongregationId || !profile?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ congregation_id: selectedCongregationId })
        .eq('id', profile.id);
      if (error) throw error;

      await refreshProfile();
      setMessage('¡Congregación cambiada exitosamente!');
    } catch (err) {
      console.error(err);
      alert('Error al cambiar de congregación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page" style={{ padding: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-primary)' }}>Configuración de Congregación</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>Administra el nombre de tu iglesia, crea o cambia entre congregaciones.</p>
      </div>

      {message && (
        <div style={{ background: 'rgba(40, 167, 69, 0.2)', color: '#28A745', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 700, border: '1px solid #28A745' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Editar Congregación Actual */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--color-primary)' }}>
            <Edit3 size={24} />
            <h3 style={{ margin: 0 }}>Editar Nombre de Congregación</h3>
          </div>
          <form onSubmit={handleUpdateCurrentCongregation}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nombre de la Congregación</label>
              <input
                type="text"
                required
                value={currentCongregationName}
                onChange={(e) => setCurrentCongregationName(e.target.value)}
                placeholder="Ej. IPUC Central Neiva"
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="secondary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Check size={18} /> Guardar Nombre
            </button>
          </form>
        </div>

        {/* Cambiar de Congregación */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--color-secondary)' }}>
            <Building size={24} />
            <h3 style={{ margin: 0 }}>Seleccionar Congregación</h3>
          </div>
          <form onSubmit={handleSwitchCongregation}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Congregaciones Registradas</label>
              <select
                value={selectedCongregationId}
                onChange={(e) => setSelectedCongregationId(e.target.value)}
                style={{ width: '100%' }}
              >
                {congregations.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading || selectedCongregationId === profile?.congregation_id} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Cambiar a esta Congregación
            </button>
          </form>
        </div>

        {/* Crear Nueva Congregación */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--color-accent)' }}>
            <Plus size={24} />
            <h3 style={{ margin: 0 }}>Crear Nueva Congregación</h3>
          </div>
          <form onSubmit={handleCreateCongregation}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nombre de la Nueva Congregación</label>
              <input
                type="text"
                required
                value={newCongregationName}
                onChange={(e) => setNewCongregationName(e.target.value)}
                placeholder="Ej. IPUC Distrito 1"
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="secondary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Plus size={18} /> Crear y Asignar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
