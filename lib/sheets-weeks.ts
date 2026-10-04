import {monday,addDays,sheetSafe,sections,type State,type Dose,type Metric} from './domain';
import {wellnessSlots,slotNames,wellnessText} from './wellness';
export type WeeklySheet={key:string;title:string;rows:(string|number)[][];dayRows:number[];sectionRows:number[]};
const doseText=(d:Dose|null,m:Metric)=>d?`${d.quantity}${m==='kg'||m==='reps'?' powt.':m==='meters'?' m':m==='minutes'?' min':' rzutów'}`:'—';
/** Eight columns and seven daily blocks, following the supplied training-plan layout. */
export function buildWeeklySheets(state:State,profileId:string):WeeklySheet[]{
 const profile=state.profiles.find(p=>p.id===profileId);if(!profile)throw Error('Nie znaleziono profilu');
 const workouts=state.workouts.filter(w=>w.profileId===profileId),events=state.events.filter(e=>e.profileId===profileId),fatigue=state.fatigue.filter(f=>f.profileId===profileId);
 const wellness=state.wellness.filter(w=>w.profileId===profileId);
 const keys=new Set([...workouts.map(w=>monday(w.date)),...fatigue.map(f=>monday(f.date)),...wellness.map(w=>monday(w.date))]);
 for(const event of events){let key=monday(event.start);const last=monday(event.end);for(let count=0;key<=last;count++,key=addDays(key,7)){if(count>=520)throw Error('Wydarzenie przekracza limit 520 tygodni eksportu.');keys.add(key);}}
 return [...keys].sort().map(key=>{
  const rows:(string|number)[][]=[],dayRows:number[]=[],sectionRows:number[]=[];
  const push=(cells:(string|number)[])=>rows.push([...cells,...Array(Math.max(0,8-cells.length)).fill('')].slice(0,8).map(sheetSafe) as (string|number)[]);
  push([`${profile.name} · TYDZIEŃ ${key} — ${addDays(key,6)}`]);
  for(let dayIndex=0;dayIndex<7;dayIndex++){
   const day=addDays(key,dayIndex);dayRows.push(rows.length+1);push([`${['PONIEDZIAŁEK','WTOREK','ŚRODA','CZWARTEK','PIĄTEK','SOBOTA','NIEDZIELA'][dayIndex]} · ${day}`]);
   push(['Kolejność / godzina','Ćwiczenie / wydarzenie','Serie','Powtórzenia / czas / dystans','Ciężar / intensywność','Przerwa / tempo','Wskazówki trenera','Notatki zawodnika / wykonanie']);
   const dayEvents=events.filter(e=>e.start<=day&&e.end>=day);for(const e of dayEvents)push([e.time,e.title,'',e.kind==='competition'?'Zawody':e.kind==='trip'?'Wyjazd':'Wydarzenie','',e.location,e.createdBy==='coach'?e.notes:'',e.createdBy==='athlete'?e.notes:'']);
   const cycles=state.periods.filter(p=>p.profileId===profileId&&p.start<=day&&p.end>=day);if(cycles.length)push(['Cykl',cycles.map(p=>`${p.level||'meso'}: ${p.name} · ${p.phase}`).join(' / '),'','','','',cycles.map(p=>p.goal).filter(Boolean).join(' / ')]);
   const daily=workouts.filter(w=>w.date===day).sort((a,b)=>a.time.localeCompare(b.time));
   for(const w of daily){sectionRows.push(rows.length+1);push([w.time,w.name,'',`${w.duration} min plan`,w.status==='completed'?'Wykonany':w.status==='skipped'?'Pominięty':'Plan','',w.notes,w.athleteNotes||'']);
    for(const section of Object.keys(sections) as (keyof typeof sections)[]){if(!w.sections[section].length)continue;sectionRows.push(rows.length+1);push(['',sections[section]]);
     w.sections[section].forEach((item,index)=>{const a=w.status==='completed'?item.actual:null,p=item.planned,exerciseNote=state.exerciseNotes.find(n=>n.profileId===profileId&&n.exerciseId===item.exercise.id)?.notes;push([index+1,item.exercise.name+(item.exercise.video?'\n'+item.exercise.video:''),a?`${p.sets} plan / ${a.sets} wyk.`:p.sets,p.prescription||doseText(p,item.exercise.metric),[item.exercise.metric==='kg'?`${p.kg} kg`:'',p.effort].filter(Boolean).join(' · '),[p.rest&&`Przerwa ${p.rest}`,p.tempo&&`Tempo ${p.tempo}`].filter(Boolean).join(' · '),[item.exercise.cues||item.exercise.notes,item.exercise.variants].filter(Boolean).join('\n'),[a?`Wykonano: ${a.sets} × ${doseText(a,item.exercise.metric)}${item.exercise.metric==='kg'?' · '+a.kg+' kg':''}`:'',item.athleteNotes,exerciseNote?`Notatka do ćwiczenia: ${exerciseNote}`:''].filter(Boolean).join('\n')]);});
    }
    if(w.status==='completed')push(['Wykonanie','','',w.actualMinutes===null?'':`${w.actualMinutes} min`,w.rpe===null?'':`RPE ${w.rpe}/10`]);
   }
   if(!daily.length&&!dayEvents.length)push(['','Brak zaplanowanej sesji']);
   const f=fatigue.find(f=>f.date===day);if(f)push(['Zmęczenie · starszy zapis','','',`${f.value}/10`,'','','',f.notes]);
   for(const slot of wellnessSlots){const w=wellness.find(w=>w.date===day&&w.slot===slot);if(w)push(['Samopoczucie',slotNames[slot].pl,'',wellnessText(w.answers),'','',w.recordedBy==='coach'?'Wpis trenera':'Wpis zawodnika',w.notes]);}push([]);
  }
  return{key,title:'FW '+key,rows,dayRows,sectionRows};
 });
}
