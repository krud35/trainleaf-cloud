import assert from 'node:assert/strict';
import {chromium, expect} from '@playwright/test';
import {seed} from './data.js';
import {snapshotTrainleafLoad} from './load-model.js';

const url = process.env.TRAINLEAF_PREVIEW_URL || 'http://127.0.0.1:4186/';
const storageKey = 'fieldwork-ui-demo-v1';
const today = '2026-10-03';
const browser = await chromium.launch({channel: 'chrome', headless: true});
const results = [];
const base = {id: 'saved-load', title: 'Historyczna sesja load', status: 'completed', date: today, time: '', trainingType: 'strength', sport: 'Trening siłowy', duration: '60', rpe: '5', notes: '', exercises: [], groups: [], postSession: {aerobic: 5, muscular: 5, satisfaction: 8, notes: ''}};

async function scenario(name, action, workouts = []) {
  const context = await browser.newContext({viewport: {width: 360, height: 800}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const initial = {...structuredClone(seed), workouts: structuredClone(workouts), draft: null};
  await page.addInitScript(({key, state}) => {
    if (!sessionStorage.getItem('load-e2e-initialized')) {
      localStorage.setItem(key, JSON.stringify(state));
      sessionStorage.setItem('load-e2e-initialized', 'yes');
    }
  }, {key: storageKey, state: initial});
  try {
    await page.goto(url);
    await expect(page.locator('#app')).toHaveAttribute('data-view', 'journal');
    await action(page);
    assert.deepEqual(errors, [], 'No browser errors');
    results.push({name, passed: true});
    console.log(`OK ${name}`);
  } catch (error) {
    results.push({name, passed: false, error: error.message, browserErrors: errors});
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    await context.close();
  }
}

const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
const answer = async (page, key, value) => {
  const slider = page.locator(`[data-post-key="${key}"] input[type="range"]`);
  await slider.press('Home');
  for (let n = 0; n < value; n++) await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', new RegExp(`^${value} — `));
};
async function start(page, {name = 'Test load', type = 'strength', duration = '60', planned = false} = {}) {
  if (planned) {
    await page.locator('#nav [data-go="plan"]').click();
    await page.locator('[data-plan]').click();
  } else await page.locator('[data-new]').click();
  await page.getByLabel('Nazwa treningu', {exact: true}).fill(name);
  await page.getByLabel('Rodzaj treningu', {exact: true}).selectOption(type);
  if (duration !== '') await page.locator('#workout [name="duration"]').fill(duration);
  return page;
}
const openSurvey = async page => {
  await page.locator('#save-workout').click();
  await expect(page.locator('#app')).toHaveAttribute('data-view', 'postSession');
};
const saveSurvey = async page => {
  await page.locator('#post-session button.primary').click();
  await expect(page.locator('#app')).toHaveAttribute('data-view', 'journal');
};
const progress = async page => {
  await page.locator('#nav [data-go="progress"]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-view', 'progress');
};
const setScenario = async (page, value) => {
  await page.locator('.review-tools').evaluate(element => {element.open = true;});
  await page.locator('#scenario').selectOption(value);
  await page.locator('.review-tools').evaluate(element => {element.open = false;});
};

try {
  await scenario('60 min strength 5/5 → 78; full snapshot, satisfaction excluded, distinct RPE and keyboard help', async page => {
    await expect(page.locator('.checkin-card > .leaf-illustration .leaf-blade')).toHaveAttribute('d', /^M/);
    await expect(page.locator('.context-feature > .leaf-illustration')).toHaveCount(2);
    await start(page);
    await page.getByLabel('RPE · opcjonalnie', {exact: true}).selectOption('5');
    await openSurvey(page);
    await expect(page.locator('#load-preview strong')).toHaveText('—');
    for (const key of ['aerobic', 'muscular', 'satisfaction']) await expect(page.locator(`[data-post-key="${key}"] input[type="range"]`)).toHaveAttribute('aria-valuetext', 'Bez odpowiedzi');
    await answer(page, 'aerobic', 5);
    await expect(page.locator('#load-preview strong')).toHaveText('—');
    await answer(page, 'muscular', 5);
    await expect(page.locator('#load-preview strong')).toHaveText('78,0');
    await answer(page, 'satisfaction', 0);
    await expect(page.locator('#load-preview strong')).toHaveText('78,0');
    await answer(page, 'satisfaction', 10);
    await expect(page.locator('#load-preview strong')).toHaveText('78,0');
    const help = page.locator('#load-preview [data-help="trainleaf-load"]');
    await help.focus(); await help.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Satysfakcja i RPE nie wchodzą do tego wzoru');
    await page.getByRole('dialog').press('Escape');
    await expect(help).toBeFocused();
    await saveSurvey(page);
    const state = await stored(page), workout = state.workouts[0];
    assert.equal(state.draft, null);
    assert.equal(workout.loadSnapshot.value, 78);
    assert.equal(workout.loadSnapshot.status, 'calculated');
    assert.equal(workout.loadSnapshot.algorithm, 'trainleaf-load-v1');
    assert.deepEqual(workout.loadSnapshot.parameters, {weights: {mental: 0, technique: 0.6, endurance: 0.8, running: 1.05, strength: 1.3, team: 1}, scale: {offset: 0.5, divisor: 10}});
    assert.deepEqual(workout.loadSnapshot.inputs, {trainingType: 'strength', duration: '60', aerobic: 5, muscular: 5});
    assert.equal(workout.postSession.satisfaction, 10);
    await progress(page);
    await expect(page.locator('.load-summary strong')).toHaveText('78,0');
    await expect(page.locator('.card').filter({has: page.getByRole('heading', {name: 'Czas × RPE', exact: true})}).locator('strong')).toHaveText('300');
  });

  const historical = {...structuredClone(base), loadSnapshot: {...snapshotTrainleafLoad(base), value: 17.234567, algorithm: 'trainleaf-load-historical-test'}};
  historical.loadSnapshot.parameters.weights.strength = 0.2872427833333333;
  await scenario('historical snapshot survives render/reload/notes-only/satisfaction edits; explicit input change updates', async page => {
    await progress(page);
    await expect(page.locator('.load-summary strong')).toHaveText('17,2');
    assert.deepEqual((await stored(page)).workouts[0].loadSnapshot, historical.loadSnapshot);
    await page.reload();
    assert.deepEqual((await stored(page)).workouts[0].loadSnapshot, historical.loadSnapshot);
    await page.locator('[data-edit="saved-load"]').click();
    await expect(page.locator('.load-summary strong')).toHaveText('17,2');
    await page.locator('#workout [name="notes"]').fill('Nowa notatka bez zmiany obciążenia.');
    await openSurvey(page);
    await expect(page.locator('#load-preview strong')).toHaveText('17,2');
    await expect(page.locator('#load-preview')).toContainText('trainleaf-load-historical-test');
    await page.locator('[name="post-notes"]').fill('Notatka po treningu.');
    await expect(page.locator('#load-preview strong')).toHaveText('17,2');
    await saveSurvey(page);
    assert.deepEqual((await stored(page)).workouts[0].loadSnapshot, historical.loadSnapshot);
    await page.reload();
    await page.locator('[data-edit="saved-load"]').click();
    await openSurvey(page);
    await answer(page, 'satisfaction', 0);
    await expect(page.locator('#load-preview strong')).toHaveText('17,2');
    await saveSurvey(page);
    assert.deepEqual((await stored(page)).workouts[0].loadSnapshot, historical.loadSnapshot);
    await page.locator('[data-edit="saved-load"]').click();
    await page.locator('#workout [name="duration"]').fill('61');
    await openSurvey(page);
    await expect(page.locator('#load-preview strong')).toHaveText('79,3');
    await saveSurvey(page);
    const updated = (await stored(page)).workouts[0];
    assert.equal(updated.loadSnapshot.algorithm, 'trainleaf-load-v1');
    assert.equal(updated.loadSnapshot.value, 1.3 * 61);
    assert.equal(updated.loadSnapshot.parameters.weights.strength, 1.3);
    assert.equal(updated.notes, 'Nowa notatka bez zmiany obciążenia.');
  }, [historical]);

  await scenario('mental skip keeps null physical answers and zero load, time remains counted', async page => {
    await start(page, {type: 'mental', duration: '20', name: 'Mentalny bez ocen fizycznych'});
    await openSurvey(page);
    await expect(page.locator('#load-preview strong')).toHaveText('0,0');
    await page.locator('[data-skip-review]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-view', 'journal');
    const workout = (await stored(page)).workouts[0];
    assert.equal(workout.postSession.aerobic, null); assert.equal(workout.postSession.muscular, null);
    assert.equal(workout.loadSnapshot.value, 0);
    assert.equal(workout.loadSnapshot.inputs.aerobic, null); assert.equal(workout.loadSnapshot.inputs.muscular, null);
    await progress(page);
    await expect(page.locator('.stats-pair .metric').nth(0)).toHaveText('1');
    await expect(page.locator('.stats-pair .metric').nth(1)).toHaveText('20 min');
    await expect(page.locator('.load-summary strong')).toHaveText('0,0');
    await expect(page.locator('.load-summary')).toContainText('Mentalne: 1');
  });

  await scenario('physical skip records unavailable, not zero, and permits save', async page => {
    await start(page, {name: 'Bez ocen po treningu'});
    await openSurvey(page);
    await page.locator('[data-skip-review]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-view', 'journal');
    const workout = (await stored(page)).workouts[0];
    assert.equal(workout.postSession.aerobic, null); assert.equal(workout.postSession.muscular, null);
    assert.equal(workout.loadSnapshot.status, 'unavailable'); assert.equal(workout.loadSnapshot.value, null);
    assert.equal(workout.loadSnapshot.reason, 'missing_aerobic');
    await progress(page);
    await expect(page.locator('.load-summary strong')).toHaveText('—');
    await expect(page.locator('.load-summary')).toContainText('0 z 1');
    await expect(page.locator('.load-summary')).toContainText('Bez wyniku: 1');
  });

  await scenario('planned session has no load snapshot and is excluded from completed progress', async page => {
    await start(page, {planned: true, duration: '90', name: 'Plan bez wykonania'});
    await page.locator('#save-workout').click();
    await expect(page.locator('#app')).toHaveAttribute('data-view', 'plan');
    const workout = (await stored(page)).workouts[0];
    assert.equal(workout.status, 'planned'); assert(!('loadSnapshot' in workout));
    await progress(page);
    await expect(page.locator('.stats-pair .metric').nth(0)).toHaveText('0');
    await expect(page.locator('.stats-pair .metric').nth(1)).toHaveText('0 min');
    await expect(page.locator('.load-summary strong')).toHaveText('—');
    await expect(page.locator('.load-summary')).toContainText('0 z 0');
  });

  for (const failure of ['error', 'full']) await scenario(`save failure ${failure} preserves draft and ratings; reload and retry succeeds`, async page => {
    await start(page, {name: `Trening zachowany ${failure}`});
    await openSurvey(page);
    await answer(page, 'aerobic', 0); await answer(page, 'muscular', 5); await answer(page, 'satisfaction', 7);
    await page.locator('[name="post-notes"]').fill('Ta notatka ma przetrwać błąd.');
    await setScenario(page, failure);
    await page.locator('#post-session button.primary').click();
    await expect(page.locator('#app')).toHaveAttribute('data-view', 'postSession');
    await expect(page.locator('#save-error')).toContainText(failure === 'full' ? 'Brak miejsca' : 'Nie udało się zapisać');
    const failed = await stored(page);
    assert.equal(failed.workouts.length, 0); assert.equal(failed.draft.title, `Trening zachowany ${failure}`);
    assert.deepEqual(failed.draft.postSession, {aerobic: 0, muscular: 5, satisfaction: 7, notes: 'Ta notatka ma przetrwać błąd.'});
    await expect(page.locator('#load-preview strong')).toHaveText('39,0');
    await page.reload();
    await page.getByRole('button', {name: 'Dokończ', exact: true}).click();
    await openSurvey(page);
    await expect(page.locator('[name="post-notes"]')).toHaveValue('Ta notatka ma przetrwać błąd.');
    await expect(page.locator('[data-post-key="aerobic"] input[type="range"]')).toHaveAttribute('aria-valuetext', /^0 — /);
    await expect(page.locator('#load-preview strong')).toHaveText('39,0');
    await saveSurvey(page);
    const recovered = await stored(page);
    assert.equal(recovered.draft, null); assert.equal(recovered.workouts.length, 1);
    assert.equal(recovered.workouts[0].loadSnapshot.value, 39);
    assert.equal(recovered.workouts[0].postSession.aerobic, 0);
    assert.equal(recovered.workouts[0].postSession.satisfaction, 7);
  });
} finally {
  await browser.close();
}
console.log(JSON.stringify({passed: results.every(result => result.passed), scenarios: results}, null, 2));
if (results.some(result => !result.passed)) process.exitCode = 1;
