/**
 * Servicio BroadcastChannel para sincronización instantánea entre pestañas del navegador
 * y simulación de sincronización multi-dispositivo local.
 */

const CHANNEL_NAME = 'deborita_sync_channel';

let channel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  channel = new BroadcastChannel(CHANNEL_NAME);
}

export function subscribeToSyncEvents(callback) {
  if (!channel) return () => {};
  
  const listener = (event) => {
    if (event.data) {
      callback(event.data);
    }
  };

  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
  };
}

export function notifyDataChange(type, payload = {}) {
  if (channel) {
    channel.postMessage({
      type,
      payload,
      timestamp: Date.now()
    });
  }
}
