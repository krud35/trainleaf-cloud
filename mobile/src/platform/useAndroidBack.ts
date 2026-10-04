import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';

/** Route the hardware back action through the same guarded flows as the UI. */
export function useAndroidBack(onBack: () => void) {
  const latest = useRef(onBack);
  useEffect(() => { latest.current = onBack; }, [onBack]);
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    const registration = NativeApp.addListener('backButton', () => {
      const dialog = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1);
      if (dialog) { dialog.dispatchEvent(new Event('cancel', { cancelable: true })); return; }
      const customDialog = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).some(element => element.getClientRects().length > 0);
      if (customDialog) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return; }
      // The editor flushes its raw draft before closing; never bypass that action.
      const draftBack = document.querySelector<HTMLButtonElement>('button.we-back');
      if (draftBack?.getClientRects().length) { if (!draftBack.disabled) draftBack.click(); return; }
      latest.current();
    });
    return () => { void registration.then(handle => handle.remove()); };
  }, []);
}
export const minimizeAndroid = () => { if (Capacitor.getPlatform() === 'android') void NativeApp.minimizeApp(); };
