import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getPendingCount, getLastSyncError } from '../services/syncEngine';
import { getAllFromStore } from '../services/db';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clearStore } from '../services/db';

export default function DiagnosticsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [syncingLocal, setSyncingLocal] = useState(false);
  const [syncLog, setSyncLog] = useState([]);

  if (!isOpen) return null;

  const runDiagnostics = async () => {
    setLoading(true);
    setResults(null);

    const supaUrl = import.meta.env.VITE_SUPABASE_URL;
    const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const hasSupaUrl = !!supaUrl;
    const hasSupaKey = !!supaKey;
    const isSupaClientInit = !!supabase;

    let pingOk = false;
    let pingError = null;
    let queryData = null;
    let pendingQueueSize = 0;

    try {
      pendingQueueSize = await getPendingCount();
    } catch (e) {
      console.error(e);
    }

    if (isSupaClientInit) {
      try {
        const { data, error } = await supabase.from('congregations').select('*').limit(1);
        if (error) {
          pingError = `${error.code}: ${error.message}`;
        } else {
          pingOk = true;
          queryData = data;
        }
      } catch (err) {
        pingError = err.message || String(err);
      }
    }

    setResults({
      hasSupaUrl,
      hasSupaKey,
      isSupaClientInit,
      supaUrlPrefix: supaUrl ? supaUrl.substring(0, 15) + '...' : 'Faltante',
      supaKeyPrefix: supaKey ? supaKey.substring(0, 15) + '...' : 'Faltante',
      pingOk,
      pingError,
      queryData,
      pendingQueueSize,
      lastSyncError: getLastSyncError(),
      userAgent: navigator.userAgent
    });
    setLoading(false);
  };

  const handleForceSync = async () => {
    if (!supabase) {
      toast.error("El conector de Supabase no está inicializado. Corrige las variables primero.");
      return;
    }

    setSyncingLocal(true);
    setSyncLog(["Iniciando subida forzada de datos locales a la nube..."]);

    const entities = ['congregations', 'users', 'committees', 'projects', 'tithes', 'offerings', 'movements', 'votes'];
    
    try {
      for (const entity of entities) {
        setSyncLog(prev => [...prev, `Leyendo tabla local: ${entity}...`]);
        const localData = await getAllFromStore(entity);
        
        if (!localData || localData.length === 0) {
          setSyncLog(prev => [...prev, `Tabla ${entity} vacía localmente. Omitiendo.`]);
          continue;
        }

        setSyncLog(prev => [...prev, `Subiendo ${localData.length} registros de ${entity} a Supabase...`]);
        let entityErrors = 0;
        let lastErrorMsg = '';

        for (const record of localData) {
          const { error } = await supabase.from(entity).upsert(record);
          if (error) {
            entityErrors++;
            lastErrorMsg = `${error.code}: ${error.message}`;
          }
        }

        if (entityErrors > 0) {
          setSyncLog(prev => [...prev, `❌ Error en ${entity}: fallaron ${entityErrors} envíos. Último error: ${lastErrorMsg}`]);
        } else {
          setSyncLog(prev => [...prev, `✅ Tabla ${entity} sincronizada correctamente en la nube.`]);
        }
      }
      setSyncLog(prev => [...prev, "🎉 Proceso de sincronización forzada finalizado."]);
    } catch (e) {
      setSyncLog(prev => [...prev, `💥 Error crítico: ${e.message || String(e)}`]);
    } finally {
      setSyncingLocal(false);
    }
  };

  const handleClearCache = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let reg of registrations) {
        await reg.unregister();
      }
    }
    if ('caches' in window) {
      const names = await caches.keys();
      for (let name of names) {
        await caches.delete(name);
      }
    }
    toast.success('Caché limpiado exitosamente. La aplicación se recargará.');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleClearQueue = async () => {
    if (!window.confirm("¿Estás seguro de eliminar la cola de sincronización pendiente? Perderás los datos no sincronizados de este dispositivo.")) return;
    
    setSyncingLocal(true);
    setSyncLog(prev => [...prev, "Limpiando cola de pendientes local..."]);
    try {
      await clearStore('syncQueue');
      setSyncLog(prev => [...prev, "Cola limpiada exitosamente."]);
      toast.success("Cola de sincronización vaciada.");
      await runDiagnostics();
    } catch (e) {
      setSyncLog(prev => [...prev, `Error limpiando cola: ${e.message}`]);
      toast.error("Error al limpiar cola.");
    } finally {
      setSyncingLocal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Diagnóstico de Conexión</h2>
            <p className="text-xs text-slate-500">Verifica la salud de la sincronización en la nube</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analizando...</span>
                </>
              ) : (
                <span>Ejecutar Diagnóstico</span>
              )}
            </button>
            <button
              onClick={handleForceSync}
              disabled={syncingLocal}
              className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              {syncingLocal ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Subir todo a Nube</span>
                </>
              )}
            </button>
          </div>

          {results && results.pendingQueueSize > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {results.lastSyncError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-mono break-words">
                  <strong>Último Error de Servidor:</strong><br/> {results.lastSyncError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleForceSync}
                  disabled={syncingLocal || !results.pingOk}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingLocal ? 'animate-spin' : ''}`} />
                  Forzar Sincronización
                </button>
                <button
                  onClick={handleClearQueue}
                  disabled={syncingLocal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-900/50 text-white rounded-xl font-medium hover:bg-red-700 dark:hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Vaciar Cola (Peligro)
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleClearCache}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar App (Forzar Limpieza de Caché)
          </button>

          {/* Registro de logs de sincronización forzada */}
          {syncLog.length > 0 && (
            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono max-h-36 overflow-y-auto space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 border-b border-slate-800 pb-1">Progreso de Sincronización:</p>
              {syncLog.map((log, idx) => (
                <div key={idx} className="leading-tight">{log}</div>
              ))}
            </div>
          )}

          {results && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm overflow-y-auto max-h-72">
              {/* Variables de Entorno */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">1. Variables cargadas en Vercel</p>
                <div className="flex justify-between items-center">
                  <span>URL de Supabase:</span>
                  <span className={results.hasSupaUrl ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                    {results.hasSupaUrl ? "Cargado" : "FALTANTE"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono pl-2">{results.supaUrlPrefix}</div>

                <div className="flex justify-between items-center">
                  <span>Clave Pública (Anon Key):</span>
                  <span className={results.hasSupaKey ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                    {results.hasSupaKey ? "Cargado" : "FALTANTE"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono pl-2">{results.supaKeyPrefix}</div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Estado del Cliente */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">2. Inicialización del Cliente</p>
                <div className="flex justify-between items-center">
                  <span>Cliente Supabase listo:</span>
                  <span className={results.isSupaClientInit ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                    {results.isSupaClientInit ? "SÍ" : "NO"}
                  </span>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Prueba de Ping */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">3. Prueba de Conexión en Vivo</p>
                {results.pingOk ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Conexión Exitosa con la Nube!</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-600 font-bold">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Fallo de Conexión</span>
                    </div>
                    {results.pingError && (
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-xs font-mono break-words">
                        {results.pingError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Cola de Sincronización */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">4. Cola Local de Pendientes</p>
                <div className="flex justify-between items-center">
                  <span>Cambios por subir a la nube:</span>
                  <span className="font-bold">{results.pendingQueueSize} cambios</span>
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl border border-blue-150 dark:border-blue-900/50 text-xs">
                <p className="font-bold mb-1">💡 Consejos de solución rápida:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {!results.hasSupaUrl || !results.hasSupaKey ? (
                    <li>Las variables de entorno en Vercel siguen vacías. Revisa la guía en Vercel, agrégalas y haz un <strong>Redeploy</strong>.</li>
                  ) : !results.pingOk ? (
                    <li>
                      <strong>Posible Bloqueo de Red:</strong> Desactiva temporalmente el VPN de Opera, Brave Shields, o extensiones bloqueadoras de anuncios y recarga.
                    </li>
                  ) : results.pendingQueueSize > 0 ? (
                    <li>Hay datos en cola. La sincronización debería completarse en segundos. Si no, dale clic al ícono de la nube en la barra superior para forzar.</li>
                  ) : (
                    <li>Todo el sistema está sano. Si no ves los datos reflejados, asegúrate de estar usando la misma congregación exacta en ambos dispositivos.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
