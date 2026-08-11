import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Building, Users, Plus, Check, Edit3, UserPlus, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const getStoredCongregations = () => {
  try {
    const local = localStorage.getItem('custom_congregations');
    if (local) return JSON.parse(local);
  } catch (e) {}
  return [
    { id: '22222222-2222-2222-2222-222222222222', name: 'Congregación Principal' }
  ];
};

export const saveStoredCongregations = (list) => {
  try {
    localStorage.setItem('custom_congregations', JSON.stringify(list));
  } catch (e) {}
};

const Admin = () => {
  const { profile, switchActiveCongregation } = useAuth();
  const [congregations, setCongregations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Modales
  const [isCongModalOpen, setIsCongModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Formulario Congregación
  const [congForm, setCongForm] = useState({ id: null, name: '' });

  // Formulario Usuario
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    congregation_id: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Obtener congregaciones de Supabase + LocalStorage
      const localList = getStoredCongregations();
      let mergedCongs = [...localList];

      const { data: dbCongs, error: congErr } = await supabase.from('congregations').select('id, name').order('name');
      if (!congErr && dbCongs && dbCongs.length > 0) {
        // Mezclar sin duplicados
        dbCongs.forEach(c => {
          if (!mergedCongs.some(lc => lc.id === c.id)) {
            mergedCongs.push(c);
          }
        });
      }

      saveStoredCongregations(mergedCongs);

      // 2. Obtener todos los perfiles de usuario
      const { data: profs } = await supabase
        .from('profiles')
        .select('*, congregations(id, name)')
        .order('full_name');

      // 3. Contar usuarios por congregación
      const counts = {};
      (profs || []).forEach(p => {
        if (p.congregation_id) {
          counts[p.congregation_id] = (counts[p.congregation_id] || 0) + 1;
        }
      });

      const formattedCongs = mergedCongs.map(c => ({
        ...c,
        userCount: counts[c.id] || 0,
        isFull: (counts[c.id] || 0) >= 2
      }));

      setCongregations(formattedCongs);
      setUsers(profs || []);
      if (formattedCongs.length > 0 && !userForm.congregation_id) {
        setUserForm(prev => ({ ...prev, congregation_id: formattedCongs[0].id }));
      }
    } catch (err) {
      console.error('Error cargando datos de administración:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCongregation = async (e) => {
    e.preventDefault();
    const congName = congForm.name.trim();
    if (!congName) return;

    try {
      let currentList = getStoredCongregations();

      if (congForm.id) {
        // Editar congregación
        await supabase.from('congregations').update({ name: congName }).eq('id', congForm.id);
        currentList = currentList.map(c => c.id === congForm.id ? { ...c, name: congName } : c);
        setMessage(`Congregación "${congName}" actualizada exitosamente.`);
      } else {
        // Crear congregación
        const createdId = `cong-${Date.now()}`;
        const { data: newCong } = await supabase
          .from('congregations')
          .insert([{ name: congName }])
          .select()
          .single();

        const finalObj = { id: newCong?.id || createdId, name: congName };
        if (!currentList.some(c => c.name.toLowerCase() === congName.toLowerCase())) {
          currentList.push(finalObj);
        }
        setMessage(`¡Nueva congregación "${congName}" creada exitosamente!`);
      }

      saveStoredCongregations(currentList);
      setIsCongModalOpen(false);
      setCongForm({ id: null, name: '' });
      
      // Actualizar estado inmediatamente
      const counts = {};
      users.forEach(p => {
        if (p.congregation_id) counts[p.congregation_id] = (counts[p.congregation_id] || 0) + 1;
      });
      const formatted = currentList.map(c => ({
        ...c,
        userCount: counts[c.id] || 0,
        isFull: (counts[c.id] || 0) >= 2
      }));
      setCongregations(formatted);
    } catch (err) {
      console.error('Error al guardar congregación:', err);
      setIsCongModalOpen(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.email || !userForm.password || !userForm.congregation_id) return;

    const selectedCong = congregations.find(c => c.id === userForm.congregation_id);
    if (selectedCong && selectedCong.userCount >= 2 && userForm.role !== 'superadmin') {
      alert(`La congregación "${selectedCong.name}" ya alcanzó el límite máximo de 2 usuarios.`);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: { data: { full_name: userForm.full_name } }
      });

      if (signUpError) console.warn(signUpError);

      const userId = authData?.user?.id || `usr-${Date.now()}`;
      const newProfile = {
        id: userId,
        full_name: userForm.full_name,
        role: userForm.role,
        congregation_id: userForm.congregation_id,
        congregations: { id: userForm.congregation_id, name: selectedCong?.name || 'Congregación' }
      };

      await supabase.from('profiles').upsert(newProfile);

      setUsers(prev => [...prev, newProfile]);
      setMessage(`Usuario "${userForm.full_name}" asignado a "${selectedCong?.name || 'Congregación'}".`);
      setIsUserModalOpen(false);
      setUserForm({ email: '', password: '', full_name: '', role: 'user', congregation_id: congregations[0]?.id || '' });
      fetchAdminData();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setIsUserModalOpen(false);
    }
  };

  const handleSelectCongregationView = (cong) => {
    switchActiveCongregation(cong.id, cong.name);
    setMessage(`Cambiado a la vista de: "${cong.name}"`);
  };

  return (
    <div className="admin-page" style={{ padding: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield color="var(--color-secondary)" size={28} /> Panel del Administrador Principal
        </h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
          Gestión centralizada de congregaciones, asignación de usuarios y control de cupos (Máximo 2 usuarios por congregación).
        </p>
      </div>

      {message && (
        <div style={{ background: 'rgba(40, 167, 69, 0.2)', color: '#28A745', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 700, border: '1px solid #28A745' }}>
          {message}
        </div>
      )}

      {/* Sección 1: Gestión de Congregaciones */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building color="var(--color-primary)" size={22} /> Congregaciones Registradas ({congregations.length})
          </h2>
          <button onClick={() => { setCongForm({ id: null, name: '' }); setIsCongModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Crear Nueva Congregación
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {congregations.map(c => (
            <div key={c.id} className="glass-card" style={{ padding: '1.4rem', borderLeft: `5px solid ${c.isFull ? '#EF4444' : '#28A745'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{c.name}</h3>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '3px 8px', 
                  borderRadius: '12px',
                  background: c.isFull ? 'rgba(239, 68, 68, 0.2)' : 'rgba(40, 167, 69, 0.2)',
                  color: c.isFull ? '#EF4444' : '#28A745'
                }}>
                  {c.userCount}/2 Usuarios {c.isFull ? '(CUPO LLENO)' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button className="outline" onClick={() => { setCongForm({ id: c.id, name: c.name }); setIsCongModalOpen(true); }} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                  <Edit3 size={14} /> Editar Nombre
                </button>

                <button className="secondary" onClick={() => handleSelectCongregationView(c)} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                  Inspeccionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección 2: Gestión de Usuarios */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="var(--color-primary)" size={22} /> Usuarios Registrados ({users.length})
          </h2>
          <button className="secondary" onClick={() => setIsUserModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Crear Usuario para Congregación
          </button>
        </div>

        <div className="glass-card" style={{ overflowX: 'auto', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '10px' }}>Nombre</th>
                <th style={{ padding: '10px' }}>Rol</th>
                <th style={{ padding: '10px' }}>Congregación Asignada</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600 }}>{u.full_name || 'Sin nombre'}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      background: u.role === 'superadmin' ? 'rgba(255, 199, 44, 0.2)' : 'rgba(0, 102, 255, 0.15)',
                      color: u.role === 'superadmin' ? 'var(--color-accent)' : 'var(--color-primary)'
                    }}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--color-text-muted)' }}>
                    {u.congregations?.name || 'General'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar Congregación */}
      {isCongModalOpen && (
        <Modal onClose={() => setIsCongModalOpen(false)}>
          <h2 style={{ marginBottom: '1.5rem' }}>{congForm.id ? 'Editar Congregación' : 'Crear Nueva Congregación'}</h2>
          <form onSubmit={handleSaveCongregation}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nombre de la Congregación *</label>
              <input
                type="text"
                required
                value={congForm.name}
                onChange={(e) => setCongForm({ ...congForm, name: e.target.value })}
                placeholder="Ej. IPUC Algeciras Central"
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="secondary" style={{ width: '100%' }}>
              {congForm.id ? 'Guardar Cambios' : 'Crear Congregación'}
            </button>
          </form>
        </Modal>
      )}

      {/* Modal Crear Usuario */}
      {isUserModalOpen && (
        <Modal onClose={() => setIsUserModalOpen(false)}>
          <h2 style={{ marginBottom: '1.5rem' }}>Crear Nuevo Usuario</h2>
          <form onSubmit={handleCreateUser}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nombre Completo *</label>
              <input
                type="text"
                required
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                placeholder="Ej. Pastor Pedro Gómez"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Correo Electrónico *</label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="usuario@ipuc.com"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Contraseña *</label>
              <input
                type="password"
                required
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="••••••••"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Rol del Usuario *</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="user">Usuario Estándar de Congregación</option>
                <option value="admin">Administrador Local de Congregación</option>
                <option value="superadmin">Administrador Principal (SuperAdmin)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Congregación Asignada (Máximo 2 usuarios) *</label>
              <select
                value={userForm.congregation_id}
                onChange={(e) => setUserForm({ ...userForm, congregation_id: e.target.value })}
                style={{ width: '100%' }}
              >
                {congregations.map(c => (
                  <option key={c.id} value={c.id} disabled={c.isFull && userForm.role !== 'superadmin'}>
                    {c.name} {c.isFull ? '🚫 (CUPO LLENO - 2/2)' : `(Disponibles: ${2 - c.userCount}/2)`}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="secondary" style={{ width: '100%' }}>
              Crear y Asignar Usuario
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Admin;
