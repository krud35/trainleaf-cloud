import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Browser checks of the localisation. They start without a saved language, like a fresh installation.
// Native Android behaviour (WebView storage, system bars, share sheet) is not covered here.
const screens = process.env.TRAINLEAF_SCREENS ? resolve(process.env.TRAINLEAF_SCREENS) : '';
if (screens) mkdirSync(screens, { recursive: true });
const shot = async (page: Page, name: string) => { if (screens) await page.screenshot({ path: join(screens, `${name}.png`), fullPage: true }); };
const POLISH_ONLY = /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/;

const copy = {
  en: { name: 'English', title: 'How do you train?', nameLabel: 'What should we call you?', create: 'Create local profile', nav: ['Today', 'Plan', 'Progress', 'More'], navLabel: 'Main navigation', settings: 'Settings', opening: 'Opening your journal…', recovery: 'The journal could not be opened', record: 'Record a workout' },
  pl: { name: 'Polski', title: 'Jak trenujesz?', nameLabel: 'Jak się do Ciebie zwracać?', create: 'Utwórz profil lokalny', nav: ['Dzisiaj', 'Plan', 'Postępy', 'Inne'], navLabel: 'Nawigacja główna', settings: 'Ustawienia', opening: 'Otwieranie dziennika…', recovery: 'Nie udało się otworzyć dziennika', record: 'Zapisz trening' },
  fr: { name: 'Français', title: 'Comment vous entraînez-vous ?', nameLabel: 'Comment vous appeler ?', create: 'Créer le profil local', nav: ['Aujourd’hui', 'Plan', 'Progrès', 'Plus'], navLabel: 'Navigation principale', settings: 'Paramètres', opening: 'Ouverture du journal…', recovery: 'Impossible d’ouvrir le journal', record: 'Enregistrer une séance' },
  es: { name: 'Español', title: '¿Cómo entrenas?', nameLabel: '¿Cómo quieres que te llamemos?', create: 'Crear perfil local', nav: ['Hoy', 'Plan', 'Progreso', 'Más'], navLabel: 'Navegación principal', settings: 'Ajustes', opening: 'Abriendo el diario…', recovery: 'No se pudo abrir el diario', record: 'Registrar entrenamiento' },
} as const;
type Code = keyof typeof copy;
const codes = Object.keys(copy) as Code[];

