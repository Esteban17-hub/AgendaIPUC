import React, { useState } from 'react';
import { HandHeart, BarChart2, PlusCircle } from 'lucide-react';
import { formatCurrency, formatDate, deduceDayOfWeek } from '../utils/formatters';
import MoneyInput from './MoneyInput';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function OfferingsView({
  offerings,
  committees,
  userRole,
  onAddOffering,
  onDeleteOffering
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offeringDate, setOfferingDate] = useState(new Date().toISOString().slice(0, 10));
  const [destinationCommitteeId, setDestinationCommitteeId] = useState(committees[0]?.id || '');
  const [amount, setAmount] = useState(0);
  const [responsible, setResponsible] = useState('Tesorero General');
  const [notes, setNotes] = useState('');

  const isReadOnly = userRole === 'VISITA';
  const autoDay = deduceDayOfWeek(offeringDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    onAddOffering({
      date: offeringDate,
      dayOfWeek: autoDay,
      destinationCommitteeId,
      amount,
      responsible,
      notes
    });

    setAmount(0);
    setNotes('');
    setIsModalOpen(false);
  };

  // Estadística por día de la semana
  const dayStats = {};
  const dayCounts = {};

  offerings.forEach(o => {
    const day = o.dayOfWeek || deduceDayOfWeek(o.date) || 'Otro';
    dayStats[day] = (dayStats[day] || 0) + (o.amount || 0);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const weekDays = ['Domingo', 'Martes', 'Jueves', 'Sábado', 'Lunes', 'Miércoles', 'Viernes'];
  const chartLabels = weekDays.filter(d => dayStats[d] !== undefined || true);
  const chartValues = chartLabels.map(d => dayStats[d] || 0);

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Recaudación por Día ($)',
        data: chartValues,
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Botón Registrar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HandHeart className="w-7 h-7 text-amber-500" />
            Ofrendas Locales
          </h2>
          <p className="text-xs text-slate-500">Registro de recolecciones por cultos y reuniones congregacionales</p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Ofrenda</span>
          </button>
        )}
      </div>

      {/* Tarjetas Estadísticas por Día de Reunión */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['Domingo', 'Martes', 'Jueves', 'Sábado'].map(day => {
          const totalDay = dayStats[day] || 0;
          const count = dayCounts[day] || 0;
          const avg = count > 0 ? Math.round(totalDay / count) : 0;

          return (
            <div key={day} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block uppercase">Cultos de {day}</span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(totalDay)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Promedio: <span className="font-bold">{formatCurrency(avg)}</span> ({count} cultos)
              </p>
            </div>
          );
        })}
      </div>

      {/* Gráfico Comparativo por Día de Semana */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-amber-500" />
          Comparativo de Recaudación por Día de la Semana
        </h3>
        <div className="h-56">
          <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Tabla de Historial de Ofrendas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Registro Histórico de Ofrendas</h3>
        {offerings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No hay ofrendas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Día Deducido</th>
                  <th className="pb-3">Comité Destino</th>
                  <th className="pb-3 text-right">Valor</th>
                  <th className="pb-3">Responsable</th>
                  <th className="pb-3">Observaciones</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {offerings.map(o => {
                  const com = committees.find(c => c.id === o.destinationCommitteeId);
                  return (
                    <tr key={o.id}>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{formatDate(o.date)}</td>
                      <td className="py-3 font-bold text-amber-600">{o.dayOfWeek || deduceDayOfWeek(o.date)}</td>
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{com ? com.name : 'General'}</td>
                      <td className="py-3 text-right font-black text-slate-900 dark:text-white">{formatCurrency(o.amount)}</td>
                      <td className="py-3 font-medium text-slate-600 dark:text-slate-400">{o.responsible}</td>
                      <td className="py-3 text-slate-500 italic">{o.notes || '-'}</td>
                      <td className="py-3 text-right">
                        {userRole === 'ADMIN' && onDeleteOffering && (
                          <button
                            onClick={() => {
                              if(window.confirm('¿Eliminar esta ofrenda?')) {
                                onDeleteOffering(o);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl transition-colors"
                            title="Eliminar registro"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Ofrenda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Agregar Ofrenda Local</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha del Culto</label>
                <input
                  type="date"
                  value={offeringDate}
                  onChange={(e) => setOfferingDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
                <p className="mt-1 text-xs text-amber-600 font-bold">
                  🗓️ Día deducido automáticamente: {autoDay}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Comité / Destino</label>
                <select
                  value={destinationCommitteeId}
                  onChange={(e) => setDestinationCommitteeId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                >
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <MoneyInput
                label="Valor Ofrendado"
                value={amount}
                onChange={setAmount}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Responsable</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales del culto"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md"
                >
                  Guardar Ofrenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
