import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import type { SnapshotData } from '../src/data/domain';

const url = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4174/';
const options = { channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', viewport: { width: 360, height: 800 }, headless: true };
const exerciseName = 'Własny przysiad testowy';
const workoutName = 'Siła jesienna';
const templateName = 'Mój cały trening';

async function profile(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00')); await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await page.goto(url);
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Alicja');
  await page.getByLabel('Ultimate frisbee', { exact: true }).uncheck();
  await page.getByLabel('Bieganie', { exact: true }).check();
  await page.getByLabel('Trening siłowy', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await expect(page.getByRole('heading', { name: 'Dzisiaj' })).toBeVisible();
}
async function navigate(page: Page, name: 'Historia' | 'Plan' | 'Baza' | 'Postępy') {
  if (name === 'Baza' || name === 'Historia') { await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Inne', exact: true }).click(); await page.getByRole('button', { name: name === 'Baza' ? 'Baza ćwiczeń' : 'Historia treningów', exact: true }).click(); } else await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name, exact: true }).click();
}
async function offlineReady(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
    });
  });
}
async function removeProfileDirectory(directory: string) {
  // Only this test's direct child of the temporary directory may be removed.
  expect(dirname(resolve(directory))).toBe(resolve(tmpdir()));
  expect(basename(directory).startsWith('fieldwork-full-flow-')).toBe(true);
  await rm(directory, { recursive: true, force: true });
}
async function saveWorkout(page: Page, planned = false, editing = false, survey = !planned && !editing) {
  await page.getByRole('button', { name: editing ? 'Zapisz zmiany' : planned ? 'Zapisz plan na urządzeniu' : 'Zapisz trening na urządzeniu', exact: true }).click();
  if (survey) { await expect(page.getByRole('heading', { name: 'Po treningu', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Pomiń na teraz', exact: true }).click(); }
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Dzisiaj', exact: true }).click();
}
async function openWorkout(page: Page, title = workoutName) {
  await navigate(page, 'Historia');
  const pending = page.getByText(/^Bieżące i przyszłe plany \(/);
  if (await pending.count()) await pending.click();
  await page.getByRole('button', { name: `Otwórz trening: ${title}`, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Szczegóły treningu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edytuj trening', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edytuj trening' })).toBeVisible();
}
async function settings(page: Page) {
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Inne', exact: true }).click();
  await page.getByRole('button', { name: 'Ustawienia profilu', exact: true }).click();
}
async function downloadBackup(page: Page): Promise<SnapshotData & { version: number }> {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportuj kopię JSON' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  return JSON.parse(await readFile((await download.path())!, 'utf8'));
}
async function assertSessionSnapshot(page: Page) {
  await expect(page.locator('.we-item').getByText(`1. ${exerciseName}`, { exact: true })).toBeVisible();
  const plan = page.locator('.we-item .we-dose').first();
  await expect(plan.getByLabel('Serie', { exact: true })).toHaveValue('3');
  await expect(plan.getByLabel('Powtórzenia', { exact: true })).toHaveValue('8');
  await expect(plan.getByLabel('RIR', { exact: true })).toHaveValue('2');
  const actual = page.locator('.we-item-actual');
  await expect(actual.getByLabel('Serie', { exact: true })).toHaveValue('2');
  await expect(actual.getByLabel('Powtórzenia', { exact: true })).toHaveValue('6');
  await expect(actual.getByLabel('Ciężar (kg)', { exact: true })).toHaveValue('35');
  await expect(actual.getByLabel('Notatka do wykonania ćwiczenia')).toHaveValue('Słabsza ostatnia seria.');
  await page.getByText('Opis ćwiczenia', { exact: true }).click();
  await expect(page.getByText('Pierwotna instrukcja przysiadu.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Zostaw szkic i wróć' }).click();
}

test('complete personal training flow survives a real offline browser restart and a confirmed backup replacement', async ({}, testInfo) => {
  test.setTimeout(180_000);
  const directory = await mkdtemp(join(tmpdir(), 'fieldwork-full-flow-'));
  let context: BrowserContext | undefined;
  const external: string[] = [];
  const watchRequests = (current: BrowserContext) => current.on('request', request => {
    if (!request.url().startsWith(url) && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url());
  });
  try {
    context = await chromium.launchPersistentContext(directory, options);
    watchRequests(context);
    let page = await context.newPage();
    await profile(page);

    await navigate(page, 'Baza');
    await page.getByRole('button', { name: '+ Własne ćwiczenie' }).click();
    await page.getByLabel('Nazwa ćwiczenia', { exact: true }).fill(exerciseName);
    await page.getByLabel('Nazwa angielska (opcjonalnie)').fill('Personal test squat');
    await page.getByRole('textbox', { name: 'Instrukcja', exact: true }).fill('Pierwotna instrukcja przysiadu.');
    await page.getByRole('textbox', { name: 'Wskazówki techniczne', exact: true }).fill('Stabilny tułów.');
    await page.getByRole('button', { name: 'Zapisz ćwiczenie', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Ćwiczenie zapisano' })).toBeVisible();
    await page.getByLabel('Szukaj ćwiczenia').fill('PERSONAL TEST');
    await page.getByLabel('Typ ćwiczenia').selectOption('strength');
    await page.screenshot({ path: testInfo.outputPath('library-360px.png'), fullPage: true });
    await page.getByRole('button', { name: new RegExp(exerciseName) }).click();
    await page.getByRole('textbox', { name: 'Notatka', exact: true }).fill('Moja wskazówka do przysiadu.');
    await page.getByRole('button', { name: 'Zapisz notatkę' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Notatka zapisana' })).toBeVisible();
    await page.getByRole('button', { name: '← Biblioteka' }).click();
    await page.getByRole('button', { name: 'Szablony', exact: true }).click();
    await page.getByRole('button', { name: '+ Nowy szablon' }).click();
    await page.getByLabel('Nazwa szablonu').fill(templateName);
    await page.getByRole('combobox', { name: 'Sport', exact: true }).selectOption('strength');
    await page.getByLabel('Zakres szablonu').selectOption('whole');
    await page.getByLabel('Szukaj ćwiczenia').fill('Personal test squat');
    await page.getByLabel(/^Ćwiczenie \(/).selectOption({ label: `${exerciseName} · Personal test squat` });
    await page.getByRole('button', { name: 'Dodaj ćwiczenie', exact: true }).click();
    await page.locator('.library-template-item').getByLabel('Serie', { exact: true }).fill('3');
    await page.locator('.library-template-item').getByLabel('Powtórzenia', { exact: true }).fill('8');
    await page.locator('.library-template-item').getByLabel('RIR', { exact: true }).fill('2');
    await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('strength');
    await page.getByRole('button', { name: 'Zapisz szablon', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Szablon zapisano' })).toBeVisible();

    await navigate(page, 'Plan');
    await page.getByRole('button', { name: 'Dodaj okres', exact: true }).click();
    await page.getByLabel('Nazwa okresu').fill('Jesienny blok');
    await page.getByLabel('Początek okresu').fill('2026-10-01');
    await page.getByLabel('Koniec okresu').fill('2026-10-31');
    await page.getByLabel('Cel okresu').fill('Regularny powrót do siły.');
    await page.getByRole('button', { name: 'Zapisz okres' }).click();
    await page.getByText(/^Przegląd okresów \(/).click();
    await expect(page.getByRole('heading', { name: 'Jesienny blok' })).toBeVisible();

    await navigate(page, 'Baza');
    await page.getByRole('button', { name: 'Szablony', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(templateName) }).click();
    await page.getByRole('button', { name: 'Zastosuj do nowego treningu' }).click();
    await page.locator('.workout-editor').getByLabel(/^Nazwa /).fill(workoutName);
    await page.getByLabel('Data', { exact: true }).fill('2026-10-03');
    await page.getByLabel(/^Planowany czas/).fill('50');
    await page.getByLabel('Notatka do planu').fill('Plan z jesiennego bloku.');
    await expect(page.getByText('Okres: Jesienny blok', { exact: true })).toBeVisible();
    await saveWorkout(page, true);
    await expect(page.getByRole('button', { name: `Otwórz trening: ${workoutName}` })).toContainText('Plan');
    await openWorkout(page);
    await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('completed');
    await page.getByRole('button', { name: 'Wykonano zgodnie z planem' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Potwierdź', exact: true }).click();
    const actual = page.locator('.we-item-actual');
    await actual.getByLabel('Serie', { exact: true }).fill('2');
    await actual.getByLabel('Powtórzenia', { exact: true }).fill('6');
    await actual.getByLabel('Ciężar (kg)', { exact: true }).fill('35');
    await actual.getByLabel('Notatka do wykonania ćwiczenia').fill('Słabsza ostatnia seria.');
    await page.getByLabel(/^Wykonany czas/).fill('43');
    await page.getByLabel('Odczuwany wysiłek').selectOption('7');
    await page.getByRole('textbox', { name: 'Twoja notatka', exact: true }).fill('Plan i wykonanie pozostały osobno.');
    await page.screenshot({ path: testInfo.outputPath('workout-editor-360px.png'), fullPage: true });
    await saveWorkout(page, false, true, true);
    await page.screenshot({ path: testInfo.outputPath('journal-360px.png'), fullPage: true });

    await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
    await page.getByRole('combobox', { name: 'Pora dnia', exact: true }).selectOption('morning');
    await page.getByLabel('Data', { exact: true }).fill('2026-10-03');
    await page.getByLabel(/^Długość snu/).fill('8,25');
    await page.getByRole('slider', { name: /^Zmęczenie/ }).focus();
    await page.getByRole('slider', { name: /^Zmęczenie/ }).press('Home');
    await page.getByLabel(/^Twoja notatka/).fill('Odpoczynek po treningu.');
    await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
    await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Inne', exact: true }).click();
    await page.getByRole('button', { name: 'Samopoczucie', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Historia samopoczucia' })).toContainText('Zmęczenie: 0/10');

    await navigate(page, 'Postępy');
    await page.locator('.pv-filters summary').click();
    await page.getByLabel('Dzień odniesienia').fill('2026-10-03');
    await expect(page.getByRole('region', { name: 'Wykonana praca' })).toContainText('43');
    await page.getByRole('button', { name: 'Wyjaśnienie: Zapisany czas', exact: true }).click();
    await expect(page.getByRole('note')).toContainText('1/1 sesji ma zapisany czas');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Dodaj cel' }).click();
    await page.getByLabel('Nazwa celu').fill('Trzy treningi siły');
    await page.getByLabel('Sport celu').selectOption('strength');
    await page.getByLabel('Wartość docelowa').fill('3');
    await page.getByRole('button', { name: 'Zapisz cel' }).click();
    await page.locator('.pv-filters summary').click();
    await page.getByLabel('Dzień odniesienia').fill('2026-10-03');
    await expect(page.getByRole('article').filter({ hasText: 'Trzy treningi siły' })).toContainText('1 / 3 treningów');

    // Catalog and template edits must never rewrite the exercise snapshot in history.
    await navigate(page, 'Baza');
    await page.getByLabel('Szukaj ćwiczenia').fill(exerciseName);
    await page.getByRole('button', { name: new RegExp(exerciseName) }).click();
    await page.getByRole('button', { name: 'Edytuj ćwiczenie' }).click();
    await page.getByLabel('Nazwa ćwiczenia', { exact: true }).fill('Zmieniony przysiad katalogowy');
    await page.getByRole('textbox', { name: 'Instrukcja', exact: true }).fill('Nowy opis katalogu.');
    await page.getByRole('button', { name: 'Zapisz ćwiczenie', exact: true }).click();
    await page.getByRole('button', { name: 'Szablony', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(templateName) }).click();
    await page.locator('.library-template-item').getByLabel('Serie', { exact: true }).fill('9');
    await page.getByLabel('Nazwa szablonu').fill('Nowa wersja szablonu');
    await page.getByRole('button', { name: 'Zapisz szablon', exact: true }).click();
    await openWorkout(page);
    await assertSessionSnapshot(page);
    await offlineReady(page);
    expect(external).toEqual([]);
    await context.close();

    // launchPersistentContext starts a new browser process against the same profile.
    context = await chromium.launchPersistentContext(directory, { ...options, offline: true });
    watchRequests(context);
    page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00')); await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await page.goto(url);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    await openWorkout(page);
    await assertSessionSnapshot(page);
    await navigate(page, 'Postępy');
    await page.locator('.pv-filters summary').click();
    await page.getByLabel('Dzień odniesienia').fill('2026-10-03');
    await expect(page.getByRole('article').filter({ hasText: 'Trzy treningi siły' })).toContainText('1 / 3 treningów');
    await page.getByRole('button', { name: /^Twoje samopoczucie/ }).click();
    const sleep = page.locator('.wbt-metric').filter({ has: page.getByRole('heading', { name: /Długość snu/ }) });
    await expect(sleep.locator('.wbt-summary')).toContainText(/8,25\s*h/);
    await expect(sleep.locator('.wbt-summary')).toContainText('1 / 3 dni');
    const largeText = await page.addStyleTag({ content: ':root { font-size: 32px !important; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('progress-offline-360px-large-text.png'), fullPage: true });
    await largeText.evaluate(element => element.remove());

    // Removing a sport from preferences preserves its previously recorded history.
    await settings(page);
    await page.getByLabel('Trening siłowy', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Zapisz ustawienia' }).click();
    await openWorkout(page);
    await page.getByText('Dodatkowe szczegóły', { exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Sport', exact: true })).toHaveValue('strength');
    await page.getByRole('textbox', { name: 'Twoja notatka', exact: true }).fill('Historia pozostaje po zmianie sportów.');
    await saveWorkout(page, false, true);
    await page.getByRole('button', { name: 'Zapisz trening', exact: true }).click();
    await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('running');
    await page.getByLabel('Data', { exact: true }).fill('2026-10-03');
    await expect(page.getByLabel(/^Wykonany czas/)).toHaveValue('');
    await expect(page.getByLabel('Odczuwany wysiłek')).toHaveValue('');
    await saveWorkout(page);
    await expect(page.getByRole('button', { name: 'Otwórz trening: Bieganie', exact: true })).toBeVisible();
    await settings(page);
    const backup = await downloadBackup(page);
    expect(backup.version).toBe(5);
    expect(backup.events).toEqual([]);
    expect(backup.readinessReferences).toEqual([]);
    expect(backup.exerciseRoles).toEqual([]);
    expect(backup.muscleTargets).toEqual([]);
    expect(backup.profile?.sportIds).toEqual(['running']);
    expect(backup.workouts.filter(workout => !workout.deletedAt)).toHaveLength(2);
    const original = backup.workouts.find(workout => workout.title === workoutName)!;
    expect(original.sections.main[0].exercise.name).toBe(exerciseName);
    expect(original.sections.main[0].planned.sets).toBe(3);
    expect(original.sections.main[0].planned.rir).toBe(2);
    expect(original.sections.main[0].actual?.sets).toBe(2);
    expect(original.sections.main[0].actual?.kg).toBe(35);
    expect(backup.customExercises[0].name).toBe('Zmieniony przysiad katalogowy');
    expect(backup.templates[0].sections.main[0].planned.sets).toBe(9);
    expect(backup.exerciseNotes[0].notes).toBe('Moja wskazówka do przysiadu.');
    expect(backup.wellness[0].answers.fatigue).toBe(0);
    expect(backup.periods[0].name).toBe('Jesienny blok');
    const quick = backup.workouts.find(workout => workout.title === 'Bieganie')!;
    expect(quick.durationMinutes).toBeNull();
    expect(quick.rpe).toBeNull();
    expect(Object.values(quick.sections).flat()).toEqual([]);
    const csvDownloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Eksportuj CSV' }).click();
    const csvDownload = await csvDownloading;
    expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);
    const csv = await readFile((await csvDownload.path())!, 'utf8');
    expect(csv).toContain(workoutName);
    expect(csv).toContain('Słabsza ostatnia seria.');
    expect(csv).toContain('Odpoczynek po treningu.');

    await openWorkout(page);
    await page.locator('.workout-editor').getByLabel(/^Nazwa /).fill('Zmiana po eksporcie');
    await page.locator('.we-item-actual').getByLabel('Ciężar (kg)', { exact: true }).fill('99');
    await saveWorkout(page, false, true);
    await expect(page.getByRole('button', { name: 'Otwórz trening: Zmiana po eksporcie', exact: true })).toBeVisible();
    await settings(page);
    await page.getByLabel('Wybierz kopię JSON do przywrócenia').setInputFiles({ name: 'moja-kopia.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await expect(page.getByRole('heading', { name: /Podgląd kopii/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Przywróć i zastąp dane' })).toBeDisabled();
    await page.getByLabel('Chcę zastąpić obecne dane zawartością tej kopii.').check();
    await page.getByRole('button', { name: 'Przywróć i zastąp dane' }).click();
    await navigate(page, 'Historia');
    await expect(page.getByRole('button', { name: 'Otwórz trening: Zmiana po eksporcie', exact: true })).toHaveCount(0);
    await openWorkout(page);
    await assertSessionSnapshot(page);
    await settings(page);
    const restored = await downloadBackup(page);
    expect(restored.workouts.map(workout => ({ title: workout.title, sections: workout.sections, durationMinutes: workout.durationMinutes, notes: workout.notes }))).toEqual(backup.workouts.map(workout => ({ title: workout.title, sections: workout.sections, durationMinutes: workout.durationMinutes, notes: workout.notes })));
    expect(restored.templates[0].name).toBe('Nowa wersja szablonu');
    expect(restored.goals[0].name).toBe('Trzy treningi siły');
    expect(restored.wellness[0].answers.sleepHours).toBe(8.25);
    expect(external).toEqual([]);
  } finally {
    await context?.close();
    await removeProfileDirectory(directory);
  }
});

test('unfinished values persist as a draft across process restart without creating a completed session', async ({}) => {
  test.setTimeout(90_000);
  const directory = await mkdtemp(join(tmpdir(), 'fieldwork-full-flow-'));
  let context: BrowserContext | undefined;
  try {
    context = await chromium.launchPersistentContext(directory, options);
    let page = await context.newPage();
    await profile(page);
    await page.getByRole('button', { name: 'Zapisz trening', exact: true }).click();
    await page.locator('.workout-editor').getByLabel(/^Nazwa /).fill('Niepełny szkic');
    await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('strength');
    await page.getByRole('combobox', { name: 'Sport', exact: true }).selectOption('strength');
    await page.getByLabel(/^Wykonany czas/).fill('12,');
    await page.getByRole('textbox', { name: 'Twoja notatka', exact: true }).fill('Ta notatka nie może zniknąć.');
    await page.getByText('Ćwiczenia (opcjonalnie)', { exact: true }).click();
    await page.getByRole('region', { name: 'Część główna', exact: true }).getByRole('button', { name: '+ Dodaj ćwiczenie' }).click();
    await page.getByLabel('Szukaj w bazie i własnych ćwiczeniach').fill('przysiad');
    await page.locator('.we-picker ul button').first().click();
    await page.locator('.we-item .we-dose').first().getByLabel('Serie', { exact: true }).fill('3,5');
    await page.getByRole('button', { name: 'Zostaw szkic i wróć' }).click();
    await page.getByText(/^Szkice \(/).click();
    await expect(page.getByRole('button', { name: 'Wznów szkic: Niepełny szkic' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Otwórz trening: Niepełny szkic' })).toHaveCount(0);
    await offlineReady(page);
    await context.close();
    context = await chromium.launchPersistentContext(directory, { ...options, offline: true });
    page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00')); await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await page.goto(url);
    await page.getByText(/^Szkice \(/).click();
    await page.getByRole('button', { name: 'Wznów szkic: Niepełny szkic' }).click();
    await expect(page.getByLabel(/^Wykonany czas/)).toHaveValue('12,');
    await expect(page.getByRole('textbox', { name: 'Twoja notatka', exact: true })).toHaveValue('Ta notatka nie może zniknąć.');
    await expect(page.locator('.we-item .we-dose').first().getByLabel('Serie', { exact: true })).toHaveValue('3,5');
    await page.getByRole('button', { name: 'Zapisz trening na urządzeniu' }).click();
    await expect(page.getByRole('alert')).toContainText('serie');
    await page.getByRole('button', { name: 'Porzuć zmiany', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Potwierdź', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Wznów szkic: Niepełny szkic' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Otwórz trening: Niepełny szkic' })).toHaveCount(0);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  } finally {
    await context?.close();
    await removeProfileDirectory(directory);
  }
});




