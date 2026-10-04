import {esc, icon, trainingTypes, helpButton} from './ui-core.js';
import {renderWeek, weekDates, renderCalendarSession, renderCalendarEvent, renderEnergyDay, renderEnergyControls} from './week-ui.js';

const asDate = day=>new Date(`${day}T12:00:00Z`);
const isoDate = date=>date.toISOString().slice(0,10);
const validDay = day=>typeof day==='string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(asDate(day).valueOf()) && isoDate(asDate(day))===day;
const monthLabel = new Intl.DateTimeFormat('pl-PL',{month:'long',year:'numeric',timeZone:'UTC'});
const shortDate = new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'short',timeZone:'UTC'});
const fullDate = new Intl.DateTimeFormat('pl-PL',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
const eventStart=event=>event.start||event.startDate||event.date;
const eventEnd=event=>event.end||event.endDate||eventStart(event);
const overlaps=(start,end,a,b)=>start<=b&&end>=a;
const addDays=(day,amount)=>{const date=asDate(day);date.setUTCDate(date.getUTCDate()+amount);return isoDate(date)};
const visibleWorkout=(workout,today)=>['planned','completed'].includes(workout.status)&&(workout.status!=='completed'||workout.date<=today);
const sorted=workouts=>[...workouts].sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')||String(a.title||'').localeCompare(String(b.title||''),'pl'));

function renderFilters(filters,day){
  const query=filters.search||filters.query||'',type=filters.trainingType||'';
  return `<details class="plan-filters"><summary>${icon('settings')}<span>Szukaj i filtruj${query||type?' · aktywne':''}</span></summary><div><label><span>Szukaj treningu</span><input type="search" name="plan-search" value="${esc(query)}" placeholder="Nazwa sesji" maxlength="160"></label><label><span>Rodzaj treningu</span><select name="plan-trainingtype"><option value="">Wszystkie rodzaje</option>${trainingTypes.map(t=>`<option value="${t.id}"${type===t.id?' selected':''}>${esc(t.label)}</option>`).join('')}</select></label><label><span>Przejdź do daty</span><input type="date" name="plan-date" value="${day}"></label></div></details>`;
}
function breadcrumbs(mode,season,day){
  return `<div class="plan-breadcrumbs" role="navigation" aria-label="Poziomy planu"><button type="button" data-plan-mode="season" ${mode==='season'?'aria-current="page"':''}>${season?esc(season.name):'Sezony'}</button><span aria-hidden="true">›</span><button type="button" data-plan-mode="week" ${mode==='week'?'aria-current="page"':''}>${mode==='month'?'Tydzień':shortDate.format(asDate(weekDates(day)[0]))}</button></div>`;
}
function monthView({workouts,events,day,today,energy}){
  const first=day.slice(0,7)+'-01',lastDate=asDate(first);lastDate.setUTCMonth(lastDate.getUTCMonth()+1,0);
  const last=isoDate(lastDate),start=weekDates(first)[0],dayCount=Math.ceil((Math.round((asDate(last)-asDate(start))/86400000)+1)/7)*7;
  const dates=Array.from({length:dayCount},(_,index)=>addDays(start,index));
  const byDay=date=>sorted(workouts.filter(w=>w.date===date));
  const byEvent=date=>events.filter(event=>eventStart(event)<=date&&eventEnd(event)>=date);
  const monthEntries=dates.filter(date=>date.slice(0,7)===day.slice(0,7)&&(byDay(date).length||byEvent(date).length));
  return `<section class="plan-month" aria-label="Kalendarz miesiąca"><div class="plan-month__heading"><button type="button" data-month-shift="-1" aria-label="Poprzedni miesiąc">←</button><h2>${esc(monthLabel.format(asDate(day)))}</h2><button type="button" data-month-shift="1" aria-label="Następny miesiąc">→</button>${helpButton('week-legend')}</div><div class="plan-month__scroll" tabindex="0" role="region" aria-label="Kalendarz miesiąca, siedem kolumn"><div class="plan-month__grid">${['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(label=>`<span class="plan-month__weekday" aria-hidden="true">${label}</span>`).join('')}${dates.map(date=>`<section class="plan-month__day${date.slice(0,7)!==day.slice(0,7)?' is-outside':''}${date===day?' is-selected':''}" aria-label="${esc(fullDate.format(asDate(date)))}"><button type="button" data-plan-day="${date}" aria-pressed="${date===day}" ${date===today?'aria-current="date"':''} aria-label="${esc(fullDate.format(asDate(date)))}, sesje: ${byDay(date).length}, otwórz tydzień">${Number(date.slice(-2))}</button><div class="plan-month__sessions">${byDay(date).map(w=>renderCalendarSession(w,today)).join('')}${byEvent(date).map(event=>renderCalendarEvent(event)).join('')}</div>${renderEnergyDay(date,energy)}</section>`).join('')}</div></div><div class="plan-month__energy-caption">${renderEnergyControls(energy)}</div><details class="plan-month__list"><summary>Lista miesiąca</summary><div>${monthEntries.map(date=>`<section><button type="button" class="plan-month__list-day" data-plan-day="${date}">${esc(fullDate.format(asDate(date)))}</button>${byDay(date).map(w=>renderCalendarSession(w,today,{compact:false})).join('')}${byEvent(date).map(event=>renderCalendarEvent(event,{compact:false})).join('')}</section>`).join('')||'<p>Brak sesji i wydarzeń w tym miesiącu.</p>'}</div></details></section>`;
}
function descendants(periods,season){
  const ids=new Set([season.id]);let changed=true;
  while(changed){changed=false;for(const period of periods){if(ids.has(period.parentId)&&!ids.has(period.id)){ids.add(period.id);changed=true}}}
  return periods.filter(p=>ids.has(p.id)&&validDay(p.start)&&validDay(p.end)&&p.end>=p.start).sort((a,b)=>a.start.localeCompare(b.start)||b.end.localeCompare(a.end));
}
function seasonView({periods,events,workouts,season,today}){
  const seasons=periods.filter(p=>!p.parentId&&validDay(p.start)&&validDay(p.end)&&p.end>=p.start);
  const selector=`<div class="plan-season__choices" aria-label="Wybierz sezon">${seasons.map(p=>`<button type="button" data-plan-season="${esc(p.id)}" aria-pressed="${p.id===season?.id}">${esc(p.name)}</button>`).join('')}</div>`;
  if(!season) return `<section class="plan-season">${selector}<div class="plan-season__empty">${icon('plan')}<h2>Twój pierwszy sezon</h2><p>Dodaj okres, aby zobaczyć tygodnie i wydarzenia na osi czasu.</p><button type="button" data-period-new>＋ Dodaj okres</button></div></section>`;
  const start=season.start,end=season.end,range=Math.max(1,Math.round((asDate(end)-asDate(start))/86400000)+1);
  const blocks=descendants(periods,season),seasonEvents=events.filter(e=>overlaps(eventStart(e),eventEnd(e),start,end));
  const timelineStyle=(a,b)=>{const left=Math.max(0,Math.round((asDate(a)-asDate(start))/86400000)),right=Math.min(range,Math.round((asDate(b)-asDate(start))/86400000)+1);return `--period-left:${left/range*100}%;--period-width:${Math.max(0,(right-left)/range*100)}%`};
  const months=[];let date=asDate(start.slice(0,7)+'-01');
  while(isoDate(date)<=end){months.push(isoDate(date));date.setUTCMonth(date.getUTCMonth()+1);if(months.length>120)break}
  const weeks=[];for(let cursor=weekDates(start)[0];cursor<=end;cursor=addDays(cursor,7)){weeks.push(cursor);if(weeks.length>=520)break}
  return `<section class="plan-season" aria-label="Sezon i okresy treningowe">${selector}<div class="plan-season__title"><div><h2>${esc(season.name)}</h2><p>${esc(shortDate.format(asDate(start)))} – ${esc(shortDate.format(asDate(end)))} ${end.slice(0,4)}</p></div><button type="button" data-period="${esc(season.id)}" aria-label="Edytuj okres: ${esc(season.name)}">Edytuj</button></div><div class="plan-timeline" role="region" tabindex="0" aria-label="Oś sezonu, okresy i wydarzenia"><div class="plan-timeline__canvas"><div class="plan-timeline__months">${months.map(month=>`<span>${esc(new Intl.DateTimeFormat('pl-PL',{month:'short',timeZone:'UTC'}).format(asDate(month)))}</span>`).join('')}</div>${blocks.filter(p=>overlaps(p.start,p.end,start,end)).map(p=>`<div class="plan-timeline__row${p.id===season.id?' is-season':''}"><button type="button" class="plan-timeline__bar" style="${timelineStyle(p.start,p.end)}" data-plan-week="${p.start<start?start:p.start}" title="${esc(p.name)} · ${esc(p.start)} – ${esc(p.end)}" aria-label="${esc(p.name)}, ${esc(p.start)} do ${esc(p.end)}. Otwórz tydzień"><span>${esc(p.name)}</span><small>${esc(shortDate.format(asDate(p.start)))} – ${esc(shortDate.format(asDate(p.end)))}</small></button></div>`).join('')}${seasonEvents.map(e=>`<div class="plan-timeline__row is-event"><button type="button" class="plan-timeline__bar calendar-event${eventEnd(e)>eventStart(e)?' calendar-event--multi':''}" style="${timelineStyle(eventStart(e),eventEnd(e))}" data-event-edit="${esc(e.id)}" aria-label="Wydarzenie: ${esc(e.title||e.name||'Wydarzenie')}, ${esc(eventStart(e))} do ${esc(eventEnd(e))}"><span>◆ ${esc(e.title||e.name||'Wydarzenie')}</span><small>${esc(shortDate.format(asDate(eventStart(e))))}${eventEnd(e)>eventStart(e)?' – '+esc(shortDate.format(asDate(eventEnd(e)))):''}</small></button></div>`).join('')}</div></div><div class="plan-season__weeks" aria-label="Tygodnie sezonu">${weeks.map(week=>{const weekEnd=addDays(week,6),count=workouts.filter(w=>w.date>=week&&w.date<=weekEnd).length;return `<button type="button" data-plan-week="${week<start?start:week}" ${week<=today&&weekEnd>=today?'aria-current="date"':''}><strong>${esc(shortDate.format(asDate(week)))}</strong><span>${count} sesji</span></button>`}).join('')}</div><details class="plan-season__list"><summary>Lista okresów i wydarzeń</summary><div>${blocks.map(p=>`<div class="plan-season__period"><button type="button" data-plan-week="${p.start}"><strong>${esc(p.name)}</strong><small>${esc(p.start)} – ${esc(p.end)}</small></button><button type="button" data-period="${esc(p.id)}" aria-label="Edytuj okres: ${esc(p.name)}">Edytuj</button></div>`).join('')}${seasonEvents.map(event=>renderCalendarEvent(event,{compact:false})).join('')}</div></details></section>`;
}

/** Pure renderer. Parent persists state and opens the existing editors. */
export function renderPlanning({workouts=[],periods=[],events=[],day,today,mode='week',filters={},selectedSeasonId=null,energy={}}={}){
  today=validDay(today)?today:isoDate(new Date());day=validDay(day)?day:today;mode=['week','month','season'].includes(mode)?mode:'week';
  const query=String(filters.search||filters.query||'').trim().toLocaleLowerCase('pl'),type=filters.trainingType||'';
  const filtered=workouts.filter(w=>visibleWorkout(w,today)&&(!query||String(w.title||'').toLocaleLowerCase('pl').includes(query))&&(!type||w.trainingType===type));
  const roots=periods.filter(p=>!p.parentId&&validDay(p.start)&&validDay(p.end)&&p.end>=p.start);
  const season=roots.find(p=>p.id===selectedSeasonId)||roots.find(p=>p.start<=day&&p.end>=day)||roots[0];
  const validEvents=events.filter(event=>validDay(eventStart(event))&&validDay(eventEnd(event))&&eventEnd(event)>=eventStart(event));
  const context={workouts:filtered,periods,events:validEvents,day,today,season,energy};
  return `<div class="plan-calendar"><div class="plan-heading"><div><span class="eyebrow">Twój rytm</span><h1>Plan</h1></div><span class="plan-heading__leaf" aria-hidden="true"><svg viewBox="0 0 56 58"><path d="M13 53C3 22 24 7 47 4c5 24-5 45-34 49Z" fill="#D7E4BE"/><path d="M13 53 36 21M23 40l-9-9m15 1 12-1" fill="none" stroke="#6F8752" stroke-width="1.5"/></svg></span></div><div class="plan-modes" role="group" aria-label="Widok kalendarza">${[['week','Tydzień'],['month','Miesiąc'],['season','Sezon']].map(([id,label])=>`<button type="button" data-plan-mode="${id}" aria-pressed="${mode===id}">${label}</button>`).join('')}</div>${breadcrumbs(mode,season,day)}${mode==='month'?monthView(context):mode==='season'?seasonView(context):renderWeek({workouts:filtered,events:validEvents,selectedDay:day,today,compact:true,showDayDetail:true,energy})}<div class="plan-create"><button type="button" class="primary" data-plan>${icon('plus')} Sesja</button><button type="button" data-event-new>${icon('plan')} Wydarzenie</button><button type="button" data-period-new>${icon('plus')} Okres</button></div>${renderFilters(filters,day)}</div>`;
}

