import { test, expect, type Page } from '@playwright/test';

async function planningDate(page: Page) {
  const filters = page.locator('.planning-filters');
  if (await filters.getAttribute('open') === null) await filters.locator('summary').click();
  return filters.getByLabel('Przejdź do daty', { exact: true });
}

test('planning month/year, Monday previous week, inclusive events and accessible legend at 360px and 200%', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 360, height: 900 });
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+02:00'));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Kalendarz test');
  await page.getByLabel('Trening siłowy', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await expect(page.locator('.week-overview-today .planning-day-details')).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Nawigacja główna' }).getByRole('button', { name: 'Plan', exact: true }).click();
  await page.getByRole('button', { name: 'Poprzedni tydzień', exact: true }).click();
  await expect(page.locator('.week-navigation')).toContainText('28 wrz – 4 paź 2026');
  await (await planningDate(page)).fill('2026-12-31');
  await expect(page.locator('.week-navigation')).toContainText('28 gru – 3 sty 2027');
  await page.getByRole('group', { name: 'Widok planu', exact: true }).getByRole('button', { name: 'Miesiąc', exact: true }).click();
  await expect(page.locator('.planning-calendar-navigation')).toContainText('grudzień 2026');
  await page.getByRole('button', { name: 'Następny miesiąc', exact: true }).click();
  await expect(await planningDate(page)).toHaveValue('2027-01-31');
  await expect(page.getByRole('navigation', { name: 'Poziom planu' })).toContainText('Sezon 2027');
  await page.getByRole('button', { name: 'Poprzedni miesiąc', exact: true }).click();
  await page.getByRole('button', { name: 'Dodaj wydarzenie', exact: true }).first().click();
  await page.getByLabel('Rodzaj wydarzenia').selectOption('trip');
  await page.getByLabel('Nazwa wydarzenia').fill('Wyjazd przez granicę roku');
  await page.getByLabel('Początek wydarzenia').fill('2026-12-30');
  await page.getByLabel('Koniec wydarzenia').fill('2027-01-02');
  await page.getByLabel('Miejsce', { exact: true }).fill('Hala testowa');
  await page.getByRole('button', { name: 'Zapisz wydarzenie', exact: true }).click();
  await expect(page.locator('.planning-month-grid button[aria-label*="Wydarzenia: 1."]')).toHaveCount(4);
  await page.getByRole('group', { name: 'Widok planu', exact: true }).getByRole('button', { name: 'Tydzień', exact: true }).click();
  await expect(page.locator('.week-mini-event')).toHaveCount(4);
  await page.locator('.week-mini-event').last().click();
  await expect(page.getByRole('heading', { name: 'Wyjazd przez granicę roku', exact: true })).toBeVisible();
  await expect(page.locator('.planning-event-detail')).toContainText('Hala testowa');
  await page.getByRole('button', { name: 'Edytuj wydarzenie', exact: true }).click();
  await page.getByLabel('Koniec wydarzenia').fill('2027-01-01');
  await page.getByRole('button', { name: 'Zapisz wydarzenie', exact: true }).click();
  await expect(page.locator('.week-mini-event')).toHaveCount(3);
  const help = page.getByRole('button', { name: 'Oznaczenia kalendarza', exact: true });
  await help.click();
  const dialog = page.getByRole('dialog', { name: 'Oznaczenia kalendarza', exact: true });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(help).toBeFocused();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole('group', { name: 'Widok planu', exact: true }).getByRole('button', { name: 'Sezon', exact: true }).click();
  await expect(page.locator('.planning-season-month')).toHaveCount(12);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(page.locator('.planning-season-year h2')).toHaveText('2027');
  await page.getByRole('button', { name: 'Poprzedni rok', exact: true }).click();
  await expect(page.locator('.planning-season-year h2')).toHaveText('2026');
  await page.getByRole('button', { name: 'Następny rok', exact: true }).click();
  await page.locator('.planning-timeline-months').getByRole('button', { name: 'Otwórz styczeń 2027', exact: true }).click();
  await page.getByRole('button', { name: 'Wyjazd przez granicę roku', exact: false }).last().click();
  await page.getByRole('button', { name: 'Edytuj wydarzenie', exact: true }).click();
  await page.getByRole('button', { name: 'Usuń wydarzenie', exact: true }).click();
  await page.getByRole('button', { name: 'Potwierdź usunięcie wydarzenia', exact: true }).click();
  await expect(page.locator('.planning-month-grid .week-mini-event')).toHaveCount(0);
});

