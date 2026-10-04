import {esc, icon, typeOf, trainingTypes, helpTexts, helpButton} from './ui-core.js';

const days = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const dateFormat = new Intl.DateTimeFormat('pl-PL', {weekday:'long', day:'numeric', month:'long', timeZone:'UTC'});
const shortDateFormat = new Intl.DateTimeFormat('pl-PL', {day:'numeric', month:'short', timeZone:'UTC'});
const isoDate = date => date.toISOString().slice(0,10);
const toDate = day => new Date(`${day}T12:00:00Z`);
const validDay = day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(toDate(day).valueOf()) && isoDate(toDate(day)) === day;

helpTexts['week-legend'] = ['Kalendarz · oznaczenia', `${trainingTypes.map(type=>type.label).join(', ')}: każdy rodzaj ma własny kolor i ikonę. ○ to plan, ✓ to wykonana sesja, ↶ to plan bez zapisanego wykonania. Wydarzenia mają znacznik ◆ i własne tło; pas obejmujący kilka dat oznacza wydarzenie wielodniowe. Wybierz kafelek, aby otworzyć sesję. Pełne nazwy są także w rozwijanej liście.`];
helpTexts['energy-calendar'] = ['Rezerwa w planie', 'Początek dnia · symulacja. To własna heurystyka produktu, oparta na Twoim odniesieniu i zapisach obciążenia. Nie jest pomiarem fizjologicznym ani zaleceniem treningowym. Neutralny pasek oznacza brak odniesienia lub danych; kreskowanie oznacza niepełne dane. Warianty obliczeń nie są przedziałem ufności. Wydarzenie samo w sobie nie nalicza obciążenia.'];

/** UTC arithmetic avoids DST shifts. Parent owns calendar selection and navigation. */
export function weekDates(day) {
  const date = toDate(validDay(day) ? day : isoDate(new Date()));
  date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
  return Array.from({length:7},(_,index)=>{const value=new Date(date);value.setUTCDate(value.getUTCDate()+index);return isoDate(value)});
}
function sessionState(workout,today) {
  if(workout.status==='completed') return {key:'completed',label:'Wykonany',mark:'✓'};
  if(workout.date<today) return {key:'past-plan',label:'Bez wykonania',mark:'↶'};
  return {key:'planned',label:'Plan',mark:'○'};
}
const sorted = workouts => [...workouts].sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')||String(a.title||'').localeCompare(String(b.title||''),'pl'));
const titleOf = workout => workout.title || 'Trening bez nazwy';
const styleOf = type => `--week-type-ink:${esc(type.color)};--week-type-paper:${esc(type.background)}`;
const sessionLabel = (workout,today) => [titleOf(workout),typeOf(workout).label,workout.time?`godzina ${workout.time}`:'bez godziny',sessionState(workout,today).label].join(', ');

