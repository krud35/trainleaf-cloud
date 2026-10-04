import { expect, test, type Page } from '@playwright/test';

// Browser checks of the Season view header (0.4.1). Native Android insets and the hardware back button are not covered here.
const copy = {
  en: { nameLabel: 'What should we call you?', create: 'Create local profile', navLabel: 'Main navigation', viewSwitch: 'Plan view', season: 'Season', previous: 'Previous year', next: 'Next year', word: /Season \d{4}/ },
  pl: { nameLabel: 'Jak się do Ciebie zwracać?', create: 'Utwórz profil lokalny', navLabel: 'Nawigacja główna', viewSwitch: 'Widok planu', season: 'Sezon', previous: 'Poprzedni rok', next: 'Następny rok', word: /Sezon \d{4}/ },
  fr: { nameLabel: 'Comment vous appeler ?', create: 'Créer le profil local', navLabel: 'Navigation principale', viewSwitch: 'Vue du plan', season: 'Saison', previous: 'Année précédente', next: 'Année suivante', word: /Saison \d{4}/ },
  es: { nameLabel: '¿Cómo quieres que te llamemos?', create: 'Crear perfil local', navLabel: 'Navegación principal', viewSwitch: 'Vista del plan', season: 'Temporada', previous: 'Año anterior', next: 'Año siguiente', word: /Temporada \d{4}/ },
} as const;
type Code = keyof typeof copy;

