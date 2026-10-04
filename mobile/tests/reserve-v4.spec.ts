// 0.4.1: onboarding quiz, adaptive reserve bars (plan-reserve-v2) and their explanation in the calendar legend.
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SnapshotData } from '../src/data/domain';

const fixture = path.resolve(import.meta.dirname, '../../tests/support/mobile-0.4-fixture');
const nav = (page: Page, name: string) => page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name, exact: true }).click();
async function backup(page: Page) {
  await nav(page, 'Inne');
  await page.getByRole('button', { name: 'Kopie i eksport', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportuj kopię JSON', exact: true }).click();
  return JSON.parse(await readFile((await (await downloading).path())!, 'utf8')) as SnapshotData & { version: number };
}
async function newProfile(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00'));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Rezerwa');
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
}
const quiz = (page: Page) => page.locator('.training-quiz');
async function answer(page: Page, option: string | RegExp) { await quiz(page).getByRole('radio', { name: option, exact: true }).check(); await quiz(page).getByRole('button', { name: 'Dalej', exact: true }).click(); }
async function fillQuiz(page: Page) {
  await answer(page, 'Od 2 do 5 lat'); await answer(page, 'Średnio zaawansowany'); await answer(page, '4'); await answer(page, '1 godzina');
  await quiz(page).getByRole('checkbox', { name: 'Drużynowy', exact: true }).check();
  await quiz(page).getByRole('checkbox', { name: 'Siłowy', exact: true }).check();
  await quiz(page).getByRole('radiogroup', { name: 'Odczuwana intensywność: Siłowy' }).getByRole('radio', { name: 'Ciężki', exact: true }).check();
  await quiz(page).getByRole('button', { name: 'Dalej', exact: true }).click();
  await quiz(page).getByRole('radio', { name: 'Trenuję regularnie', exact: true }).check();
  await quiz(page).getByRole('button', { name: 'Zapisz odpowiedzi', exact: true }).click();
}
/** Value of the bar in the week grid for a day of the visible week (0-1), read from the rendered element. */
async function bar(page: Page, day: number) {
  const tile = page.locator('.week-day').filter({ has: page.locator('.week-day-select strong', { hasText: new RegExp(`^${day}$`) }) });
  await expect(tile.locator('.reserve-day')).toHaveCount(1);
  return Number(await tile.locator('.reserve-day').getAttribute('data-reserve'));
}
async function goTo(page: Page, date: string) {
  await nav(page, 'Plan');
  if (!await page.getByLabel('Przejdź do daty', { exact: true }).isVisible()) await page.locator('.planning-filters > summary').click();
  await page.getByLabel('Przejdź do daty', { exact: true }).fill(date);
}
async function plan(page: Page, title: string, date: string, minutes: string) {
  await goTo(page, date);
  await page.getByRole('button', { name: 'Dodaj trening', exact: true }).click();
  await page.locator('.workout-editor').getByLabel(/^Nazwa /).fill(title);
  await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('strength');
  await page.getByLabel(/^Planowany czas/).fill(minutes);
  // No expected ratings are asked for or given.
  await page.getByRole('button', { name: 'Zapisz plan na urządzeniu', exact: true }).click();
  await expect(page.getByText('Trening zapisany.', { exact: true })).toBeVisible();
}

test('first start: the quiz follows the new profile, is stored with its raw answers and never returns; Settings can change it', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00'));
  await page.goto('/');
  await expect(quiz(page)).toHaveCount(0); // not before the profile exists
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Rezerwa');
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await expect(quiz(page).getByRole('heading', { level: 1 })).toHaveText('Od jak dawna trenujesz regularnie?');
  await expect(quiz(page)).toContainText('Sześć krótkich pytań, około minuty.');
  await expect(quiz(page)).not.toContainText('Nowość w tej wersji');
  await expect(quiz(page).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.getByRole('navigation', { name: 'Nawigacja główna', exact: true })).toHaveCount(0);
  // A question must be answered before going on; going back keeps the answer.
  await expect(quiz(page).getByRole('button', { name: 'Dalej', exact: true })).toBeDisabled();
  await answer(page, 'Od 2 do 5 lat');
  await expect(quiz(page).getByRole('heading', { level: 1 })).toBeFocused();
  await quiz(page).getByRole('button', { name: 'Wstecz', exact: true }).click();
  await expect(quiz(page).getByRole('radio', { name: 'Od 2 do 5 lat', exact: true })).toBeChecked();
  await fillQuiz(page);
  await expect(quiz(page)).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Zapisano odpowiedzi.');
  await expect(page.getByRole('navigation', { name: 'Nawigacja główna', exact: true })).toBeVisible();

  const saved = await backup(page);
  expect(saved.version).toBe(5);
  expect(saved.trainingQuizzes).toHaveLength(1);
  expect(saved.trainingQuizzes[0]).toMatchObject({ quizVersion: 1, status: 'completed', answers: { experience: '2to5y', level: 'intermediate', sessionsPerWeek: 4, typicalMinutes: 60,
    kinds: [{ type: 'strength', intensity: 'hard' }, { type: 'team', intensity: 'moderate' }], rhythm: 'steady' } });
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Nawigacja główna', exact: true })).toBeVisible();
  await expect(quiz(page)).toHaveCount(0);

  // Later entry in Settings: the answers are prefilled and can be changed or left.
  await page.locator('.app-settings').click();
  const card = page.locator('.quiz-settings');
  await expect(card).toContainText('Uzupełniono');
  await card.getByRole('button', { name: 'Zmień odpowiedzi', exact: true }).click();
  await expect(quiz(page)).toContainText('Możesz je zmienić w każdej chwili');
  await expect(quiz(page).getByRole('radio', { name: 'Od 2 do 5 lat', exact: true })).toBeChecked();
  await quiz(page).getByRole('button', { name: 'Zamknij bez zmian', exact: true }).click();
  await expect(quiz(page)).toHaveCount(0);
  await page.locator('.quiz-settings').getByRole('button', { name: 'Zmień odpowiedzi', exact: true }).click();
  await quiz(page).getByRole('radio', { name: 'Ponad 5 lat', exact: true }).check();
  for (let step = 0; step < 5; step++) await quiz(page).getByRole('button', { name: 'Dalej', exact: true }).click();
  await quiz(page).getByRole('button', { name: 'Zapisz odpowiedzi', exact: true }).click();
  const changed = await backup(page);
  expect(changed.trainingQuizzes[0].id).toBe(saved.trainingQuizzes[0].id);
  expect(changed.trainingQuizzes[0].answers?.experience).toBe('over5y');
});

