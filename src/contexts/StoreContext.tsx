'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStoreUpdates } from '@/hooks/useStoreUpdates';
import { emptyStore, type StoreProfile } from '@/lib/store-profile';
const StoreContext = createContext<StoreProfile>(emptyStore);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState(emptyStore),
    [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((v) => v + 1), []);
  useStoreUpdates(reload);
  useEffect(() => {
    const c = new AbortController();
    fetch('/api/store', { signal: c.signal, cache: 'no-store' })
      .then(async (r) => {
        if (r.ok) setStore({ ...emptyStore, ...(await r.json()) });
      })
      .catch(() => {});
    return () => c.abort();
  }, [refresh]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
export function useStore() {
  return useContext(StoreContext);
}
