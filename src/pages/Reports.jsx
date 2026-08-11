import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Calendar, Filter, Printer, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Reports.css';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

const Reports = () => {
  const { profile } = useAuth();
  const [committees, setCommittees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAnnualYear, setSelectedAnnualYear] = useState(new Date().getFullYear());
  const [selectedCommittee, setSelectedCommittee] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.congregation_id) {
      supabase
        .from('committees')
        .select('id, name')
        .eq('congregation_id', profile.congregation_id)
        .order('name')
        .then(({ data }) => {
          if (data) setCommittees(data);
        });
    }
  }, [profile]);

  const generateMonthlyReport = async () => {
    if (!profile?.congregation_id) return;
    setLoading(true);

    try {
      const start = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const end = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('events')
        .select('name, date, time, location, committees(name)')
        .eq('congregation_id', profile.congregation_id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(0, 51, 141);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AGENDA DE ACTIVIDADES', 14, 18);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${profile?.congregations?.name || 'Congregación IPUC'} - ${MONTHS[selectedMonth]} ${selectedYear}`, 14, 25);

      const rows = (data || []).map(ev => [
        ev.date,
        ev.time && ev.time !== '00:00:00' ? ev.time.substring(0, 5) : 'Todo el día',
        ev.name,
        ev.committees?.name || 'General',
        ev.location || 'En el Templo'
      ]);

      autoTable(doc, {
        head: [['Fecha', 'Hora', 'Evento', 'Comité', 'Lugar']],
        body: rows,
        startY: 38,
        headStyles: { fillColor: [0, 51, 141], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      doc.save(`Agenda_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el reporte PDF.');
    } finally {
      setLoading(false);
    }
  };

  const generateAnnualReport = async () => {
    if (!profile?.congregation_id) return;
    setLoading(true);

    try {
      const start = `${selectedAnnualYear}-01-01`;
      const end = `${selectedAnnualYear}-12-31`;

      const { data, error } = await supabase
        .from('events')
        .select('name, date, time, location, committees(name)')
        .eq('congregation_id', profile.congregation_id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(0, 102, 255);
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`REPORTE ANUAL DE ACTIVIDADES ${selectedAnnualYear}`, 14, 18);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${profile?.congregations?.name || 'Congregación IPUC'} - Resumen Completo de 12 Meses`, 14, 26);

      const rows = (data || []).map(ev => [
        ev.date,
        ev.time && ev.time !== '00:00:00' ? ev.time.substring(0, 5) : 'Todo el día',
        ev.name,
        ev.committees?.name || 'General',
        ev.location || 'En el Templo'
      ]);

      autoTable(doc, {
        head: [['Fecha', 'Hora', 'Evento', 'Comité', 'Lugar']],
        body: rows,
        startY: 40,
        headStyles: { fillColor: [0, 102, 255], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      doc.save(`Reporte_Anual_${selectedAnnualYear}.pdf`);
    } catch (err) {
      console.error('Error generating annual PDF:', err);
      alert('Error al generar el reporte anual.');
    } finally {
      setLoading(false);
    }
  };

  const generateCommitteeReport = async () => {
    if (!profile?.congregation_id || !selectedCommittee) {
      alert('Por favor selecciona un comité.');
      return;
    }
    setLoading(true);

    try {
      const committeeObj = committees.find(c => c.id === selectedCommittee);

      const { data, error } = await supabase
        .from('events')
        .select('name, date, time, location')
        .eq('congregation_id', profile.congregation_id)
        .eq('committee_id', selectedCommittee)
        .order('date', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(0, 174, 239);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`REPORTE DE COMITÉ: ${committeeObj?.name?.toUpperCase()}`, 14, 18);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${profile?.congregations?.name || 'Congregación IPUC'}`, 14, 25);

      const rows = (data || []).map(ev => [
        ev.date,
        ev.time && ev.time !== '00:00:00' ? ev.time.substring(0, 5) : 'Todo el día',
        ev.name,
        ev.location || 'En el Templo'
      ]);

      autoTable(doc, {
        head: [['Fecha', 'Hora', 'Evento', 'Lugar']],
        body: rows,
        startY: 38,
        headStyles: { fillColor: [0, 174, 239], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      doc.save(`Reporte_Comite_${committeeObj?.name}.pdf`);
    } catch (err) {
      console.error('Error generating committee PDF:', err);
      alert('Error al generar el reporte del comité.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-primary)' }}>Generación de Reportes PDF</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>Descarga la programación en documentos impresos de formato oficial.</p>
      </div>

      <div className="reports-grid">
        {/* Card Reporte Anual Completo */}
        <div className="report-card">
          <div>
            <div className="report-icon-wrapper" style={{ backgroundColor: 'rgba(0, 102, 255, 0.15)', color: 'var(--color-primary)' }}>
              <Award size={24} />
            </div>
            <h3>Reporte Anual Completo</h3>
            <p>Genera un informe completo de 12 meses con todos los eventos programados en todo el año.</p>
            
            <div className="report-controls">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Selecciona el Año:</label>
              <select value={selectedAnnualYear} onChange={(e) => setSelectedAnnualYear(parseInt(e.target.value))}>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="secondary" onClick={generateAnnualReport} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '1.5rem' }}>
            <Download size={18} /> {loading ? 'Generando...' : 'Descargar Reporte Anual'}
          </button>
        </div>

        {/* Card Reporte Mensual */}
        <div className="report-card">
          <div>
            <div className="report-icon-wrapper" style={{ backgroundColor: 'rgba(0, 174, 239, 0.15)', color: 'var(--color-secondary)' }}>
              <Calendar size={24} />
            </div>
            <h3>Reporte Mensual</h3>
            <p>Genera un documento PDF con los eventos programados para un mes específico.</p>
            
            <div className="report-controls">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mes:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>Año:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="secondary" onClick={generateMonthlyReport} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
            <Download size={18} /> {loading ? 'Generando...' : 'Descargar PDF Mensual'}
          </button>
        </div>

        {/* Card Reporte por Comité */}
        <div className="report-card">
          <div>
            <div className="report-icon-wrapper" style={{ backgroundColor: 'rgba(255, 199, 44, 0.15)', color: 'var(--color-accent)' }}>
              <Filter size={24} />
            </div>
            <h3>Reporte por Comité</h3>
            <p>Filtra y genera un reporte PDF exclusivo de las actividades de un comité en particular.</p>
            
            <div className="report-controls">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Selecciona el Comité:</label>
              <select value={selectedCommittee} onChange={(e) => setSelectedCommittee(e.target.value)}>
                <option value="">Selecciona un comité...</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="add-btn" onClick={generateCommitteeReport} disabled={loading || !selectedCommittee} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '1.5rem' }}>
            <Download size={18} /> {loading ? 'Generando...' : 'Descargar PDF por Comité'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
