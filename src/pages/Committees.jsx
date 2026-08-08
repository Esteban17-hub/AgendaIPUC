import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, Edit2, Trash2, Tag } from 'lucide-react';
import { Modal } from '../components/Modal';
import './Committees.css';

const DEFAULT_COLOR_PRESETS = [
  '#00338D', // Azul IPUC
  '#00AEEF', // Cyan
  '#FFC72C', // Amarillo
  '#E31C23', // Rojo
  '#28A745', // Verde
  '#6F42C1', // Púrpura
  '#FD7E14', // Naranja
  '#20C997', // Menta
];

const DEFAULT_COMMITTEES = [
  { name: 'Escuela Dominical', color: '#00AEEF', description: 'Enseñanza bíblica para niños, jóvenes y adultos.' },
  { name: 'Damas Dorcas', color: '#E31C23', description: 'Comité de mujeres dedicadas al servicio y la oración.' },
  { name: 'Jóvenes (Conquistadores)', color: '#FFC72C', description: 'Ministerio juvenil e integración de jóvenes.' },
  { name: 'Misiones y Evangelismo', color: '#00338D', description: 'Evangelismo local y apoyo a misiones.' },
  { name: 'Familia', color: '#28A745', description: 'Orientación, talleres y eventos de integración familiar.' },
  { name: 'Obra Social', color: '#6F42C1', description: 'Ayuda humanitaria y atención a necesitados.' }
];

const Committees = () => {
  const { profile } = useAuth();
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState(null);

  const [form, setForm] = useState({
    name: '',
    color: '#00338D',
    description: '',
  });

  useEffect(() => {
    if (profile?.congregation_id) {
      fetchCommittees();
    }
  }, [profile]);

  const fetchCommittees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .eq('congregation_id', profile.congregation_id)
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        setCommittees(data);
      } else {
        // If empty, suggest seeding default committees
        setCommittees([]);
      }
    } catch (err) {
      console.error('Error fetching committees:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultCommittees = async () => {
    if (!profile?.congregation_id) return;
    setLoading(true);
    try {
      const payload = DEFAULT_COMMITTEES.map(c => ({
        ...c,
        congregation_id: profile.congregation_id
      }));
      const { error } = await supabase.from('committees').insert(payload);
      if (error) throw error;
      fetchCommittees();
    } catch (err) {
      console.error('Error seeding committees:', err);
      alert('Error al agregar los comités por defecto.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedCommittee(null);
    setForm({ name: '', color: '#00338D', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (committee) => {
    setSelectedCommittee(committee);
    setForm({
      name: committee.name,
      color: committee.color || '#00338D',
      description: committee.description || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCommittee(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        color: form.color,
        description: form.description,
        congregation_id: profile.congregation_id,
      };

      if (selectedCommittee) {
        const { error } = await supabase
          .from('committees')
          .update(payload)
          .eq('id', selectedCommittee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('committees').insert(payload);
        if (error) throw error;
      }

      closeModal();
      fetchCommittees();
    } catch (err) {
      console.error('Error saving committee:', err);
      alert('Error al guardar el comité: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este comité? Esto podría afectar los eventos asociados.')) {
      try {
        const { error } = await supabase.from('committees').delete().eq('id', id);
        if (error) throw error;
        fetchCommittees();
      } catch (err) {
        console.error('Error deleting committee:', err);
        alert('No se pudo eliminar el comité. Asegúrate de que no tenga eventos vinculados.');
      }
    }
  };

  return (
    <div className="committees-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-primary)' }}>Gestión de Comités</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>Administra los comités locales y sus colores distintivos.</p>
        </div>
        <button className="add-btn" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
          <Plus size={18} /> Nuevo Comité
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Cargando comités...</div>
      ) : committees.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', padding: '3rem', borderRadius: '14px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <Users size={48} color="var(--color-secondary)" style={{ marginBottom: '1rem' }} />
          <h3>No hay comités registrados</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Puedes crear tus propios comités o cargar la lista estándar de la IPUC con un solo clic.
          </p>
          <button className="secondary" onClick={seedDefaultCommittees}>
            Cargar Comités Estándar de la IPUC
          </button>
        </div>
      ) : (
        <div className="committees-grid">
          {committees.map((committee) => (
            <div key={committee.id} className="committee-card" style={{ borderTopColor: committee.color || '#00338D' }}>
              <div>
                <div className="committee-header">
                  <div className="committee-color-badge" style={{ backgroundColor: committee.color || '#00338D' }} />
                  <h3 className="committee-title">{committee.name}</h3>
                </div>
                <p className="committee-desc">{committee.description || 'Sin descripción asignada.'}</p>
              </div>

              <div className="committee-actions">
                <button className="icon-btn outline" onClick={() => openEditModal(committee)} style={{ padding: '6px 12px' }}>
                  <Edit2 size={16} /> Editar
                </button>
                <button className="icon-btn outline danger" onClick={() => handleDelete(committee.id)} style={{ padding: '6px 12px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <h2 style={{ marginBottom: '1.5rem' }}>{selectedCommittee ? 'Editar Comité' : 'Nuevo Comité'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nombre del Comité *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Escuela Dominical"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Color del Distintivo *</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  style={{ width: '45px', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  style={{ width: '100px', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}
                />
              </div>
              <div className="color-presets">
                {DEFAULT_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-preset-btn ${form.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Descripción</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Propósito o visión de este comité..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button type="button" className="outline" onClick={closeModal} style={{ flex: 1 }}>Cancelar</button>
              <button type="submit" className="secondary" style={{ flex: 1 }}>
                {selectedCommittee ? 'Guardar Cambios' : 'Crear Comité'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Committees;
