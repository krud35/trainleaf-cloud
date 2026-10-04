import {esc,icon,typeOf,helpButton} from './ui-core.js';
import {loadSummary} from './load-model.js';

const dayMs=86400000;
const dateValue=date=>new Date(`${date}T12:00:00Z`);
const iso=date=>date.toISOString().slice(0,10);
const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(dateValue(date).valueOf())&&iso(dateValue(date))===date;
const addDays=(day,amount)=>iso(new Date(dateValue(day).valueOf()+amount*dayMs));
const numeric=value=>value===null||value===undefined||!['number','string'].includes(typeof value)||String(value).trim()===''?null:Number.isFinite(Number(value))?Number(value):null;
const number=value=>value===null?'—':new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1}).format(value);
const sleepNumber=value=>value===null?'—':new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2}).format(value);
const shortDate=day=>validDate(day)?new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'short',timeZone:'UTC'}).format(dateValue(day)):'';
const button=(label,attrs='',cls='')=>`<button type="button" class="${cls}" ${attrs}>${label}</button>`;
const go=(label,target,cls='insight-link')=>button(`${label}${icon('arrow')}`,`data-go="${target}"`,cls);
const botanical=()=>'<svg class="insight-botanical" viewBox="0 0 120 150" aria-hidden="true"><path d="M22 144Q61 92 85 14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M41 112Q7 81 15 53Q55 63 41 112M57 81Q76 45 108 48Q101 84 57 81M72 50Q39 24 53 6Q83 19 72 50" fill="currentColor" opacity=".28"/></svg>';
const heading=(title,sub)=>`<div class="page-heading"><h1>${title}</h1>${sub?`<p class="muted">${esc(sub)}</p>`:''}</div>`;
const rangeNames=[['week','Tydzień'],['month','Miesiąc'],['six-months','6 miesięcy']];
export const wellnessSlots=['Rano','W ciągu dnia','Wieczorem'];
export const wellnessMetrics={
 'Rano':[{name:'Sen (godziny)',max:24,unit:'h'},{name:'Jakość snu',max:5,unit:'/ 5'},{name:'Zmęczenie',max:10,unit:'/ 10'},{name:'Bolesność mięśni',max:10,unit:'/ 10'}],
 'W ciągu dnia':[{name:'Energia',max:5,unit:'/ 5'},{name:'Stres',max:10,unit:'/ 10'},{name:'Nastrój',max:5,unit:'/ 5'},{name:'Koncentracja',max:5,unit:'/ 5'}],
 'Wieczorem':[{name:'Zmęczenie',max:10,unit:'/ 10'},{name:'Bolesność mięśni',max:10,unit:'/ 10'},{name:'Stres',max:10,unit:'/ 10'},{name:'Czas na odpoczynek',max:5,unit:'/ 5'}]
};

