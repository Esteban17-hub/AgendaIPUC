import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Bell, LogOut, Activity, RotateCcw, Cloud, CloudOff, RefreshCw, User, Users, Palette, Check } from 'lucide-react';
import { triggerBackgroundSync } from '../services/syncEngine';

export default function Navbar({
  congregationName,
  userRole,
  userName,
  networkStatus,
  connectedUsers,
  theme,
  setTheme,
  onLogout,
  onOpenDiagnostics,
  onOpenReset
}) {
  const { isOnline, isSyncing, pendingCount } = networkStatus;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const menuRef = useRef(null);
  const themeRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleLabel = () => {
    switch (userRole) {
      case 'ADMIN': return 'Pastor - Administrador';
      case 'TESORERO': return 'Tesorero General';
      case 'VISITA': return 'Visita (Solo Lectura)';
      default: return userRole;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Congregation Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Gestión de Comités
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {congregationName || 'Congregación Central'}
            </p>
          </div>
        </div>

        {/* Right side: Sync Status + Kebab Menu */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          
          {/* Sync Indicator (Kept outside for visibility, or can be moved inside. We keep a minimal version here) */}
          <button
            onClick={() => triggerBackgroundSync()}
            title={isOnline ? 'En línea' : 'Modo Offline'}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            ) : isOnline ? (
              <Cloud className="w-4 h-4 text-emerald-400" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-400" />
            )}
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-bold w-4 h-4 flex items-center justify-center rounded-full text-[9px] shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Theme Selector */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all focus:outline-none"
              title="Seleccionar Tema"
            >
              <Palette className="w-5 h-5" />
            </button>
            
            {isThemeOpen && (
              <div className="absolute right-0 top-12 mt-2 w-56 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden transform origin-top-right transition-all">
                <div className="p-3 border-b border-slate-700 bg-slate-800/50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estilos Visuales</p>
                </div>
                <div className="py-2">
                  <button onClick={() => { setTheme('dark-premium'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600"></div> Dark Premium</span>
                    {theme === 'dark-premium' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <button onClick={() => { setTheme('corporate-blue'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div> Corporate Blue</span>
                    {theme === 'corporate-blue' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <button onClick={() => { setTheme('executive-graphite'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-500"></div> Executive Graphite</span>
                    {theme === 'executive-graphite' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <button onClick={() => { setTheme('forest-emerald'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-50 border border-emerald-200"></div> Forest Emerald</span>
                    {theme === 'forest-emerald' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kebab Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all focus:outline-none"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Pop-up Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 mt-2 w-64 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden transform origin-top-right transition-all" ref={menuRef}>
              <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{userName}</p>
                    <p className="text-xs font-medium text-slate-400">{getRoleLabel()}</p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <div className="px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{connectedUsers || 1} Usuarios Activos</span>
                </div>

                <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors text-left">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Notificaciones</span>
                </button>

                <button
                  onClick={() => { setIsMenuOpen(false); onOpenDiagnostics(); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors text-left"
                >
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Diagnóstico</span>
                </button>

                <button
                  onClick={() => { setIsMenuOpen(false); onOpenReset(); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors text-left"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Restablecer Datos</span>
                </button>
              </div>

              <div className="p-2 border-t border-slate-700">
                <button
                  onClick={() => { setIsMenuOpen(false); onLogout(); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
