import React, { useState, useEffect } from 'react';
import { Calculator, History, TrendingUp, Lock } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import MoneyInput from './MoneyInput';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

export default function TithesView({ tithes, userRole, isMobile, pastorName: initialPastorName, onSaveTithe, onDeleteTithe }) {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'history', 'chart'

  // Entradas de la calculadora
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [pastorName, setPastorName] = useState(initialPastorName || 'Pastor');
  const [smlv, setSmlv] = useState(1750905);
  const [nationalPercentage, setNationalPercentage] = useState(21);
  const [grossTithe, setGrossTithe] = useState(5000000);
  const [correctedPointInput, setCorrectedPointInput] = useState('');
  const [isPointManuallyEdited, setIsPointManuallyEdited] = useState(false);

  // Cálculos reactivos en tiempo real
  const nationalTreasury = Math.round(grossTithe * (nationalPercentage / 100));
  const netIncome = grossTithe - nationalTreasury;
  
  // Punto Calculado = Ingreso Neto / SMLV (con 3 decimales)
  const calculatedPoint = smlv > 0 ? parseFloat((netIncome / smlv).toFixed(3)) : 0;

  // Si no se ha editado manualmente, Punto Corregido toma el valor exacto de Punto Calculado
  const activeCorrectedPoint = isPointManuallyEdited 
    ? (correctedPointInput === '' ? 0 : parseFloat(correctedPointInput) || 0) 
    : calculatedPoint;

  const localFundAport = Math.round(netIncome * (activeCorrectedPoint / 100));
  const pastorAllocation = netIncome - localFundAport;

  const handleSave = (e) => {
    e.preventDefault();
    if (!grossTithe || grossTithe <= 0) return;

    onSaveTithe({
      month,
      year,
      pastorName,
      smlv,
      nationalPercentage,
      grossTithe,
      nationalTreasury,
      netIncome,
      calculatedPoint,
      correctedPoint: activeCorrectedPoint,
      localFundAport,
      pastorAllocation,
      date: `${year}-${month}-28`
    });

    toast.success('Liquidación de diezmos guardada correctamente.');
    setGrossTithe(0);
    setActiveTab('history');
  };

  // Datos para gráfico de evolución del Diezmo Bruto
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const chartDataValues = monthNames.map((_, index) => {
    const monthIndex = (index + 1).toString().padStart(2, '0');
    const found = tithes.find(t => t.month === monthIndex && t.year === year);
    return found ? found.grossIncome : 0;
  });

  const chartData = {
    labels: monthNames,
    datasets: [
      {
        label: `Diezmo Bruto ${year} ($)`,
        data: chartDataValues,
        borderColor: 'rgb(16, 185, 129)', // Emerald 500
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
        pointRadius: 6
      }
    ]
  };

  // Cálculos de Resumen Anual
  const currentYearTithes = tithes.filter(t => t.year === year);
  
  const avgGrossIncome = currentYearTithes.length > 0
    ? currentYearTithes.reduce((acc, t) => acc + (t.grossIncome || 0), 0) / currentYearTithes.length
    : 0;
    
  const avgPastorAllocation = currentYearTithes.length > 0
    ? currentYearTithes.reduce((acc, t) => acc + (t.pastorAllocation || 0), 0) / currentYearTithes.length
    : 0;

  const maxGrossMonth = currentYearTithes.length > 0
    ? currentYearTithes.reduce((max, t) => ((t.grossIncome || 0) > (max.grossIncome || 0) ? t : max), currentYearTithes[0])
    : null;

  const minGrossMonth = currentYearTithes.length > 0
    ? currentYearTithes.reduce((min, t) => ((t.grossIncome || 0) < (min.grossIncome || 0) ? t : min), currentYearTithes[0])
    : null;

  const getMonthName = (m) => monthNames[parseInt(m) - 1] || '-';

  // Ocultar módulo si es rol VISITA (early return after hooks)
  if (userRole === 'VISITA') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 p-8 rounded-3xl border border-amber-200 dark:border-amber-900 text-center max-w-lg mx-auto">
        <Lock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Módulo de Diezmos Restringido</h3>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Su rol actual (Visita - Solo Lectura) no tiene privilegios para consultar o gestionar la liquidación de diezmos congregacionales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Selector de Pestañas del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'calculator'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Calculadora de Liquidación</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Liquidaciones ({tithes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'chart'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Gráfico Evolución Anual</span>
        </button>
      </div>

      {/* Pestaña 1: Calculadora Estricta de Diezmos */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div 
            className={`flex flex-wrap items-center justify-between gap-4 ${isMobile ? 'p-6' : 'p-8'} rounded-[2rem] text-white shadow-2xl`}
            style={{ backgroundImage: 'var(--gradient-tithes)', boxShadow: '0 25px 50px -12px var(--shadow-color)' }}
          >
            <div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>Registrar Diezmo</h2>
              <p className="text-sm text-orange-100 font-medium">Liquidación estricta y matemática de diezmos</p>
            </div>
            <Calculator className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-white/80`} />
          </div>

          <form onSubmit={handleSave} className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6 bg-slate-50 dark:bg-slate-900/40 ${isMobile ? 'p-4' : 'p-6'} rounded-[2rem] border border-slate-200 dark:border-slate-800`}>
            
            {/* Columna Izquierda: Entradas de Formulario */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Datos de Entrada</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mes</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                  >
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Año</label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Pastor</label>
                <input
                  type="text"
                  value={pastorName}
                  onChange={(e) => setPastorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                />
              </div>

              <MoneyInput
                label="Diezmo Bruto Recolectado"
                value={grossTithe}
                onChange={setGrossTithe}
                required
              />

              <MoneyInput
                label="Valor del SMLV (Salario Mínimo)"
                value={smlv}
                onChange={setSmlv}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Porcentaje Nacional (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={nationalPercentage}
                  onChange={(e) => setNationalPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs"
                />
              </div>
            </div>

            {/* Columna Derecha: Resultados Matemáticos en Tiempo Real */}
            <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/60 shadow-inner">
              <h3 className="text-sm font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Resultados en Tiempo Real
              </h3>

              <div className="space-y-4 divide-y divide-emerald-200/50 dark:divide-emerald-800/50 text-sm">
                
                <div className="flex justify-between items-center pt-3">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">1. Tesorería Nacional ({nationalPercentage}%):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(nationalTreasury)}</span>
                </div>

                <div className="flex justify-between items-center pt-3">
                  <span className="text-slate-800 dark:text-slate-200 font-bold">2. Ingreso Neto:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(netIncome)}</span>
                </div>

                <div className="flex justify-between items-center pt-3">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">3. Punto Calculado:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{calculatedPoint.toFixed(3)} pts</span>
                </div>

                <div className="pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">4. Punto Corregido (%):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPointManuallyEdited(!isPointManuallyEdited);
                        if (isPointManuallyEdited) setCorrectedPointInput('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold underline"
                    >
                      {isPointManuallyEdited ? 'Restablecer' : 'Editar'}
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    disabled={!isPointManuallyEdited}
                    value={isPointManuallyEdited ? correctedPointInput : calculatedPoint}
                    onChange={(e) => {
                      setIsPointManuallyEdited(true);
                      setCorrectedPointInput(e.target.value);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border font-bold text-sm outline-none transition-all ${
                      isPointManuallyEdited 
                        ? 'border-blue-400 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm focus:ring-2 focus:ring-blue-500' 
                        : 'border-emerald-200 dark:border-emerald-800 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}
                  />
                </div>

                <div className="flex justify-between items-center pt-3">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">5. Aporte Fondo Local:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(localFundAport)}</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t-2 border-emerald-200 dark:border-emerald-800">
                  <span className="text-slate-900 dark:text-white font-black text-base uppercase">6. Asignación Pastor:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-2xl">{formatCurrency(pastorAllocation)}</span>
                </div>

              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all mt-6"
              >
                Guardar Liquidación de Diezmos
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Pestaña 2: Historial */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Historial de Diezmos Liquidados</h2>
          {tithes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No hay diezmos registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="pb-3">Mes/Año</th>
                    <th className="pb-3">Pastor</th>
                    <th className="pb-3 text-right">Diezmo Bruto</th>
                    <th className="pb-3 text-right">Tesor. Nac.</th>
                    <th className="pb-3 text-right">Ingreso Neto</th>
                    <th className="pb-3 text-right">Puntos</th>
                    <th className="pb-3 text-right">Asign. Pastor</th>
                    <th className="pb-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tithes.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{t.month}/{t.year}</td>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{t.balanceGroup || pastorName || 'Pastor'}</td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(t.grossIncome || 0)}</td>
                      <td className="py-3 text-right font-semibold text-rose-500">{formatCurrency(t.nationalShare || 0)}</td>
                      <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(t.netIncome || 0)}</td>
                      <td className="py-3 text-right font-mono font-bold text-amber-600">{t.pastorAllocationPercentage || 0} pts</td>
                      <td className="py-3 text-right font-black text-emerald-600">{formatCurrency(t.pastorAllocation || 0)}</td>
                      <td className="py-3 text-right">
                        {userRole === 'ADMIN' && onDeleteTithe && (
                          <button
                            onClick={() => {
                              if(window.confirm('¿Eliminar esta liquidación?')) {
                                onDeleteTithe(t);
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pestaña 3: Gráfico y Resumen Anual */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Evolución de Diezmo Bruto ({year})</h2>
            <div className="h-72">
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumen Anual ({year})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ingreso Bruto Promedio</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(avgGrossIncome)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Asign. Pastor Promedio</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(avgPastorAllocation)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mes Más Alto</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {maxGrossMonth ? `${getMonthName(maxGrossMonth.month)} (${formatCurrency(maxGrossMonth.grossIncome)})` : '-'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mes Más Bajo</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {minGrossMonth ? `${getMonthName(minGrossMonth.month)} (${formatCurrency(minGrossMonth.grossIncome)})` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