test('muscle map has accessible SVG fallback and explicit goals, units and historical week overrides', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+02:00'));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Mapa test');
  await page.getByLabel('Trening siłowy', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await page.getByRole('navigation', { name: 'Nawigacja główna' }).getByRole('button', { name: 'Plan', exact: true }).click();
  const map = page.getByRole('region', { name: 'Obciążenie mięśni w tygodniu', exact: true });
  await expect(map.getByRole('heading', { name: 'Obciążenie w tym tygodniu', exact: true })).toBeVisible();
  await expect(map.locator('.muscle-fallback svg')).toBeVisible();
  await map.getByRole('button', { name: 'Tył', exact: true }).click();
  await expect(map.getByRole('button', { name: 'Tył', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await map.getByText('Wartości i cele mięśni', { exact: true }).click();
  await expect(map.locator('.muscle-list>li')).toHaveCount(20);
  await map.getByRole('button', { name: 'Ustaw cel: Pośladki', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Cel: Pośladki', exact: true });
  await expect(dialog.getByLabel('Wartość celu', { exact: true })).toHaveValue('');
  await dialog.getByLabel('Jednostka celu').selectOption('exposures');
  await dialog.getByLabel('Wartość celu', { exact: true }).fill('2');
  await dialog.getByLabel('Pochodzenie celu').fill('Własna decyzja testowa');
  await dialog.getByRole('button', { name: 'Zapisz cel mięśnia', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(map.locator('.muscle-list>li').filter({ hasText: 'Pośladki' })).toContainText('Cel: 2 · ekspozycje');
  await (await planningDate(page)).fill('2026-09-28');
  await map.getByRole('button', { name: 'Ustaw cel: Pośladki', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Cel: Pośladki', exact: true });
  await expect(dialog.getByLabel('Zakres celu')).toHaveValue('week-override');
  await dialog.getByLabel('Wartość celu', { exact: true }).fill('0');
  await dialog.getByLabel('Pochodzenie celu').fill('Jawny wyjątek dawnego tygodnia');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await dialog.getByRole('button', { name: 'Zapisz cel mięśnia', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(map.locator('.muscle-list>li').filter({ hasText: 'Pośladki' })).toContainText('Poza celem · cel 0');
  await map.getByRole('button', { name: 'Wykonanie', exact: true }).click();
  await expect(map).toContainText('Brak danych');
});

test('opening a session detail preserves the selected month and day after returning to Plan', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+02:00'));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Kontekst test');
  await page.getByLabel('Trening siłowy', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await page.getByRole('button', { name: 'Zapisz trening', exact: true }).click();
  await page.getByLabel(/^Nazwa /).fill('Sesja zachowuje kontekst');
  await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('strength');
  await page.getByRole('combobox', { name: 'Sport', exact: true }).selectOption('strength');
  await page.getByLabel('Data', { exact: true }).fill('2027-01-07');
  await page.getByRole('button', { name: 'Zmień na zaplanowany', exact: true }).click();
  await page.getByRole('button', { name: 'Zapisz plan na urządzeniu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Nawigacja główna' }).getByRole('button', { name: 'Plan', exact: true }).click();
  await page.getByRole('group', { name: 'Widok planu', exact: true }).getByRole('button', { name: 'Miesiąc', exact: true }).click();
  await (await planningDate(page)).fill('2027-01-07');
  await page.locator('.planning-month-grid .week-mini-session').filter({ hasText: 'Sesja zachowuje kontekst' }).click();
  await expect(page.getByRole('region', { name: 'Szczegóły treningu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '← Wróć', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Widok planu', exact: true }).getByRole('button', { name: 'Miesiąc', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(await planningDate(page)).toHaveValue('2027-01-07');
  await expect(page.locator('.planning-calendar-navigation')).toContainText('styczeń 2027');
  await expect(page.getByRole('navigation', { name: 'Poziom planu' })).toContainText('Sezon 2027');
});


