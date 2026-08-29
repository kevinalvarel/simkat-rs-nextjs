/**
 * Real-time synchronization utility using BroadcastChannel
 * Allows instant 0ms cross-tab event notification within the same browser session
 */

const SYNC_CHANNEL_NAME = 'simkat_production_sync';

export interface ProductionSyncMessage {
  type: 'SYNC_NOW' | 'PATIENT_UPDATED' | 'SNAPSHOT_TRIGGERED' | 'REVISION_APPROVED';
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

  // 1. Dispatch local DOM custom event for current window
  try {
    window.dispatchEvent(
      new CustomEvent('simkat:production-update', {
        detail: { type, timestamp: Date.now(), source },
      }),
    );
  } catch (e) {
    console.debug('Failed to dispatch local custom event:', e);
  }

  // 2. Broadcast to other tabs
  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage({
        type,
        timestamp: Date.now(),
        source,
      } as ProductionSyncMessage);
    } catch (e) {
      console.warn('Failed to postMessage to BroadcastChannel:', e);
    }
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

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<ProductionSyncMessage>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener('simkat:production-update', handleCustomEvent);

  const channel = getChannel();
  const handleBroadcastMessage = (event: MessageEvent<ProductionSyncMessage>) => {
    if (event.data && typeof event.data === 'object') {
      callback(event.data);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('simkat:production-update', handleCustomEvent);
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
