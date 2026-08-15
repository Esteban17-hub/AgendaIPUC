import React, { useState } from 'react';
import { Target, PlusCircle, HeartHandshake, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import MoneyInput from './MoneyInput';

export default function ProjectsView({
  projects,
  votes,
  userRole,
  isMobile,
  onCreateProject,
  onAddVote
}) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewVoteOpen, setIsNewVoteOpen] = useState(false);

  // Form Proyecto
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [financialGoal, setFinancialGoal] = useState(10000000);

  // Form Voto
  const [memberName, setMemberName] = useState('');
  const [voteAmount, setVoteAmount] = useState(0);
  const [voteDate, setVoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [voteNotes, setVoteNotes] = useState('');

  const isReadOnly = userRole === 'VISITA';
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const activeProjectVotes = votes.filter(v => v.projectId === selectedProjectId);
  const totalRaised = activeProjectVotes.reduce((acc, v) => acc + (v.amount || 0), 0);
  const goal = activeProject?.financialGoal || 0;
  const progressPercent = goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 100;
  const remaining = Math.max(0, goal - totalRaised);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!projectName || !financialGoal) return;
    onCreateProject({
      name: projectName,
      description: projectDescription,
      startDate,
      endDate,
      financialGoal
    });
    setProjectName('');
    setProjectDescription('');
    setIsNewProjectOpen(false);
  };

  const handleAddVote = (e) => {
    e.preventDefault();
    if (!voteAmount || voteAmount <= 0) return;
    onAddVote({
      projectId: selectedProjectId,
      memberName: memberName || 'Anónimo',
      amount: voteAmount,
      date: voteDate,
      notes: voteNotes
    });
    setVoteAmount(0);
    setMemberName('');
    setVoteNotes('');
    setIsNewVoteOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Proyectos */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-4 ${isMobile ? 'p-6' : 'p-8'} rounded-[2rem] text-white shadow-2xl`}
        style={{ backgroundImage: 'var(--gradient-projects)', boxShadow: '0 25px 50px -12px var(--shadow-color)' }}
      >
        <div>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>Proyectos en Curso</h2>
          <p className="text-sm text-teal-100 font-medium opacity-90">Gestión de metas de recaudación y registro de aportes</p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Nuevo Proyecto</span>
          </button>
        )}
      </div>

      {/* Selector de Proyecto Activo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProjectId(p.id)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap ${
              selectedProjectId === p.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {activeProject && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Ficha del Proyecto & Barra de Progreso */}
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">{activeProject.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{activeProject.description}</p>
                <p className="text-[11px] font-semibold text-teal-400 mt-2">
                  🗓️ Periodo: {formatDate(activeProject.startDate)} {activeProject.endDate ? `hasta ${formatDate(activeProject.endDate)}` : ''}
                </p>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => setIsNewVoteOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Registrar Voto / Aporte</span>
                </button>
              )}
            </div>

            {/* Tarjetas resumen del proyecto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Meta Económica</span>
                <p className="text-xl font-black text-white mt-0.5">{formatCurrency(goal)}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Total Recaudado</span>
                <p className="text-xl font-black text-teal-400 mt-0.5">{formatCurrency(totalRaised)}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Faltante para la Meta</span>
                <p className="text-xl font-black text-rose-400 mt-0.5">{formatCurrency(remaining)}</p>
              </div>
            </div>

            {/* Barra de Progreso Porcentual */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-300">Progreso Recaudado</span>
                <span className="text-teal-400">{progressPercent}%</span>
              </div>
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Historial de Votos / Aportes */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Historial de Votos Registrados</h4>
            {activeProjectVotes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No se han registrado votos aún.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3">Fecha</th>
                      <th className="pb-3">Miembro / Creyente</th>
                      <th className="pb-3 text-right">Monto del Voto</th>
                      <th className="pb-3">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeProjectVotes.map(v => (
                      <tr key={v.id}>
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{formatDate(v.date)}</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{v.memberName}</td>
                        <td className="py-3 text-right font-black text-emerald-600">{formatCurrency(v.amount)}</td>
                        <td className="py-3 text-slate-500 italic">{v.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal Nuevo Proyecto */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Crear Proyecto</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  placeholder="Ej: Remodelación Templo, Aire Acondicionado"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Descripción</label>
                <input
                  type="text"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Propósito de la recaudación"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <MoneyInput
                label="Meta Económica ($)"
                value={financialGoal}
                onChange={setFinancialGoal}
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha Estimada Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                >
                  Guardar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Voto */}
      {isNewVoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Registrar Voto - {activeProject?.name}
            </h3>
            <form onSubmit={handleAddVote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Miembro / Creyente</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Nombre o Anónimo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <MoneyInput
                label="Monto del Voto / Aporte"
                value={voteAmount}
                onChange={setVoteAmount}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha</label>
                <input
                  type="date"
                  value={voteDate}
                  onChange={(e) => setVoteDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={voteNotes}
                  onChange={(e) => setVoteNotes(e.target.value)}
                  placeholder="Detalles adicionales"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewVoteOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  Guardar Voto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
