import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Calendar as CalendarIcon, List, Users, FileText, LogOut, Menu, Sun, Moon, Settings as SettingsIcon, X } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Agenda', href: '/agenda', icon: List },
    { name: 'Calendario', href: '/calendario/mes', icon: CalendarIcon },
    { name: 'Comités', href: '/comites', icon: Users },
    { name: 'Reportes', href: '/reportes', icon: FileText },
    { name: 'Configuración', href: '/configuracion', icon: SettingsIcon },
  ];

  return (
    <div className="layout">
      {/* Mobile Overlay Dark Backdrop */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Header (Sólido, Sin Transparencias Raras) */}
      <div className="mobile-header">
        <div className="flex-center" style={{ gap: '10px' }}>
          <img src="/logo.png" alt="Logo" className="mobile-logo" onError={(e) => e.target.style.display = 'none'} />
          <span className="mobile-title">Agenda IPUC</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="theme-toggle-btn icon-btn outline" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? <Sun size={18} color="#FFC72C" /> : <Moon size={18} color="#00338D" />}
          </button>
          <button className="mobile-menu-btn outline" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Sólido */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2 className="sidebar-title" style={{ margin: 0 }}>Agenda IPUC</h2>
            <button className="theme-toggle-btn icon-btn outline desktop-theme-btn" onClick={toggleTheme} title="Cambiar tema">
              {theme === 'dark' ? <Sun size={18} color="#FFC72C" /> : <Moon size={18} color="#00338D" />}
            </button>
          </div>
          <p className="sidebar-subtitle">{profile?.congregations?.name || 'Congregación IPUC'}</p>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} className="nav-icon" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{profile?.full_name || 'Administrador'}</span>
            <span className="user-role">{profile?.role === 'admin' ? 'Administrador' : 'Editor'}</span>
          </div>
          <button onClick={signOut} className="logout-btn outline">
            <LogOut size={18} />
            Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
