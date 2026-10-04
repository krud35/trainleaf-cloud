import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { initializeTheme } from './themeStore';
const theme = initializeTheme();
if (Capacitor.isNativePlatform()) {
  const syncSystemBars = () => {
    void SystemBars.setStyle({ style: theme.getSnapshot().resolved === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light })
      .catch(() => { document.documentElement.dataset.systemBarTheme = 'unavailable'; });
  };
  syncSystemBars();
  theme.subscribe(syncSystemBars);
}