/** Display adapter only. No forecast is inferred from sessions, fatigue or a demo. */
export function renderEnergyDay(date,energy={}, {compact=true}={}) {
  const supplied=energy?.[date], raw=typeof supplied==='string'?{state:supplied}:supplied||{};
  const state=['unknown','low-confidence','forecast'].includes(raw.state)?raw.state:'unknown';
  const labels={unknown:'Brak danych', 'low-confidence':'Niepełne dane', forecast:'Symulacja'};
  const label=raw.label||labels[state];
  const displayedValue=state==='low-confidence'?raw.knownValue:raw.value;
  const value=typeof displayedValue==='number'&&Number.isFinite(displayedValue)?Math.min(1,Math.max(0,displayedValue)):null;
  const noReference=energy?.__referenceRequired===true||raw.label==='Ustaw odniesienie'||!Object.keys(energy||{}).length;
  return `<span class="calendar-energy calendar-energy--${state}${noReference?' calendar-energy--reference':''}${compact?' is-compact':''}" data-energy-state="${state}" role="img" aria-label="Rezerwa w planie: ${esc(label)}. Początek dnia · symulacja${raw.detail?'. '+esc(raw.detail):''}" title="Rezerwa w planie: ${esc(label)} · Początek dnia · symulacja"><span class="calendar-energy__track" aria-hidden="true">${state!=='unknown'&&value!==null?`<span style="width:${value*100}%"></span>`:''}</span>${compact?'':`<span>${esc(label)}</span>`}</span>`;
}
export function renderEnergyControls(energy={}) {
  const entries=Object.entries(energy||{}).filter(([date])=>validDay(date));
  const needsReference=typeof energy?.__referenceRequired==='boolean'?energy.__referenceRequired:!entries.length||entries.some(([,entry])=>entry?.label==='Ustaw odniesienie');
  return `<span class="calendar-energy-caption"><span title="Początek dnia · symulacja">Rezerwa w planie</span>${helpButton('energy-calendar')}<button type="button" class="calendar-energy-action" ${needsReference?'data-energy-reference':'data-energy-settings'}>${needsReference?'Ustaw odniesienie':'Ustawienia'}</button></span>`;
}
export function renderCalendarSession(workout,today,{compact=true}={}) {
  const type=typeOf(workout),state=sessionState(workout,today);
  if(compact) return `<button type="button" class="week-mini week-mini--${state.key}" style="${styleOf(type)}" data-week-session="${esc(workout.id)}" aria-label="Otwórz: ${esc(sessionLabel(workout,today))}" title="${esc(sessionLabel(workout,today))}"><span class="week-mini__type">${icon(type.icon)}<span>${esc(type.short||type.label)}</span></span><span class="week-mini__title">${esc(titleOf(workout))}</span><span class="week-mini__foot"><span aria-hidden="true">${state.mark}</span>${workout.time?`<time>${esc(workout.time)}</time>`:'<span aria-label="Bez godziny">—</span>'}</span></button>`;
  return `<button type="button" class="week-session week-session--${state.key}" style="${styleOf(type)}" data-week-session="${esc(workout.id)}" aria-label="Otwórz: ${esc(sessionLabel(workout,today))}"><span class="week-session__type">${icon(type.icon)}${esc(type.label)}<span class="week-session__status">${state.mark} ${state.label}</span></span><strong>${esc(titleOf(workout))}</strong><span class="week-session__meta">${workout.time?`<time>${esc(workout.time)}</time>`:''}${workout.duration?`<span>${esc(workout.duration)} min</span>`:''}${icon('arrow')}</span></button>`;
}
const eventStart=event=>event.start||event.startDate||event.date;
const eventEnd=event=>event.end||event.endDate||eventStart(event);
export function renderCalendarEvent(event,{compact=true}={}) {
  const multi=eventEnd(event)>eventStart(event),title=event.title||event.name||'Wydarzenie';
  return `<button type="button" class="calendar-event${multi?' calendar-event--multi':''}${compact?' is-compact':''}" data-event-edit="${esc(event.id)}" title="${esc(title)} · ${esc(eventStart(event))}${multi?' – '+esc(eventEnd(event)):''}" aria-label="Wydarzenie${multi?' wielodniowe':''}: ${esc(title)}, ${esc(eventStart(event))}${multi?' do '+esc(eventEnd(event)):''}"><span aria-hidden="true">◆</span><span>${esc(title)}</span>${compact?'':`<small>${esc(eventStart(event))}${multi?' – '+esc(eventEnd(event)):''}</small>`}</button>`;
}

