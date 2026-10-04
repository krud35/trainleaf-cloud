import { expect, test, type Page } from '@playwright/test';

// Check-in windows by the device's local clock (0.4.1): morning 03:00-09:59, daytime 10:00-17:59, evening 18:00-02:59.
// The clock is frozen in the browser; the native Android clock and time-zone changes on a device are not covered here.
test.use({ timezoneId: 'Europe/Warsaw' });

const label = { morning: 'Rano', daytime: 'W ciągu dnia', evening: 'Wieczorem' } as const;
type Slot = keyof typeof label;

/** Freezes the local wall clock and lets the Today screen notice it, as it does when the app regains focus. */
async function at(page: Page, localTime: string) {
  await page.clock.setFixedTime(new Date(localTime));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}
async function createProfile(page: Page, localTime: string) {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.setFixedTime(new Date(localTime));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Pory dnia');
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await expect(page.locator('.today-view')).toBeVisible();
}
const mainNav = (page: Page, name: string) => page.getByRole('navigation', { name: 'Nawigacja główna' }).getByRole('button', { name, exact: true }).click();
const openCheckin = (page: Page) => page.locator('.today-view').getByRole('button', { name: 'Zapisz samopoczucie' }).click();
async function expectForm(page: Page, slot: Slot, date: string) {
  await expect(page.getByLabel('Pora dnia', { exact: true })).toHaveValue(slot);
  await expect(page.getByLabel('Data', { exact: true })).toHaveValue(date);
}

test('Today and the wellbeing form choose the same window at every boundary of the local clock', async ({ page }) => {
  test.setTimeout(120_000);
  await createProfile(page, '2026-10-05T12:00:00');
  const moments: [string, Slot, string][] = [
    ['2026-10-06T02:59:00', 'evening', '2026-10-05'], ['2026-10-06T03:00:00', 'morning', '2026-10-06'],
    ['2026-10-06T09:59:00', 'morning', '2026-10-06'], ['2026-10-06T10:00:00', 'daytime', '2026-10-06'],
    ['2026-10-06T17:59:00', 'daytime', '2026-10-06'], ['2026-10-06T18:00:00', 'evening', '2026-10-06'],
    ['2026-10-06T23:59:00', 'evening', '2026-10-06'], ['2026-10-07T00:00:00', 'evening', '2026-10-06'],
    ['2026-10-07T00:01:00', 'evening', '2026-10-06'],
  ];
  for (const [time, slot, date] of moments) {
    await at(page, time);
    await expect(page.locator('.today-view'), time).toContainText(`Opcjonalnie · ${label[slot]}`);
    await openCheckin(page);
    await expectForm(page, slot, date);
    await mainNav(page, 'Dzisiaj');
  }
  // The same rule from the standalone wellbeing screen, still at 00:01.
  await mainNav(page, 'Inne');
  await page.getByRole('button', { name: 'Samopoczucie', exact: false }).first().click();
  await page.getByRole('button', { name: 'Nowy check-in', exact: true }).first().click();
  await expectForm(page, 'evening', '2026-10-06');
});

test('daylight saving: the windows follow the wall clock on both changeover nights', async ({ page }) => {
  await createProfile(page, '2026-03-28T12:00:00');
  // 29 March 2026: 01:59 CET, one minute later it is 03:00 CEST.
  await at(page, '2026-03-29T00:59:00Z');
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.evening}`);
  await at(page, '2026-03-29T01:00:00Z');
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.morning}`);
  await openCheckin(page);
  await expectForm(page, 'morning', '2026-03-29');
  await mainNav(page, 'Dzisiaj');
  // 25 October 2026: the second 02:30 (CET) is still the evening window; 03:00 CET is morning.
  await at(page, '2026-10-25T01:30:00Z');
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.evening}`);
  await openCheckin(page);
  await expectForm(page, 'evening', '2026-10-24');
  await mainNav(page, 'Dzisiaj');
  await at(page, '2026-10-25T02:00:00Z');
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.morning}`);
});

test('past midnight the evening check-in still belongs to the previous day and saved entries keep their slot', async ({ page }) => {
  test.setTimeout(120_000);
  // 11:00 is now "daytime". An entry saved as "morning" (the window it had in 0.4.0) must stay a morning entry.
  await createProfile(page, '2026-10-05T11:00:00');
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.daytime}`);
  await openCheckin(page);
  await expectForm(page, 'daytime', '2026-10-05');
  await page.getByLabel('Pora dnia', { exact: true }).selectOption('morning');
  await page.getByLabel(/^Długość snu/).fill('7,5');
  await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.daytime}`);
  // 23:59: the evening check-in of 5 October.
  await at(page, '2026-10-05T23:59:00');
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.evening}`);
  await openCheckin(page);
  await expectForm(page, 'evening', '2026-10-05');
  const firstScale = page.getByRole('slider').first();
  await firstScale.focus(); await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
  await expect(page.locator('.checkin-done')).toContainText(`${label.evening} · zobacz wpis`);
  // 00:01: the calendar day is 6 October, but this is still the evening of 5 October, so the check-in stays done.
  await at(page, '2026-10-06T00:01:00');
  await expect(page.locator('.journal-heading')).toContainText('6 października');
  await expect(page.locator('.checkin-done')).toContainText(`${label.evening} · zobacz wpis`);
  await page.locator('.checkin-done').click();
  await expect(page.getByRole('heading', { name: 'Twój check-in' })).toBeVisible();
  await expect(page.locator('.ed-detail')).toContainText('5 paź');
  await mainNav(page, 'Dzisiaj');
  await at(page, '2026-10-06T02:59:00');
  await expect(page.locator('.checkin-done')).toHaveCount(1);
  // 03:00: the morning of 6 October starts.
  await at(page, '2026-10-06T03:00:00');
  await expect(page.locator('.checkin-done')).toHaveCount(0);
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.morning}`);
  // A check-in at 01:30 on 7 October is the evening of 6 October and does not use up the evening of 7 October.
  await at(page, '2026-10-07T01:30:00');
  await expect(page.locator('.today-view')).toContainText(`Opcjonalnie · ${label.evening}`);
  await openCheckin(page);
  await expectForm(page, 'evening', '2026-10-06');
  await expect(page.locator('.wv-existing')).toHaveCount(0);
  await page.getByRole('slider').first().focus(); await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
  await expect(page.locator('.checkin-done')).toContainText(`${label.evening} · zobacz wpis`);
  await at(page, '2026-10-07T20:00:00');
  await expect(page.locator('.checkin-done')).toHaveCount(0);
  await openCheckin(page);
  await expectForm(page, 'evening', '2026-10-07');
  await expect(page.locator('.wv-existing')).toHaveCount(0);
  // Saved entries: 6 October evening, 5 October evening and morning; none reclassified, also after a restart.
  await mainNav(page, 'Inne');
  await page.getByRole('button', { name: 'Samopoczucie', exact: false }).first().click();
  const records = page.locator('.wv-record');
  const saved = async () => (await records.allInnerTexts()).map(text => text.replace(/\s+/g, ' '));
  await expect(records).toHaveCount(3);
  const before = await saved();
  expect(before[0]).toContain(label.evening); expect(before[0]).toContain('6 paź');
  expect(before[1]).toContain(label.evening); expect(before[1]).toContain('5 paź');
  expect(before[2]).toContain(label.morning); expect(before[2]).toContain('5 paź');
  await page.reload();
  await mainNav(page, 'Inne');
  await page.getByRole('button', { name: 'Samopoczucie', exact: false }).first().click();
  await expect(records).toHaveCount(3);
  expect(await saved()).toEqual(before);
});
