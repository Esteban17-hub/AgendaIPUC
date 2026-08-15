import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, HandHeart, PlusCircle, ArrowRightLeft, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, deduceDayOfWeek } from '../utils/formatters';
import MoneyInput from './MoneyInput';

export default function DashboardView({
  committees,
  allCommittees = committees,
  movements,
  offerings,
  userRole,
  congregationName,
  onSelectTab,
  onAddMovement,
  onAddOffering
}) {
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState('INGRESO');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [movementDescription, setMovementDescription] = useState('');
  const [movementCommitteeId, setMovementCommitteeId] = useState('');

  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [offeringDate, setOfferingDate] = useState(new Date().toISOString().slice(0, 10));
  const [offeringDay, setOfferingDay] = useState(deduceDayOfWeek(new Date().toISOString().slice(0, 10)));
  const [offeringAmount, setOfferingAmount] = useState('');
  const [offeringCommitteeId, setOfferingCommitteeId] = useState('');

  const handleCreateMovement = (e) => {
    e.preventDefault();
    if (!movementCommitteeId || !movementAmount || movementAmount <= 0) {
      toast.error("Por favor complete todos los campos correctamente.");
      return;
    }
    onAddMovement({
      committeeId: movementCommitteeId,
      type: movementType,
      amount: movementAmount,
      description: movementDescription,
      date: movementDate
    });
    setIsMovementModalOpen(false);
    setMovementAmount('');
    setMovementDescription('');
    toast.success("Movimiento registrado con éxito.");
  };

  const handleCreateOffering = (e) => {
    e.preventDefault();
    if (!offeringCommitteeId || !offeringAmount || offeringAmount <= 0) {
      toast.error("Por favor complete todos los campos correctamente.");
      return;
    }
    onAddOffering({
      destinationCommitteeId: offeringCommitteeId,
      date: offeringDate,
      day: offeringDay,
      amount: offeringAmount
    });
    setIsOfferingModalOpen(false);
    setOfferingAmount('');
    toast.success("Ofrenda registrada con éxito.");
  };
  const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Saldo total consolidado
  const totalBalance = committees.reduce((acc, c) => acc + (c.balance || 0), 0);

  // Movimientos del mes actual (no anulados)
  const currentMonthMovements = movements.filter(
    m => !m.annulled && m.date && m.date.startsWith(currentMonthYear)
  );

  const currentMonthIncomes = currentMonthMovements
    .filter(m => m.type === 'INGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  const currentMonthExpenses = currentMonthMovements
    .filter(m => m.type === 'EGRESO')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  // Ofrendas del mes actual
  const currentMonthOfferings = offerings
    .filter(o => o.date && o.date.startsWith(currentMonthYear))
    .reduce((acc, o) => acc + (o.amount || 0), 0);

  const isReadOnly = userRole === 'VISITA';

  return (
    <div className="space-y-6">
      
      {/* Botones de Acceso Rápido */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/50 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">¡Bienvenido a {congregationName}!</h2>
            <p className="text-sm text-slate-400 font-medium">Acceso rápido a operaciones financieras cotidianas</p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold text-sm hover:from-blue-500 hover:to-blue-300 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Registrar Movimiento</span>
            </button>
            <button
              onClick={() => setIsOfferingModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold text-sm hover:from-orange-400 hover:to-orange-300 transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar Ofrenda</span>
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas Principales del Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Saldo de Comités */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Consolidado actual
          </span>
        </div>

        {/* 2. Ofrendas del Mes */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Ofrendas del mes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <HandHeart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">
            {formatCurrency(currentMonthOfferings)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Recaudado este mes
          </span>
        </div>

        {/* 3. Ingresos de Comités */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Ingresos Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(currentMonthIncomes)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Entradas este mes
          </span>
        </div>

        {/* 4. Egresos de Comités */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/50 relative overflow-hidden group transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Egresos Comités
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-rose-400 tracking-tight">
            {formatCurrency(currentMonthExpenses)}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
            Salidas este mes
          </span>
        </div>

      </div>

      {/* Lista Deslizable de Resumen por Comité */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl shadow-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-white">Resumen por Comités</h3>
          </div>
          <button
            onClick={() => onSelectTab('committees')}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Ver todos →
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {committees.map((com) => (
            <div
              key={com.id}
              onClick={() => onSelectTab('committees')}
              className="min-w-[200px] p-5 rounded-2xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-blue-500/50 transition-all"
            >
              <span className="text-[11px] font-bold text-slate-400 block truncate uppercase tracking-wider">
                {com.name}
              </span>
              <p className={`text-2xl font-black mt-1 ${com.balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                {formatCurrency(com.balance)}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 font-medium truncate">
                Tesorero: <span className="text-slate-300">{com.treasurer || 'No asignado'}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nuevo Movimiento desde Dashboard */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 lg:p-8 shadow-2xl border border-slate-800 my-8">
            <h3 className="text-xl font-black text-white mb-6">
              Registrar Movimiento
            </h3>
            <form onSubmit={handleCreateMovement} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Seleccionar Comité <span className="text-rose-500">*</span>
                </label>
                <select
                  value={movementCommitteeId}
                  onChange={(e) => setMovementCommitteeId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="">Seleccione un comité...</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType('INGRESO')}
                  className={`py-3 rounded-2xl font-bold text-sm border transition-all ${
                    movementType === 'INGRESO'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  🟢 Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('EGRESO')}
                  className={`py-3 rounded-2xl font-bold text-sm border transition-all ${
                    movementType === 'EGRESO'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  🔴 Egreso (-)
                </button>
              </div>

              <MoneyInput
                label="Monto del Movimiento"
                value={movementAmount}
                onChange={setMovementAmount}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={movementDescription}
                  onChange={(e) => setMovementDescription(e.target.value)}
                  placeholder="Detalle de la transacción, responsable..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Ofrenda desde Dashboard */}
      {isOfferingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 lg:p-8 shadow-2xl border border-slate-800 my-8">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <HandHeart className="w-6 h-6 text-orange-400" /> Agregar Ofrenda
            </h3>
            <form onSubmit={handleCreateOffering} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
                  <input
                    type="date"
                    value={offeringDate}
                    onChange={(e) => {
                      setOfferingDate(e.target.value);
                      setOfferingDay(deduceDayOfWeek(e.target.value));
                    }}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-white font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Día</label>
                  <input
                    type="text"
                    value={offeringDay}
                    onChange={(e) => setOfferingDay(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-white font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Destino / Comité <span className="text-rose-500">*</span>
                </label>
                <select
                  value={offeringCommitteeId}
                  onChange={(e) => setOfferingCommitteeId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-white font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                >
                  <option value="">Seleccione un destino...</option>
                  {allCommittees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <MoneyInput
                label="Valor de Ofrenda"
                value={offeringAmount}
                onChange={setOfferingAmount}
                required
              />

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsOfferingModalOpen(false)}
                  className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-bold text-sm shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all"
                >
                  Registrar Ofrenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
