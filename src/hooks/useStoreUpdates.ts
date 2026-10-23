'use client';
import { useEffect } from 'react';

// Refresh open storefronts without requiring a deployment or Supabase Realtime setup.
export function useStoreUpdates(reload: () => void) {
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') reload();
    };
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('polaris:store-updated', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('polaris:store-updated', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reload]);
}
