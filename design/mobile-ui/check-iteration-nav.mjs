import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.TRAINLEAF_PREVIEW_URL||'http://127.0.0.1:4186/';
const storageKey='fieldwork-ui-demo-v1',report=[];
const output=name=>fileURLToPath(new URL(`qa/iteration-${name}`,import.meta.url));
const app=page=>page.locator('#app');
const nav=(page,label)=>page.locator('#nav').getByRole('button',{name:label,exact:true}).click();
async function large(page,on){await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#large').setChecked(on);await page.locator('.review-tools').evaluate(el=>el.open=false);}
async function screenshot(page,name){await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:output(`${name}.png`),fullPage:true});}
async function saved(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);}
async function test(name,run){
  const context=await browser.newContext({viewport:{width:360,height:800}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{await page.goto(base);await expect(page).toHaveTitle(/Trainleaf · prototyp 04/);await run(page);expect(errors).toEqual([]);report.push({name,passed:true});}
  catch(error){await page.screenshot({path:output(`failure-${name}.png`),fullPage:true}).catch(()=>{});report.push({name,passed:false,error:error.message,browserErrors:errors});}
  finally{await context.close();}
}

try{
  await test('navigation-week',async page=>{
    expect((await page.locator('#nav button').allTextContents()).map(text=>text.trim())).toEqual(['Dzisiaj','Plan','Postępy','Inne']);
    for(const label of ['Plan','Postępy','Inne','Dzisiaj']){await nav(page,label);await expect(app(page).getByRole('heading',{level:1,name:label,exact:true})).toBeVisible();await expect(page.locator('#nav button[aria-current="page"]')).toHaveText(label);}
    await page.getByRole('button',{name:'Cały tydzień',exact:true}).click();
    await expect(page.getByRole('button',{name:'Tylko dziś',exact:true})).toHaveAttribute('aria-expanded','true');
    await expect(page.locator('.week-column')).toHaveCount(7);
    await page.locator('.week-column__day[data-week-date="2026-10-04"]').click();
    await expect(app(page).getByRole('heading',{level:1,name:'Plan',exact:true})).toBeVisible();
    await expect(page.locator('.week-day-detail')).toContainText('niedziela, 4 października');
    await expect(page.locator('.week-day-detail')).toContainText('Nogi i plecy');
    await screenshot(page,'nav-plan-360');
    await large(page,true);
    await expect(page.locator('.week-column')).toHaveCount(7);
    const geometry=await page.locator('.week-board__grid').evaluate(grid=>({columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,tops:[...grid.children].map(child=>Math.round(child.getBoundingClientRect().top)),scrolls:grid.parentElement.scrollWidth>grid.parentElement.clientWidth}));
    expect(geometry.columns).toBe(7);expect(new Set(geometry.tops).size).toBe(1);expect(geometry.scrolls).toBe(true);
    await page.locator('.week-board__list summary').click();
    await screenshot(page,'nav-plan-200');
    await large(page,false);
    await page.locator('.week-day-detail [data-week-session="d"]').click();
    await expect(page.getByLabel('Nazwa treningu',{exact:true})).toHaveValue('Nogi i plecy');
    await expect(page.getByRole('button',{name:'Zapisz wykonanie tego planu',exact:true})).toBeDisabled();
    await nav(page,'Dzisiaj');
    await page.locator('.week-mini[data-week-session="c"]').click();
    await expect(page.getByLabel('Nazwa treningu',{exact:true})).toHaveValue('Rzuty i praca nóg');
    await expect(page.getByRole('button',{name:'Zapisz wykonanie tego planu',exact:true})).toBeEnabled();
  });

  await test('hidden-tools',async page=>{
    await nav(page,'Inne');await page.getByRole('button',{name:/^Dostosuj/}).click();
    await page.getByRole('button',{name:'Zapisz skróty',exact:true}).click();
    const original=JSON.stringify((await saved(page)).workouts);
    await page.getByRole('button',{name:/^Dostosuj/}).click();
    for(const checkbox of await page.locator('#modules input[type="checkbox"]').all())await checkbox.uncheck();
    await page.getByRole('button',{name:'Zapisz skróty',exact:true}).click();
    expect((await saved(page)).profile.modules).toEqual([]);
    expect(JSON.stringify((await saved(page)).workouts)).toBe(original);
    await expect(page.locator('.more-shortcuts button')).toHaveCount(0);
    await expect(page.getByRole('button',{name:/^Dostosuj/})).toBeVisible();
    await expect(app(page).getByRole('button',{name:/^Ustawienia/})).toBeVisible();
    await page.locator('.more-all summary').click();
    expect(await page.locator('.more-all button').evaluateAll(buttons=>buttons.map(button=>button.dataset.go))).toEqual(['library','templates','history','wellness','export']);
    await page.locator('.more-all [data-go="history"]').click();
    await expect(app(page).getByRole('heading',{level:1,name:'Historia',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:/Siła całego ciała/})).toBeVisible();
    await page.reload();await nav(page,'Inne');await expect(page.locator('.more-shortcuts button')).toHaveCount(0);
    await page.locator('.more-all summary').click();await large(page,true);await screenshot(page,'nav-hidden-tools-200');
  });

  await test('profile-draft',async page=>{
    const title='Spokojny powrót do treningów z długą nazwą i własnym planem';
    const customOne='Ultimate na plaży i ćwiczenia przygotowania do turniejów';
    const customTwo='Trening koordynacji i równowagi na świeżym powietrzu';
    await page.getByRole('button',{name:'＋ Zapisz trening',exact:true}).click();
    await page.getByLabel('Nazwa treningu',{exact:true}).fill(title);
    await page.getByLabel('Notatka · opcjonalnie',{exact:true}).fill('Ważna notatka szkicu. Zachowaj ją po zmianie profilu.');
    const draftBefore=(await saved(page)).draft;
    await page.getByRole('button',{name:'Zmień sporty w profilu',exact:true}).click();
    const checkedSports=await page.locator('#profile input[name="sport"]:checked').evaluateAll(inputs=>inputs.map(input=>input.value));
    for(const sport of checkedSports)await page.getByLabel(sport,{exact:true}).uncheck();
    await page.getByLabel('Znajdź sport').fill('nieistniejący sport');
    await page.getByRole('button',{name:'Zapisz sporty',exact:true}).click();
    await expect(page.locator('#profile-error')).toContainText('Wybierz przynajmniej jeden sport');
    await expect(page.getByLabel('Znajdź sport')).toHaveValue('nieistniejący sport');
    await expect(page.locator('#profile input[name="sport"]:checked')).toHaveCount(0);
    expect((await saved(page)).draft).toEqual(draftBefore);
    await page.getByLabel('Nazwa sportu',{exact:true}).fill(customOne);await page.getByRole('button',{name:'Dodaj sport',exact:true}).click();
    await page.getByLabel('Znajdź sport').fill('plywanie');await page.getByLabel('Pływanie',{exact:true}).check();
    await page.getByLabel('Znajdź sport').fill('');await page.getByLabel('Nazwa sportu',{exact:true}).fill(customTwo);
    await large(page,true);await screenshot(page,'nav-sports-long-200');await large(page,false);
    await page.getByRole('button',{name:'Zapisz sporty',exact:true}).click();
    const result=await saved(page);expect(result.profile.sports).toEqual(expect.arrayContaining([customOne,customTwo,'Pływanie']));expect(result.draft).toEqual(draftBefore);
    await expect(page.getByLabel('Nazwa treningu',{exact:true})).toHaveValue(title);
    await expect(page.locator('#workout textarea[name="notes"]')).toHaveValue(draftBefore.notes);
    await expect(page.getByLabel('Dyscyplina',{exact:true})).toHaveValue('Ultimate frisbee');
    expect(await page.getByLabel('Dyscyplina',{exact:true}).locator('option').allTextContents()).toEqual(expect.arrayContaining([customOne,customTwo,'Pływanie','Ultimate frisbee']));
    await page.reload();await page.getByRole('button',{name:'Dokończ',exact:true}).click();
    await expect(page.getByLabel('Nazwa treningu',{exact:true})).toHaveValue(title);
    await page.getByRole('button',{name:'Zmień sporty w profilu',exact:true}).click();await expect(page.getByLabel(customOne,{exact:true})).toBeChecked();await expect(page.getByLabel(customTwo,{exact:true})).toBeChecked();
  });

  await test('periods-and-future',async page=>{
    const overlap='Krótki blok techniczny nakładający się na przygotowania jesienne';
    await nav(page,'Plan');await page.getByRole('button',{name:/^Okresy treningowe/}).click();await page.getByRole('button',{name:'＋ Dodaj okres',exact:true}).click();
    await page.getByLabel('Nazwa',{exact:true}).fill(overlap);await page.getByLabel('Od',{exact:true}).fill('2026-10-01');await page.getByLabel('Do',{exact:true}).fill('2026-10-06');await page.getByRole('button',{name:'Zapisz okres',exact:true}).click();
    await nav(page,'Dzisiaj');await page.getByRole('button',{name:'＋ Zapisz trening',exact:true}).click();await page.getByLabel('Nazwa treningu',{exact:true}).fill('Sesja kontrolna okresów i daty');
    await expect(page.locator('#editor-period li')).toHaveCount(3);await expect(page.locator('#editor-period')).toContainText(overlap);await expect(page.locator('#editor-period')).toContainText('W ramach: Przygotowania jesienne');
    await large(page,true);await screenshot(page,'nav-periods-long-200');await large(page,false);
    await page.getByLabel('Data',{exact:true}).fill('2026-11-15');await expect(page.locator('#editor-period li')).toHaveCount(1);await expect(page.locator('#editor-period')).toContainText('Przygotowania jesienne');await expect(page.locator('#save-workout')).toBeDisabled();
    await page.getByLabel('Data',{exact:true}).fill('2026-12-01');await expect(page.locator('#editor-period')).toContainText('Brak okresu treningowego');await expect(page.locator('#editor-period li')).toHaveCount(0);
    await page.getByLabel('Data',{exact:true}).fill('2026-10-03');await expect(page.locator('#editor-period li')).toHaveCount(3);await expect(page.locator('#save-workout')).toBeEnabled();
    await page.getByLabel('Data',{exact:true}).fill('2026-10-04');await expect(page.locator('#save-workout')).toBeDisabled();await page.getByRole('button',{name:'Zapisz jako plan',exact:true}).click();await expect(page.getByRole('button',{name:'Zapisz wykonanie tego planu',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Zapisz plan',exact:true}).click();
    const result=await saved(page),session=result.workouts.find(workout=>workout.title==='Sesja kontrolna okresów i daty');expect(session.date).toBe('2026-10-04');expect(session.status).toBe('planned');expect(result.workouts.some(workout=>workout.date>'2026-10-03'&&workout.status==='completed')).toBe(false);
    await expect(app(page).getByRole('heading',{level:1,name:'Plan',exact:true})).toBeVisible();
  });
}finally{
  await browser.close();
  await writeFile(output('navigation-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(report.some(result=>!result.passed))process.exitCode=1;
}