/** compact defaults true, showDayDetail defaults false to avoid duplicating Today sessions. */
export function renderWeek({workouts=[],events=[],selectedDay,today,showNavigation=true,compact=true,showDayDetail=false,energy={}}={}) {
  today=validDay(today)?today:isoDate(new Date());selectedDay=validDay(selectedDay)?selectedDay:today;
  const dates=weekDates(selectedDay),available=workouts.filter(w=>['planned','completed'].includes(w.status)&&dates.includes(w.date)&&(w.status!=='completed'||w.date<=today));
  const byDay=date=>sorted(available.filter(w=>w.date===date));
  const eventsByDay=date=>events.filter(event=>eventStart(event)<=date&&eventEnd(event)>=date);
  const range=`${shortDateFormat.format(toDate(dates[0]))} – ${shortDateFormat.format(toDate(dates[6]))} ${dates[6].slice(0,4)}`;
  return `<section class="week-board${compact?' week-board--compact':''}" aria-label="Przegląd tygodnia"><div class="week-board__heading${showNavigation?'':' week-board__heading--static'}">${showNavigation?'<button type="button" class="week-board__shift" data-week-shift="-1" aria-label="Poprzedni tydzień">←</button>':''}<h2>${esc(range)}</h2>${showNavigation?'<button type="button" class="week-board__shift" data-week-shift="1" aria-label="Następny tydzień">→</button>':''}${helpButton('week-legend')}</div><div class="week-board__scroll" role="region" aria-label="Siedem dni tygodnia" tabindex="0"><div class="week-board__grid">${dates.map((date,index)=>`<section class="week-column${date===selectedDay?' is-selected':''}${date===today?' is-today':''}" aria-label="${esc(dateFormat.format(toDate(date)))}"><button type="button" class="week-column__day" data-week-date="${date}" aria-pressed="${date===selectedDay}" ${date===today?'aria-current="date"':''} aria-label="${esc(dateFormat.format(toDate(date)))}${date===today?', dzisiaj':''}, sesje: ${byDay(date).length}"><span>${days[index]}</span><strong>${Number(date.slice(-2))}</strong>${date===today?'<i aria-hidden="true"></i>':''}</button><div class="week-column__sessions">${byDay(date).map(w=>renderCalendarSession(w,today)).join('')}${eventsByDay(date).map(event=>renderCalendarEvent(event)).join('')}${byDay(date).length||eventsByDay(date).length?'':'<span class="week-column__empty" aria-label="Brak sesji">·</span>'}</div><div class="week-column__energy">${renderEnergyDay(date,energy)}</div></section>`).join('')}</div></div><div class="week-board__footer">${renderEnergyControls(energy)}<details class="week-board__list"><summary>Lista tygodnia</summary><div>${dates.map(date=>`<section><button type="button" class="week-list-day" data-week-date="${date}" aria-pressed="${date===selectedDay}">${esc(dateFormat.format(toDate(date)))}${date===today?' · dziś':''}</button>${byDay(date).map(w=>renderCalendarSession(w,today,{compact:false})).join('')}${eventsByDay(date).map(event=>renderCalendarEvent(event,{compact:false})).join('')}${byDay(date).length||eventsByDay(date).length?'':'<p class="week-list-empty">Brak sesji</p>'}${renderEnergyDay(date,energy,{compact:false})}</section>`).join('')}</div></details></div>${showDayDetail?`<section class="week-day-detail" aria-label="Wybrany dzień"><h3>${esc(dateFormat.format(toDate(selectedDay)))}${selectedDay===today?' · dziś':''}</h3>${byDay(selectedDay).map(w=>renderCalendarSession(w,today,{compact:false})).join('')}${eventsByDay(selectedDay).map(event=>renderCalendarEvent(event,{compact:false})).join('')}${byDay(selectedDay).length||eventsByDay(selectedDay).length?'':'<p class="week-day-detail__empty">Dzień bez sesji.</p>'}</section>`:''}</section>`;
}

/** One session counts once per muscle label, even when multiple exercises share it. */
export function renderMusclePlan(workouts = [], day) {
  const dates = weekDates(day);
  const plans = workouts.filter(workout => workout.status === 'planned' && dates.includes(workout.date));
  const counts = new Map();
  let withoutTags = 0;
  for (const workout of plans) {
    const muscles = new Map();
    for (const exercise of workout.exercises || []) {
      for (const raw of Array.isArray(exercise.muscles) ? exercise.muscles : []) {
        if (typeof raw !== 'string' || !raw.trim()) continue;
        const label = raw.trim(), key = label.toLocaleLowerCase('pl');
        if (!muscles.has(key)) muscles.set(key, label);
      }
    }
    if (!muscles.size) withoutTags++;
    for (const [key, label] of muscles) {
      const existing = counts.get(key);
      counts.set(key, {label: existing?.label || label, count: (existing?.count || 0) + 1});
    }
  }
  const values = [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pl'));
  return `<section class="muscle-plan" aria-label="Grupy mięśniowe w planie tygodnia"><div class="muscle-plan__heading">${icon('strength')}<h2>Mięśnie w planie</h2></div><p class="muscle-plan__source">Tylko zaplanowane sesje tego tygodnia. Ukończone sesje są poza tym zestawieniem.</p>
    ${!plans.length ? '<div class="muscle-plan__empty"><strong>Brak zaplanowanych sesji</strong><p>Grupy pojawią się po dodaniu ćwiczeń z oznaczeniami mięśni.</p></div>' : !values.length ? `<div class="muscle-plan__empty"><strong>Plany nie mają oznaczeń mięśni</strong><p>Liczba zaplanowanych sesji: ${plans.length}. Żadna nie zawiera oznaczeń grup mięśniowych.</p></div>` : `<ul class="muscle-plan__groups">${values.map(({label, count}) => `<li><div><span>${esc(label)}</span><strong>${count} z ${plans.length} sesji</strong></div><span class="muscle-plan__track" aria-hidden="true"><span style="width:${count / plans.length * 100}%"></span></span></li>`).join('')}</ul>`}
    ${plans.length && values.length && withoutTags ? `<p class="muscle-plan__missing">Sesje bez oznaczeń mięśni: <strong>${withoutTags}</strong>. Są zaplanowane, ale nie widać ich na paskach.</p>` : ''}
    ${values.length ? '<p class="muscle-plan__note">Jedna sesja może obejmować kilka grup. Paski pokazują liczbę sesji, nie objętość ani wykonanie.</p>' : ''}
  </section>`;
}