async function openPlan(page: Page, code: Code) {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+02:00'));
  await page.addInitScript(language => localStorage.setItem('trainleaf-language', language), code);
  await page.goto('/');
  await page.getByLabel(copy[code].nameLabel).fill('Sezon test');
  await page.getByRole('button', { name: copy[code].create }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await page.getByRole('navigation', { name: copy[code].navLabel }).getByRole('button', { name: 'Plan', exact: true }).click();
}
const switchTo = (page: Page, code: Code, name: string) => page.getByRole('group', { name: copy[code].viewSwitch, exact: true }).getByRole('button', { name, exact: true }).click();
async function planningDate(page: Page) {
  const filters = page.locator('.planning-filters');
  if (await filters.getAttribute('open') === null) await filters.locator('summary').click();
  return filters.getByLabel('Przejdź do daty', { exact: true });
}
/** Geometry of the season header, in CSS pixels. */
const headerGeometry = (page: Page) => page.evaluate(() => {
  const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
  const switcher = box('.planning-view-switch'), year = box('.planning-season-year h2'), header = box('.planning-season-year');
  return {
    gap: box('.planning-timeline').top - switcher.bottom,
    centreOffset: year.left + year.width / 2 - (header.left + header.width / 2),
    arrows: Array.from(document.querySelectorAll('.planning-season-year button')).map(button => { const r = button.getBoundingClientRect(); return [r.width, r.height]; }),
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    yearColour: getComputedStyle(document.querySelector('.planning-season-year h2')!).color,
    insideViewport: header.left >= 0 && header.right <= innerWidth + 1,
  };
});

test('the season header shows the year from the plan state exactly once, without the week breadcrumb', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openPlan(page, 'pl');
  await expect(page.getByRole('navigation', { name: 'Poziom planu' })).toBeVisible();
  // Walking by weeks into the next year moves the season year with the selected day.
  await (await planningDate(page)).fill('2026-12-31');
  await page.getByRole('button', { name: 'Następny tydzień', exact: true }).click();
  await expect(page.locator('.week-navigation')).toContainText('2027');
  await switchTo(page, 'pl', 'Sezon');
  const header = page.locator('.planning-season-year');
  await expect(header).toHaveText('←2027→');
  await expect(header.getByRole('heading', { level: 2 })).toHaveText('2027');
  await expect(page.locator('.planning-season').getByRole('heading')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Poziom planu' })).toHaveCount(0);
  await expect(page.locator('.planning-breadcrumb')).toHaveCount(0);
  expect(await page.locator('.planning-page').innerText()).not.toMatch(copy.pl.word);
  expect((await page.locator('.planning-season-year').innerText()).match(/\d{4}/g)).toEqual(['2027']);
  await page.getByRole('button', { name: 'Poprzedni rok', exact: true }).click();
  await expect(header.getByRole('heading')).toHaveText('2026');
  await page.getByRole('button', { name: 'Następny rok', exact: true }).click();
  await page.getByRole('button', { name: 'Następny rok', exact: true }).click();
  await expect(header.getByRole('heading')).toHaveText('2028');
  await expect(page.locator('.planning-timeline-months button').first()).toHaveAccessibleName('Otwórz styczeń 2028');
  // The selected day follows the chosen year, so leaving the season view lands in that year.
  await switchTo(page, 'pl', 'Tydzień');
  await expect(page.locator('.week-navigation')).toContainText('2028');
  await expect(page.getByRole('navigation', { name: 'Poziom planu' })).toContainText('Sezon 2028');
});

for (const code of Object.keys(copy) as Code[]) {
  test(`${code}: the season axis starts close to the view switch at 320 and 360 px, 100% and 200% text, light and dark`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await openPlan(page, code);
    await switchTo(page, code, copy[code].season);
    await expect(page.locator('.planning-timeline')).toBeVisible();
    await expect(page.getByRole('button', { name: copy[code].previous, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: copy[code].next, exact: true })).toBeVisible();
    expect(await page.locator('.planning-page').innerText()).not.toMatch(copy[code].word);
    await expect(page.locator('.planning-season-year')).toHaveText('←2026→');
    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 800 }]) for (const scale of [100, 200]) {
      const colours: string[] = [];
      for (const theme of ['light', 'dark']) {
        await page.setViewportSize(viewport);
        await page.evaluate(([size, mode]) => { document.documentElement.style.fontSize = `${size}%`; document.documentElement.dataset.theme = String(mode); }, [scale, theme]);
        const label = `${code} ${viewport.width}px ${scale}% ${theme}`;
        // Before 0.4.1 this gap was 192.4 px at 100% and 260.8-298 px at 200%.
        await expect.poll(async () => (await headerGeometry(page)).gap, { message: `${label}: gap` }).toBeLessThanOrEqual(scale === 100 ? 72 : 100);
        const geometry = await headerGeometry(page);
        expect(geometry.gap, `${label}: gap`).toBeGreaterThanOrEqual(44);
        expect(Math.abs(geometry.centreOffset), `${label}: centred year`).toBeLessThanOrEqual(1);
        expect(geometry.arrows.length, `${label}: two arrows`).toBe(2);
        for (const [width, height] of geometry.arrows) { expect(width, `${label}: arrow width`).toBeGreaterThanOrEqual(44); expect(height, `${label}: arrow height`).toBeGreaterThanOrEqual(44); }
        expect(geometry.overflow, `${label}: horizontal overflow`).toBe(false);
        expect(geometry.insideViewport, `${label}: header inside the viewport`).toBe(true);
        colours.push(geometry.yearColour);
      }
      expect(colours[0], `${code}: the year has its own dark colour`).not.toBe(colours[1]);
    }
  });
}

