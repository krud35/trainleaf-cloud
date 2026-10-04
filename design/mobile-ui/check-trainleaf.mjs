import {chromium,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}}),report=[];
const imagePath=n=>fileURLToPath(new URL('qa/trainleaf-'+n+'.png',import.meta.url));
async function inspect(name){
 const contrast=await page.evaluate(()=>{
  const rgba=s=>{const a=s.match(/[\d.]+/g)?.map(Number)||[0,0,0,0];return [a[0],a[1],a[2],a[3]??1]};
  const blend=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
  const lum=c=>c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const failures=[],ratios=[];let node;const walker=document.createTreeWalker(document.querySelector('.shell'),NodeFilter.SHOW_TEXT);
  while(node=walker.nextNode()){
   const text=node.textContent.trim(),el=node.parentElement;if(!text||!el||el.closest('svg,option,script,style'))continue;
   const r=document.createRange();r.selectNode(node);if(!r.getBoundingClientRect().width)continue;
   const css=getComputedStyle(el);if(css.visibility==='hidden')continue;
   let bg=[255,255,255],opacity=1;const ancestors=[];for(let p=el;p;p=p.parentElement)ancestors.unshift(p);
   for(const p of ancestors){
    const st=getComputedStyle(p);bg=blend(rgba(st.backgroundColor),bg);opacity*=Number(st.opacity);
    // Leaf cards use an SVG surface rather than an element background.
    const art=p.querySelector(':scope > .leaf-illustration');
    if(art)for(const selector of ['.leaf-blade','.leaf-wash','.leaf-midrib']){
     const layer=getComputedStyle(art.querySelector(selector));
     const color=rgba(selector==='.leaf-midrib'?layer.stroke:layer.fill);
     color[3]*=Number(layer.opacity);bg=blend(color,bg);
    }
   }
   const ink=rgba(css.color);ink[3]*=opacity;const fg=blend(ink,bg),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   const large=parseFloat(css.fontSize)>=24||(parseFloat(css.fontSize)>=18.66&&Number(css.fontWeight)>=700),target=large?3:4.5;
   ratios.push(ratio);if(ratio<target)failures.push({text:text.slice(0,70),ratio:+ratio.toFixed(2),target,color:css.color,bg});
  }
  return {minimum:+Math.min(...ratios).toFixed(2),failures};
 });
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 report.push({name,overflow,contrast});
 await page.screenshot({path:imagePath(name),fullPage:true});
}
try{
 await page.goto('http://127.0.0.1:4186/');await expect(page).toHaveTitle('Trainleaf · prototyp 04');
 await inspect('today');
 await page.getByRole('button',{name:'＋ Zapisz trening',exact:true}).click();
 await page.getByLabel('Nazwa treningu',{exact:true}).fill('Siła i spokojny powrót do treningów');
 await page.getByRole('button',{name:'＋ Ćwiczenie',exact:true}).click();
 await page.getByRole('button',{name:/Własne ćwiczenie/}).click();
 await page.getByLabel('Nazwa',{exact:true}).fill('Wykrok w tył z uniesieniem kolana i kontrolowanym opuszczaniem ciężaru');
 await page.getByRole('button',{name:'Dodaj do katalogu',exact:true}).click();
 await inspect('library-long');
 await page.getByRole('button',{name:/Wykrok w tył/}).click();await page.getByRole('button',{name:'Dodaj do treningu',exact:true}).click();
 await page.getByLabel('Notatka · opcjonalnie',{exact:true}).fill('Zostawić czas na rozgrzewkę. Zapisać, jak wyglądała ostatnia seria.');
 await inspect('editor');
 await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#large').check();await page.locator('.review-tools').evaluate(el=>el.open=false);await inspect('editor-200');
 await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#large').uncheck();await page.locator('.review-tools').evaluate(el=>el.open=false);
 await page.getByRole('button',{name:'Plan',exact:true}).click();await inspect('plan');
 await page.getByRole('button',{name:/Okresy treningowe/}).click();await page.getByRole('button',{name:/Powrót do regularności/}).click();await inspect('period');
 await page.getByRole('button',{name:'Dzisiaj',exact:true}).click();await page.getByRole('button',{name:'Zrób check-in'}).click();
 await page.getByRole('slider',{name:'Zmęczenie · 0–10',exact:true}).press('End');await inspect('checkin');
 await page.getByRole('button',{name:'Postępy',exact:true}).click();await inspect('progress');
 await page.getByRole('button',{name:'Inne',exact:true}).click();await inspect('more');
 await page.getByRole('button',{name:/Ustawienia.*Twoje sporty/}).click();await page.getByRole('button',{name:'Sporty w profilu',exact:true}).click();await inspect('profile');
 await page.locator('.review-tools').evaluate(el=>el.open=true);await page.locator('#scenario').selectOption('empty');await page.getByRole('button',{name:'Dzisiaj',exact:true}).click();await page.locator('.review-tools').evaluate(el=>el.open=false);await inspect('empty');
 await writeFile(new URL('qa/trainleaf-results.json',import.meta.url),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(report.some(x=>x.overflow||x.contrast.failures.length))process.exitCode=1;
}finally{await browser.close()}
