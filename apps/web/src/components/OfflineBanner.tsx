'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getQueueCount, syncPendingQueue } from '../lib/offline-queue';
import { useAuth } from '../context/AuthContext';
import { getT } from '../lib/i18n';

export const OfflineBanner: React.FC = () => {
  const { activeMandal, token, language } = useAuth();
  const t = getT(language);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const checkQueue = async () => {
    if (activeMandal) {
      const count = await getQueueCount(activeMandal.id);
      setQueueCount(count);
    }
  };

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      handleAutoSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [activeMandal, token]);

  const handleAutoSync = async () => {
    if (!activeMandal || !token) return;
    setIsSyncing(true);
    const result = await syncPendingQueue(
      activeMandal.id,
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      token,
      (count) => {
        if (count > 0) {
          setSyncSuccessMsg(`${count} offline donations synced successfully!`);
          setTimeout(() => setSyncSuccessMsg(null), 4000);
        }
      }
    );
    setIsSyncing(false);
    checkQueue();
  };

  if (isOnline && queueCount === 0 && !syncSuccessMsg) {
    return null;
  }

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md flex items-center justify-between transition-all duration-200">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 shrink-0 text-amber-100 animate-pulse" />
              <span>
                <strong>Offline Mode:</strong> Donations are stored safely on your phone and will auto-sync when connected.
              </span>
            </>
          ) : syncSuccessMsg ? (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-200" />
              <span>{syncSuccessMsg}</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 shrink-0 text-amber-100" />
              <span>
                <strong>{queueCount}</strong> donation{queueCount > 1 ? 's' : ''} saved offline and waiting to sync.
              </span>
            </>
          )}
        </div>

        {isOnline && queueCount > 0 && (
          <button
            onClick={handleAutoSync}
            disabled={isSyncing}
            className="shrink-0 bg-white text-amber-900 hover:bg-amber-50 px-3 py-1 rounded-lg font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 min-h-[32px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : t.sync_now}</span>
          </button>
        )}
      </div>
    </div>
  );
};