test('returning from the season to month, week and a session keeps the plan context', async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00+02:00'));
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Powroty test');
  await page.getByLabel('Trening siłowy', { exact: true }).check();
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await page.getByRole('button', { name: 'Zapisz trening', exact: true }).click();
  await page.getByLabel(/^Nazwa /).fill('Sesja sezonu');
  await page.getByRole('combobox', { name: /^Rodzaj treningu/ }).selectOption('strength');
  await page.getByRole('combobox', { name: 'Sport', exact: true }).selectOption('strength');
  await page.getByLabel('Data', { exact: true }).fill('2027-01-07');
  await page.getByRole('button', { name: 'Zmień na zaplanowany', exact: true }).click();
  await page.getByRole('button', { name: 'Zapisz plan na urządzeniu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Nawigacja główna' }).getByRole('button', { name: 'Plan', exact: true }).click();
  const pressed = (name: string) => page.getByRole('group', { name: 'Widok planu', exact: true }).getByRole('button', { name, exact: true });
  const year = page.locator('.planning-season-year').getByRole('heading');
  await switchTo(page, 'pl', 'Sezon');
  await expect(year).toHaveText('2027');
  // Season -> week -> session -> back: the same week, then the same season year.
  await page.locator('.planning-season-weeks button').filter({ hasText: /^4 sty/ }).click();
  await expect(pressed('Tydzień')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.week-navigation')).toContainText('4 sty – 10 sty 2027');
  await page.locator('.week-grid .week-mini-session').filter({ hasText: 'Sesja sezonu' }).click();
  await expect(page.getByRole('region', { name: 'Szczegóły treningu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '← Wróć', exact: true }).click();
  await expect(pressed('Tydzień')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.week-navigation')).toContainText('4 sty – 10 sty 2027');
  await switchTo(page, 'pl', 'Sezon');
  await expect(year).toHaveText('2027');
  // Season -> month -> session -> back: the same month and day, then the breadcrumb leads back to the same season.
  await page.locator('.planning-timeline-months').getByRole('button', { name: 'Otwórz styczeń 2027', exact: true }).click();
  await expect(pressed('Miesiąc')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.planning-calendar-navigation')).toContainText('styczeń 2027');
  await page.locator('.planning-month-grid .week-mini-session').filter({ hasText: 'Sesja sezonu' }).click();
  await expect(page.getByRole('region', { name: 'Szczegóły treningu', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '← Wróć', exact: true }).click();
  await expect(pressed('Miesiąc')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.planning-calendar-navigation')).toContainText('styczeń 2027');
  await expect(await planningDate(page)).toHaveValue('2027-01-07'); // The opened session's day stays selected, as before 0.4.1.
  await page.getByRole('navigation', { name: 'Poziom planu' }).getByRole('button', { name: 'Sezon 2027', exact: true }).click();
  await expect(pressed('Sezon')).toHaveAttribute('aria-pressed', 'true');
  await expect(year).toHaveText('2027');
  await expect(page.getByRole('navigation', { name: 'Poziom planu' })).toHaveCount(0);
});

test('with a period the header still shows one year; the period name and range follow below it', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openPlan(page, 'pl');
  await page.getByRole('button', { name: 'Dodaj okres', exact: true }).click();
  await page.getByLabel('Nazwa okresu').fill('Przygotowania halowe');
  await page.getByLabel('Początek okresu').fill('2026-09-01');
  await page.getByLabel('Koniec okresu').fill('2027-02-28');
  await page.getByRole('button', { name: 'Zapisz okres' }).click();
  await switchTo(page, 'pl', 'Sezon');
  const season = page.locator('.planning-season');
  await expect(page.locator('.planning-season-year')).toHaveText('←2026→');
  await expect(season.getByRole('heading', { level: 2 })).toHaveCount(1);
  await expect(season.getByRole('heading', { level: 3, name: 'Przygotowania halowe', exact: true })).toBeVisible();
  await expect(page.locator('.planning-season-title')).toContainText('1 wrz 2026 – 28 lut 2027');
  await expect(page.locator('.planning-season-title').getByRole('button', { name: 'Edytuj', exact: true })).toBeVisible();
  await expect(page.locator('.planning-timeline-row.is-season')).toHaveCount(1);
  expect(await page.locator('.planning-page').innerText()).not.toMatch(copy.pl.word);
  // The period spans two years: the next year shows the same period, the year after has none.
  await page.getByRole('button', { name: 'Następny rok', exact: true }).click();
  await expect(page.locator('.planning-season-year h2')).toHaveText('2027');
  await expect(season.getByRole('heading', { level: 3, name: 'Przygotowania halowe', exact: true })).toBeVisible();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(mode => { document.documentElement.dataset.theme = mode; window.scrollTo(0, 0); }, theme);
    const colour = await page.locator('.planning-season-title h3').evaluate(element => getComputedStyle(element).color);
    expect(colour, theme).toBe(theme === 'light' ? 'rgb(45, 72, 47)' : await page.locator('.planning-season-year h2').evaluate(element => getComputedStyle(element).color));
    if (process.env.TRAINLEAF_SCREENS) await page.screenshot({ path: `${process.env.TRAINLEAF_SCREENS}/after-pl-period-360x800-100-${theme}.png` });
    else await page.screenshot({ path: testInfo.outputPath(`season-period-${theme}.png`) });
  }
  await page.getByRole('button', { name: 'Następny rok', exact: true }).click();
  await expect(page.locator('.planning-season-title')).toHaveCount(0);
  await expect(season.getByRole('heading')).toHaveCount(1);
});