/** Calendar ranges end today; future plans and future observations never count. */
export function insightRange(today,range='week'){
 if(!validDate(today))throw new RangeError('Wymagana poprawna data today.');
 let start=today;
 if(range==='six-months'){
  const date=dateValue(today),day=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()-6);
  const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,last));start=iso(date);
 }else if(range==='month')start=today.slice(0,7)+'-01';
 else start=addDays(today,-((dateValue(today).getUTCDay()+6)%7));
 return {start,end:today,days:Math.round((dateValue(today)-dateValue(start))/dayMs)+1};
}
const within=(entry,period)=>validDate(entry.date)&&entry.date>=period.start&&entry.date<=period.end;
const sorted=rows=>[...rows].sort((a,b)=>b.date.localeCompare(a.date)||(b.time||'').localeCompare(a.time||''));
const dedupeEntries=entries=>entries.filter((entry,index,all)=>validDate(entry.date)&&wellnessSlots.includes(entry.slot)&&all.findIndex(x=>x.date===entry.date&&x.slot===entry.slot)===index);
export function progressFacts(workouts,today,range='week'){
 const period=insightRange(today,range),done=sorted(workouts.filter(w=>w.status==='completed'&&within(w,period)));
 const timed=done.filter(w=>numeric(w.duration)!==null&&numeric(w.duration)>=0),minutes=timed.reduce((sum,w)=>sum+numeric(w.duration),0),activeDays=new Set(done.map(w=>w.date)).size;
 const rated=done.filter(w=>numeric(w.duration)!==null&&numeric(w.duration)>=0&&numeric(w.rpe)!==null&&numeric(w.rpe)>=0&&numeric(w.rpe)<=10);
 return {period,done,timed,minutes:timed.length?minutes:done.length?null:0,activeDays,regularity:Math.round(activeDays/period.days*100),rpeCount:rated.length,rpeTotal:rated.length?rated.reduce((sum,w)=>sum+numeric(w.duration)*numeric(w.rpe),0):null};
}
function rangeButtons(range,attribute){return `<div class="insight-ranges" aria-label="Zakres czasu">${rangeNames.map(([value,label])=>button(label,`${attribute}="${value}" aria-pressed="${value===range}"`,value===range?'primary':'')).join('')}</div>`;}
function activityChart(done,period){
 const daily=period.days<=14,bucketDays=daily?1:7,buckets=[];let start=period.start;
 while(start<=period.end){const end=addDays(start,bucketDays-1)>period.end?period.end:addDays(start,bucketDays-1);buckets.push({start,end,count:done.filter(w=>w.date>=start&&w.date<=end).length});start=addDays(end,1);}
 const max=Math.max(1,...buckets.map(b=>b.count)),barWidth=280/buckets.length;
 return `<div class="insight-activity"><span class="eyebrow">${daily?'Dzień po dniu':'Tygodnie w tym okresie'}</span><svg viewBox="0 0 300 82" role="img" aria-label="${esc(buckets.map(b=>`${shortDate(b.start)}: liczba sesji ${b.count}`).join('; '))}"><path d="M10 74H290" stroke="#aab9a0"/>${buckets.map((b,i)=>`<rect x="${10+i*barWidth+barWidth*.12}" y="${74-b.count/max*56}" width="${barWidth*.76}" height="${b.count/max*56}" rx="2" fill="${i===buckets.length-1?'#41664d':'#a1b48f'}"/>`).join('')}</svg><div class="insight-chart-ends"><span>${shortDate(period.start)}</span><span>${shortDate(period.end)}</span></div></div>`;
}
export function renderProgressView({workouts=[],wellness=[],goals=[],goal='',today,range='week'}){
 const f=progressFacts(workouts,today,range),loads=loadSummary(f.done,today),checkins=dedupeEntries(wellness).filter(e=>within(e,f.period));
 const typeCounts=new Map();for(const w of f.done){const type=typeOf(w);typeCounts.set(type.label,(typeCounts.get(type.label)||0)+1);}const most=[...typeCounts].sort((a,b)=>b[1]-a[1])[0];
 const ratings=f.done.filter(w=>w.postSession).slice(0,4);
 return `<div class="insights-view">${heading('Postępy',`${shortDate(f.period.start)} – ${shortDate(f.period.end)} · zapisane wykonanie`)}${rangeButtons(range,'data-progress-range')}
 <section class="insight-accomplished" aria-labelledby="accomplished-title">${botanical()}<span class="eyebrow">Twoja wykonana praca</span><h2 id="accomplished-title">${f.done.length?'To już za Tobą.':'Miejsce na Twoją historię.'}</h2><div class="insight-metrics"><div><strong>${f.done.length}</strong><span>ukończone sesje</span></div><div><strong>${f.activeDays}</strong><span>dni z aktywnością</span></div><div><strong>${number(f.minutes)}</strong><span>zapisane minuty</span></div><div><strong>${f.regularity}<small>%</small></strong><span>regularność dni</span></div></div><p class="insight-footnote">Aktywność w ${f.activeDays} z ${f.period.days} dni tego zakresu.${f.timed.length<f.done.length?` Czas zapisany w ${f.timed.length} z ${f.done.length} sesji.`:''}</p></section>
 <section class="insight-period"><h2>Rytm tego okresu</h2>${f.done.length?`<p>${most?`Najczęstszy rodzaj: ${esc(most[0])} (${most[1]}). `:''}${f.timed.length?`Średni zapisany czas sesji: ${number(f.minutes/f.timed.length)} min.`:'Czas sesji czeka na uzupełnienie.'}</p>${activityChart(f.done,f.period)}`:'<p>W tym zakresie nie ma jeszcze ukończonych sesji. Wpisy utworzą podsumowanie.</p>'}<p class="insight-footnote">${checkins.length} check-inów w ${new Set(checkins.map(e=>e.date)).size} dniach. To osobna historia samopoczucia.</p></section>
 <div class="insight-links">${go('Samopoczucie i trendy','wellnessTrends')}${go(`Cele${goals.length?' · '+goals.length:''}`,'goals')}${go('Historia treningów','history')}</div>
 <details class="insight-analysis"><summary>Analiza wysiłku i obciążenia</summary><div class="label-help"><h2>Czas × RPE</h2>${helpButton('rpe')}</div><strong class="insight-value">${number(f.rpeTotal)}</strong><p>${f.rpeCount} z ${f.done.length} sesji ma zapisany czas i RPE.</p><div class="label-help"><h2>Trainleaf load</h2>${helpButton('trainleaf-load')}</div><strong class="insight-value">${number(loads.total)}</strong><p>${loads.calculatedCount} z ${loads.completedCount} sesji ma zapisany wynik.${loads.missingCount?' Bez wyniku: '+loads.missingCount+'.':''}</p>${loads.mentalCount?`<p>Mentalne: ${loads.mentalCount} · czas pozostaje w statystykach.</p>`:''}${loads.mixedAlgorithms?'<p>Suma zapisanych wyników z różnych wersji algorytmu.</p>':''}<p class="insight-footnote">Brak danych nie oznacza zera. To opis zapisów; większy wynik nie jest celem.</p></details>
 <section class="insight-ratings"><h2>Ostatnie oceny po treningu</h2>${ratings.map(w=>`<button class="insight-rating" data-edit="${esc(w.id)}"><strong>${esc(w.title)}</strong><small>${shortDate(w.date)}</small><span class="insight-rating-values">${[['aerobic','Oddech'],['muscular','Mięśnie'],['satisfaction','Satysfakcja']].map(([key,label])=>`<span>${label}<b>${number(numeric(w.postSession[key]))}${numeric(w.postSession[key])!==null?' / 10':''}</b></span>`).join('')}</span></button>`).join('')||'<p class="muted">Nie ma jeszcze ocen po treningu w tym zakresie.</p>'}</section>
 ${goal?`<section class="insight-personal">${botanical()}<span class="eyebrow">Mój kierunek</span><p>${esc(goal)}</p>${go('Zmień własny cel','goal','subtle')}</section>`:''}</div>`;
}

