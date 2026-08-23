import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineDonationEntry, SyncDonationsBatchInput } from '@vargani/types';

interface VarganiDBSchema extends DBSchema {
  donations_queue: {
    key: string; // client_id
    value: OfflineDonationEntry;
    indexes: { 'by_mandal': string; 'by_status': string };
  };
}

const DB_NAME = 'vargani_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VarganiDBSchema>> | null = null;

function getDB() {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = openDB<VarganiDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('donations_queue')) {
          const store = db.createObjectStore('donations_queue', { keyPath: 'client_id' });
          store.createIndex('by_mandal', 'mandal_id');
          store.createIndex('by_status', 'sync_status');
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueOfflineDonation(donation: OfflineDonationEntry): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put('donations_queue', donation);
}

export async function getPendingDonations(mandalId?: string): Promise<OfflineDonationEntry[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAll('donations_queue');
  return all.filter((d) => (!mandalId || d.mandal_id === mandalId) && d.sync_status === 'PENDING_SYNC');
}

export async function getQueueCount(mandalId?: string): Promise<number> {
  const pending = await getPendingDonations(mandalId);
  return pending.length;
}

export async function markDonationSynced(clientId: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const item = await db.get('donations_queue', clientId);
  if (item) {
    item.sync_status = 'SYNCED';
    await db.put('donations_queue', item);
  }
}

export async function clearSyncedDonations(): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const all = await db.getAll('donations_queue');
  for (const item of all) {
    if (item.sync_status === 'SYNCED') {
      await db.delete('donations_queue', item.client_id);
    }
  }
}

export async function syncPendingQueue(
  mandalId: string,
  apiBaseUrl: string,
  token: string,
  onSyncComplete?: (syncedCount: number) => void
): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  const pending = await getPendingDonations(mandalId);
  if (pending.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const payload: SyncDonationsBatchInput = {
    mandal_id: mandalId,
    donations: pending.map((d) => ({
      mandal_id: d.mandal_id,
      donor_name: d.donor_name,
      donor_phone: d.donor_phone || '',
      amount: d.amount,
      payment_mode: d.payment_mode,
      payment_reference: d.payment_reference,
      flat_wing: d.flat_wing,
      language: d.language,
      client_id: d.client_id,
      receipt_number: d.receipt_number,
      created_at: d.created_at,
    })),
  };

  try {
    const res = await fetch(`${apiBaseUrl}/donations/sync-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) {
      return { success: false, syncedCount: 0, errors: [data.message || 'Sync failed'] };
    }

    let synced = 0;
    const errors: string[] = [];

    for (const result of data.data) {
      if (result.status === 'SYNCED') {
        await markDonationSynced(result.client_id);
        synced++;
      } else {
        errors.push(`Receipt ${result.receipt_number}: ${result.error}`);
      }
    }

    await clearSyncedDonations();
    if (onSyncComplete) onSyncComplete(synced);

    return { success: errors.length === 0, syncedCount: synced, errors };
  } catch (err: any) {
    return { success: false, syncedCount: 0, errors: [err.message || 'Network error during sync'] };
  }
}
