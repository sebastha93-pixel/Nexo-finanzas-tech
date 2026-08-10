import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// The BACKEND is the single authoritative writer of imported transactions.
// The frontend only triggers the server-side sync and reloads the list — it no
// longer parses or inserts, which removes the frontend/backend parser race.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)
  ?? 'https://nexo-finanzas-tech-production.up.railway.app/api/v1';

const MIN_GAP_MS  = 20 * 60 * 1000; // 20 min throttle between syncs
const INTERVAL_MS = 30 * 60 * 1000; // poll every 30 min while app is open

function lastSyncAt(): number {
  return parseInt(localStorage.getItem('nexo_last_gmail_sync') ?? '0', 10);
}
function markSynced() {
  localStorage.setItem('nexo_last_gmail_sync', String(Date.now()));
}
function isConnected(): boolean {
  return localStorage.getItem('nexo_gmail_connected') === '1';
}

export function useAutoGmailSync(
  userId: string | null,
  onNewTransactions?: () => void,
) {
  const [newCount, setNewCount] = useState(0);
  const [syncing, setSyncing]   = useState(false);

  const cbRef      = useRef(onNewTransactions);
  const syncingRef = useRef(false);
  const userRef    = useRef(userId);

  useEffect(() => { cbRef.current   = onNewTransactions; }, [onNewTransactions]);
  useEffect(() => { userRef.current = userId; },           [userId]);

  useEffect(() => {
    if (!userId) return;

    async function sync(bypassThrottle = false) {
      const uid = userRef.current;
      if (!uid || syncingRef.current) return;
      if (!isConnected()) return; // no Gmail linked → nothing to do
      if (!bypassThrottle && Date.now() - lastSyncAt() < MIN_GAP_MS) return;

      syncingRef.current = true;
      setSyncing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch(`${API_URL}/email-sync/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return; // don't arm the throttle on a failed sync
        markSynced();

        const result = (await res.json()) as { transactionsCreated?: number };
        const created = result.transactionsCreated ?? 0;
        if (created > 0) {
          setNewCount(n => n + created);
          cbRef.current?.();
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('ORIA · Nuevos movimientos', {
              body: `${created} movimiento${created !== 1 ? 's' : ''} importado${created !== 1 ? 's' : ''} automáticamente`,
              icon: '/favicon.png',
            });
          }
        }
      } catch {
        // Silent — never disrupt the user
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    }

    // Sync once per session without throttle; later mounts (e.g. after an
    // auto-lock/unlock) respect the throttle so we don't hammer the backend.
    const firstOfSession = !sessionStorage.getItem('oria_synced_session');
    sessionStorage.setItem('oria_synced_session', '1');
    void sync(firstOfSession);

    // Re-sync when the user returns to the tab.
    function onVisibility() {
      if (document.visibilityState === 'visible') void sync();
    }
    // Sync immediately when Gmail is connected mid-session (no reload needed).
    function onConnected() { void sync(true); }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('oria:gmail-connected', onConnected);
    const timer = setInterval(() => void sync(), INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('oria:gmail-connected', onConnected);
      clearInterval(timer);
    };
  }, [userId]); // callbacks use refs; userId is the only structural dep

  return { newCount, syncing, clearCount: () => setNewCount(0) };
}
