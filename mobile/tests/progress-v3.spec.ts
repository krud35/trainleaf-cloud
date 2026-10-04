import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { createServer } from 'node:net';
import type { LocalSnapshot } from '../src/data/domain';
type QaWindow = Window & { qa: {
  fail: () => void; refreshFail: () => void; advance: () => void; exit: () => void;
  calls: () => { kind: string; epoch: number; id?: string; revision?: number; input?: Record<string, unknown> }[];
  snapshot: () => LocalSnapshot;
} };
const root = resolve(import.meta.dirname, '../..');
const featureRoot = join(root, 'mobile/src/features/progress');
let directory: string, server: ChildProcess;
let route: string;
let baseURL: string;
test.use({ viewport: { width: 360, height: 800 } });
// Test-only fixture is generated in an isolated directory and never imported by App.
test.beforeAll(async () => {
  const port = await new Promise<number>(resolve => { const lease = createServer(); lease.listen(0, '127.0.0.1', () => { const address = lease.address(); const port = typeof address === 'object' && address ? address.port : 0; lease.close(() => resolve(port)); }); });
  baseURL = `http://127.0.0.1:${port}`;
  directory = await mkdtemp(join(featureRoot, '.qa-v3-'));
  route = `/src/features/progress/${directory.split(/[\\/]/).at(-1)}/index.html`;
  await writeFile(join(directory, 'index.html'), '<html lang="pl"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="./harness.tsx"></script></body></html>');
  await writeFile(join(directory, 'harness.tsx'), `
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {WellnessView} from '../../../ui/WellnessView';
import {ProgressView} from '../../../ui/ProgressView';
import {WorkoutEntryDetail} from '../../entry-details/WorkoutEntryDetail';
import {snapshotSchema,workoutSchema} from '../../../data/domain';
import '../../../styles.css';
import '../../../ui/trainleaf.css';
import '../../../ui/layout.css';
const meta={revision:1,createdAt:'2026-10-03T10:00:00.000Z',updatedAt:'2026-10-03T10:00:00.000Z',syncState:'local-only'};
let snapshot={...snapshotSchema.parse({profile:{...meta,id:'local-profile',displayName:'QA',roles:['athlete'],sportIds:['ultimate'],modules:['journal']},workouts:[],customExercises:[],exerciseNotes:[],templates:[],periods:[],wellness:[{...meta,profileId:'local-profile',id:'first',date:'2026-10-03',slot:'morning',answers:{sleepHours:0,fatigue:0},notes:'Pierwszy zapis'}],goals:[],drafts:[]}),epoch:42};
const workout=workoutSchema.parse({...meta,id:'workout',profileId:'local-profile',sportId:'ultimate',trainingType:'strength',date:'2026-10-03',deletedAt:null,title:'Siła testowa',status:'completed',durationMinutes:0,postWorkout:{aerobicFatigue:0,muscularFatigue:null,satisfaction:3,notes:'Ankieta'},supersets:[{id:'sup',section:'main',transitionRest:'20 s',roundRest:'90 s'}],sections:{warmup:[],main:['a','b'].map(id=>({id,supersetId:'sup',exercise:{id,name:'Ćwiczenie '+id,category:'strength',metric:'kg',shares:[],video:'',notes:'Opis'},planned:{sets:3,quantity:8,kg:0,rir:0,tempo:'2-2-2'},actual:null})),cooldown:[]}});
let fail=false,refreshFail=false,calls=[],guard;
window.qa={fail:()=>fail=true,refreshFail:()=>refreshFail=true,calls:()=>calls,snapshot:()=>snapshot,exit:()=>guard?.(()=>document.body.dataset.exited='yes')};
const repo={async createWellness(input,epoch){calls.push({kind:'create',epoch,input});if(fail){fail=false;throw Error('Brak miejsca na zapis')}if(epoch!==snapshot.epoch)throw Error('Konflikt epoki');const saved={...input,...meta,id:'new-'+calls.length};snapshot={...snapshot,wellness:[...snapshot.wellness,saved]};return saved;},async updateWellness(id,revision,input,epoch){calls.push({kind:'update',id,revision,epoch});if(fail){fail=false;throw Error('Brak miejsca na zapis')}if(epoch!==snapshot.epoch||revision!==snapshot.wellness.find(w=>w.id===id).revision)throw Error('Konflikt epoki lub rewizji');const saved={...input,...meta,id,revision:revision+1};snapshot={...snapshot,wellness:snapshot.wellness.map(w=>w.id===id?saved:w)};return saved;},async createGoal(input,epoch){calls.push({kind:'goal',input,epoch});const saved={...input,...meta,id:'goal'};snapshot={...snapshot,goals:[saved]};return saved;}};
function Harness(){const [data,setData]=useState(snapshot),[closed,setClosed]=useState(false),[notice,setNotice]=useState(''),[warning,setWarning]=useState(''),[edited,setEdited]=useState(false);window.qa.advance=()=>{snapshot={...snapshot,epoch:43,wellness:snapshot.wellness.map(w=>w.id==='first'?{...w,revision:2}:w)};setData({...snapshot})};const params=new URLSearchParams(location.search),mode=params.get('mode'),origin=params.get('origin');const changed=async()=>{if(refreshFail)throw Error('Odczyt');setData({...snapshot})};return <main style={{maxWidth:600,padding:18,margin:'auto'}}>{notice&&<p role="status">{notice}</p>}{warning&&<p role="alert">{warning}</p>}{closed?<h1>Punkt wejścia Dzisiaj</h1>:mode==='progress'?<ProgressView repository={repo} snapshot={data} onChanged={changed}/>:mode==='workout'?<><WorkoutEntryDetail workout={workout} periods={[{id:'period',name:'Okres automatyczny',level:'micro'}]} onEdit={()=>setEdited(true)} onClose={()=>setClosed(true)}/>{edited&&<p role="status">Jawna edycja</p>}</>:<WellnessView repository={repo} snapshot={data} onChanged={changed} initialMode={mode||'trends'} entryId={mode==='edit'||mode==='detail'?'first':undefined} onClose={origin?()=>setClosed(true):undefined} onSavedNotice={origin?setNotice:undefined} onRefreshError={origin?setWarning:undefined} registerExitGuard={fn=>{guard=fn;return()=>guard=undefined}}/>}</main>};createRoot(document.getElementById('root')).render(<Harness/>);
`);
  let serverOutput = '';
  server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), '--config', join(root, 'mobile/vite.config.ts'), '--port', String(port), '--host', '127.0.0.1'], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout?.on('data', data => serverOutput += data);
  server.stderr?.on('data', data => serverOutput += data);
  for (let attempt = 0; attempt < 100; attempt++) { try { if ((await fetch(baseURL + route)).ok) return; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(`Serwer testowy nie wystartował: ${serverOutput}`);
});
test.afterAll(async () => {
  server?.kill();
  if (directory && dirname(resolve(directory)) === resolve(featureRoot)) {
    await unlink(join(directory, 'index.html')); await unlink(join(directory, 'harness.tsx')); await rmdir(directory);
  }
});
async function open(page: Page, query = '') { await page.clock.setFixedTime(new Date('2026-10-04T08:00:00+02:00')); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); await page.addInitScript(() => localStorage.setItem('trainleaf-language', 'pl')); await page.goto(baseURL + route + query); await expect(page.locator('main')).toBeVisible(); expect(errors).toEqual([]); }
async function newEntry(page: Page) { await page.getByRole('button', { name: 'Nowy check-in', exact: true }).first().click(); await page.getByLabel(/^Długość snu/).fill('7.25'); }
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }

