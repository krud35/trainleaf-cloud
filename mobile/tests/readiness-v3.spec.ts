import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SnapshotData } from '../src/data/domain';

async function more(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Inne', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
}
async function backup(page: Page) {
  await more(page, 'Kopie i eksport');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportuj kopię JSON', exact: true }).click();
  return JSON.parse(await readFile((await (await downloading).path())!, 'utf8')) as SnapshotData & { version: number };
}
async function createProfile(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00+02:00'));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Plan bez zgadywania');
  await page.getByLabel('Ultimate frisbee', { exact: true }).uncheck();
  await page.getByLabel('Trening siłowy', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
}
async function editPlan(page: Page, title: string) {
  await more(page, 'Historia treningów');
  await page.getByText(/^Bieżące i przyszłe plany \(/).click();
  await page.getByRole('button', { name: `Otwórz trening: ${title}`, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Szczegóły treningu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edytuj trening', exact: true }).click();
}
async function rating(page: Page, name: string, value: number) {
  const slider = page.getByRole('slider', { name, exact: true });
  await slider.focus(); await slider.press('Home');
  for (let index = 0; index < value; index++) await slider.press('ArrowRight');
}

test('planned ratings, raw draft and explicit muscle snapshots stay separate from actual answers; a previewed move changes only the date', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 360, height: 850 });
  await createProfile(page);
  await page.getByRole('button', { name: 'Zapisz trening', exact: true }).click();
  await page.locator('.workout-editor').getByLabel(/^Nazwa /).fill('Plan z jawnymi rolami');
  await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('strength');
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('planned');
  await page.getByLabel('Data', { exact: true }).fill('2026-10-05');
  await page.getByLabel(/^Planowany czas/).fill('40');
  for (const name of ['Oczekiwane zmęczenie wydolnościowe', 'Oczekiwane zmęczenie mięśniowe']) await expect(page.getByRole('slider', { name, exact: true })).toHaveAttribute('aria-valuetext', 'Brak odpowiedzi');
  await rating(page, 'Oczekiwane zmęczenie wydolnościowe', 0);
  await page.getByText('Ćwiczenia (opcjonalnie)', { exact: true }).click();
  await page.getByRole('region', { name: 'Część główna', exact: true }).getByRole('button', { name: '+ Dodaj ćwiczenie', exact: true }).click();
  await page.getByLabel('Szukaj w bazie i własnych ćwiczeniach').fill('przysiad');
  await page.locator('.we-picker ul button').first().click();
  await page.locator('.we-item .we-dose').first().getByLabel('Serie', { exact: true }).fill('3,5');
  await page.locator('.muscle-roles-editor summary').click();
  await page.getByRole('combobox', { name: /^Dodaj mięsień:/ }).selectOption('quads');
  await page.getByRole('combobox', { name: /^Dodaj rolę:/ }).selectOption('direct');
  await page.getByRole('button', { name: 'Dodaj rolę mięśnia', exact: true }).click();
  await page.getByRole('combobox', { name: /^Dodaj mięsień:/ }).selectOption('glutes');
  await page.getByRole('combobox', { name: /^Dodaj rolę:/ }).selectOption('indirect');
  await page.getByRole('button', { name: 'Dodaj rolę mięśnia', exact: true }).click();
  await page.getByRole('button', { name: 'Zostaw szkic i wróć', exact: true }).click();
  const draftBackup = await backup(page);
  expect(draftBackup.workouts).toEqual([]);
  const raw = draftBackup.drafts[0].raw.form as { plannedFatigue: { aerobicFatigue: string; muscularFatigue: string }; sections: { main: { planned: { sets: string }; muscleRoles: unknown }[] } };
  expect(raw.plannedFatigue).toEqual({ aerobicFatigue: '0', muscularFatigue: '' });
  expect(raw.sections.main[0].planned.sets).toBe('3,5');
  expect(raw.sections.main[0].muscleRoles).toEqual([{ muscle: 'quads', role: 'direct' }, { muscle: 'glutes', role: 'indirect' }]);
  await page.reload();
  await page.getByText(/^Szkice \(/).click();
  await page.getByRole('button', { name: 'Wznów szkic: Plan z jawnymi rolami', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Oczekiwane zmęczenie wydolnościowe', exact: true })).toHaveValue('0');
  await expect(page.getByRole('slider', { name: 'Oczekiwane zmęczenie mięśniowe', exact: true })).toHaveAttribute('aria-valuetext', 'Brak odpowiedzi');
  await expect(page.locator('.we-item .we-dose').first().getByLabel('Serie', { exact: true })).toHaveValue('3,5');
  await page.locator('.we-item .we-dose').first().getByLabel('Serie', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Zapisz plan na urządzeniu', exact: true }).click();
  const unanswered = await backup(page);
  expect(unanswered.workouts[0].plannedFatigue).toEqual({ aerobicFatigue: 0, muscularFatigue: null });
  expect(unanswered.workouts[0].plannedLoadCalculation).toBeNull();
  expect(unanswered.workouts[0].postWorkout.aerobicFatigue).toBeNull();
  expect(unanswered.workouts[0].postWorkout.muscularFatigue).toBeNull();
  expect(unanswered.workouts[0].sections.main[0].actual).toBeNull();
  await editPlan(page, 'Plan z jawnymi rolami');
  await rating(page, 'Oczekiwane zmęczenie mięśniowe', 5);
  await page.getByRole('button', { name: 'Zapisz zmiany', exact: true }).click();
  const estimated = await backup(page);
  expect(estimated.workouts[0].plannedLoadCalculation?.value).toBeGreaterThan(0);
  expect(estimated.workouts[0].loadCalculation).toBeNull();
  expect(estimated.workouts[0].sections.main[0].muscleRoles).toEqual(raw.sections.main[0].muscleRoles);

  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ustaw punkt odniesienia', exact: true })).toHaveCount(0);
  await expect(page.locator('.forecast-panel')).toHaveCount(0);
  await expect(page.getByText('Punkt odniesienia', { exact: false })).toHaveCount(0);
  expect((await backup(page)).readinessReferences).toEqual([]);
  await page.getByRole('navigation', { name: 'Nawigacja główna', exact: true }).getByRole('button', { name: 'Plan', exact: true }).click();
  await page.locator('.planning-filters > summary').click();
  await page.getByLabel('Przejdź do daty', { exact: true }).fill('2026-10-05');
  await page.getByText('Przenieś sesję', { exact: true }).click();
  await page.getByLabel('Nowa data sesji').fill('2026-10-06');
  await page.getByRole('button', { name: /^Przenieś na / }).click();
  const move = page.getByRole('dialog', { name: 'Przenieś trening', exact: true });
  await expect(move).toContainText('Przed');
  await expect(move).toContainText('Po przesunięciu');
  await expect(move).toContainText('Szacowana rezerwa dni, na które wpływa przeniesienie');
  await expect(move).not.toContainText('punkt odniesienia');
  // Monday loses the session, Tuesday gains it and Wednesday still carries it: the bar of the day itself moves.
  const bars = async (label: string) => Object.fromEntries(await move.locator('.reserve-compare').evaluateAll((sections, column) => sections.map(section => [section.querySelector('strong')!.textContent, Number(section.querySelectorAll<HTMLElement>('.reserve-day')[column].dataset.reserve)]), label === 'before' ? 0 : 1)) as Record<string, number>;
  const before = Object.values(await bars('before')), after = Object.values(await bars('after'));
  expect(before.length).toBe(3);
  expect(before[0]).toBeLessThan(1); expect(after[0]).toBe(1);
  expect(after[1]).toBeLessThan(before[1]); expect(after[2]).toBeLessThan(before[2]);
  await page.screenshot({ path: testInfo.outputPath('move-preview-360.png'), fullPage: true });
  await move.getByRole('button', { name: 'Potwierdź przeniesienie', exact: true }).click();
  await expect(move).not.toBeVisible();
  const moved = await backup(page);
  expect(moved.workouts[0].date).toBe('2026-10-06');
  expect(moved.workouts[0].plannedFatigue).toEqual({ aerobicFatigue: 0, muscularFatigue: 5 });
  expect(moved.workouts[0].plannedLoadCalculation).toEqual(estimated.workouts[0].plannedLoadCalculation);
  expect(moved.workouts[0].sections.main[0].muscleRoles).toEqual(raw.sections.main[0].muscleRoles);
  expect(moved.readinessReferences).toEqual([]);
  expect(moved.version).toBe(5);
});
