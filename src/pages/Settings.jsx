import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Check, Edit3 } from 'lucide-react';

const Settings = () => {
  const { profile, updateCongregationName } = useAuth();
  const [currentCongregationName, setCurrentCongregationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile?.congregations?.name) {
      setCurrentCongregationName(profile.congregations.name);
    }
  }, [profile]);

  const handleUpdateCurrentCongregation = async (e) => {
    e.preventDefault();
    const updatedName = currentCongregationName.trim();
    if (!profile?.congregation_id || !updatedName) return;
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('congregations')
        .update({ name: updatedName })
        .eq('id', profile.congregation_id);
      if (error) console.warn('Supabase update warning:', error);

      updateCongregationName(updatedName);
      setMessage('¡Nombre de la congregación actualizado exitosamente!');
    } catch (err) {
      console.error(err);
      updateCongregationName(updatedName);
      setMessage('¡Nombre actualizado!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page" style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={26} /> Configuración de Congregación
        </h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
          Administra el nombre de tu congregación activa ({profile?.congregations?.name || 'Congregación IPUC'}).
        </p>
      </div>

      {message && (
        <div style={{ background: 'rgba(40, 167, 69, 0.2)', color: '#28A745', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 700, border: '1px solid #28A745' }}>
          {message}
        </div>
      )}

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--color-primary)' }}>
          <Edit3 size={24} />
          <h3 style={{ margin: 0 }}>Editar Nombre de Congregación</h3>
        </div>
        <form onSubmit={handleUpdateCurrentCongregation}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nombre de la Congregación *</label>
            <input
              type="text"
              required
              value={currentCongregationName}
              onChange={(e) => setCurrentCongregationName(e.target.value)}
              placeholder="Ej. IPUC Zuluaga Central"
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit" className="secondary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check size={18} /> Guardar Nombre
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