test('default trends → entry summary → explicit edit → durable save closes; revision/epoch survive', async ({ page }) => {
  await open(page);
  await expect(page.locator('.wv-form')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Trendy samopoczucia' })).toBeVisible();
  await page.locator('.wv-record').click();
  await expect(page.getByRole('heading', { name: 'Twój check-in' })).toBeVisible();
  await expect(page.locator('.ed-facts')).toContainText('0 h');
  expect(await page.evaluate(() => (window as QaWindow).qa.calls())).toHaveLength(0);
  await page.getByRole('button', { name: 'Edytuj wpis', exact: true }).click();
  await page.getByLabel(/^Długość snu/).fill('8');
  await page.getByRole('button', { name: 'Zapisz zmiany samopoczucia' }).click();
  await expect(page.locator('.wv-form')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Zapisano samopoczucie');
  expect(await page.evaluate(() => (window as QaWindow).qa.calls())).toMatchObject([{ kind: 'update', id: 'first', revision: 1, epoch: 42 }]);
});

test('wellbeing displays one selected metric and slot with calendar range completeness', async ({ page }) => {
  await open(page);
  const trends = page.getByRole('region', { name: 'Trendy samopoczucia' });
  await expect(trends.locator('.wbt-metric')).toHaveCount(1);
  await expect(trends.getByRole('combobox', { name: 'Obserwacja', exact: true })).toHaveValue('sleepHours');
  await expect(trends.locator('.wbt-summary')).toContainText('1 / 4 dni');
  await trends.getByRole('combobox', { name: 'Obserwacja', exact: true }).selectOption('fatigue');
  await expect(trends.locator('.wbt-summary')).toContainText('0 / 10');
  await trends.getByLabel('Pora trendów').selectOption('evening');
  await expect(trends.locator('.wbt-summary')).toContainText('0 / 4 dni');
  await expect(trends.getByRole('heading', { name: 'Jeszcze bez odpowiedzi' })).toBeVisible();
  await trends.getByRole('button', { name: 'Tydzień', exact: true }).click();
  await expect(trends.locator('.wbt-summary')).toContainText('0 / 7 dni');
  expect(await page.evaluate(() => (window as QaWindow).qa.calls())).toHaveLength(0);
});

test('save error retains form; retry returns to Today even when refresh fails', async ({ page }) => {
  await open(page, '?mode=new&origin=today');
  await page.getByLabel(/^Długość snu/).fill('7.25');
  await page.evaluate(() => (window as QaWindow).qa.fail());
  await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Brak miejsca');
  await expect(page.getByLabel(/^Długość snu/)).toHaveValue('7.25');
  await page.evaluate(() => (window as QaWindow).qa.refreshFail());
  await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Punkt wejścia Dzisiaj' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Zapisano samopoczucie');
  await expect(page.getByRole('alert')).toContainText('Wpis został zapisany');
  expect((await page.evaluate(() => (window as QaWindow).qa.snapshot())).wellness).toHaveLength(2);
});

test('new check-in never silently edits a duplicate; exit guard traps focus and preserves unsaved responses', async ({ page }) => {
  await open(page); await newEntry(page);
  await page.getByLabel('Data', { exact: true }).fill('2026-10-03');
  await expect(page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true })).toBeDisabled();
  await page.evaluate(() => (window as QaWindow).qa.exit());
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Anuluj' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Odrzuć zmiany i przejdź' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel(/^Długość snu/)).toHaveValue('7.25');
  expect(await page.evaluate(() => document.body.dataset.exited)).toBeUndefined();
  await page.evaluate(() => (window as QaWindow).qa.exit());
  await dialog.getByRole('button', { name: 'Odrzuć zmiany i przejdź' }).click();
  expect(await page.evaluate(() => document.body.dataset.exited)).toBe('yes');
});

