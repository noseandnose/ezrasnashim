import { getLocalDateString } from './dateUtils';

const DEVICE_ID_KEY = 'ezras_nashim_device_id';
const PENDING_SYNC_KEY = 'ezras_nashim_pending_sync';

interface PendingCompletion {
  category: 'torah' | 'tefilla' | 'tzedaka';
  modalId: string | undefined;
  date: string;
  idempotencyKey: string;
  timestamp: number;
}

interface SyncResult {
  synced: number;
  totals: {
    torah: number;
    tefilla: number;
    tzedaka: number;
    total: number;
  };
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function getPendingCompletions(): PendingCompletion[] {
  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePendingCompletions(completions: PendingCompletion[]): void {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(completions));
}

export function queueCompletion(category: 'torah' | 'tefilla' | 'tzedaka', modalId?: string): void {
  const now = new Date();
  const date = getLocalDateString(); // Use local date to match existing completion tracking
  const idempotencyKey = `${getDeviceId()}-${date}-${category}-${modalId || 'main'}-${now.getTime()}`;
  
  const completion: PendingCompletion = {
    category,
    modalId: modalId,
    date,
    idempotencyKey,
    timestamp: now.getTime()
  };
  
  const pending = getPendingCompletions();
  pending.push(completion);
  savePendingCompletions(pending);
  
  syncCompletions();
}

export async function syncCompletions(): Promise<SyncResult | null> {
  if (!navigator.onLine) {
    return null;
  }
  
  const pending = getPendingCompletions();
  if (pending.length === 0) {
    return null;
  }
  
  try {
    const response = await fetch('/api/mitzvos/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        completions: pending.map(p => ({
          category: p.category,
          modalId: p.modalId,
          date: p.date,
          idempotencyKey: p.idempotencyKey
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error('Sync failed');
    }
    
    const result: SyncResult = await response.json();
    savePendingCompletions([]);
    
    return result;
  } catch (error) {
    console.error('Failed to sync completions:', error);
    return null;
  }
}

export async function getMitzvahTotals(): Promise<{ torah: number; tefilla: number; tzedaka: number; total: number; monthlyTotal: number } | null> {
  try {
    const response = await fetch('/api/mitzvos/totals');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getDeviceStreak(): Promise<number> {
  try {
    const deviceId = getDeviceId();
    const response = await fetch(`/api/mitzvos/streak/${deviceId}`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.streak || 0;
  } catch {
    return 0;
  }
}

// Sync when coming back online
window.addEventListener('online', () => {
  syncCompletions();
});

// Listen for service worker sync messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_MITZVOS') {
      syncCompletions();
    }
  });
}

if ('serviceWorker' in navigator && 'sync' in window) {
  navigator.serviceWorker.ready.then(registration => {
    (registration as any).sync?.register('sync-mitzvos').catch(() => {
    });
  });
}

// Sync pending completions on app initialization
// This ensures offline completions are synced when user reopens the app
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncCompletions();
  }, 1000);
}