test('skipping is remembered after a restart, gives a cautious estimate of lower confidence and can be completed later', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await newProfile(page);
  await expect(quiz(page)).toContainText('Możesz uzupełnić później w Ustawieniach.');
  await quiz(page).getByRole('button', { name: 'Pomiń na razie', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Pominięto. Ankietę możesz uzupełnić w Ustawieniach.');
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Nawigacja główna', exact: true })).toBeVisible();
  await expect(quiz(page)).toHaveCount(0);
  expect((await backup(page)).trainingQuizzes[0]).toMatchObject({ status: 'skipped', answers: null, quizVersion: 1 });
  // The forecast works at once on an empty history: a full bar, marked as an estimate from less data.
  await nav(page, 'Plan');
  const today = page.locator('.week-day.selected .reserve-day');
  await expect(today).toHaveAttribute('data-reserve', '1.000');
  await expect(today).toHaveAttribute('data-confidence', 'lower');
  await expect(today).toHaveAttribute('aria-label', /Szacowana rezerwa w planie: duża, szacunek o niższej pewności\.$/);
  await expect(page.locator('.planning-readiness-slot .reserve-caption')).toHaveText('Szacowana rezerwa: duża · niższa pewność');
  await expect(page.getByText('Niepełne dane')).toHaveCount(0);
  await plan(page, 'Bez ankiety', '2026-10-05', '60');
  await goTo(page, '2026-10-05');
  expect(await bar(page, 5)).toBeLessThan(1);

  await page.locator('.app-settings').click();
  await expect(page.locator('.quiz-settings')).toContainText('Pominięto. Używamy ostrożnych ustawień początkowych.');
  await page.locator('.quiz-settings').getByRole('button', { name: 'Uzupełnij ankietę', exact: true }).click();
  await fillQuiz(page);
  await expect(page.locator('.quiz-settings')).toContainText('Uzupełniono');
  await goTo(page, '2026-10-05');
  await expect(page.locator('.week-day.selected .reserve-day')).toHaveAttribute('data-confidence', 'normal');
});

test('an existing 0.4.0 installation migrates in the browser, keeps its data and is asked once to complete the profile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+02:00'));
  // The released schema 7 database, written by the 0.4.0 code, is placed where the preview keeps its SQLite file.
  const bytes = [...await readFile(path.join(fixture, 'released-v7.sqlite'))];
  await page.goto('/licenses/three.txt');
  await page.evaluate(data => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('fieldwork-mobile-preview', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('snapshots');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { const tx = request.result.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').put(new Uint8Array(data), 'main'); tx.oncomplete = () => { request.result.close(); resolve(); }; tx.onerror = () => reject(tx.error); };
  }), bytes);
  await page.goto('/');
  // No new profile form: the one-time completion opens on top of the existing profile.
  await expect(page.getByRole('button', { name: 'Utwórz profil lokalny' })).toHaveCount(0);
  await expect(quiz(page)).toContainText('Nowość w tej wersji');
  await expect(quiz(page)).toContainText('Twój profil i dane pozostają bez zmian.');
  await quiz(page).getByRole('button', { name: 'Pomiń na razie', exact: true }).click();
  await expect(quiz(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Nawigacja główna', exact: true })).toBeVisible();
  await expect(quiz(page)).toHaveCount(0);

  const original = JSON.parse(await readFile(path.join(fixture, 'backup-v4.json'), 'utf8')) as SnapshotData;
  const migrated = await backup(page);
  expect(migrated.version).toBe(5);
  expect(migrated.profile?.displayName).toBe('Zażółć 0.4.0');
  expect(migrated.workouts).toEqual(original.workouts);
  expect(migrated.wellness).toEqual(original.wellness);
  expect(migrated.readinessReferences).toEqual(original.readinessReferences); // old reference kept and still exported
  expect(migrated.trainingQuizzes[0]).toMatchObject({ status: 'skipped' });
  // The bars work on the migrated history without any reference: the planned Tuesday session shortens its own day.
  await goTo(page, '2026-10-06');
  expect(await bar(page, 6)).toBeLessThan(await bar(page, 5));
  await expect(page.getByRole('button', { name: 'Ustaw punkt odniesienia', exact: true })).toHaveCount(0);
});