test('360px and 200% text preserve progress/trend/detail layout; help opens with keyboard and Escape restores focus', async ({ page }, testInfo) => {
  await open(page, '?mode=progress');
  await page.addStyleTag({ content: 'html {font-size:200% !important}' });
  await noOverflow(page);
  await page.locator('.pv-filters summary').click(); await noOverflow(page);
  await page.locator('.pv-filters summary').click();
  const help = page.getByRole('button', { name: 'Wyjaśnienie: Zapisany czas', exact: true });
  await help.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('note')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('note')).toHaveCount(0); await expect(help).toBeFocused();
  await page.getByRole('button', { name: 'Samopoczucie', exact: true }).click(); await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('wellbeing-360-text200.png'), fullPage: true });
  await open(page, '?mode=new'); await page.addStyleTag({ content: 'html {font-size:200% !important}' }); await noOverflow(page);
  await page.getByLabel(/^Długość snu/).fill('7.25'); await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('form-360-text200.png'), fullPage: true });
  await open(page, '?mode=workout'); await page.addStyleTag({ content: 'html {font-size:200% !important}' }); await noOverflow(page);
  await expect(page.locator('.ed-detail')).toContainText('Okres automatyczny');
  await expect(page.locator('.ed-exercises')).toContainText('RIR 0');
  await expect(page.locator('.ed-exercises')).toContainText('2-2-2');
  await expect(page.locator('.ed-exercises')).toContainText('Superseria 1');
  expect(await page.evaluate(() => (window as QaWindow).qa.calls())).toHaveLength(0);
  await page.getByRole('button', { name: 'Edytuj trening', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Jawna edycja');
});

test('sleep goal has no default or sport filter and persists an explicit target', async ({ page }) => {
  await open(page, '?mode=progress');
  await page.getByRole('button', { name: 'Dodaj cel' }).click();
  await page.getByLabel('Nazwa celu', { exact: true }).fill('Mój sen');
  await page.getByRole('combobox', { name: /^Miara celu/ }).selectOption('sleepAverageHours');
  await expect(page.getByLabel('Twój cel snu (godziny)', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Sport celu', { exact: true })).toHaveCount(0);
  await page.getByLabel('Twój cel snu (godziny)', { exact: true }).fill('7.3');
  await page.getByRole('button', { name: 'Zapisz cel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mój sen', exact: true })).toBeVisible();
  const call = (await page.evaluate(() => (window as QaWindow).qa.calls()))[0];
  expect(call.epoch).toBe(42); expect(call.input?.sportId).toBeNull(); expect(call.input?.target).toBe(7.3);
});






test('snapshot refresh does not replace the editor revision/epoch; conflict retains the answers', async ({ page }) => {
  await open(page, '?mode=edit');
  await page.getByLabel(/^Długość snu/).fill('8.25');
  await page.evaluate(() => (window as QaWindow).qa.advance());
  await page.getByRole('button', { name: 'Zapisz zmiany samopoczucia' }).click();
  await expect(page.getByRole('alert')).toContainText('Konflikt epoki lub rewizji');
  await expect(page.getByLabel(/^Długość snu/)).toHaveValue('8.25');
  expect(await page.evaluate(() => (window as QaWindow).qa.calls())).toMatchObject([{ kind: 'update', id: 'first', revision: 1, epoch: 42 }]);
});

test('standalone wellbeing with navigation callbacks returns to its own trends after saving and detail back', async ({ page }) => {
  await open(page, '?origin=wellness');
  await page.locator('.wv-record').click();
  await page.getByRole('button', { name: '← Wróć do samopoczucia', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Trendy samopoczucia' })).toBeVisible();
  await newEntry(page);
  await page.getByRole('button', { name: 'Zapisz samopoczucie', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Trendy samopoczucia' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveText('Zapisano samopoczucie');
  await expect(page.getByRole('heading', { name: 'Punkt wejścia Dzisiaj' })).toHaveCount(0);
});

