import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Users, Clock, MapPin, ChevronRight, Activity, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { Modal } from '../components/Modal';
import { AIAssistantModal } from '../components/AIAssistantModal';
import './Dashboard.css';

const Dashboard = () => {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ total: 0, month: 0, committees: 0 });
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (profile?.congregation_id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('congregation_id', profile.congregation_id);

      const { count: totalCommittees } = await supabase
        .from('committees')
        .select('*', { count: 'exact', head: true })
        .eq('congregation_id', profile.congregation_id);

      const today = new Date().toISOString().split('T')[0];
      const { data: nextEvt } = await supabase
        .from('events')
        .select('*, committees(name, color)')
        .eq('congregation_id', profile.congregation_id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1)
        .maybeSingle();

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

  if (authLoading || loading) {
    return <div className="loading-state">Cargando Inicio...</div>;
  }

  if (profile && !profile.congregation_id) {
    return (
      <div className="dashboard-page flex-center" style={{ flexDirection: 'column', textAlign: 'center', padding: '4rem' }}>
        <AlertCircle size={48} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '1rem' }}>Falta configurar tu congregación</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', marginBottom: '1.5rem' }}>
          Tu cuenta ha sido creada exitosamente pero aún no tienes una congregación asignada.
        </p>
        <Link to="/configuracion">
          <button className="secondary">Configurar Congregación Ahora</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Inicio</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Bienvenido, {profile?.full_name?.split(' ')[0] || 'Administrador'} - {profile?.congregations?.name || 'Congregación IPUC'}
          </p>
        </div>

        {/* Botones de Acción en Inicio: Secre IA + Agregar Evento */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="secondary"
            onClick={() => setIsAIModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', fontSize: '1rem' }}
          >
            <Sparkles size={20} /> Secre IA
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', fontSize: '1rem' }}
          >
            <Plus size={20} /> Agregar Evento
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 174, 239, 0.15)', color: 'var(--color-secondary)' }}>
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
          <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 102, 255, 0.15)', color: 'var(--color-primary)' }}>
            <Users size={28} />
          </div>
          <div className="stat-info">
            <h3>Comités Activos</h3>
            <p>{stats.committees}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h3>Resumen de Actividad</h3>
          <div className="flex-center" style={{ height: '240px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed var(--color-border)', marginTop: '1rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Panel corporativo activo y actualizado.</p>
          </div>
        </div>

        <div>
          {nextEvent ? (
            <div className="next-event-card" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', padding: '1.5rem', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <div className="next-event-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase', tracking: '1px', opacity: 0.8 }}>Próximo Evento Destacado</div>
              <h2 className="next-event-title" style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>{nextEvent.name}</h2>
              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="next-event-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={16} /> 
                  <span>{new Date(nextEvent.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}</span>
                </div>
                <div className="next-event-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} /> 
                  <span>{nextEvent.time && nextEvent.time !== '00:00:00' ? nextEvent.time.substring(0,5) : 'Todo el día'}</span>
                </div>
                <div className="next-event-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} /> 
                  <span>{nextEvent.location}</span>
                </div>
                <div className="next-event-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} /> 
                  <span>Comité: {nextEvent.committees?.name || 'General'}</span>
                </div>
              </div>
              <Link to="/agenda" style={{ display: 'inline-flex', alignItems: 'center', marginTop: '1.5rem', color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}>
                Ver agenda completa <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="empty-dashboard" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
              <h3>No hay eventos próximos</h3>
              <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>Planifica la próxima actividad de la congregación.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="secondary" onClick={() => setIsAIModalOpen(true)}>
                  <Sparkles size={16} /> Usar Secre IA
                </button>
                <button onClick={() => setIsModalOpen(true)}>
                  Agregar Evento
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Formulario Normal */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h2 style={{ marginBottom: '1.5rem' }}>Nuevo Evento</h2>
          <EventForm 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchDashboardData} 
          />
        </Modal>
      )}

      {/* Modal Secre IA desde Inicio */}
      {isAIModalOpen && (
        <AIAssistantModal 
          onClose={() => setIsAIModalOpen(false)} 
          onSuccess={fetchDashboardData} 
        />
      )}
    </div>
  );
};

export default Dashboard;