test('importing an older backup offers the quiz once; a backup with the answer does not', async ({ page, browser }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+02:00'));
  await page.goto('/');
  const restore = async (target: Page, file: string | { name: string; mimeType: string; buffer: Buffer }) => {
    await target.getByLabel('Wybierz kopię JSON do przywrócenia').setInputFiles(file);
    await target.getByLabel('Chcę zastąpić obecne dane zawartością tej kopii.').check();
    await target.getByRole('button', { name: 'Przywróć i zastąp dane', exact: true }).click();
  };
  await restore(page, path.join(fixture, 'backup-v4.json'));
  await expect(quiz(page)).toBeVisible();
  await fillQuiz(page);
  const withAnswers = await backup(page);
  expect(withAnswers.readinessReferences).toHaveLength(1);
  expect(withAnswers.trainingQuizzes[0].status).toBe('completed');
  // The same device imports the older backup again: the answer is kept, no quiz.
  await restore(page, path.join(fixture, 'backup-v4.json'));
  await expect(page.getByText('Przywrócono dane z kopii.', { exact: true })).toBeVisible();
  await expect(quiz(page)).toHaveCount(0);
  expect((await backup(page)).trainingQuizzes[0].answers).toEqual(withAnswers.trainingQuizzes[0].answers);
  // A fresh browser imports the new backup: identifiers and the answer arrive together, no quiz.
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, viewport: { width: 360, height: 800 } });
  await context.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl'));
  const fresh = await context.newPage();
  await fresh.goto('/');
  await expect(fresh.getByRole('button', { name: 'Utwórz profil lokalny' })).toBeVisible();
  await restore(fresh, { name: 'new.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(withAnswers)) });
  await expect(fresh.getByText('Przywrócono dane z kopii.', { exact: true })).toBeVisible();
  await expect(quiz(fresh)).toHaveCount(0);
  const again = await backup(fresh);
  expect(again.trainingQuizzes[0].id).toBe(withAnswers.trainingQuizzes[0].id);
  expect(again.trainingQuizzes[0].answers).toEqual(withAnswers.trainingQuizzes[0].answers);
  expect(again.workouts.map(workout => workout.id).sort()).toEqual(withAnswers.workouts.map(workout => workout.id).sort());
  expect(again.readinessReferences.map(reference => reference.id)).toEqual(withAnswers.readinessReferences.map(reference => reference.id));
  await context.close();
});

