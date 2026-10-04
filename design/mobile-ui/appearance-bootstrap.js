/* Synchronous, independent of workout data. Runs before styles and app modules. */
(() => {
  const key = 'trainleaf-appearance-v1';
  const choices = ['light', 'dark', 'system'];
  const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  let preference = 'system';
  let storageAvailable = true;
  let returnFocus = null;
  try {
    const saved = localStorage.getItem(key);
    if (choices.includes(saved)) preference = saved;
  } catch { storageAvailable = false; }

  const resolved = () => preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference;
  function syncControls() {
    document.querySelectorAll('[data-appearance-select]').forEach(select => { select.value = preference; });
    document.querySelectorAll('[data-appearance-status]').forEach(status => {
      status.textContent = storageAvailable
        ? (preference === 'system' ? 'Wygląd dopasowuje się do ustawienia urządzenia.' : 'Wybrany wygląd zostaje po ponownym uruchomieniu. Systemowy nadal jest dostępny.')
        : 'Wygląd działa w tej sesji. Przeglądarka nie pozwoliła zapisać ustawienia na następne uruchomienie.';
    });
  }
  function apply() {
    const theme = resolved();
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = theme;
    root.style.backgroundColor = theme === 'dark' ? '#101A15' : '#E9EDE3';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17231C' : '#F7F8F2');
    syncControls();
    window.dispatchEvent(new CustomEvent('trainleaf:themechange', {detail: {preference, resolved: theme}}));
  }
  function setPreference(value) {
    if (!choices.includes(value)) return false;
    preference = value;
    try { localStorage.setItem(key, value); storageAvailable = true; } catch { storageAvailable = false; }
    apply();
    return storageAvailable;
  }
  window.TrainleafAppearance = Object.freeze({
    getPreference: () => preference,
    getResolvedTheme: resolved,
    setPreference,
    refreshControls: syncControls,
    storageKey: key
  });
  apply();
  const systemChanged = () => { if (preference === 'system') apply(); };
  if (media?.addEventListener) media.addEventListener('change', systemChanged);
  else media?.addListener?.(systemChanged);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = choices.includes(event.newValue) ? event.newValue : 'system';
    apply();
  });
  document.addEventListener('change', event => {
    if (event.target.matches?.('[data-appearance-select]')) setPreference(event.target.value);
  });
  document.addEventListener('click', event => {
    const open = event.target.closest?.('[data-appearance-open]');
    const dialog = document.querySelector('#appearance-dialog');
    if (open && dialog) { returnFocus = open; syncControls(); dialog.showModal(); }
    if (event.target.closest?.('[data-appearance-close]')) dialog?.close();
  });
  document.addEventListener('DOMContentLoaded', () => {
    syncControls();
    const dialog = document.querySelector('#appearance-dialog');
    dialog?.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });
  });
  // Static startup UI remains usable if an app module cannot initialize. No data reset.
  const startupFailed = () => {
    const startup = document.querySelector('[data-startup]');
    if (!startup) return;
    startup.querySelector('[data-startup-loading]')?.setAttribute('hidden', '');
    startup.querySelector('[data-startup-error]')?.removeAttribute('hidden');
  };
  window.addEventListener('error', startupFailed, true);
  window.addEventListener('unhandledrejection', startupFailed);
})();
