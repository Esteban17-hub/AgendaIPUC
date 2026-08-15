import React, { useState } from 'react';
import { RotateCcw, ShieldAlert, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { initDB, getAllFromStore, deleteRecord, putRecord } from '../services/db';
import { supabase } from '../services/supabaseClient';
import { notifyDataChange } from '../services/broadcast';

export default function ResetModal({
  isOpen,
  onClose,
  congregationId,
  congregationName,
  onResetComplete
}) {
  const [pin, setPin] = useState('');
  const [selectedModules, setSelectedModules] = useState({
    committees: false,
    tithes: false,
    offerings: false,
    projects: false
  });
  const [selectAll, setSelectAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleToggleAll = (checked) => {
    setSelectAll(checked);
    setSelectedModules({
      committees: checked,
      tithes: checked,
      offerings: checked,
      projects: checked
    });
  };

  const handleToggleModule = (key) => {
    const updated = { ...selectedModules, [key]: !selectedModules[key] };
    setSelectedModules(updated);
    const allChecked = Object.values(updated).every(Boolean);
    setSelectAll(allChecked);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validar PIN de Seguridad Maestro
    if (pin.trim() !== '987654321') {
      setError('❌ PIN de seguridad incorrecto. Verifique e intente de nuevo.');
      return;
    }

    const hasSelection = Object.values(selectedModules).some(Boolean);
    if (!hasSelection) {
      setError('⚠️ Seleccione al menos un módulo o opción para restablecer a ceros.');
      return;
    }

    try {
      setIsProcessing(true);
      const db = await initDB();

      // 1. RESTABLECER COMITÉS Y MOVIMIENTOS
      if (selectedModules.committees) {
        // Local IndexedDB: Eliminar movimientos de la congregación
        const allMovs = await getAllFromStore('movements');
        const movsToDelete = allMovs.filter(m => m.congregationId === congregationId);
        for (const m of movsToDelete) {
          await deleteRecord('movements', m.id);
        }

        // Desvincular ofrendas asignadas a comités para esta congregación
        const allOfferings = await getAllFromStore('offerings');
        const commOfferings = allOfferings.filter(o => o.congregationId === congregationId && o.destinationCommitteeId);
        for (const o of commOfferings) {
          if (!selectedModules.offerings) {
            await putRecord('offerings', { ...o, destinationCommitteeId: null });
          }
        }

        // Resetear saldo de comités de la congregación a 0
        const allComms = await getAllFromStore('committees');
        const commsToReset = allComms.filter(c => c.congregationId === congregationId);
        for (const c of commsToReset) {
          await putRecord('committees', { ...c, balance: 0, updatedAt: Date.now() });
        }

        // Supabase Cloud: Eliminar movimientos, desvincular ofrendas y resetear saldos en la nube
        if (supabase) {
          await supabase.from('movements').delete().eq('congregationId', congregationId);
          await supabase.from('committees').update({ balance: 0 }).eq('congregationId', congregationId);
          if (!selectedModules.offerings) {
            await supabase.from('offerings').update({ destinationCommitteeId: null }).eq('congregationId', congregationId);
          }
        }
      }

      // 2. RESTABLECER DIEZMOS
      if (selectedModules.tithes) {
        const allTithes = await getAllFromStore('tithes');
        const tithesToDelete = allTithes.filter(t => t.congregationId === congregationId);
        for (const t of tithesToDelete) {
          await deleteRecord('tithes', t.id);
        }

        if (supabase) {
          await supabase.from('tithes').delete().eq('congregationId', congregationId);
        }
      }

      // 3. RESTABLECER OFRENDAS
      if (selectedModules.offerings) {
        const allOfferings = await getAllFromStore('offerings');
        const offsToDelete = allOfferings.filter(o => o.congregationId === congregationId);
        for (const o of offsToDelete) {
          await deleteRecord('offerings', o.id);
        }

        if (supabase) {
          await supabase.from('offerings').delete().eq('congregationId', congregationId);
        }
      }

      // 4. RESTABLECER PROYECTOS Y VOTOS
      if (selectedModules.projects) {
        const allProjs = await getAllFromStore('projects');
        const projsToDelete = allProjs.filter(p => p.congregationId === congregationId);
        const projIds = new Set(projsToDelete.map(p => p.id));

        for (const p of projsToDelete) {
          await deleteRecord('projects', p.id);
        }

        const allVotes = await getAllFromStore('votes');
        const votesToDelete = allVotes.filter(v => projIds.has(v.projectId));
        for (const v of votesToDelete) {
          await deleteRecord('votes', v.id);
        }

        if (supabase) {
          await supabase.from('projects').delete().eq('congregationId', congregationId);
          if (projIds.size > 0) {
            await supabase.from('votes').delete().in('projectId', Array.from(projIds));
          }
        }
      }

      // Notificar cambio de datos y refrescar la app
      notifyDataChange('RESET_DATA');
      if (onResetComplete) {
        await onResetComplete();
      }

      setSuccessMsg(`✅ Datos restablecidos con éxito en la sede "${congregationName}".`);
      setPin('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error durante el restablecimiento:', err);
      setError(`❌ Error durante el proceso: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Restablecer Datos de Fábrica</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Sede actual: <span className="font-bold">{congregationName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          
          {/* Advertencia */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Atención:</strong> Esta acción borrará la información seleccionada en esta congregación tanto localmente como en la base de datos Supabase de forma irreversible.
            </p>
          </div>

          {/* Selección de Módulos a poner en 0 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              ¿Qué deseas restablecer a ceros?
            </label>
            
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              
              {/* Opción TODO */}
              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 cursor-pointer font-bold text-xs text-rose-700 dark:text-rose-300">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <span>🔥 RESTABLECER TODO (Volver a Fábrica en esta Sede)</span>
              </label>

              <hr className="border-slate-200 dark:border-slate-700 my-2" />

              <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={selectedModules.committees}
                  onChange={() => handleToggleModule('committees')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>👥 Comités (Elimina movimientos y deja saldos en $0)</span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={selectedModules.tithes}
                  onChange={() => handleToggleModule('tithes')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>🧮 Diezmos (Elimina registros de diezmos)</span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={selectedModules.offerings}
                  onChange={() => handleToggleModule('offerings')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>🤲 Ofrendas (Elimina registros de ofrendas)</span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={selectedModules.projects}
                  onChange={() => handleToggleModule('projects')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>🎯 Proyectos y Votos (Elimina proyectos y sus votos)</span>
              </label>

            </div>
          </div>

          {/* Campo PIN de Seguridad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>PIN de Seguridad Maestro para Confirmar</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ingrese el PIN maestro"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm tracking-widest focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Mensajes de Error y Éxito */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              {successMsg}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Restableciendo...' : 'Confirmar Restablecimiento'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
