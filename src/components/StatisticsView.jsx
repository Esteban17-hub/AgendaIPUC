import React from 'react';
import { PieChart, TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StatisticsView({
  movements,
  committees,
  tithes,
  offerings,
  userRole
}) {
  const currentYear = new Date().getFullYear().toString();

  // Acumulados Anuales
  const annualTithes = tithes
    .filter(t => t.year === currentYear)
    .reduce((acc, t) => acc + (t.grossTithe || 0), 0);

  const annualOfferings = offerings
    .filter(o => o.date && o.date.startsWith(currentYear))
    .reduce((acc, o) => acc + (o.amount || 0), 0);

  const activeMovements = movements.filter(m => !m.annulled && m.date && m.date.startsWith(currentYear));

  const annualIncomes = activeMovements
    .filter(m => m.type === 'INGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  const annualExpenses = activeMovements
    .filter(m => m.type === 'EGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  // Gráfico 1: Evolución de diezmos mes a mes
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const tithesMonthlyData = monthCodes.map(mc => {
    const found = tithes.find(t => t.month === mc && t.year === currentYear);
    return found ? found.grossTithe : 0;
  });

  const tithesLineChart = {
    labels: months,
    datasets: [
      {
        label: `Diezmos Recaudados ${currentYear} ($)`,
        data: tithesMonthlyData,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        tension: 0.3,
        pointRadius: 5
      }
    ]
  };

  // Gráfico 2: Total de ofrendas mes a mes
  const offeringsMonthlyData = monthCodes.map(mc => {
    const prefix = `${currentYear}-${mc}`;
    return offerings
      .filter(o => o.date && o.date.startsWith(prefix))
      .reduce((acc, o) => acc + (o.amount || 0), 0);
  });

  const offeringsBarChart = {
    labels: months,
    datasets: [
      {
        label: `Ofrendas Mensuales ${currentYear} ($)`,
        data: offeringsMonthlyData,
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderRadius: 8
      }
    ]
  };

  // Gráfico 3: Lado a Lado - Ingresos vs Egresos por Comité
  const committeeNames = committees.map(c => c.name);
  const committeeIncomes = committees.map(c => {
    return activeMovements
      .filter(m => m.committeeId === c.id && m.type === 'INGRESO')
      .reduce((acc, m) => acc + (m.amount || 0), 0);
  });
  const committeeExpenses = committees.map(c => {
    return activeMovements
      .filter(m => m.committeeId === c.id && m.type === 'EGRESO')
      .reduce((acc, m) => acc + (m.amount || 0), 0);
  });

  const comparisonChartData = {
    labels: committeeNames,
    datasets: [
      {
        label: 'Ingresos ($)',
        data: committeeIncomes,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6
      },
      {
        label: 'Egresos ($)',
        data: committeeExpenses,
        backgroundColor: 'rgba(244, 63, 94, 0.8)',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-7 h-7 text-purple-600" />
          Estadísticas Generales ({currentYear})
        </h2>
        <p className="text-xs text-slate-500">Métricas consolidadas de rendimiento financiero congregacional</p>
      </div>

      {/* Tarjetas Acumuladas Anuales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {userRole !== 'VISITA' && (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Diezmos Acumulados</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {formatCurrency(annualTithes)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Año {currentYear}</span>
          </div>
        )}

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Ofrendas Acumuladas</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(annualOfferings)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Año {currentYear}</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Ingresos de Comités</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(annualIncomes)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Entradas globales</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Egresos de Comités</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(annualExpenses)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Salidas ejecutadas</span>
        </div>

      </div>

      {/* Gráficos en Rejilla */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Diezmos */}
        {userRole !== 'VISITA' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Evolución de Diezmos Mes a Mes</h3>
            <div className="h-64">
              <Line data={tithesLineChart} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}

        {/* Gráfico 2: Ofrendas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Total de Ofrendas Mes a Mes</h3>
          <div className="h-64">
            <Bar data={offeringsBarChart} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

      </div>

      {/* Gráfico 3: Lado a Lado Ingresos vs Egresos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Comparativo Lado a Lado: Ingresos vs Egresos por Comité</h3>
        <div className="h-72">
          <Bar data={comparisonChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

    </div>
  );
}
