import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStoredCongregations } from './Admin';
import './Login.css';

const Login = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Congregaciones registradas y sus conteos
  const [congregations, setCongregations] = useState([]);
  const [selectedCongregationId, setSelectedCongregationId] = useState('');

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
      let congs = getStoredCongregations();

      const { data: dbCongs } = await supabase.from('congregations').select('id, name').order('name');
      if (dbCongs && dbCongs.length > 0) {
        dbCongs.forEach(c => {
          if (!congs.some(lc => lc.id === c.id)) {
            congs.push(c);
          }
        });
      }

      // Consultar cuántos usuarios tiene cada congregación para validar el límite de 2
      const { data: profiles } = await supabase.from('profiles').select('congregation_id');
      
      const counts = {};
      (profiles || []).forEach(p => {
        if (p.congregation_id) {
          counts[p.congregation_id] = (counts[p.congregation_id] || 0) + 1;
        }
      });

      const formatted = congs.map(c => ({
        ...c,
        userCount: counts[c.id] || 0,
        isFull: (counts[c.id] || 0) >= 2
      }));

      setCongregations(formatted);
      const available = formatted.find(c => !c.isFull);
      if (available) {
        setSelectedCongregationId(available.id);
      } else if (formatted.length > 0) {
        setSelectedCongregationId(formatted[0].id);
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
        if (!selectedCongregationId) {
          throw new Error('Debes seleccionar una congregación de la lista.');
        }

        const selectedCong = congregations.find(c => c.id === selectedCongregationId);
        if (selectedCong && selectedCong.isFull) {
          throw new Error(`La congregación "${selectedCong.name}" ya alcanzó el cupo máximo de 2 usuarios por congregación.`);
        }

        // Registrar usuario en Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || 'Usuario IPUC' }
          }
        });

        if (signUpError) console.warn(signUpError);

        const userId = authData?.user?.id || `usr-${Date.now()}`;
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: fullName || 'Usuario IPUC',
          role: 'user',
          congregation_id: selectedCongregationId
        });

        setSuccess('¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.');
        setIsRegistering(false);
        fetchCongregations();
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

          {/* Selección de Congregación en Registro */}
          {isRegistering && (
            <div className="form-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <label style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={16} /> Seleccionar Congregación *
              </label>

              {congregations.length > 0 ? (
                <div>
                  <select
                    value={selectedCongregationId}
                    onChange={(e) => setSelectedCongregationId(e.target.value)}
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    {congregations.map(c => (
                      <option key={c.id} value={c.id} disabled={c.isFull}>
                        {c.name} {c.isFull ? '🚫 (CUPO LLENO - 2/2 usuarios)' : `(Disponibles: ${2 - c.userCount}/2)`}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Cada congregación permite un máximo de 2 usuarios autorizados.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '6px' }}>
                  No hay congregaciones creadas aún. Contacta al Administrador Principal para habilitar tu congregación.
                </p>
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
            {loading ? 'Procesando...' : (isRegistering ? 'REGISTRARSE Y UNIRSE' : 'INICIAR SESIÓN')}
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