test('bars: a new session changes its own day and the next ones, two count more, and moving, shortening and deleting update at once', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 360, height: 850 });
  await newProfile(page);
  await fillQuiz(page);
  await goTo(page, '2026-10-06');
  // The bars stay in their place: the last element of every day column of the week grid.
  expect(await page.locator('.week-day').evaluateAll(days => days.every(day => day.lastElementChild?.classList.contains('planning-day-readiness') && !!day.lastElementChild.querySelector('.reserve-day')))).toBe(true);
  for (const day of [5, 6, 7, 8]) expect(await bar(page, day)).toBe(1);
  await expect(page.locator('.week-day.selected .reserve-day')).toHaveAttribute('data-level', 'high');
  await expect(page.locator('.forecast-panel')).toHaveCount(0);

  await plan(page, 'Siła A', '2026-10-06', '90');
  await goTo(page, '2026-10-06');
  const one = { mon: await bar(page, 5), tue: await bar(page, 6), wed: await bar(page, 7), thu: await bar(page, 8) };
  expect(one.mon).toBe(1);                                   // earlier days are untouched
  expect(one.tue).toBeLessThan(1);                           // the day of the session itself
  expect(one.wed).toBeLessThan(1); expect(one.wed).toBeGreaterThan(one.tue); // the next day, already fading
  expect(one.thu).toBeGreaterThan(one.wed);

  await plan(page, 'Siła B', '2026-10-06', '90');
  await goTo(page, '2026-10-06');
  const two = { tue: await bar(page, 6), wed: await bar(page, 7) };
  expect(two.tue).toBeLessThan(one.tue); expect(two.wed).toBeLessThan(one.wed);
  await expect(page.locator('.week-day.selected .reserve-day')).not.toHaveAttribute('data-level', 'high');
  await page.screenshot({ path: testInfo.outputPath('bars-two-sessions-360.png'), fullPage: true });

  // Move B to Sunday: Tuesday returns to the value with one session, and Monday of the next week carries Sunday.
  const sessionB = page.locator('.planning-section-list > li').filter({ hasText: 'Siła B' });
  await sessionB.getByText('Przenieś sesję', { exact: true }).click();
  await sessionB.getByLabel('Nowa data sesji').fill('2026-10-11');
  await sessionB.getByRole('button', { name: /^Przenieś na / }).click();
  const move = page.getByRole('dialog', { name: 'Przenieś trening', exact: true });
  await expect(move.locator('.reserve-compare')).toHaveCount(4);
  await move.getByRole('button', { name: 'Potwierdź przeniesienie', exact: true }).click();
  await expect(move).not.toBeVisible();
  await goTo(page, '2026-10-06');
  expect(await bar(page, 6)).toBe(one.tue);
  expect(await bar(page, 11)).toBeLessThan(1);
  expect(await bar(page, 10)).toBeGreaterThan(await bar(page, 11));
  await page.getByRole('button', { name: 'Następny tydzień', exact: true }).click();
  const monday = await bar(page, 12);
  expect(monday).toBeLessThan(1);                             // Sunday passes into the next week
  expect(await bar(page, 13)).toBeGreaterThan(monday);        // and fades

  // Shorten A from 90 to 30 minutes.
  await goTo(page, '2026-10-06');
  await page.getByRole('button', { name: /Siła A/ }).last().click();
  await page.getByRole('button', { name: 'Edytuj trening', exact: true }).click();
  await page.getByLabel(/^Planowany czas/).fill('30');
  await page.getByRole('button', { name: 'Zapisz zmiany', exact: true }).click();
  await goTo(page, '2026-10-06');
  const shorter = await bar(page, 6);
  expect(shorter).toBeGreaterThan(one.tue); expect(shorter).toBeLessThan(1);

  // Delete A: the day is a full bar again.
  await page.getByRole('button', { name: /Siła A/ }).last().click();
  await page.getByRole('button', { name: 'Edytuj trening', exact: true }).click();
  await page.getByText('Kopiowanie i usuwanie', { exact: true }).click();
  await page.getByRole('button', { name: 'Usuń trening', exact: true }).click();
  await page.locator('.we-confirm .primary').click();
  await goTo(page, '2026-10-06');
  expect(await bar(page, 6)).toBe(1);
  // The month view uses the same bars.
  await page.getByRole('button', { name: 'Miesiąc', exact: true }).click();
  await expect(page.locator('.planning-month-day .reserve-day').first()).toBeVisible();
  expect(await page.locator('.planning-month-day .reserve-day').count()).toBeGreaterThanOrEqual(28);
});

