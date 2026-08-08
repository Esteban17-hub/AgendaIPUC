import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Login.css';

const Login = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isRegistering) {
      // Intentar registrar al usuario
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Admin IPUC'
          }
        }
      });

      if (signUpError) {
        setError(`Error al registrar: ${signUpError.message}`);
      } else {
        setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión (si Supabase te pide confirmar correo, revisa tu bandeja de entrada o desactiva "Confirm email" en el panel de Supabase).');
        setIsRegistering(false);
      }
    } else {
      // Iniciar sesión
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const { data, error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(`Error de Supabase: ${signInError.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-container">
          <img src="/logo.png" alt="Logo de la Iglesia" className="login-logo" onError={(e) => e.target.style.display = 'none'} />
          <h2>Agenda IPUC</h2>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-error" style={{backgroundColor: '#e8f5e9', color: '#2e7d32'}}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
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
            <label htmlFor="password">Contraseña</label>
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

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Procesando...' : (isRegistering ? 'REGISTRARSE' : 'INICIAR SESIÓN')}
          </button>
        </form>

        <div className="login-footer">
          <button 
            type="button" 
            className="outline" 
            style={{marginTop: '1rem', width: '100%'}}
            onClick={() => {setIsRegistering(!isRegistering); setError(''); setSuccess('');}}
          >
            {isRegistering ? 'Volver a Iniciar Sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
