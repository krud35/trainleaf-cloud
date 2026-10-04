import './features/theme/boot';
import './i18n/boot';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { createLocalRepository } from './data/repository';
import { openDatabase } from './platform/database';
import { App } from './App';
import { exportRecoveryData } from './data/recovery';
import { exportTextFile } from './platform/files';
import { today } from './data/analytics';
import { ThemeControl } from './features/theme/ThemeControl';
import { LanguageControl } from './i18n/LanguageControl';
import { currentTranslator, useI18n } from './i18n';
import { errorText } from './i18n/labels';
import './styles.css';
import './ui/trainleaf.css';
import './features/theme/theme.css';

const root = createRoot(document.getElementById('root')!);
function Opening() { const { t } = useI18n(); return <main className="startup" role="status">{t('app.opening')}</main>; }
root.render(<Opening/>);

// Android loads its own bundled files. Only the production browser preview needs a shell cache.
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('./sw.js').catch(() => {
    // Database writes still work; indicate that offline browser startup is unavailable.
    document.documentElement.dataset.offlinePreview = 'unavailable';
  });
}

async function start() {
  const database = await openDatabase();
  try {
    const repository = await createLocalRepository(database);
    const snapshot = await repository.readSnapshot();
    root.render(<App repository={repository} initialSnapshot={snapshot} />);
  } catch (error) {
    await database.close().catch(() => undefined);
    throw error;
  }
}

function RecoveryScreen({ error }: { error: unknown }) {
  const [busy, setBusy] = useState(false);
  const i18n = useI18n(), { t } = i18n;
  const [notice, setNotice] = useState('');
  async function exportRecovery() {
    setBusy(true); setNotice('');
    try {
      const database = await openDatabase();
      let text: string;
      try { text = await exportRecoveryData(database); }
      finally { await database.close().catch(() => undefined); }
      const partial = JSON.parse(text).complete === false;
      const exported = currentTranslator().msg(await exportTextFile(`trainleaf-plik-ratunkowy-${today()}.json`, text, 'application/json'));
      setNotice(partial ? currentTranslator().t('app.recoveryPartial', { result: exported }) : exported);
    } catch (failure) { const now = currentTranslator(); setNotice(now.t('app.recoveryExportFailed', { reason: failure instanceof Error ? errorText(now, failure) : now.t('app.recoveryDataKept') })); }
    finally { setBusy(false); }
  }
  return <main className="startup"><section className="card stack">
    <LanguageControl/>
    <ThemeControl/>
    <h1>{t('app.recoveryTitle')}</h1>
    <p role="alert">{t('app.recoveryAlert')}</p>
    <p>{t('app.recoveryHelp')}</p>
    <button className="primary" disabled={busy} onClick={() => location.reload()}>{t('app.retry')}</button>
    <button className="secondary" disabled={busy} onClick={() => void exportRecovery()}>{t('app.exportRecovery')}</button>
    {notice && <p role="status">{notice}</p>}
    <details><summary>{t('app.problemDetails')}</summary><p>{error instanceof Error ? errorText(i18n, error) : t('app.localDataUnreadable')}</p></details>
  </section></main>;
}
start().catch((error: unknown) => { root.render(<RecoveryScreen error={error}/>); });