const languages = {
  en: { name: 'English', create: 'Create local profile', nameLabel: 'What should we call you?', plan: 'Plan', nav: 'Main navigation', legend: 'Calendar symbols', title: 'Reserve bars', details: 'Technical details', question: 'How long have you been training regularly?', promise: 'not a promise' },
  pl: { name: 'Polski', create: 'Utwórz profil lokalny', nameLabel: 'Jak się do Ciebie zwracać?', plan: 'Plan', nav: 'Nawigacja główna', legend: 'Oznaczenia kalendarza', title: 'Paski rezerwy', details: 'Szczegóły techniczne', question: 'Od jak dawna trenujesz regularnie?', promise: 'nie jest obietnicą' },
  fr: { name: 'Français', create: 'Créer le profil local', nameLabel: 'Comment vous appeler ?', plan: 'Plan', nav: 'Navigation principale', legend: 'Symboles du calendrier', title: 'Barres de réserve', details: 'Détails techniques', question: 'Depuis combien de temps vous entraînez-vous régulièrement ?', promise: 'ne promet pas' },
  es: { name: 'Español', create: 'Crear perfil local', nameLabel: '¿Cómo quieres que te llamemos?', plan: 'Plan', nav: 'Navegación principal', legend: 'Símbolos del calendario', title: 'Barras de reserva', details: 'Detalles técnicos', question: '¿Desde cuándo entrenas con regularidad?', promise: 'no promete' },
} as const;
for (const code of ['en', 'pl', 'fr', 'es'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`${code} ${theme}: quiz and legend fit 320 px and 200% text without horizontal overflow or untranslated keys`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const copy = languages[code];
    const fits = async (label: string) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: horizontal overflow`).toBe(true);
    await page.setViewportSize({ width: 320, height: 700 });
    await page.addInitScript(([language, appearance]) => { localStorage.setItem('trainleaf-language', language); localStorage.setItem('trainleaf-theme', appearance); }, [code, theme]);
    await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.getByLabel(copy.nameLabel).fill('Alex');
    await page.getByRole('button', { name: copy.create }).click();
    await expect(quiz(page).getByRole('heading', { level: 1 })).toHaveText(copy.question);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    // Every question at 320 px and 200%: the first option is chosen, then the next screen.
    for (let step = 0; step < 6; step++) {
      await expect(quiz(page).getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(step + 1));
      await fits(`${code} ${theme} quiz step ${step + 1}`);
      expect(await quiz(page).innerText()).not.toMatch(/\b(quiz|reserve)\.[a-zA-Z_]+/);
      const option = quiz(page).locator(step === 4 ? 'input[type=checkbox]' : 'input[type=radio]').first();
      await option.scrollIntoViewIfNeeded(); await option.check();
      if (step === 4) { await expect(quiz(page).getByRole('radiogroup')).toHaveCount(1); await fits(`${code} ${theme} quiz intensity`); await page.screenshot({ path: testInfo.outputPath(`quiz-${code}-${theme}-320-200pct.png`), fullPage: true }); }
      // The choice and the primary button are large enough to tap.
      const submit = quiz(page).locator('button[type=submit]');
      expect((await submit.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await submit.click();
    }
    await expect(quiz(page)).toHaveCount(0);
    await page.getByRole('navigation', { name: copy.nav }).getByRole('button', { name: copy.plan, exact: true }).click();
    await page.getByRole('button', { name: copy.legend, exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: copy.legend, exact: true });
    await expect(dialog.getByRole('heading', { name: copy.title, exact: true })).toBeVisible();
    await expect(dialog.locator('.reserve-samples li')).toHaveCount(4);
    await expect(dialog).toContainText(copy.promise);
    await dialog.getByText(copy.details, { exact: true }).click();
    await expect(dialog).toContainText('plan-reserve-v2');
    expect(await dialog.innerText()).not.toMatch(/\b(quiz|reserve)\.[a-zA-Z_]+/);
    // The dialog scrolls vertically only and stays inside the viewport.
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1 && element.getBoundingClientRect().right <= innerWidth + 1 && element.getBoundingClientRect().left >= -1)).toBe(true);
    await fits(`${code} ${theme} legend`);
    // The three bar colours differ from each other and from the rail in this appearance.
    const colours = await dialog.locator('.reserve-samples .reserve-track').evaluateAll(tracks => tracks.slice(0, 3).map(track => [getComputedStyle(track.firstElementChild!).backgroundColor, getComputedStyle(track).backgroundColor]));
    expect(new Set(colours.map(([fill]) => fill)).size).toBe(3);
    for (const [fill, rail] of colours) expect(fill).not.toBe(rail);
    await dialog.screenshot({ path: testInfo.outputPath(`legend-${code}-${theme}-320-200pct.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
}