export function wellnessTrendFacts({entries=[],today,slot='Rano',metric,range='week'}){
 slot=wellnessSlots.includes(slot)?slot:'Rano';const spec=wellnessMetrics[slot].find(m=>m.name===metric)||wellnessMetrics[slot][0],period=insightRange(today,range);
 const rows=dedupeEntries(entries).filter(e=>e.slot===slot&&within(e,period)).sort((a,b)=>a.date.localeCompare(b.date));
 const points=rows.map(e=>({date:e.date,value:numeric(e[`answer-${spec.name}`])})).filter(p=>p.value!==null&&p.value>=0&&p.value<=spec.max);
 const average=points.length?points.reduce((sum,p)=>sum+p.value,0)/points.length:null;
 return {slot,spec,period,rows,points,average};
}
function trendChart(f){
 if(!f.points.length)return '<div class="insight-chart-empty">W tym zakresie nie ma odpowiedzi na to pytanie.</div>';
 const x=day=>20+(dateValue(day)-dateValue(f.period.start))/dayMs/Math.max(1,f.period.days-1)*260;
 const y=value=>116-value/f.spec.max*92;
 let paths=[],path='',previous=null;for(const p of f.points){if(previous&&addDays(previous,1)!==p.date){paths.push(path);path='';}path+=`${path?'L':'M'}${x(p.date).toFixed(2)},${y(p.value).toFixed(2)} `;previous=p.date;}if(path)paths.push(path);
 return `<svg class="insight-trend-svg" viewBox="0 0 300 138" role="img" aria-label="${esc(`${f.spec.name}, ${f.slot}. ${f.points.length} odpowiedzi. Średnia ${number(f.average)} ${f.spec.unit}. Punkty pokazują tylko zapisane odpowiedzi; przerwy to brak wpisu.`)}"><text x="4" y="18">${f.spec.max}</text><text x="4" y="120">0</text><path d="M20 24H285M20 70H285M20 116H285" stroke="#c7d4bd" stroke-dasharray="3 5"/>${paths.map(d=>`<path d="${d}" fill="none" stroke="#3e674d" stroke-width="2"/>`).join('')}${f.points.map(p=>`<circle cx="${x(p.date)}" cy="${y(p.value)}" r="3" fill="#3e674d"><title>${shortDate(p.date)}: ${number(p.value)} ${esc(f.spec.unit)}</title></circle>`).join('')}</svg><div class="insight-chart-ends"><span>${shortDate(f.period.start)}</span><span>${shortDate(f.period.end)}</span></div>`;
}
const metricValue=(entry,spec)=>{const value=numeric(entry[`answer-${spec.name}`]);return `${number(value)}${value!==null?' '+spec.unit:''}`;};
export function renderWellnessTrends({entries=[],today,slot='Rano',metric,range='week'}){
 const f=wellnessTrendFacts({entries,today,slot,metric,range}),history=dedupeEntries(entries).filter(e=>e.date<=today).sort((a,b)=>b.date.localeCompare(a.date)||wellnessSlots.indexOf(b.slot)-wellnessSlots.indexOf(a.slot));
 return `<div class="insights-view">${go('← Postępy','progress','subtle')}${heading('Samopoczucie','Twoje odpowiedzi w czasie, osobno dla każdej pory dnia.')}
 <div class="insight-trend-controls"><label class="field">Pora dnia<select name="wellness-trend-slot">${wellnessSlots.map(s=>`<option ${s===f.slot?'selected':''}>${esc(s)}</option>`).join('')}</select></label><label class="field">Obserwacja<select name="wellness-trend-metric">${wellnessMetrics[f.slot].map(m=>`<option ${m.name===f.spec.name?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label></div>${rangeButtons(range,'data-wellness-range')}
 <section class="insight-trend"><span class="eyebrow">${esc(f.slot)} · ${esc(f.spec.name)}</span>${trendChart(f)}<div class="insight-trend-summary"><div><span>Średnia odpowiedzi</span><strong>${number(f.average)} <small>${esc(f.spec.unit)}</small></strong></div><div><span>Kompletność</span><strong>${f.points.length}<small> / ${f.period.days} dni</small></strong></div></div><p class="insight-footnote">Każdy punkt to jedna odpowiedź. Puste dni nie są zerem. Porównujesz tylko wpisy z pory „${esc(f.slot)}”.</p></section>
 ${button('＋ Nowy check-in','data-checkin','wide insight-checkin')}<section class="insight-wellness-history"><h2>Ostatnie wpisy</h2>${history.slice(0,30).map(e=>`<button class="insight-wellness-row" data-wellness-entry="${esc(e.date+'|'+e.slot)}"><span><strong>${shortDate(e.date)} · ${esc(e.slot)}</strong><small>${wellnessMetrics[e.slot].filter(m=>numeric(e['answer-'+m.name])!==null).slice(0,2).map(m=>`${esc(m.name)} ${metricValue(e,m)}`).join(' · ')||'Bez odpowiedzi liczbowych'}</small></span>${icon('chevron')}</button>`).join('')||'<p class="muted">Twoje zapisane check-iny pojawią się tutaj.</p>'}${history.length>30?`<p class="insight-footnote">Ostatnie 30 z ${history.length} wpisów.</p>`:''}${go('Pełna historia check-inów','wellnessHistory')}</section></div>`;
}
export function renderWellnessDetail({entry}){
 if(!entry)return go('← Samopoczucie','wellnessTrends','subtle')+heading('Wpis niedostępny','Wróć do historii i wybierz zapisany check-in.');
 const specs=wellnessMetrics[entry.slot]||[];
 return `<div class="insights-view">${go('← Samopoczucie','wellnessTrends','subtle')}${heading('Twój check-in',`${shortDate(entry.date)} · ${entry.slot}`)}<section class="insight-detail"><dl>${specs.map(spec=>`<div><dt>${esc(spec.name)}</dt><dd>${metricValue(entry,spec)}</dd></div>`).join('')}</dl>${entry.notes?`<div class="insight-notes"><span class="eyebrow">Twoja notatka</span><p>${esc(entry.notes)}</p></div>`:''}</section>${button('Edytuj wpis',`data-edit-wellness="${esc(entry.date+'|'+entry.slot)}"`,'wide')}</div>`;
}

export const goalTypes={count:{label:'Ukończone sesje',unit:'sesji'},minutes:{label:'Minuty aktywności',unit:'min'},activeDays:{label:'Dni z aktywnością',unit:'dni'},checkinDays:{label:'Dni z check-inem',unit:'dni'},sleepAverageHours:{label:'Średni czas snu',unit:'h'}};
const canonicalGoalType=type=>({sessions:'count',checkins:'checkinDays',sleep:'sleepAverageHours'}[type]||type);
/** A sleep goal uses morning observations only, never an assumed sleep norm. */
export function goalFacts(goal,{workouts=[],entries=[],today}){
 const week=insightRange(today,'week'),weekEnd=addDays(week.start,6),period=goal.period&&typeof goal.period==='object'&&validDate(goal.period.start)&&validDate(goal.period.end)&&goal.period.start<=goal.period.end?{start:goal.period.start,end:goal.period.end}:{start:week.start,end:weekEnd};
 const elapsedEnd=period.end<today?period.end:today,observedPeriod={start:period.start,end:elapsedEnd};
 const done=workouts.filter(w=>w.status==='completed'&&within(w,observedPeriod)),checkins=dedupeEntries(entries).filter(e=>within(e,observedPeriod));
 const sleep=checkins.filter(e=>e.slot==='Rano').map(e=>numeric(e['answer-Sen (godziny)'])).filter(v=>v!==null&&v>=0&&v<=24);
 const timed=done.map(w=>numeric(w.duration)).filter(v=>v!==null&&v>=0);
 const type=canonicalGoalType(goal.metric||goal.type),sleepEntries=checkins.filter(e=>e.slot==='Rano'&&numeric(e['answer-Sen (godziny)'])!==null&&numeric(e['answer-Sen (godziny)'])>=0&&numeric(e['answer-Sen (godziny)'])<=24);
 const value={count:done.length,minutes:timed.reduce((sum,v)=>sum+v,0),activeDays:new Set(done.map(w=>w.date)).size,checkinDays:new Set(checkins.map(e=>e.date)).size,sleepAverageHours:sleep.length?sleep.reduce((sum,v)=>sum+v,0)/sleep.length:null}[type]??null;
 const observed=type==='sleepAverageHours'?sleepEntries:type==='checkinDays'?checkins:type==='minutes'?done.filter(w=>numeric(w.duration)!==null&&numeric(w.duration)>=0):done;
 const expectedDays=Math.max(0,Math.round((dateValue(elapsedEnd)-dateValue(period.start))/dayMs)+1),target=numeric(goal.target),hasData=observed.length>0;
 const roundedPercent=value!==null&&target!==null&&target>0?Math.round(Math.max(0,value/target*100)):null;
 const percent=type==='sleepAverageHours'&&roundedPercent!==null?Math.min(value>=target?100:99,roundedPercent):roundedPercent;
 return {period,value,actual:value,target,type,hasData,percent,met:hasData&&value!==null&&target!==null?value>=target:null,observedDays:new Set(observed.map(e=>e.date)).size,expectedDays,observations:sleep.length,days:expectedDays,timedCount:timed.length,sessions:done.length,progress:percent};
}
export function renderGoalsView({goals=[],workouts=[],entries=[],today}){
 return `<div class="insights-view">${go('← Postępy','progress','subtle')}${heading('Twoje cele','Ty wybierasz miarę i wartość. Możesz je zmienić w każdej chwili.')}
 <section class="insight-goals-intro">${botanical()}<span class="eyebrow">Własny kierunek</span><p>${goals.length?`${goals.length} zapisane cele · postęp z Twoich wpisów.`:'Wybierz to, co chcesz obserwować: sesje, czas, dni aktywności, check-iny lub własny cel snu.'}</p>${button('＋ Nowy cel','data-new-goal','primary')}</section>
 <section class="insight-goals-list" aria-label="Zapisane cele">${goals.map(goal=>{const f=goalFacts(goal,{workouts,entries,today}),type=goalTypes[f.type]||{label:'Cel',unit:''},format=f.type==='sleepAverageHours'?sleepNumber:number,sleepUnmet=f.type==='sleepAverageHours'&&f.met===false;return `<article class="insight-goal"><span class="eyebrow">${esc(type.label)}</span><h2>${esc(goal.title||type.label)}</h2><p class="insight-goal-period">${shortDate(f.period.start)} – ${shortDate(f.period.end)}</p><div class="insight-goal-value"><strong>${format(f.type==='minutes'&&!f.hasData?null:f.value)}</strong><span> / ${format(f.target)} ${esc(type.unit)}</span></div>${f.progress!==null&&f.hasData?`<div class="insight-goal-track" role="progressbar" aria-label="${esc(goal.title||type.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,f.progress)}" aria-valuetext="${format(f.value)} z ${format(f.target)} ${esc(type.unit)}${sleepUnmet?', poniżej celu':''}"><span style="width:${Math.min(100,f.progress)}%"></span></div>`:''}${f.type==='sleepAverageHours'?`<p class="insight-footnote">${sleepUnmet?'Średnia jest poniżej Twojego celu. ':''}Średnia z porannych odpowiedzi · ${f.observations} obserwacji / ${f.expectedDays} dni. Wartość docelowa wybrana przez Ciebie.</p>`:`<p class="insight-footnote">Kompletność: ${f.observedDays} dni z zapisem / ${f.expectedDays} dni.${f.type==='minutes'&&f.timedCount<f.sessions?` Czas zapisany w ${f.timedCount} z ${f.sessions} sesji.`:''}</p>`}${button('Edytuj cel',`data-edit-goal="${esc(goal.id)}"`,'subtle')}</article>`;}).join('')}</section></div>`;
}
