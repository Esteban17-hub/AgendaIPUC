import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Calendar as CalendarIcon, List, Users, FileText, LogOut, Menu } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Agenda', href: '/agenda', icon: List },
    { name: 'Calendario', href: '/calendario', icon: CalendarIcon },
    { name: 'Comités', href: '/comites', icon: Users },
    { name: 'Reportes', href: '/reportes', icon: FileText },
  ];

  return (
    <div className="layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="flex-center">
          <img src="/logo.png" alt="Logo" className="mobile-logo" onError={(e) => e.target.style.display = 'none'} />
          <span className="mobile-title">Agenda</span>
        </div>
        <button className="mobile-menu-btn outline" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" onError={(e) => e.target.style.display = 'none'} />
          <h2 className="sidebar-title">Iglesia</h2>
          <p className="sidebar-subtitle">{profile?.congregations?.name || 'Cargando...'}</p>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
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
            <span className="user-name">{profile?.full_name}</span>
            <span className="user-role">{profile?.role}</span>
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
