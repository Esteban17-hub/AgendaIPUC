import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Users, Clock, MapPin, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, month: 0, committees: 0 });
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.congregation_id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('congregation_id', profile.congregation_id);

      // Committees count
      const { count: totalCommittees } = await supabase
        .from('committees')
        .select('*', { count: 'exact', head: true })
        .eq('congregation_id', profile.congregation_id);

      // Next event
      const today = new Date().toISOString().split('T')[0];
      const { data: nextEvt } = await supabase
        .from('events')
        .select('*, committees(name, color)')
        .eq('congregation_id', profile.congregation_id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1)
        .single();

      // Events this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      
      const { count: monthEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('congregation_id', profile.congregation_id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      setStats({
        total: totalEvents || 0,
        month: monthEvents || 0,
        committees: totalCommittees || 0
      });
      setNextEvent(nextEvt || null);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Cargando panel corporativo...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Bienvenido, {profile?.full_name?.split(' ')[0] || 'Administrador'}</h1>
        <p>Panel de control corporativo - {profile?.congregations?.name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 174, 239, 0.1)', color: 'var(--color-secondary)' }}>
            <CalendarIcon size={28} />
          </div>
          <div className="stat-info">
            <h3>Este Mes</h3>
            <p>{stats.month}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 199, 44, 0.15)', color: 'var(--color-accent)' }}>
            <Activity size={28} />
          </div>
          <div className="stat-info">
            <h3>Total Eventos</h3>
            <p>{stats.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 51, 141, 0.1)', color: 'var(--color-primary)' }}>
            <Users size={28} />
          </div>
          <div className="stat-info">
            <h3>Comités Activos</h3>
            <p>{stats.committees}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-card">
          <h3>Resumen de Actividad</h3>
          <div className="flex-center" style={{ height: '250px', background: '#f8f9fc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>El gráfico anual se habilitará pronto...</p>
          </div>
        </div>

        <div>
          {nextEvent ? (
            <div className="next-event-card">
              <div className="next-event-label">Próximo Evento Destacado</div>
              <h2 className="next-event-title">{nextEvent.name}</h2>
              <div style={{ marginTop: '1.5rem' }}>
                <div className="next-event-detail">
                  <CalendarIcon size={16} /> 
                  <span>{new Date(nextEvent.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="next-event-detail">
                  <Clock size={16} /> 
                  <span>{nextEvent.time.substring(0,5)}</span>
                </div>
                <div className="next-event-detail">
                  <MapPin size={16} /> 
                  <span>{nextEvent.location}</span>
                </div>
                <div className="next-event-detail">
                  <Users size={16} /> 
                  <span>Comité: {nextEvent.committees?.name}</span>
                </div>
              </div>
              <Link to="/agenda" style={{ display: 'inline-flex', alignItems: 'center', marginTop: '1.5rem', color: 'white', fontWeight: 'bold' }}>
                Ver agenda completa <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="empty-dashboard">
              <h3>No hay eventos próximos</h3>
              <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>Planifica la próxima actividad de la congregación.</p>
              <Link to="/agenda">
                <button>Ir a la Agenda</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
