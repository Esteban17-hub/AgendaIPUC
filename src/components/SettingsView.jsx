import React, { useState } from 'react';
import { Building2, User, KeyRound, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { hashPin, verifyPin } from '../utils/security';

export default function SettingsView({
  congregationId,
  congregationName,
  congregationCity,
  users,
  userRole,
  currentUser,
  isMobile,
  onUpdateCongregation,
  onUpdateUsers
}) {
  const isAdmin = userRole === 'ADMIN';

  // Buscar usuarios clave
  const adminUser = users.find(u => u.congregationId === congregationId && u.role === 'ADMIN');
  const treasurerUser = users.find(u => u.congregationId === congregationId && u.role === 'TESORERO');

  // Estado Local: Congregación (Solo Admin)
  const [editCongName, setEditCongName] = useState(congregationName || '');
  const [editCongCity, setEditCongCity] = useState(congregationCity || '');

  // Estado Local: Usuarios (Admin edita nombres, Admin/Tesorero editan su propio PIN)
  const [editPastorName, setEditPastorName] = useState(adminUser?.name || '');
  const [editTreasurerName, setEditTreasurerName] = useState(treasurerUser?.name || '');

  // Estado de PIN (Solo edita el propio PIN por seguridad)
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const handleSaveCongregation = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    await onUpdateCongregation({
      name: editCongName.trim(),
      city: editCongCity.trim()
    });
    toast.success('Datos de la congregación actualizados correctamente.');
  };

  const handleSaveUsers = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const updatedUsers = [];
    if (adminUser) updatedUsers.push({ ...adminUser, name: editPastorName.trim() });
    if (treasurerUser) updatedUsers.push({ ...treasurerUser, name: editTreasurerName.trim() });
    
    await onUpdateUsers(updatedUsers);
    toast.success('Nombres de usuarios actualizados correctamente.');
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    // Validaciones
    if (!verifyPin(currentPin, currentUser?.pin)) {
      setPinError('El PIN actual es incorrecto.');
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('El nuevo PIN debe tener entre 4 y 6 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('La confirmación del nuevo PIN no coincide.');
      return;
    }
    if (newPin === currentPin) {
      setPinError('El nuevo PIN no puede ser igual al actual.');
      return;
    }

    // Actualizar PIN del usuario logueado con hash
    onUpdateUsers([{ ...currentUser, pin: hashPin(newPin) }]);
    setPinSuccess('PIN actualizado de forma segura. Use su nuevo PIN en el próximo inicio de sesión.');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  if (userRole === 'VISITA') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 p-8 rounded-3xl border border-amber-200 dark:border-amber-900 text-center max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Acceso Restringido</h3>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Su rol actual no tiene privilegios para acceder a las configuraciones del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Configuración */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-4 ${isMobile ? 'p-6' : 'p-8'} rounded-[2rem] text-white shadow-2xl`}
        style={{ backgroundImage: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)', boxShadow: '0 25px 50px -12px rgba(30, 41, 59, 0.5)' }}
      >
        <div>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>Configuración</h2>
          <p className="text-sm text-slate-300 font-medium">Administra los datos de la sede y preferencias de seguridad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tarjeta 1: Congregación (Solo ADMIN) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Datos de la Congregación</h3>
            </div>
            
            <form onSubmit={handleSaveCongregation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre de la Sede</label>
                <input
                  type="text"
                  value={editCongName}
                  onChange={(e) => setEditCongName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Ciudad / Municipio</label>
                <input
                  type="text"
                  value={editCongCity}
                  onChange={(e) => setEditCongCity(e.target.value)}
                  placeholder="Ej: Bogotá, Zuluaga, Cali"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
              >
                <Save className="w-4 h-4" /> Guardar Sede
              </button>
            </form>
          </div>
        )}

        {/* Tarjeta 2: Nombres de Usuarios (Solo ADMIN) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfiles Locales</h3>
            </div>
            
            <form onSubmit={handleSaveUsers} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Pastor (ADMIN)</label>
                <input
                  type="text"
                  value={editPastorName}
                  onChange={(e) => setEditPastorName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Tesorero(a)</label>
                <input
                  type="text"
                  value={editTreasurerName}
                  onChange={(e) => setEditTreasurerName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
              >
                <Save className="w-4 h-4" /> Actualizar Perfiles
              </button>
            </form>
          </div>
        )}

        {/* Tarjeta 3: Seguridad / Cambio de PIN (ADMIN y TESORERO) */}
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm ${!isAdmin ? 'md:col-span-2 max-w-lg mx-auto w-full' : 'md:col-span-2'}`}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seguridad de la Cuenta</h3>
          </div>
          
          <form onSubmit={handleChangePin} className="max-w-md space-y-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
              Cambia el PIN de acceso para el usuario <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name} ({currentUser?.role})</strong>.
            </p>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {pinError}
              </div>
            )}
            
            {pinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {pinSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">PIN Actual</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nuevo PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="4-6 dígitos"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Confirmar PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
            >
              <Save className="w-4 h-4" /> Actualizar PIN Seguro
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
