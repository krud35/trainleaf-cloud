import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SnapshotData } from '../src/data/domain';

async function other(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Inne', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
}
async function backup(page: Page) {
  await other(page, 'Kopie i eksport');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportuj kopię JSON', exact: true }).click();
  return JSON.parse(await readFile((await (await downloading).path())!, 'utf8')) as SnapshotData & { version: number };
}
async function createProfile(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00'));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Test liści');
  await page.getByLabel('Trening siłowy', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await expect(page.getByRole('heading', { name: 'Dzisiaj', exact: true })).toBeVisible();
}
async function newSession(page: Page, title: string, type = 'strength') {
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Dzisiaj', exact: true }).click();
  await page.getByRole('button', { name: 'Zapisz trening', exact: true }).click();
  await page.locator('.workout-editor').getByLabel(/^Nazwa /).fill(title);
  await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption(type);
  await page.getByRole('combobox', { name: 'Sport', exact: true }).selectOption('strength');
}
async function chooseDate(page: Page, date: string) {
  const filters = page.locator('.planning-filters');
  if (await filters.getAttribute('open') === null) await filters.locator('summary').click();
  await filters.getByLabel('Przejdź do daty', { exact: true }).fill(date);
}

test('three exercise supersets preserve RIR, planned muscles and year boundary copies; imported future execution stays separate', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 850 });
  await createProfile(page);
  await newSession(page, 'Superseria przez granicę roku');
  await page.getByLabel('Data', { exact: true }).fill('2026-12-31');
  await expect(page.getByRole('button', { name: 'Zapisz trening na urządzeniu' })).toBeDisabled();
  await page.getByRole('button', { name: 'Zmień na zaplanowany', exact: true }).click();
  await page.getByText('Ćwiczenia (opcjonalnie)', { exact: true }).click();
  const main = page.getByRole('region', { name: 'Część główna', exact: true });
  for (const [index, query] of ['przysiad', 'martwy', 'wiosłowanie'].entries()) {
    await main.getByRole('button', { name: '+ Dodaj ćwiczenie', exact: true }).click();
    await page.getByLabel('Szukaj w bazie i własnych ćwiczeniach').fill(query);
    await page.locator('.we-picker ul button').first().click();
    const dose = page.locator('.we-item .we-dose').nth(index);
    await expect(dose.getByLabel('Serie', { exact: true })).toHaveValue('');
    await expect(dose.getByLabel('Powtórzenia', { exact: true })).toHaveValue('');
    await dose.getByLabel('Serie', { exact: true }).fill(String(3 - index));
    await dose.getByLabel('Powtórzenia', { exact: true }).fill('8');
    await dose.getByLabel('RIR', { exact: true }).fill(String(index));
  }
  await main.getByRole('button', { name: '+ Utwórz superserię', exact: true }).click();
  const choices = main.locator('.training-superset-picker input[type=checkbox]');
  await expect(choices).toHaveCount(3);
  for (let i = 0; i < 3; i++) await choices.nth(i).check();
  await main.getByRole('button', { name: 'Zapisz superserię', exact: true }).click();
  await page.getByLabel(/^Przerwa między ćwiczeniami superserii/).fill('20 s');
  await page.getByLabel(/^Przerwa po rundzie superserii/).fill('90 s');
  await page.getByText('Podgląd kolejności rund', { exact: true }).click();
  await expect(page.locator('.training-rounds')).toContainText('Runda 1: 1a → 1b → 1c');
  await expect(page.locator('.training-rounds')).toContainText('Runda 2: 1a → 1b');
  await expect(page.locator('.training-rounds')).toContainText('Runda 3: 1a');
  await page.locator('.we-dose').first().getByRole('button', { name: 'Wyjaśnienie: RIR', exact: true }).click();
  await expect(page.getByRole('note')).toContainText('prawidłową technikę');
  await page.getByRole('button', { name: 'Zamknij wyjaśnienie: RIR', exact: true }).click();
  await page.getByRole('button', { name: 'Zapisz plan na urządzeniu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Plan', exact: true }).click();
  await chooseDate(page, '2026-12-31');
  await expect(page.locator('.week-navigation')).toContainText('28 gru – 3 sty 2027');
  const muscles = page.getByRole('region', { name: 'Mapa mięśni tygodnia' });
  await expect(muscles).toBeVisible();
  await expect(muscles).toContainText(/nieustalon|niepełn|brak danych/i);
  await page.getByText('Kopiuj cały tydzień', { exact: true }).click();
  await page.getByLabel('Tydzień docelowy').fill('2027-01-04');
  await page.getByRole('button', { name: 'Przejrzyj kopiowanie', exact: true }).click();
  await expect(page.locator('.confirm-box')).toContainText('Skopiować 1 sesję');
  await page.getByRole('button', { name: 'Potwierdź kopię tygodnia', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Utworzono 1 nowy plan' })).toContainText('Utworzono 1 nowy plan');
  const saved = await backup(page);
  expect(saved.version).toBe(5);
  expect(saved.workouts).toHaveLength(2);
  for (const workout of saved.workouts) {
    expect(workout.supersets).toHaveLength(1);
    expect(workout.sections.main.map(item => item.planned.rir)).toEqual([0, 1, 2]);
    expect(workout.sections.main.map(item => item.planned.sets)).toEqual([3, 2, 1]);
    expect(new Set(workout.sections.main.map(item => item.supersetId)).size).toBe(1);
    expect(workout.sections.main.every(item => item.actual === null)).toBe(true);
    expect(workout.sections.main.every(item => item.muscleRoles === null)).toBe(true);
    expect(workout.sections.main.reduce((sum, item) => sum + (item.planned.sets ?? 0), 0)).toBe(6);
  }
  expect(saved.workouts.map(w => w.date).sort()).toEqual(['2026-12-31', '2027-01-07']);
  const imported = saved.workouts.find(w => w.date === '2026-12-31')!;
  imported.status = 'completed';
  imported.durationMinutes = 99;
  imported.rpe = 10;
  await page.getByLabel('Wybierz kopię JSON do przywrócenia').setInputFiles({ name: 'future-import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.getByLabel('Chcę zastąpić obecne dane zawartością tej kopii.').check();
  await page.getByRole('button', { name: 'Przywróć i zastąp dane', exact: true }).click();
  await other(page, 'Historia treningów');
  await page.getByText(/^Daty do sprawdzenia \(/).click();
  await expect(page.getByText('Zapis wykonania z przyszłą datą', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ankieta po treningu:/ })).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Postępy', exact: true }).click();
  await page.locator('.pv-filters summary').click();
  await page.getByLabel('Dzień odniesienia').fill('2026-12-31');
  const stats = page.getByRole('region', { name: 'Wykonana praca' });
  await expect(stats.locator('.pv-work-facts>div').filter({ hasText: /ukończon/ }).locator('strong')).toHaveText('0');
  await expect(stats.locator('.pv-work-facts>div').filter({ hasText: /z aktywnością/ }).locator('strong')).toHaveText('0');
  await stats.getByRole('button', { name: 'Wyjaśnienie: Zapisany czas', exact: true }).click();
  await expect(page.getByRole('note')).toContainText('0/0 sesji ma zapisany czas');
  await page.keyboard.press('Escape');
  await page.addStyleTag({ content: ':root { font-size:32px !important }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('future-progress-320-200.png'), fullPage: true });
});

test('post-workout zero differs from unanswered and recorded Trainleaf load survives restart', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 850 });
  await createProfile(page);
  await newSession(page, 'Siła z ankietą');
  await page.getByLabel(/^Wykonany czas/).fill('40');
  await page.getByLabel('Odczuwany wysiłek (RPE)', { exact: true }).selectOption('5');
  await page.getByRole('button', { name: 'Zapisz trening na urządzeniu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Po treningu', exact: true })).toBeVisible();
  for (const name of ['Zmęczenie wydolnościowe', 'Zmęczenie mięśniowe']) {
    const slider = page.getByRole('slider', { name, exact: true });
    await expect(slider).toHaveAttribute('aria-valuetext', 'Brak odpowiedzi');
    await slider.focus(); await slider.press('Home');
    await expect(slider).toHaveValue('0');
  }
  const satisfaction = page.getByRole('slider', { name: 'Satysfakcja z treningu', exact: true });
  await satisfaction.focus(); await satisfaction.press('End');
  await page.getByRole('button', { name: 'Usuń odpowiedź: Satysfakcja z treningu', exact: true }).click();
  await expect(satisfaction).toHaveAttribute('aria-valuetext', 'Brak odpowiedzi');
  await page.getByRole('button', { name: 'Zapisz ankietę', exact: true }).click();
  await newSession(page, 'Mentalny bez pomiarów', 'mental');
  await page.getByRole('button', { name: 'Zapisz trening na urządzeniu', exact: true }).click();
  await page.getByRole('button', { name: 'Pomiń na teraz', exact: true }).click();
  const saved = await backup(page);
  const strength = saved.workouts.find(w => w.title === 'Siła z ankietą')!;
  expect(strength.postWorkout.aerobicFatigue).toBe(0);
  expect(strength.postWorkout.muscularFatigue).toBe(0);
  expect(strength.postWorkout.satisfaction).toBeNull();
  expect(strength.loadCalculation?.version).toBe('trainleaf-v1');
  expect(strength.loadCalculation?.value).toBe(13);
  expect(saved.workouts.find(w => w.title === 'Mentalny bez pomiarów')?.loadCalculation?.value).toBe(0);
  await page.reload();
  await other(page, 'Historia treningów');
  await page.getByRole('button', { name: 'Ankieta po treningu: Siła z ankietą', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Zmęczenie wydolnościowe', exact: true })).toHaveValue('0');
  await expect(page.getByRole('slider', { name: 'Satysfakcja z treningu', exact: true })).toHaveAttribute('aria-valuetext', 'Brak odpowiedzi');
  await page.getByRole('button', { name: 'Pomiń na teraz', exact: true }).click();
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Postępy', exact: true }).click();
  await page.getByText('Obciążenie i objętość ćwiczeń', { exact: true }).click();
  const calculations = page.locator('.pv-calculations');
  await expect(calculations).toContainText('200 · 1/2 sesji');
  await expect(calculations).toContainText('13 · 2/2 sesji');
  await page.getByRole('button', { name: 'Wyjaśnienie: Wskaźnik Trainleaf', exact: true }).click();
  await expect(page.getByRole('note')).toContainText('nie jest naukowo zwalidowany');
  await page.screenshot({ path: testInfo.outputPath('survey-load-360.png'), fullPage: true });
});


