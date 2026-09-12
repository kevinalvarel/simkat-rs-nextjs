/**
 * Real-time synchronization utility using BroadcastChannel
 * Allows instant 0ms cross-tab event notification within the same browser session
 */

const SYNC_CHANNEL_NAME = 'simkat_production_sync';

/** Key localStorage untuk event terakhir — dibaca tab yang baru dibuka/navigasi. */
export const SYNC_STORAGE_KEY = 'simkat_production_sync_last';

export interface ProductionSyncMessage {
  type:
    | 'SYNC_NOW'
    | 'PATIENT_UPDATED'
    | 'SNAPSHOT_TRIGGERED'
    | 'REVISION_APPROVED'
    | 'REVISION_REJECTED'
    | 'ETIKET_PRINTED';
  timestamp: number;
  source?: string;
}

let channelInstance: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;

  if (!channelInstance) {
    try {
      channelInstance = new BroadcastChannel(SYNC_CHANNEL_NAME);
    } catch (e) {
      console.warn('BroadcastChannel not supported or failed to initialize:', e);
      return null;
    }
  }
  return channelInstance;
}

/**
 * Broadcast an event to all open tabs that production data has changed
 */
export function broadcastProductionUpdate(
  type: ProductionSyncMessage['type'] = 'SYNC_NOW',
  source = 'client',
) {
  if (typeof window === 'undefined') return;

  const msg: ProductionSyncMessage = {
    type,
    timestamp: Date.now(),
    source,
  };

  // 1. Dispatch local DOM custom event for current window
  try {
    window.dispatchEvent(
      new CustomEvent('simkat:production-update', {
        detail: msg,
      }),
    );
  } catch (e) {
    console.debug('Failed to dispatch local custom event:', e);
  }

  // 2. Persist last event agar tab yang baru dibuka / baru navigasi ke
  //    layout katering tetap bisa menaikkan badge (event tidak hilang).
  try {
    window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(msg));
  } catch (e) {
    console.debug('Failed to persist sync event to localStorage:', e);
  }

  // 3. Broadcast to other tabs
  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage(msg);
    } catch (e) {
      console.warn('Failed to postMessage to BroadcastChannel:', e);
    }
  }
}

/**
 * Baca event sync terakhir dari localStorage (untuk tab yang mount belakangan).
 * Return null bila tidak ada / rusak.
 */
export function readLastSyncEvent(): ProductionSyncMessage | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductionSyncMessage;
    if (!parsed || typeof parsed !== 'object' || !parsed.type) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Subscribe to production update events across tabs and local events
 * Returns a cleanup function
 */
export function listenProductionUpdate(
  callback: (msg: ProductionSyncMessage) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Dedupe: tab penerima bisa dapat event yang sama via BroadcastChannel
  // DAN via storage event — hanya teruskan sekali.
  let lastDeliveredKey = '';

  const deliver = (msg: ProductionSyncMessage) => {
    if (!msg || typeof msg !== 'object') return;
    const key = `${msg.type}|${msg.timestamp}|${msg.source ?? ''}`;
    if (key === lastDeliveredKey) return;
    lastDeliveredKey = key;
    callback(msg);
  };

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<ProductionSyncMessage>;
    if (customEvent.detail) {
      deliver(customEvent.detail);
    }
  };

  window.addEventListener('simkat:production-update', handleCustomEvent);

  const channel = getChannel();
  const handleBroadcastMessage = (event: MessageEvent<ProductionSyncMessage>) => {
    if (event.data && typeof event.data === 'object') {
      deliver(event.data);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage);
  }

  // Fallback lintas-tab via storage event (tidak fire di tab pengirim,
  // hanya di tab lain — melengkapi BroadcastChannel).
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key !== SYNC_STORAGE_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as ProductionSyncMessage;
      if (parsed && parsed.type) deliver(parsed);
    } catch {
      // abaikan payload rusak
    }
  };

  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('simkat:production-update', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
