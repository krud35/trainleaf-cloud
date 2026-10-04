import { useRef, useState } from 'react';
import { currentTranslator, useI18n } from '../i18n';
import { errorText, sportLabel } from '../i18n/labels';

export const sportName = (id: string) => sportLabel(currentTranslator(), id);
export const dateLabel = (day: string) => currentTranslator().date(day);
/** Text of an error in the current language; errors are identified by code, never by their text. */
export function errorMessage(error: unknown) { return errorText(currentTranslator(), error); }
export function useAction() {
  const i18n = useI18n();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  // The failure itself is kept, so its message follows a later language change.
  const [failure, setFailure] = useState<{ value: unknown } | null>(null);
  const [notice, setNotice] = useState('');
  const setError = (value: unknown) => setFailure(value === '' || value == null ? null : { value });
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setFailure(null); setNotice('');
    try { await action(); } catch (e) { setFailure({ value: e }); }
    finally { lock.current = false; setBusy(false); }
  }
  const error = !failure ? '' : typeof failure.value === 'string' ? failure.value : errorText(i18n, failure.value);
  return { busy, error, notice, setError, setNotice, run };
}
export function Feedback({ error, notice }: { error: string; notice: string }) {
  return <>{error && <p role="alert" className="error">{error}</p>}{notice && <p role="status" className="success">{notice}</p>}</>;
}
