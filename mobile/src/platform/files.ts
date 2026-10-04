import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AppError } from '../data/errors';
import { currentTranslator, type Msg } from '../i18n';
/** Export occurs only after a user action; no automatic upload or directory access. */
export async function exportTextFile(name: string, contents: string, mime: string): Promise<Msg> {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new AppError('fileNameInvalid', 'Nieprawidłowa nazwa pliku.');
  if (Capacitor.isNativePlatform()) {
    const path = `exports/${Date.now()}-${name}`;
    const result = await Filesystem.writeFile({ directory: Directory.Cache, path, data: contents, encoding: Encoding.UTF8, recursive: true });
    try {
      await Share.share({ title: currentTranslator().t('files.shareTitle'), files: [result.uri], dialogTitle: currentTranslator().t('files.shareDialog') });
    } catch (error) {
      if (error instanceof Error && /cancel/i.test(error.message)) return { key: 'files.cancelled' };
      throw error;
    }
    // The destination app may still be reading this file after the chooser closes.
    // Android owns expiry of cache files; do not delete it before that read finishes.
    return { key: 'files.shared' };
  }
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { key: 'files.downloaded' };
}
