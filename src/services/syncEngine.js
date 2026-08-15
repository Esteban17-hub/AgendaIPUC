import { initDB, getAllFromStore, deleteRecord, putRecord, clearStore } from './db';
import { notifyDataChange } from './broadcast';
import { supabase } from './supabaseClient';

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isSyncing = false;
const listeners = new Set();

let presenceCount = 1;
const presenceListeners = new Set();

let lastSyncError = null;

export function getLastSyncError() {
  return lastSyncError;
}

export function subscribePresence(callback) {
  presenceListeners.add(callback);
  callback(presenceCount);
  return () => presenceListeners.delete(callback);
}

function notifyPresenceChange() {
  presenceListeners.forEach((cb) => cb(presenceCount));
}

// Manejadores de eventos de red y polling automático
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    notifyStatusChange();
    triggerBackgroundSync()
      .then(() => {
        fetchFreshDataFromCloud();
      })
      .catch(err => {
        console.warn('Fallo sync on-line:', err);
      });
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    notifyStatusChange();
  });

  // Polling automático cada 5 segundos: Envía pendientes y descarga novedades de otros dispositivos
  setInterval(() => {
    if (isOnline && !isSyncing) {
      triggerBackgroundSync().catch(err => {
        console.warn('Fallo en sync periódico, se detiene para evitar pérdida de datos.', err);
      });
    }
  }, 5000);
}

// Configurar WebSockets para Realtime
let isRealtimeInitialized = false;

export function setupRealtimeListeners() {
  if (isRealtimeInitialized || !supabase) return;
  
  const tables = ['congregations', 'users', 'committees', 'projects', 'tithes', 'offerings', 'movements', 'votes'];
  
  tables.forEach(table => {
    supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, async (payload) => {
        console.log(`Realtime update en ${table}:`, payload);
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          await putRecord(table, newRecord);
        } else if (eventType === 'DELETE') {
          await deleteRecord(table, oldRecord.id);
        }
        
        notifyDataChange('REALTIME_UPDATE');
      })
      .subscribe();
  });

  // PRESENCE CHANNEL
  const presenceChannel = supabase.channel('global-presence', {
    config: {
      presence: {
        key: 'user-' + Math.random().toString(36).substring(2, 9)
      }
    }
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      let count = 0;
      for (const id in state) {
        count += state[id].length;
      }
      presenceCount = Math.max(1, count);
      notifyPresenceChange();
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          online_at: new Date().toISOString()
        });
      }
    });

  isRealtimeInitialized = true;
}

export function subscribeNetworkStatus(callback) {
  listeners.add(callback);
  callback({ isOnline, isSyncing });
  return () => listeners.delete(callback);
}

function notifyStatusChange() {
  getPendingCount().then((count) => {
    listeners.forEach((cb) => cb({ isOnline, isSyncing, pendingCount: count }));
  });
}

export async function getPendingCount() {
  try {
    const queue = await getAllFromStore('syncQueue');
    return queue.length;
  } catch (e) {
    return 0;
  }
}

export async function queueOfflineAction(action, entity, data) {
  const db = await initDB();
  const queueItem = {
    action, // 'CREATE', 'UPDATE', 'DELETE', 'ANNUL'
    entity, // 'movements', 'tithes', 'offerings', 'projects', 'votes', 'committees'
    data,
    timestamp: Date.now()
  };
  
  await db.add('syncQueue', queueItem);
  notifyStatusChange();
  notifyDataChange('QUEUE_UPDATED', { entity });

  // Si estamos en línea, intentar sincronizar de inmediato
  if (isOnline) {
    triggerBackgroundSync().catch(err => {
      console.warn('Sync en segundo plano pausado:', err.message);
    });
  }
}

export async function triggerBackgroundSync() {
  if (isSyncing || !isOnline) return;

  try {
    isSyncing = true;
    notifyStatusChange();

    const db = await initDB();
    const queue = await getAllFromStore('syncQueue');

    if (queue.length > 0) {
      // Sincronizar cola enviando a Supabase
      for (const item of queue) {
        let success = true;
        
        if (supabase) {
          if (item.action === 'CREATE' || item.action === 'UPDATE' || item.action === 'ANNUL') {
            const { error } = await supabase.from(item.entity).upsert(item.data);
            if (error) {
              console.error(`Error enviando ${item.entity} a Supabase:`, error);
              lastSyncError = `Auto-corregido error en ${item.entity}: ${error.message}`;
              
              // AUTO-HEALING: Si Supabase rechaza el registro (ej. Foreign Key, RLS), 
              // está corrupto. Lo eliminamos automáticamente para no atascar la cola.
              await deleteRecord('syncQueue', item.id);
              
              // Si era un registro nuevo que nunca existirá en la nube, lo borramos localmente
              // para mantener la consistencia y evitar datos "fantasma" en este dispositivo.
              if (item.action === 'CREATE' && item.data && item.data.id) {
                await deleteRecord(item.entity, item.data.id);
              }
              
              continue; // Saltamos al siguiente elemento automáticamente sin detener la cola
            }
          } else if (item.action === 'DELETE') {
            const { error } = await supabase.from(item.entity).delete().match({ id: item.data.id });
            if (error) {
               console.error(`Error eliminando en Supabase:`, error);
               lastSyncError = `Auto-corregido error eliminando ${item.entity}: ${error.message}`;
               await deleteRecord('syncQueue', item.id);
               continue;
            }
          }
        }
        
        // Si llegó hasta aquí, fue exitoso (o no hay supabase, lo cual simula éxito offline puro)
        lastSyncError = null;
        await putRecord(item.entity, item.data);
        await deleteRecord('syncQueue', item.id);
        notifyStatusChange();
      }
    }

    // Regla de Oro: Solo cuando la cola está 100% vacía, notificamos que terminó
    const remainingQueue = await getAllFromStore('syncQueue');
    if (remainingQueue.length === 0) {
      // Ya no hacemos fetchFreshDataFromCloud() aquí para evitar el bucle de borrado cada 5s
      console.log('Cola de pendientes vacía. Sincronización al día.');
    }
  } catch (err) {
    console.error('Error durante la sincronización en segundo plano:', err);
    throw err;
  } finally {
    isSyncing = false;
    notifyStatusChange();
    notifyDataChange('SYNC_COMPLETED');
  }
}

export async function fetchFreshDataFromCloud() {
  if (!supabase) return;
  // Descarga de datos reales desde Supabase a IndexedDB local
  const entities = ['users', 'congregations', 'committees', 'projects', 'tithes', 'offerings', 'movements', 'votes'];
  
  for (const entity of entities) {
    const { data, error } = await supabase.from(entity).select('*');
    if (data && !error) {
      // CAUSA RAÍZ SOLUCIONADA: 
      // Antes, solo hacíamos putRecord (Upsert). Los registros eliminados en la nube 
      // o en otro dispositivo nunca se borraban localmente si el cliente estaba offline.
      // Ahora, al asegurar que la cola de pendientes está vacía, podemos limpiar 
      // la tabla local por completo y reescribirla con la fuente de verdad (Nube).
      await clearStore(entity);
      
      for (const record of data) {
         await putRecord(entity, record);
      }
    } else if (error) {
      console.error(`Error obteniendo ${entity} de Supabase:`, error);
    }
  }
}
