import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff, RefreshCw, X, Send, Database } from 'lucide-react';
import { getAllFromStore } from '../services/db';
import { triggerBackgroundSync } from '../services/syncEngine';

export default function MultiDeviceSimulator({ isOpen, onClose, networkStatus }) {
  const [queueItems, setQueueItems] = useState([]);
  const [device2Online, setDevice2Online] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadQueue();
    }
  }, [isOpen, networkStatus]);

  const loadQueue = async () => {
    const items = await getAllFromStore('syncQueue');
    setQueueItems(items);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Simulador Multi-Dispositivo & Offline</h2>
            <p className="text-xs text-slate-500">Prueba interactiva de la cola de pendientes y sincronización con la nube</p>
          </div>
        </div>

        {/* Rejilla de Dispositivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dispositivo 1: Este Dispositivo */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">📱 Dispositivo Actual (Pestaña A)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                networkStatus.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {networkStatus.isOnline ? 'Internet OK' : 'Modo Avión'}
              </span>
            </div>

            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <p>• Cola local pendientes: <strong className="text-amber-600 font-mono">{networkStatus.pendingCount} registros</strong></p>
              <p>• Motor de Sync: {networkStatus.isSyncing ? '🔄 Enviando datos...' : 'Idle'}</p>
            </div>

            <button
              onClick={() => triggerBackgroundSync()}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Forzar Sincronización</span>
            </button>
          </div>

          {/* Dispositivo 2: Dispositivo Remoto Simulado */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">💻 Dispositivo Remoto B (Pastor/Tesorero)</span>
              <button
                onClick={() => setDevice2Online(!device2Online)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  device2Online ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {device2Online ? 'En Línea' : 'Desconectado'}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Los cambios guardados en cualquier dispositivo sin internet se conservan en su memoria IndexedDB local y se transmiten automáticamente vía BroadcastChannel a dispositivos cercanos o vía Servidor Central.
            </p>
          </div>

        </div>

        {/* Inspección de Cola Pendiente (sync_queue) */}
        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400 font-bold border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-400" /> Inspección de Cola `syncQueue` ({queueItems.length})
            </span>
            <button onClick={loadQueue} className="text-indigo-400 text-[11px] underline">
              Refrescar
            </button>
          </div>

          {queueItems.length === 0 ? (
            <p className="text-emerald-400 text-center py-3">
              ✨ La cola de pendientes está vacía. Todos los datos están 100% sincronizados con la nube.
            </p>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1">
              {queueItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
                  <span className="text-amber-400 font-bold">[{item.action}] {item.entity}</span>
                  <span className="text-slate-400 text-[10px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
