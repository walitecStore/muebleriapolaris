'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { emptyStore, type StoreProfile } from '@/lib/store-profile';
const StoreContext = createContext<StoreProfile>(emptyStore);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState(emptyStore),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const reload = () => setRefresh((v) => v + 1);
    window.addEventListener('polaris:store-updated', reload);
    return () => window.removeEventListener('polaris:store-updated', reload);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    fetch('/api/store', { signal: c.signal })
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
