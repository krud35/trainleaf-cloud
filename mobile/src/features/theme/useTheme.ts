import { useSyncExternalStore } from 'react';
import { initializeTheme } from './themeStore';
export { type ThemePreference, type ResolvedTheme } from './themeStore';
export function useTheme() {
  const store = initializeTheme();
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...snapshot, setPreference: store.setPreference };
}
