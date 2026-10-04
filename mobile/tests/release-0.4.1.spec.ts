import { expect, test, type Page } from '@playwright/test';

// 0.4.1 integration: the one-time quiz (reserve-v4) together with the check-in card and its day rule (checkin-hours).
test.use({ timezoneId: 'Europe/Warsaw' });

async function at(page: Page, localTime: string) {
  await page.clock.setFixedTime(new Date(localTime));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}
const mainNav = (page: Page, name: string) => page.getByRole('navigation', { name: 'Nawigacja główna' }).getByRole('button', { name, exact: true }).click();

test('the quiz opens once over Today, and after it the check-in card works, also after midnight and after a restart', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.setFixedTime(new Date('2026-10-06T01:30:00'));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Wydanie 0.4.1');
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  // The quiz takes the place of the screen: Today and its check-in card are not rendered underneath it.
  const quiz = page.locator('.training-quiz');
  await expect(quiz).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zapisz samopoczucie' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Nawigacja główna' })).toHaveCount(0);
  await quiz.locator('.quiz-skip').click();
  await expect(quiz).toHaveCount(0);

  // 01:30 on 6 October: the calendar day is the 6th, the check-in is the evening of the 5th.
  const todayView = page.locator('.today-view');
  await expect(todayView).toBeVisible();
  await expect(todayView).toContainText('Opcjonalnie · Wieczorem');
  await todayView.getByRole('button', { name: 'Zapisz samopoczucie' }).click();
  await expect(page.getByLabel('Pora dnia', { exact: true })).toHaveValue('evening');
  await expect(page.getByLabel('Data', { exact: true })).toHaveValue('2026-10-05');
  await page.getByRole('slider').first().focus(); await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
  await expect(page.locator('.checkin-done')).toContainText('Wieczorem · zobacz wpis');

  // The plan with its reserve bars renders with that entry present.
  await mainNav(page, 'Plan');
  await expect(page.locator('.reserve-day').first()).toBeVisible();
  await mainNav(page, 'Dzisiaj');

  // Restart: the skipped quiz does not come back and the entry is still the evening of the 5th.
  await page.reload();
  await expect(page.locator('.today-view')).toBeVisible();
  await expect(page.locator('.training-quiz')).toHaveCount(0);
  await expect(page.locator('.checkin-done')).toHaveCount(1);
  // 20:00 the same calendar day: a new evening check-in for the 6th is offered.
  await at(page, '2026-10-06T20:00:00');
  await expect(page.locator('.checkin-done')).toHaveCount(0);
  await page.locator('.today-view').getByRole('button', { name: 'Zapisz samopoczucie' }).click();
  await expect(page.getByLabel('Data', { exact: true })).toHaveValue('2026-10-06');
  await expect(page.locator('.wv-existing')).toHaveCount(0);
});

test('Settings show version 0.4.1', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Wersja');
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click();
  await mainNav(page, 'Inne');
  await page.getByRole('button', { name: 'Ustawienia', exact: false }).first().click();
  await expect(page.locator('.settings-privacy')).toContainText('0.4.1');
});
