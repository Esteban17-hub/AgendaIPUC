import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Building, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Login.css';

const Login = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Congregaciones
  const [congregations, setCongregations] = useState([]);
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [createNewCongregation, setCreateNewCongregation] = useState(false);
  const [newCongregationName, setNewCongregationName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    fetchCongregations();
  }, []);

  const fetchCongregations = async () => {
    try {
      const { data } = await supabase.from('congregations').select('*').order('name');
      if (data && data.length > 0) {
        setCongregations(data);
        setSelectedCongregationId(data[0].id);
      } else {
        setCreateNewCongregation(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isRegistering) {
      try {
        let finalCongregationId = selectedCongregationId;

        // Si eligió crear una congregación nueva
        if (createNewCongregation || !selectedCongregationId) {
          if (!newCongregationName.trim()) {
            throw new Error('Por favor escribe el nombre de la nueva congregación.');
          }
          const { data: newCong, error: congErr } = await supabase
            .from('congregations')
            .insert([{ name: newCongregationName.trim() }])
            .select()
            .single();

          if (congErr) throw congErr;
          finalCongregationId = newCong.id;
        }

        // Registrar usuario en Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || 'Usuario IPUC' }
          }
        });

        if (signUpError) throw signUpError;

        // Crear fila en profiles
        if (authData.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            full_name: fullName || 'Usuario IPUC',
            role: 'admin',
            congregation_id: finalCongregationId
          });
        }

        setSuccess('¡Registro exitoso! Ya puedes iniciar sesión.');
        setIsRegistering(false);
      } catch (err) {
        setError(`Error al registrar: ${err.message}`);
      }
    } else {
      // Iniciar sesión
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(`Error de inicio de sesión: ${signInError.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="login-logo-container">
          <img src="/logo.png" alt="Logo de la Iglesia" className="login-logo" onError={(e) => e.target.style.display = 'none'} />
          <h2>Agenda IPUC</h2>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-error" style={{ backgroundColor: 'rgba(40, 167, 69, 0.15)', color: '#28A745' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="fullName">Nombre Completo *</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Pastor Juan Pérez"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo electrónico *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div className="form-group relative-group">
            <label htmlFor="password">Contraseña *</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Selección o Creación de Congregación en Registro */}
          {isRegistering && (
            <div className="form-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <label style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={16} /> Congregación *
              </label>

              {!createNewCongregation && congregations.length > 0 ? (
                <div>
                  <select
                    value={selectedCongregationId}
                    onChange={(e) => setSelectedCongregationId(e.target.value)}
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    {congregations.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="outline"
                    onClick={() => setCreateNewCongregation(true)}
                    style={{ fontSize: '0.8rem', marginTop: '6px', width: '100%' }}
                  >
                    + ¿Tu congregación no aparece? Créala aquí
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '6px' }}>
                  <input
                    type="text"
                    value={newCongregationName}
                    onChange={(e) => setNewCongregationName(e.target.value)}
                    placeholder="Escribe el nombre de tu congregación..."
                    required
                    style={{ width: '100%' }}
                  />
                  {congregations.length > 0 && (
                    <button
                      type="button"
                      className="outline"
                      onClick={() => setCreateNewCongregation(false)}
                      style={{ fontSize: '0.8rem', marginTop: '6px', width: '100%' }}
                    >
                      Volver a la lista de congregaciones
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!isRegistering && (
            <div className="form-group remember-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Recordar mi correo
              </label>
            </div>
          )}

          <button type="submit" disabled={loading} className="login-button" style={{ marginTop: '1rem' }}>
            {loading ? 'Procesando...' : (isRegistering ? 'REGISTRARSE Y CREAR CUENTA' : 'INICIAR SESIÓN')}
          </button>
        </form>

        <div className="login-footer">
          <button 
            type="button" 
            className="outline" 
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }}
          >
            {isRegistering ? 'Volver a Iniciar Sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
