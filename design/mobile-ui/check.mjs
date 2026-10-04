import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir(new URL('qa/',import.meta.url),{recursive:true});
await page.goto('http://127.0.0.1:4186');
await page.screenshot({path:fileURLToPath(new URL('qa/journal-360.png',import.meta.url)),fullPage:true});
const checks=[];
for(const v of ['journal','history','plan','library','progress','settings','onboarding','wellness','period','templates','export']){
 await page.evaluate(v=>document.querySelector('#nav').insertAdjacentHTML('beforeend',`<button data-go="${v}" id="test-nav">Test</button>`),v);await page.locator('#test-nav').click();
 checks.push({view:v,width:360,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#large').check();checks.push({view:v,text:'200%',overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.locator('#large').uncheck();
}
await page.getByRole('button',{name:'Dzisiaj',exact:true}).click();await page.getByRole('button',{name:'＋ Zapisz trening',exact:true}).click();
await page.getByLabel('Nazwa treningu',{exact:true}).fill('Test szkicu');await page.getByLabel('Notatka · opcjonalnie',{exact:true}).fill('Zachowaj treść');await page.getByRole('button',{name:'Zostaw szkic'}).click();await page.reload();await page.getByRole('button',{name:'Dokończ'}).click();
if(await page.getByLabel('Nazwa treningu',{exact:true}).inputValue()!=='Test szkicu')throw Error('Draft lost');
await page.getByRole('button',{name:'＋ Ćwiczenie',exact:true}).click();await page.getByLabel('Szukaj ćwiczenia').fill('goblet');await page.getByRole('button',{name:/Przysiad goblet/}).click();await page.getByRole('button',{name:'Dodaj do treningu',exact:true}).click();
await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#scenario').selectOption('full');await page.getByRole('button',{name:'Zapisz trening',exact:true}).click();if(!await page.locator('#save-error').textContent())throw Error('Missing save error');
await page.locator('#scenario').selectOption('normal');await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#large').check();checks.push({view:'editor',text:'200%',overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.locator('.review-tools').evaluate(el=>el.open=false);await page.screenshot({path:fileURLToPath(new URL('qa/editor-200.png',import.meta.url)),fullPage:true});await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#large').uncheck();await page.getByRole('button',{name:'Zapisz trening',exact:true}).click();
if(!await page.getByRole('button',{name:/Test szkicu/}).count())throw Error('Save missing');
await page.evaluate(()=>localStorage.clear());await page.reload();
await writeFile(new URL('qa/results.json',import.meta.url),JSON.stringify({checks,errors,draftReload:true,exercisePicker:true,saveError:true,saveRecovery:true},null,2));
console.log(JSON.stringify({checks,errors}));await browser.close();if(errors.length||checks.some(x=>x.overflow))process.exitCode=1;

