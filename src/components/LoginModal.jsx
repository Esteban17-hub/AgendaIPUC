import React, { useState } from 'react';
import { Building2, User, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { verifyPin } from '../utils/security';

export default function LoginModal({ isOpen, onClose, onLogin, currentCongregation, currentRole, congregations = [], users = [], onCreateCongregation }) {
  // Inicializar estado con la primera congregación si no hay una actual
  const defaultCongId = congregations.find(c => c.name === currentCongregation)?.id || (congregations.length > 0 ? congregations[0].id : '');
  
  const [congregationId, setCongregationId] = useState(defaultCongId);
  const [role, setRole] = useState(currentRole || 'TESORERO');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newCongregationName, setNewCongregationName] = useState('');
  const [newPastorName, setNewPastorName] = useState('');
  const [newTreasurerName, setNewTreasurerName] = useState('');

  // Sincronizar el select cuando las congregaciones cargan
  React.useEffect(() => {
    if (!congregationId && congregations.length > 0) {
      setCongregationId(congregations[0].id);
    }
  }, [congregations, congregationId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isCreating) {
      if (!newCongregationName.trim()) {
        setError('El nombre de la congregación es obligatorio.');
        return;
      }
      try {
        const newId = await onCreateCongregation(newCongregationName.trim(), newPastorName.trim(), newTreasurerName.trim());
        setCongregationId(newId);
        setIsCreating(false);
        setNewCongregationName('');
        setNewPastorName('');
        setNewTreasurerName('');
        toast.success(`Congregación creada con éxito.\nUsuarios creados con PIN 1234.`);
      } catch (_) {
        setError('Error al crear congregación.');
      }
      return;
    }

    // Validar en la lista de usuarios
    const user = users.find(u => u.congregationId === congregationId && u.role === role);
    
    if (!user) {
      setError('Rol no encontrado para esta congregación.');
      return;
    }
    
    if (!verifyPin(pin, user.pin)) {
      setError('PIN incorrecto. Intente nuevamente.');
      return;
    }

    const selectedCongregation = congregations.find(c => c.id === congregationId);
    
    onLogin({ 
      congregation: selectedCongregation.name,
      congregationId: selectedCongregation.id, 
      username: user.name, 
      role: user.role,
      remember: remember
    });
    setPin(''); // limpiar por seguridad
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acceso al Sistema</h2>
            <p className="text-xs text-slate-500">Gestión Ejecutiva de Comités</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isCreating ? (
            // --- VISTA: CREAR NUEVA CONGREGACIÓN ---
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de la Nueva Congregación
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={newCongregationName}
                    onChange={(e) => setNewCongregationName(e.target.value)}
                    required
                    placeholder="Ej. Zuluaga-Central D21"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nombre del Pastor
                </label>
                <div className="relative">
                  <ShieldCheck className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={newPastorName}
                    onChange={(e) => setNewPastorName(e.target.value)}
                    required
                    placeholder="Ej. Ever Bustos Ramirez"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nombre del Tesorero(a)
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={newTreasurerName}
                    onChange={(e) => setNewTreasurerName(e.target.value)}
                    required
                    placeholder="Ej. Nubia Castro"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Se inicializarán los 11 comités por defecto y 3 usuarios base (Pastor, Tesorero, Visita) con PIN 1234.
                </p>
              </div>

              {error && (
                <p className="text-red-600 text-sm font-semibold">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all"
              >
                Crear e Inicializar Congregación
              </button>

              <button
                type="button"
                onClick={() => { setIsCreating(false); setError(''); }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Volver al Acceso
              </button>
            </div>
          ) : (
            // --- VISTA: ACCESO EXISTENTE ---
            <div className="space-y-4 animate-fade-in">
              {/* 1. Selector de Congregación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Congregación
                </label>
                <select
                  value={congregationId}
                  onChange={(e) => setCongregationId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                >
                  {congregations.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Rol de Acceso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Rol de Acceso / Usuario
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'ADMIN'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Pastor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('TESORERO')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'TESORERO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Tesorero</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('VISITA')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'VISITA'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span>Visita</span>
                  </button>
                </div>
              </div>

              {/* 3. PIN de Seguridad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  PIN de Acceso
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    placeholder="Ingrese su PIN numérico"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm font-semibold">{error}</p>
              )}

              {role === 'VISITA' && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                  ⚠️ Modo Solo Lectura: El módulo de Diezmos estará oculto y no podrá crear o editar registros.
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  Recordar inicio de sesión
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all mt-4"
              >
                Ingresar a la Congregación
              </button>
              
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 mb-2">¿Necesita configurar una nueva sede?</p>
                <button
                  type="button"
                  onClick={() => { setIsCreating(true); setError(''); }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline"
                >
                  Crear Nueva Congregación
                </button>
              </div>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