async function offlineReady(page: Page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise<void>(done => navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true })); });
}
async function choose(page: Page, code: Code) { await page.getByRole('radio', { name: copy[code].name, exact: true }).check(); }
async function createProfile(page: Page, code: Code, name = 'Alex') {
  await page.goto('/');
  if (code !== 'en') await choose(page, code);
  await page.getByLabel(copy[code].nameLabel).fill(name);
  await page.getByRole('button', { name: copy[code].create }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
  await expect(page.getByRole('navigation', { name: copy[code].navLabel })).toBeVisible();
}
/** Visible text plus accessibility texts of the whole document. */
async function allTexts(page: Page) {
  return page.evaluate(() => [document.body.innerText, ...Array.from(document.querySelectorAll('[aria-label],[placeholder],[title]')).flatMap(element => ['aria-label', 'placeholder', 'title'].map(name => element.getAttribute(name) ?? ''))].join('\n'));
}
async function noOverflow(page: Page, label: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: horizontal overflow`).toBe(true);
}

test.describe('with the browser set to Polish', () => {
  test.use({ locale: 'pl-PL', timezoneId: 'Europe/Warsaw' });

  test('the first start is English and no Polish text is shown at any moment', async ({ page }) => {
    // Every text that ever enters the document is recorded from before the first script runs.
    await page.addInitScript(() => {
      const seen: string[] = []; (window as unknown as { seenTexts: string[] }).seenTexts = seen;
      new MutationObserver(() => { seen.push(`${document.documentElement.lang}|${document.title}|${document.body?.innerText ?? ''}`); }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: copy.en.title })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle('Trainleaf — training journal');
    expect(await page.evaluate(() => navigator.language)).toBe('pl-PL');
    expect(await page.evaluate(() => localStorage.getItem('trainleaf-language')), 'starting must not save a language').toBeNull();
    await expect(page.getByRole('radio', { name: 'English', exact: true })).toBeChecked();
    const seen = await page.evaluate(() => (window as unknown as { seenTexts: string[] }).seenTexts);
    expect(seen.length).toBeGreaterThan(0);
    for (const entry of seen) { expect(entry.startsWith('en|'), entry.slice(0, 80)).toBe(true); expect(entry).not.toMatch(POLISH_ONLY); expect(entry).not.toContain('Otwieranie'); }
    expect(await allTexts(page)).not.toMatch(POLISH_ONLY);
  });

  test('the saved language is applied before the application bundle loads, under the production CSP', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', message => { if (/Content Security Policy|Executing inline script violates/i.test(message.text())) violations.push(message.text()); });
    await page.addInitScript(() => { localStorage.setItem('trainleaf-language', 'fr'); localStorage.setItem('trainleaf-theme', 'dark'); });
    await page.route('**/assets/*.js', route => route.abort());
    await page.goto('/');
    await expect(page.locator('#root')).toBeEmpty();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(violations).toEqual([]);
  });

  test('an invalid or unreadable preference falls back to English and never blocks the start', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'de'));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: copy.en.title })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const blocked = await page.context().newPage();
    await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }); });
    await blocked.goto('/');
    await expect(blocked.getByRole('heading', { name: copy.en.title })).toBeVisible();
    await blocked.getByRole('radio', { name: 'Español', exact: true }).check();
    await expect(blocked.getByRole('heading', { name: copy.es.title }), 'the session keeps the choice even when it cannot be saved').toBeVisible();
  });
});

for (const code of codes) {
  test(`${copy[code].name}: chosen before the profile, kept after restart and offline`, async ({ page, context }) => {
    await page.clock.setFixedTime(new Date('2026-12-31T12:00:00+01:00'));
    await page.goto('/');
    await choose(page, code);
    await expect(page.getByRole('heading', { name: copy[code].title })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await page.getByLabel(copy[code].nameLabel).fill('Alex');
    await page.getByRole('button', { name: copy[code].create }).click();
    await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4
    const nav = page.getByRole('navigation', { name: copy[code].navLabel });
    for (const name of copy[code].nav) await expect(nav.getByRole('button', { name, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: copy[code].nav[0], exact: true, level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await offlineReady(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: copy[code].nav[0], exact: true, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: copy[code].record })).toBeVisible();
    // The selector is also in Settings and shows the saved choice.
    await page.getByRole('button', { name: copy[code].settings, exact: true }).click();
    await expect(page.getByRole('radio', { name: copy[code].name, exact: true })).toBeChecked();
    await context.setOffline(false);
  });
}

test('year boundary, Monday-first week, decimals, a saved zero and a missing answer in every language', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-31T08:00:00+01:00'));
  await createProfile(page, 'en');
  const heading = { en: 'Thursday 31 December', pl: 'czwartek, 31 grudnia', fr: 'jeudi 31 décembre', es: 'jueves, 31 de diciembre' };
  const monday = { en: 'Mo', pl: 'Pn', fr: 'Lu', es: 'Lu' };
  const range = { en: /28 Dec – 3 Jan 2027/, pl: /28 gru – 3 sty 2027/, fr: /28 déc\. – 3 janv\. 2027/, es: /28 dic – 3 ene 2027/ };
  const sleep = { en: '7.25 h', pl: '7,25 h', fr: '7,25 h', es: '7,25 h' };
  const noAnswer = { en: 'No answer', pl: 'Brak odpowiedzi', fr: 'Pas de réponse', es: 'Sin respuesta' };
  // One morning check-in: sleep 7.25 h typed with a comma, fatigue explicitly 0, soreness left unanswered.
  await page.getByRole('button', { name: 'Record wellbeing' }).click();
  await page.getByLabel(/^Sleep duration/).fill('7,25');
  const fatigue = page.getByRole('slider', { name: 'Fatigue', exact: true });
  await fatigue.focus(); await page.keyboard.press('Home');
  await expect(fatigue).toHaveAttribute('aria-valuetext', 'I feel completely fresh');
  await page.getByRole('button', { name: 'Save wellbeing' }).click();
  await expect(page.getByRole('button', { name: /Check-in done/ })).toBeVisible();
  for (const code of codes) {
    await page.getByRole('button', { name: copy[code === 'en' ? 'en' : codes[codes.indexOf(code) - 1]].settings, exact: true }).click();
    await choose(page, code);
    const nav = page.getByRole('navigation', { name: copy[code].navLabel });
    await nav.getByRole('button', { name: copy[code].nav[0], exact: true }).click();
    await expect(page.locator('.journal-heading p')).toHaveText(heading[code]);
    await page.locator('.checkin-done').click();
    const facts = page.locator('.ed-wellness-facts > div');
    await expect(facts.nth(0).locator('dd')).toHaveText(sleep[code]);
    await expect(facts.nth(2).locator('dd'), 'a saved zero is a measurement').toHaveText('0 / 10');
    await expect(facts.nth(3).locator('dd'), 'a missing answer is not zero').toHaveText(noAnswer[code]);
    await page.locator('.ed-detail .back').click();
    await nav.getByRole('button', { name: copy[code].nav[1], exact: true }).click();
    await expect(page.locator('.week-day-select span').first()).toHaveText(monday[code]);
    await expect(page.locator('.week-navigation h2')).toHaveText(range[code]);
    expect(await page.evaluate(() => document.querySelectorAll('.week-day').length)).toBe(7);
  }
  // The stored record keeps its language-independent form.
  const stored = await page.evaluate(() => localStorage.getItem('trainleaf-language'));
  expect(stored).toBe('es');
});

test('changing the language keeps the profile form, an open workout form and its draft', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel(copy.en.nameLabel).fill('Zażółć Gęślą');
  await page.getByLabel('Find a sport').fill('swim');
  await page.getByLabel('Swimming', { exact: true }).check();
  const nameInput = await page.getByLabel(copy.en.nameLabel).elementHandle();
  await choose(page, 'fr');
  await expect(page.getByLabel(copy.fr.nameLabel)).toHaveValue('Zażółć Gęślą');
  expect(await nameInput!.evaluate(element => element.isConnected), 'the form is not remounted').toBe(true);
  await page.getByLabel('Trouver un sport').fill('');
  await expect(page.getByLabel('Natation', { exact: true })).toBeChecked();
  await choose(page, 'en');
  await page.getByRole('button', { name: copy.en.create }).click();
  await page.locator('.training-quiz .quiz-skip').click(); // the one-time quiz has its own spec: reserve-v4

  await page.getByRole('button', { name: copy.en.record }).click();
  await page.getByLabel(/^Name/).fill('Poranny trening siłowy');
  await page.getByRole('combobox', { name: 'Workout kind', exact: true }).selectOption('strength');
  await page.getByLabel(/^Actual time/).fill('45');
  await page.getByRole('combobox', { name: 'Sport', exact: true }).selectOption('swimming');
  await page.getByRole('textbox', { name: 'Your note', exact: true }).fill('Notatka użytkownika — bez tłumaczenia.');
  await page.getByText('Exercises (optional)', { exact: true }).click();
  await page.getByRole('region', { name: 'Main part', exact: true }).getByRole('button', { name: '+ Add exercise' }).click();
  await page.getByLabel('Search the library and your own exercises').fill('back squat');
  await page.locator('.we-picker ul button').first().click();
  await page.locator('.we-item .we-dose').first().getByLabel('Sets', { exact: true }).fill('3');
  await expect(page.locator('.we-draft-status')).toHaveText('Draft saved on the device.');
  const draftBefore = await page.evaluate(() => new Promise<string>(done => { const request = indexedDB.databases(); void request.then(list => done(JSON.stringify(list.map(entry => entry.name)))); }));
  const noteField = await page.getByRole('textbox', { name: 'Your note', exact: true }).elementHandle();

  // The editor hides Settings, so the language is changed from a second tab; the open form follows it.
  const other = await context.newPage();
  await other.goto('/');
  await other.getByRole('button', { name: copy.en.settings, exact: true }).click();
  await other.getByRole('radio', { name: 'Español', exact: true }).check();
  await expect(page.getByRole('heading', { name: 'Registrar entrenamiento', level: 1 })).toBeVisible();
  await expect(page.locator('.we-draft-status')).toHaveText('Borrador guardado en el dispositivo.');
  expect(await noteField!.evaluate(element => element.isConnected), 'the editor is not remounted').toBe(true);
  await expect(page.getByLabel(/^Nombre/)).toHaveValue('Poranny trening siłowy');
  await expect(page.getByLabel(/^Tiempo realizado/)).toHaveValue('45');
  await expect(page.getByRole('textbox', { name: 'Tu nota', exact: true })).toHaveValue('Notatka użytkownika — bez tłumaczenia.');
  await expect(page.locator('.we-item > legend')).toHaveText('1. Sentadilla trasera con barra');
  await expect(page.locator('.we-item .we-dose').first().getByLabel('Series', { exact: true })).toHaveValue('3');
  await other.close();

  // A validation error raised in Spanish is re-rendered after another change, by its code.
  await page.locator('.we-item .we-dose').first().getByLabel('Series', { exact: true }).fill('3,5');
  await page.getByRole('button', { name: 'Guardar el entrenamiento en el dispositivo' }).click();
  await expect(page.getByRole('alert')).toContainText('Sentadilla trasera con barra: series: introduce un número entero de 1 a 100.');
  await page.locator('.we-item .we-dose').first().getByLabel('Series', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Dejar el borrador y volver' }).click();
  await page.getByText(/^Borradores \(1\)/).click();
  await page.getByRole('button', { name: 'Retomar borrador: Poranny trening siłowy' }).click();
  await expect(page.getByLabel(/^Nombre/)).toHaveValue('Poranny trening siłowy');
  await expect(page.locator('.we-item .we-dose').first().getByLabel('Series', { exact: true })).toHaveValue('3');
  expect(await page.evaluate(() => new Promise<string>(done => { void indexedDB.databases().then(list => done(JSON.stringify(list.map(entry => entry.name)))); }))).toBe(draftBefore);
  await page.getByRole('button', { name: 'Guardar el entrenamiento en el dispositivo' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Entrenamiento guardado.' })).toBeVisible();
  await page.getByRole('button', { name: 'Omitir por ahora' }).click();
  // User content is shown exactly as written; the factory exercise name follows the language.
  await page.getByRole('button', { name: 'Abrir entrenamiento: Poranny trening siłowy' }).click();
  await expect(page.getByRole('heading', { name: 'Poranny trening siłowy', level: 1 })).toBeVisible();
  await expect(page.locator('.ed-notebook .ed-notes')).toHaveText('Notatka użytkownika — bez tłumaczenia.');
  await expect(page.locator('.ed-exercises h3')).toHaveText('Sentadilla trasera con barra');
  await expect(page.locator('.ed-exercises')).toContainText('3 series');
});

test('the recovery screen works without a database: English by default, selectable and remembered', async ({ page }) => {
  await page.addInitScript(() => { IDBFactory.prototype.open = function open() { throw new DOMException('storage failure', 'UnknownError'); }; });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: copy.en.recovery })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export recovery file' })).toBeVisible();
  expect(await allTexts(page)).not.toMatch(POLISH_ONLY);
  await page.getByRole('radio', { name: 'Français', exact: true }).check();
  await expect(page.getByRole('heading', { name: copy.fr.recovery })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Sombre', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: copy.fr.recovery }), 'the choice is read before the database').toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.getByRole('radio', { name: 'Polski', exact: true }).check();
  await expect(page.getByRole('heading', { name: copy.pl.recovery })).toBeVisible();
});

for (const code of ['en', 'fr', 'es'] as const) {
  test(`${copy[code].name}: no Polish interface or factory text on the main screens, in the library and in the editor`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-05T09:00:00+02:00'));
    await createProfile(page, code);
    const nav = page.getByRole('navigation', { name: copy[code].navLabel });
    const check = async (label: string) => { const text = await allTexts(page); const hit = text.split('\n').find(line => POLISH_ONLY.test(line)); expect(hit, `${code} ${label}: ${hit}`).toBeUndefined(); };
    for (const name of copy[code].nav) {
      await nav.getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
      for (const summary of await page.locator('.view-frame details:not([open]) > summary').all()) if (await summary.isVisible()) await summary.click();
      await check(name);
    }
    await page.getByRole('button', { name: copy[code].settings, exact: true }).click();
    await check('settings');
    await nav.getByRole('button', { name: copy[code].nav[3], exact: true }).click();
    await page.locator('.more-tools .more-tool-row').first().click();
    await expect(page.locator('.library-list li')).toHaveCount(163);
    await check('library list with all 163 factory exercises');
    await page.locator('.library-list li button').nth(20).click();
    await check('exercise detail');
    await page.locator('.library-view .back').click();
    await nav.getByRole('button', { name: copy[code].nav[0], exact: true }).click();
    await page.getByRole('button', { name: copy[code].record }).click();
    for (const summary of await page.locator('.workout-editor details:not([open]) > summary').all()) if (await summary.isVisible()) await summary.click();
    await check('workout editor');
  });
}

for (const code of ['fr', 'es'] as const) {
  test(`${copy[code].name}: main screens fit 360 px and 200% text in light and dark appearance`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.clock.setFixedTime(new Date('2026-10-05T09:00:00+02:00'));
    await page.emulateMedia({ colorScheme: 'light' });
    await createProfile(page, code);
    const nav = page.getByRole('navigation', { name: copy[code].navLabel });
    const light = code === 'fr' ? 'Clair' : 'Claro', dark = code === 'fr' ? 'Sombre' : 'Oscuro', system = code === 'fr' ? 'Système' : 'Sistema';
    for (const theme of ['light', 'dark'] as const) {
      await page.getByRole('button', { name: copy[code].settings, exact: true }).click();
      await page.getByRole('radio', { name: theme === 'light' ? light : dark, exact: true }).check();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await noOverflow(page, `${code} settings ${theme}`); await shot(page, `${code}-360-${theme}-settings`);
      for (const [index, name] of copy[code].nav.entries()) {
        await nav.getByRole('button', { name, exact: true }).click();
        await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
        await noOverflow(page, `${code} ${name} ${theme}`); await shot(page, `${code}-360-${theme}-${['today', 'plan', 'progress', 'more'][index]}`);
      }
    }
    // Readable text on both appearances: the page colour and the text colour differ clearly.
    const contrast = await page.evaluate(() => { const style = getComputedStyle(document.body); return { color: style.color, background: getComputedStyle(document.documentElement).backgroundColor }; });
    expect(contrast.color).not.toBe(contrast.background);
    // System appearance follows the device setting, with the translated label.
    await page.getByRole('button', { name: copy[code].settings, exact: true }).click();
    await page.getByRole('radio', { name: system, exact: true }).check();
    await page.emulateMedia({ colorScheme: 'dark' }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.emulateMedia({ colorScheme: 'light' }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // Text enlarged to 200%.
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await noOverflow(page, `${code} settings 200%`); await shot(page, `${code}-360-200pct-settings`);
    for (const [index, name] of copy[code].nav.entries()) {
      await nav.getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
      await noOverflow(page, `${code} ${name} 200%`); await shot(page, `${code}-360-200pct-${['today', 'plan', 'progress', 'more'][index]}`);
      await expect(nav.getByRole('button', { name, exact: true })).toHaveAttribute('aria-current', 'page');
    }
    await nav.getByRole('button', { name: copy[code].nav[0], exact: true }).click();
    await page.getByRole('button', { name: copy[code].record }).click();
    await expect(page.locator('.workout-editor h1')).toBeVisible();
    await noOverflow(page, `${code} editor 200%`); await shot(page, `${code}-360-200pct-editor`);
  });
}

test('export and import keep the data and the stored format in any language', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-05T09:00:00+02:00'));
  await createProfile(page, 'fr', 'Camille');
  await page.getByRole('button', { name: copy.fr.record }).click();
  await page.getByLabel(/^Nom/).fill('Séance du lundi');
  await page.getByRole('combobox', { name: 'Type de séance', exact: true }).selectOption('running');
  await page.getByRole('button', { name: 'Enregistrer la séance sur l’appareil' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Séance enregistrée.' })).toBeVisible();
  await page.getByRole('button', { name: 'Passer pour l’instant' }).click();
  await page.getByRole('button', { name: copy.fr.settings, exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter la sauvegarde JSON' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('trainleaf-backup-2026-10-05.json');
  await expect(page.getByRole('status').filter({ hasText: 'Le fichier est prêt à être téléchargé.' })).toBeVisible();
  const path = await file.path();
  const backup = JSON.parse(await (await import('node:fs/promises')).readFile(path, 'utf8'));
  // The backup keeps stable IDs and enums and contains no language setting.
  expect(backup.format).toBe('training-companion-backup');
  expect(backup.workouts[0]).toMatchObject({ title: 'Séance du lundi', sportId: 'ultimate', trainingType: 'running', status: 'completed', date: '2026-10-05' });
  expect(JSON.stringify(backup)).not.toContain('trainleaf-language');
  expect(Object.keys(backup)).not.toContain('language');
  // The same file restores in another language.
  await choose(page, 'en');
  await page.getByLabel('Choose a JSON backup to restore').setInputFiles(path);
  await expect(page.getByRole('heading', { name: 'Backup preview' })).toBeVisible();
  await expect(page.locator('.confirm-box')).toContainText('Profile: Camille. Format: version 5.');
  await page.getByLabel('I want to replace the current data with the contents of this backup.').check();
  await page.getByRole('button', { name: 'Restore and replace data' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Data restored from the backup.' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'English', exact: true }), 'restoring data does not change the language').toBeChecked();
  await page.getByRole('navigation', { name: copy.en.navLabel }).getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open workout: Séance du lundi' })).toBeVisible();
});
