import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const url = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4174/';
const options = { channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', viewport: { width: 390, height: 844 }, headless: true };

async function createProfile(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00')); await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await page.goto(url);
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Marta');
  await page.getByLabel('Bieganie', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await expect(page.getByRole('heading', { name: 'Dzisiaj', exact: true })).toBeVisible();
}
async function fillWorkout(page: Page, name: string) {
  await page.getByRole('button', { name: 'Zapisz trening', exact: true }).click();
  await page.locator('.workout-editor').getByLabel(/^Nazwa /).fill(name);
  await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('running');
  await page.getByRole('combobox', { name: 'Sport', exact: true }).selectOption('running');
  await page.getByLabel('Data', { exact: true }).fill('2026-10-03');
  await page.getByLabel(/^Wykonany czas/).fill('45');
  await page.getByLabel('Odczuwany wysiłek').selectOption('0');
  await page.getByRole('textbox', { name: 'Twoja notatka', exact: true }).fill('Spokojnie, bez pośpiechu.');
}
async function saveWorkout(page: Page) {
  await page.getByRole('button', { name: 'Zapisz trening na urządzeniu' }).click();
  await expect(page.getByRole('heading', { name: 'Po treningu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pomiń na teraz', exact: true }).click();
}
async function settings(page: Page) {
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Inne', exact: true }).click();
  await page.getByRole('button', { name: 'Ustawienia profilu', exact: true }).click();
}
async function history(page: Page) {
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Dzisiaj', exact: true }).click();
  await page.getByRole('button', { name: 'Historia treningów', exact: true }).click();
}
async function offlineReady(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
    });
  });
}

test('profile and workout survive full browser restart, read and edit with network offline', async ({}, testInfo) => {
  const directory = await mkdtemp(join(tmpdir(), 'fieldwork-offline-'));
  let context: BrowserContext | undefined;
  try {
    context = await chromium.launchPersistentContext(directory, options);
    let page = await context.newPage();
    const external: string[] = [];
    context.on('request', request => { if (!request.url().startsWith(url) && !request.url().startsWith('data:')) external.push(request.url()); });
    await createProfile(page);
    await fillWorkout(page, 'Bieg w parku');
    await saveWorkout(page);
    await offlineReady(page);
    expect(external).toEqual([]);
    await context.close();

    context = await chromium.launchPersistentContext(directory, { ...options, offline: true });
    page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00')); await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await page.goto(url);
    await expect(page.getByRole('button', { name: 'Otwórz trening: Bieg w parku' })).toContainText('45 min');
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    await page.getByRole('button', { name: 'Otwórz trening: Bieg w parku' }).click();
    await expect(page.getByRole('region', { name: 'Szczegóły treningu', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Szczegóły treningu', exact: true }).getByText('Spokojnie, bez pośpiechu.')).toBeVisible();
    await expect(page.locator('.ed-facts > div').filter({ has: page.getByText('RPE sesji', { exact: true }) })).toContainText('0 / 10');
    await page.getByRole('button', { name: 'Edytuj trening', exact: true }).click();
    await page.getByLabel(/^Wykonany czas/).fill('60');
    await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
    await expect(page.getByRole('status')).toContainText('Trening zapisany');
    await context.close();

    context = await chromium.launchPersistentContext(directory, { ...options, offline: true });
    page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00')); await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await page.goto(url);
    await expect(page.getByRole('button', { name: 'Otwórz trening: Bieg w parku' })).toContainText('60 min');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('journal-offline-mobile.png'), fullPage: true });
    await settings(page);
    await expect(page.getByLabel('Bieganie', { exact: true })).toBeChecked();
    await expect(page.getByLabel('Jak się do Ciebie zwracać?')).toHaveValue('Marta');
    await page.getByRole('checkbox', { name: 'Historia treningów', exact: true }).uncheck();
    await page.getByRole('checkbox', { name: 'Okresy treningowe', exact: true }).check();
    await page.getByRole('button', { name: 'Zapisz ustawienia' }).click();
    await expect(page.getByRole('heading', { name: 'Inne', exact: true })).toBeVisible();
    await expect(page.locator('.more-tools').getByRole('button', { name: 'Historia treningów', exact: true })).toHaveCount(0);
    await page.getByText('Wszystkie narzędzia', { exact: false }).click();
    await expect(page.locator('.more-all').getByRole('button', { name: 'Historia treningów', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dzisiaj', exact: true })).toBeVisible();
    await history(page);
    await expect(page.getByRole('button', { name: 'Otwórz trening: Bieg w parku' })).toBeVisible();
    await settings(page);
    await page.getByRole('checkbox', { name: 'Historia treningów', exact: true }).check();
    await page.getByRole('button', { name: 'Zapisz ustawienia' }).click();
    await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Dzisiaj', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Otwórz trening: Bieg w parku' })).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: testInfo.outputPath('journal-offline-desktop.png'), fullPage: true });
  } finally {
    await context?.close();
    expect(dirname(resolve(directory))).toBe(resolve(tmpdir()));
    expect(basename(directory).startsWith('fieldwork-offline-')).toBe(true);
    await rm(directory, { recursive: true, force: true });
  }
});

test('two tabs preserve independent writes and reject a stale profile edit', async ({ browser }) => {
  const context = await browser.newContext(options);
  try {
    const first = await context.newPage();
    await createProfile(first);
    const second = await context.newPage();
    await second.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00')); await second.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await second.goto(url);
    await Promise.all([fillWorkout(first, 'Pierwszy wpis'), fillWorkout(second, 'Drugi wpis')]);
    await Promise.all([saveWorkout(first), saveWorkout(second)]);
    await first.reload();
    await expect(first.getByRole('button', { name: 'Otwórz trening: Pierwszy wpis' })).toBeVisible();
    await expect(first.getByRole('button', { name: 'Otwórz trening: Drugi wpis' })).toBeVisible();
    await settings(first);
    await settings(second);
    await second.getByLabel('Jak się do Ciebie zwracać?').fill('Nowsza nazwa');
    await second.getByRole('button', { name: 'Zapisz ustawienia' }).click();
    await expect(second.getByRole('status')).toContainText('Zapisano ustawienia');
    await first.getByLabel('Jak się do Ciebie zwracać?').fill('Stary formularz');
    await first.getByRole('button', { name: 'Zapisz ustawienia' }).click();
    await expect(first.getByRole('alert')).toContainText('Dane zostały zmienione');
    await first.reload();
    await settings(first);
    await expect(first.getByLabel('Jak się do Ciebie zwracać?')).toHaveValue('Nowsza nazwa');
  } finally { await context.close(); }
});

test('failed durable write keeps the form and never reports a saved workout', async ({ browser }) => {
  const context = await browser.newContext(options);
  try {
    const page = await context.newPage();
    await createProfile(page);
    await fillWorkout(page, 'Nieudany zapis');
    await page.evaluate(() => {
      IDBObjectStore.prototype.put = () => { throw new DOMException('Brak miejsca na zapis.', 'QuotaExceededError'); };
    });
    await page.getByRole('button', { name: 'Zapisz trening na urządzeniu' }).click();
    await expect(page.getByRole('alert')).toContainText('Brak miejsca');
    await expect(page.locator('.workout-editor').getByLabel(/^Nazwa /)).toHaveValue('Nieudany zapis');
    await expect(page.getByText('Trening zapisany na tym urządzeniu.')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dzisiaj', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Otwórz trening: Nieudany zapis' })).toHaveCount(0);
  } finally { await context.close(); }
});



