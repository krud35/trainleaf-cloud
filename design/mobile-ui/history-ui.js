import {esc} from './ui-core.js';

const monthLabel=date=>new Intl.DateTimeFormat('pl-PL',{month:'long',year:'numeric'}).format(new Date(date+'-01T12:00:00'));

export function monthFilter(entries,name,selected){
  const months=[...new Set(entries.map(entry=>entry.date.slice(0,7)))].sort().reverse();
  if(months.length<2)return '';
  return `<label class="field archive-filter">Miesiąc<select name="${name}" aria-label="Miesiąc"><option value="">Cała historia</option>${months.map(month=>`<option value="${month}" ${selected===month?'selected':''}>${esc(monthLabel(month))}</option>`).join('')}</select></label>`;
}

export function historyCount(total,shown){return `<p class="archive-count">Wpisy: <strong>${total}</strong>${shown<total?` · wyświetlono ${shown}`:''}</p>`;}

export function monthlyActivity(done,start,end){
  const months=[];
  for(let date=new Date(start.slice(0,7)+'-01T12:00:00');date.toISOString().slice(0,7)<=end.slice(0,7);date.setMonth(date.getMonth()+1)){
    const month=date.toISOString().slice(0,7),sessions=done.filter(workout=>workout.date.startsWith(month));
    months.push({month,count:sessions.length,minutes:sessions.reduce((total,w)=>total+Number(w.duration||0),0)});
  }
  const max=Math.max(1,...months.map(month=>month.count));
  return `<section class="activity-history"><h2>Twoje miesiące</h2><p class="muted">Ukończone treningi w wybranym zakresie.</p><div class="activity-months">${months.map(({month,count,minutes})=>`<div class="activity-month"><div><span>${esc(monthLabel(month))}</span><strong>${count}<small> · ${minutes} min</small></strong></div><div class="activity-track" aria-hidden="true"><span style="width:${count/max*100}%"></span></div></div>`).join('')}</div><p class="form-aside">Pierwszy i ostatni miesiąc mogą obejmować tylko część miesiąca.</p></section>`;
}
