import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// All mutations are inside a fresh, disposable browser context, never the user's tab.
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:360,height:800}});
const page=await context.newPage(),checks=[],errors=[];
const key='fieldwork-ui-demo-v1',base=process.env.TRAINLEAF_URL||'http://127.0.0.1:4186/';
const qa=new URL('qa/',import.meta.url);
await mkdir(qa,{recursive:true});
const path=name=>fileURLToPath(new URL(name,qa));
page.on('pageerror',error=>errors.push(error.message));
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const expectView=view=>expect(page.locator('#app')).toHaveAttribute('data-view',view);
const selectInput=field=>page.locator(`[data-ex-field="${field}"]`);
async function addCatalog(name){
  await page.locator('[data-picker]').click();
  await page.getByLabel('Szukaj ćwiczenia',{exact:true}).fill(name);
  await page.locator('[data-exercise]').filter({has:page.getByText(name,{exact:true})}).click();
  await page.locator('[data-add-exercise]').click();
  await expectView('editor');
}
async function help(topic,keyboard=true){
  const trigger=page.locator(`[data-help="${topic}"]`).first();
  if(keyboard){await trigger.focus();await trigger.press('Enter')}else await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('#help-description')).not.toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
}
async function large(value){
  await page.locator('.review-tools').evaluate(el=>el.open=true);
  await page.locator('#large').setChecked(value);
  await page.locator('.review-tools').evaluate(el=>el.open=false);
}
async function layout(name){
  const overflow=await page.evaluate(()=>({
    document:document.documentElement.scrollWidth>innerWidth,
    controls:[...document.querySelectorAll('#app input:not([type=hidden]),#app select,#app textarea,#app button,#app h3')].filter(element=>{const rect=element.getBoundingClientRect();return rect.width&&(rect.left<-.5||rect.right>innerWidth+.5)}).map(element=>({text:element.textContent.slice(0,70),name:element.name}))
  }));
  assert.equal(overflow.document,false,name+': document overflow');
  assert.deepEqual(overflow.controls,[],name+': control/text overflow');
  await page.screenshot({path:path(name+'.png'),fullPage:true});
  checks.push(name+': 360 px, long names and controls fit');
}
async function createGroup(){
  await page.locator('[data-ex-action="select"]').click();
  await expect(page.locator('[data-ex-action="create"]')).toBeDisabled();
  const selectors=page.locator('[data-ex-select]');
  await selectors.nth(0).check();
  await expect(page.locator('[data-ex-action="create"]')).toBeDisabled();
  await selectors.nth(1).check();await selectors.nth(2).check();
  await expect(page.locator('[data-ex-action="create"]')).toBeEnabled();
  await page.locator('[data-ex-action="create"]').click();
  await expect(page.locator('.ex-group')).toHaveCount(1);
  await expect(page.locator('.ex-member')).toHaveCount(3);
}
try{
  await page.goto(base);
  await expectView('journal');
  await page.getByRole('button',{name:'Plan',exact:true}).click();
  await page.locator('[data-plan]').click();
  const title='QA · Siła i spokojny bieg';
  await page.getByLabel('Nazwa treningu',{exact:true}).fill(title);
  await page.getByLabel('Data',{exact:true}).fill('2026-10-03');
  await page.getByLabel('Planowany czas (min) · opcjonalnie',{exact:true}).fill('55');
  await addCatalog('Przysiad goblet');
  const first=(await saved()).draft.exercises[0];
  for(const field of ['sets','quantity','rir','tempo','pace','rest'])assert.equal(first[field],'',field+' must not receive a catalog dose');
  assert.equal(first.kg,undefined);
  for(const field of ['sets','quantity','rir'])await expect(selectInput(field)).toHaveValue('');
  await selectInput('sets').fill('3');await selectInput('quantity').fill('8');await selectInput('rir').fill('0');
  await help('rir');
  await page.locator('.ex-details summary').click();
  await selectInput('tempo').fill('2–2–X–1');await selectInput('rest').fill('90');
  await help('strength-tempo');await help('rest',false);
  assert.equal((await saved()).draft.exercises[0].rir,'0');
  checks.push('Catalog doses empty; RIR zero independent of kg; RIR/tempo/rest help Enter or touch, Escape and focus restore');

  await addCatalog('Martwy ciąg rumuński');
  await selectInput('sets').nth(1).fill('3');
  await selectInput('quantity').nth(1).fill('6');
  await selectInput('rir').nth(1).fill('2');
  await page.locator('[data-picker]').click();
  await page.locator('[data-go="custom"]').click();
  const longName='Wiosłowanie jednorącz w podporze z bardzo długą własną nazwą ćwiczenia zawodnika';
  await page.getByLabel('Nazwa',{exact:true}).fill(longName);
  await page.getByLabel('Grupy mięśniowe · oddziel przecinkami',{exact:true}).fill('Plecy, Ramiona');
  await page.getByLabel('Opis wykonania · opcjonalnie',{exact:true}).fill('Własny opis wykonania.');
  await page.getByRole('button',{name:'Dodaj do katalogu',exact:true}).click();
  await page.getByLabel('Szukaj ćwiczenia',{exact:true}).fill(longName);
  await page.locator('[data-exercise]').filter({has:page.getByText(longName,{exact:true})}).click();
  await page.locator('[data-add-exercise]').click();
  await selectInput('sets').nth(2).fill('3');
  await selectInput('quantity').nth(2).fill('10');
  await createGroup();
  await expect(page.locator('.ex-member .ex-number')).toHaveText(['1a','1b','1c']);
  await expect(page.locator('[data-ex-group][data-ex-field="rounds"]')).toHaveValue('3');
  await page.locator('[data-ex-group][data-ex-field="rounds"]').fill('4');
  await page.locator('[data-ex-group][data-ex-field="transitionRest"]').fill('0');
  await page.locator('[data-ex-group][data-ex-field="roundRest"]').fill('120');
  await help('superset');
  await page.locator('.ex-member').first().locator('[data-ex-action="down"]').click();
  await expect(page.locator('.ex-member h3')).toHaveText(['Martwy ciąg rumuński','Przysiad goblet',longName]);
  await expect(page.locator('.ex-member').nth(1).locator('[data-ex-action="down"]')).toBeFocused();
  await page.locator('.ex-member').nth(1).locator('[data-ex-action="detach"]').click();
  await expect(page.locator('.ex-member')).toHaveCount(2);
  const detached=page.locator('.ex-item:not(.ex-member)').filter({has:page.getByRole('heading',{name:'Przysiad goblet',exact:true})});
  await expect(detached.locator('[data-ex-field="sets"]')).toHaveValue('4');
  await expect(detached.locator('[data-ex-field="sets"]')).toBeFocused();
  await page.locator('[data-ex-group-picker]').selectOption({label:'Przysiad goblet'});
  await page.locator('[data-ex-action="append"]').click();
  await expect(page.locator('.ex-member h3')).toHaveText(['Martwy ciąg rumuński',longName,'Przysiad goblet']);
  await page.locator('[data-ex-action="ungroup"]').click();
  await expect(page.locator('.ex-group')).toHaveCount(0);
  for(const input of await selectInput('sets').all())await expect(input).toHaveValue('4');
  await createGroup();
  await page.locator('[data-ex-group][data-ex-field="transitionRest"]').fill('0');
  await page.locator('[data-ex-group][data-ex-field="roundRest"]').fill('120');
  checks.push('Three-member superseries: native selection, order and focus, detach, append, ungroup, rounds become sets, independent transition/round rest');

  await addCatalog('Spokojny bieg');
  await addCatalog('Jazda na rowerze');
  const running=page.locator('.ex-item').filter({has:page.getByRole('heading',{name:'Spokojny bieg',exact:true})});
  const cycling=page.locator('.ex-item').filter({has:page.getByRole('heading',{name:'Jazda na rowerze',exact:true})});
  await running.locator('summary').click();
  await running.locator('[data-ex-field="pace"]').fill('5:30');
  await help('running-pace');
  await cycling.locator('summary').click();
  await expect(cycling.locator('[data-ex-field="pace"]')).toHaveCount(0);
  await expect(cycling).not.toContainText('min/km');
  await page.locator('.ex-details').evaluateAll(items=>items.forEach(el=>el.open=true));
  await layout('iteration-editor-360');
  await large(true);await layout('iteration-editor-200');await large(false);
  const draftId=(await saved()).draft.id;
  await page.locator('#save-workout').click();
  await expectView('plan');
  let workout=(await saved()).workouts.find(w=>w.id===draftId);
  assert.equal(workout.status,'planned');assert.equal(workout.groups.length,1);assert.equal(workout.exercises.length,5);
  assert.equal(workout.groups[0].transitionRest,'0');assert.equal(workout.groups[0].roundRest,'120');
  await page.reload();
  await page.locator(`[data-edit="${draftId}"]`).click();
  await expect(page.locator('.ex-member')).toHaveCount(3);
  await expect(page.locator('[data-ex-group][data-ex-field="rounds"]')).toHaveValue('4');
  checks.push('Exercise modality controls tempo; cycling has no running pace; saved plan and group data survive reload');

  await page.locator('[data-complete]').click();
  await expect(page.locator('[name="duration"]')).toHaveValue('');
  await page.getByLabel('Wykonany czas (min) · opcjonalnie',{exact:true}).fill('48');
  await page.locator('[name="rpe"]').selectOption('7');
  await help('rpe');
  await page.locator('#save-workout').click();
  await expectView('postSession');
  for(const block of await page.locator('[data-post-key]').all()){
    await expect(block.getByRole('slider')).toHaveValue('5');
    await expect(block.getByRole('slider')).toHaveAttribute('aria-valuetext','Bez odpowiedzi');
    await expect(block.locator('.feeling-answer')).toHaveValue('');
  }
  const aerobic=page.locator('[data-post-key="aerobic"]');
  const muscular=page.locator('[data-post-key="muscular"]');
  const satisfaction=page.locator('[data-post-key="satisfaction"]');
  await aerobic.getByRole('slider').press('Home');
  await muscular.getByRole('slider').press('End');
  await muscular.getByRole('button',{name:/Pomiń/}).click();
  await satisfaction.getByRole('slider').press('End');
  await satisfaction.getByRole('slider').press('ArrowLeft');
  await page.locator('[name="post-notes"]').fill('Notatka po sesji, oddzielna od planu.');
  let post=(await saved()).draft.postSession;
  assert.equal(post.aerobic,0);assert.equal(post.muscular,null);assert.equal(post.satisfaction,9);
  await expect(muscular.getByRole('slider')).toHaveAttribute('aria-valuetext','Bez odpowiedzi');
  await expect(muscular.locator('.feeling-answer')).toHaveValue('');
  await layout('iteration-survey-360');
  await large(true);await layout('iteration-survey-200');await large(false);
  await page.getByRole('button',{name:'Zapisz trening',exact:true}).click();
  await expectView('journal');
  await page.reload();
  workout=(await saved()).workouts.find(w=>w.id===draftId);
  assert.equal(workout.status,'completed');assert.equal(workout.rpe,'7');assert.equal(workout.duration,'48');
  assert.equal(workout.postSession.aerobic,0);assert.equal(workout.postSession.muscular,null);assert.equal(workout.postSession.satisfaction,9);
  assert.equal(workout.planned.duration,'55');assert.equal(workout.planned.status,'planned');assert.equal((await saved()).wellness,null);
  await page.locator(`[data-edit="${draftId}"]`).click();
  await page.locator('#save-workout').click();
  await expect(aerobic.getByRole('slider')).toHaveValue('0');
  await expect(muscular.getByRole('slider')).toHaveAttribute('aria-valuetext','Bez odpowiedzi');
  await expect(satisfaction.getByRole('slider')).toHaveValue('9');
  await page.getByRole('button',{name:'Zapisz trening',exact:true}).click();
  checks.push('Completion keeps plan snapshot; survey middle stays unanswered; zero persists, per-question skip becomes null, satisfaction/RPE/day wellness remain separate after reload');

  await page.locator('[data-new]').click();
  await page.getByLabel('Nazwa treningu',{exact:true}).fill('QA · Aktywność bez planu');
  const spontaneousId=(await saved()).draft.id;
  await page.locator('#save-workout').click();
  await expectView('postSession');
  await page.getByRole('button',{name:'Pomiń ankietę i zapisz',exact:true}).click();
  const spontaneous=(await saved()).workouts.find(w=>w.id===spontaneousId);
  assert.deepEqual(spontaneous.postSession,{aerobic:null,muscular:null,satisfaction:null,notes:''});
  assert.equal(spontaneous.rpe,'');
  checks.push('Unplanned activity also opens survey; skipping untouched questionnaire saves three null values, never midpoint5');

  await page.getByRole('button',{name:'Inne',exact:true}).click();
  await page.locator('[data-go="history"]').first().click();
  await page.locator('[data-edit="a"]').click();
  await expect(page.locator('.ex-preserved')).toContainText('16 kg');
  await expect(selectInput('rir')).toHaveValue('2');
  await selectInput('rir').fill('0');
  assert.equal((await saved()).draft.exercises[0].kg,16);
  assert.equal((await saved()).draft.exercises[0].rir,'0');
  assert.equal((await saved()).workouts.find(w=>w.id==='a').exercises[0].kg,16);
  checks.push('Historical kg remain visible and unchanged while editing independent RIR; original history untouched before save');
  assert.deepEqual(errors,[],'No browser exceptions');
  checks.push('No browser exceptions');
  await writeFile(new URL('iteration-editor-results.json',qa),JSON.stringify({checks,errors},null,2));
  console.log(checks.join('\n'));
}catch(error){
  await page.screenshot({path:path('iteration-editor-failure.png'),fullPage:true});
  await writeFile(new URL('iteration-editor-results.json',qa),JSON.stringify({checks,errors,failure:error.message},null,2));
  console.error(await page.locator('#app').innerText());
  throw error;
}finally{await context.close();await browser.close()}
