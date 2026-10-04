import {chromium,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}}),checks=[];
const imagePath=name=>fileURLToPath(new URL('qa/'+name,import.meta.url));
try{
 await page.goto('http://127.0.0.1:4186/');
 await page.locator('.today-context').screenshot({path:imagePath('goal-period.png')});
 await page.getByRole('button',{name:'Zrób check-in'}).click();
 await page.getByRole('button',{name:'Zapisz check-in'}).click();
 await expect(page.getByRole('heading',{name:'Check-in',exact:true})).toBeVisible();
 await expect(page.getByText('Uzupełnij przynajmniej jedną odpowiedź.')).toBeVisible();
 checks.push('Unselected sliders do not count as answers');
 for(const slot of ['Rano','W ciągu dnia','Wieczorem']){

  await page.getByLabel('Pora dnia',{exact:true}).selectOption(slot);
  for(const slider of await page.getByRole('slider').all()){
   const min=Number(await slider.getAttribute('min')),max=Number(await slider.getAttribute('max')),name=await slider.getAttribute('aria-label'),captions=[];
   await slider.press('Home');
   for(let value=min;value<=max;value++){
    if(value>min)await slider.press('ArrowRight');
    await expect(slider).toHaveValue(String(value));
    const block=slider.locator('..');
    captions.push(await block.locator('.feeling-caption').textContent());
    await expect(block.locator('.feeling-answer')).toHaveValue(String(value));
    await expect(slider).toHaveAttribute('aria-valuetext',`${value} — ${captions.at(-1)}`);
   }
   if(new Set(captions).size!==max-min+1||captions.some(c=>!c||c.includes('undefined')))throw Error('Missing distinct labels: '+name);
   await slider.locator('..').getByRole('button',{name:/Pomiń:/}).click();
   await expect(slider.locator('..').locator('.feeling-answer')).toHaveValue('');
   checks.push(`${slot}: ${name}, every label + keyboard + skip`);
  }
 }
 await page.getByLabel('Pora dnia',{exact:true}).selectOption('Rano');
 const fatigue=page.getByRole('slider',{name:'Zmęczenie · 0–10',exact:true});
 await fatigue.press('Home');await page.getByRole('button',{name:'Zapisz check-in'}).click();
 await page.reload();await page.locator('.checkin-done').click();
 await expect(page.getByRole('slider',{name:'Zmęczenie · 0–10',exact:true})).toHaveValue('0');
 await expect(page.getByText('Czuję pełną świeżość',{exact:true})).toBeVisible();
 await expect(page.locator('[name="answer-Jakość snu"]')).toHaveValue('');
 checks.push('Zero persists, unanswered values stay empty after reload');
 await page.getByLabel('Pora dnia',{exact:true}).selectOption('W ciągu dnia');
 await page.getByRole('slider',{name:'Energia · 1–5',exact:true}).press('End');
 const stress=page.getByRole('slider',{name:'Stres · 0–10',exact:true});await stress.press('Home');await stress.press('ArrowRight');await stress.press('ArrowRight');
 await page.locator('#wellness-fields').screenshot({path:imagePath('checkin-sliders.png')});
 await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#large').check();await page.locator('.review-tools').evaluate(el=>el.open=false);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow at 200%');
 await page.getByRole('button',{name:'Dzisiaj',exact:true}).click();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Context cards overflow at 200%');
 checks.push('360 px and 200% text, sliders and context cards');
 await writeFile(new URL('qa/slider-results.json',import.meta.url),JSON.stringify({checks},null,2));console.log(checks.join('\n'));
}catch(error){await page.screenshot({path:imagePath('slider-debug.png'),fullPage:true});console.log(await page.locator('main').innerText());throw error}finally{await browser.close()}


