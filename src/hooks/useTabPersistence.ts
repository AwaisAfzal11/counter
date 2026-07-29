import { useCallback, useState } from 'react';

const KEY = 'campaign158.front';

/**
 * The only storage in the entire app: which visualization tab was last open.
 * Nothing the user taps ever changes data — this remembers a viewpoint, not a
 * result.
 */
export function useTabPersistence<T extends string>(tabs: readonly T[], fallback: T) {
  const [tab, setTabState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(KEY) as T | null;
      if (stored && tabs.includes(stored)) return stored;
    } catch {
      /* storage unavailable — a viewpoint is not worth a crash */
    }
    return fallback;
  });

  const setTab = useCallback((next: T) => {
    setTabState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return [tab, setTab] as const;
}
