import { expect, test } from '@playwright/test';

test('saved appearance initializes before the application bundle and database load under the production CSP', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', message => { if (/Content Security Policy|Executing inline script violates/i.test(message.text())) violations.push(message.text()); });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.setItem('trainleaf-theme', 'dark'));
  await page.route('**/assets/*.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#root')).toBeEmpty();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('html').evaluate(element => getComputedStyle(element).colorScheme)).toBe('dark');
  expect(violations).toEqual([]);
});

test('theme follows system before profile, persists offline and does not reset profile input', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Jak trenujesz?' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Profil przed zapisem');
  await page.getByRole('radio', { name: 'Jasny', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByLabel('Jak się do Ciebie zwracać?')).toHaveValue('Profil przed zapisem');
  await page.getByRole('radio', { name: 'Ciemny', exact: true }).check();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })); });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Ciemny', exact: true })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'Systemowy', exact: true }).check();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('sport search preserves hidden choices and primary screens fit 360px at 200% text', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 820 });
  await page.goto('/');
  await page.getByLabel('Jak się do Ciebie zwracać?').fill('Kontrola interfejsu');
  await page.getByLabel('Znajdź sport').fill('plywanie');
  await page.getByLabel('Pływanie', { exact: true }).check();
  await page.getByLabel('Znajdź sport').fill('nieistniejący sport');
  await page.getByRole('button', { name: 'Utwórz profil lokalny' }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  const nav = page.getByRole('navigation', { name: 'Nawigacja główna' });
  await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  await expect(page.getByLabel('Ultimate frisbee', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Pływanie', { exact: true })).toBeChecked();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  for (const name of ['Dzisiaj', 'Plan', 'Postępy', 'Inne']) {
    await nav.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} page overflow`).toBe(true);
    await expect(nav.getByRole('button', { name, exact: true })).toHaveAttribute('aria-current', 'page');
  }
  const boxes = await nav.getByRole('button').evaluateAll(buttons => buttons.map(button => ({ x: button.getBoundingClientRect().x, y: button.getBoundingClientRect().y })));
  expect(boxes[0].y).toBe(boxes[1].y);
  expect(boxes[2].y).toBeGreaterThan(boxes[0].y);
  expect(boxes[2].x).toBe(boxes[0].x);
});
