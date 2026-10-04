import {computeTrainleafLoad} from './load-model.js';

export const RESERVE_ALGORITHM='plan-reserve-v1';
export const RESERVE_LOOKBACK_DAYS=21;
export const RESERVE_HALF_LIFE_SCENARIOS=[1,2,3];
const dayMs=86400000;
const dateValue=day=>new Date(`${day}T12:00:00Z`);
const iso=date=>date.toISOString().slice(0,10);
const validDate=day=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(dateValue(day).valueOf())&&iso(dateValue(day))===day;
const addDays=(day,n)=>iso(new Date(dateValue(day).valueOf()+n*dayMs));
const numeric=value=>!['number','string'].includes(typeof value)||String(value).trim()===''?null:Number.isFinite(Number(value))?Number(value):null;
const knownSnapshot=snapshot=>snapshot?.status==='calculated'&&typeof snapshot.value==='number'&&Number.isFinite(snapshot.value)&&snapshot.value>=0;

const excluded=workout=>['skipped','deleted'].includes(workout.status)||Boolean(workout.deletedAt);
const recordPriority=workout=>excluded(workout)?2:workout.status==='completed'?1:0;
const revision=workout=>numeric(workout.revision)??0;
const updated=workout=>[workout.updatedAt,workout.deletedAt].filter(value=>typeof value==='string').sort().at(-1)||'';
const recordOrder=(a,b)=>revision(a)-revision(b)||updated(a).localeCompare(updated(b))||recordPriority(a)-recordPriority(b);
const latestRecord=records=>records.reduce((latest,record)=>!latest||recordOrder(record,latest)>=0?record:latest,null);

/** Latest explicit exclusion wins; otherwise a nonfuture actual cannot be erased by a newer plan. */
export function canonicalReserveWorkouts(workouts=[],today){
 const records=new Map();workouts.forEach((workout,index)=>{
  const key=workout.id?String(workout.id):`missing-id:${index}`;
  if(!records.has(key))records.set(key,[]);records.get(key).push(workout);
 });
 return [...records.values()].map(group=>{
  const latest=latestRecord(group);
  if(excluded(latest))return latest;
  const actuals=group.filter(workout=>!excluded(workout)&&workout.status==='completed'&&validDate(workout.date)&&(!validDate(today)||workout.date<=today));
  return latestRecord(actuals)||latest;
 });
}
/** No actual-future ratings, nested plan, RPE or inferred values enter this model. */
export function reserveSessionLoad(workout,today,{allowHistoricalPlan=false}={}){
 if(!validDate(workout.date))return {value:null,reason:'invalid_date'};
 if(workout.status==='completed'){
  if(workout.date>today)return {value:null,reason:'future_completion'};
  // The approved physical-load weight is zero; reading never creates an actual snapshot.
  if(workout.trainingType==='mental')return {value:0,source:'explicit_actual_mental_zero'};
  return knownSnapshot(workout.loadSnapshot)?{value:workout.loadSnapshot.value,source:'saved_actual'}:{value:null,reason:'missing_actual_snapshot'};
 }
 if(workout.status==='planned'){
  if(workout.date<today&&!allowHistoricalPlan)return {value:null,reason:'uncompleted_past_plan'};
  // V1 explicitly excludes mental sessions from physical load, even with no ratings.
  if(workout.trainingType==='mental')return {value:0,source:'explicit_plan_mental_zero'};
  const duration=numeric(workout.duration),aerobic=numeric(workout.plannedExertion?.aerobic),muscular=numeric(workout.plannedExertion?.muscular);
  if(duration===null||duration<=0||aerobic===null||muscular===null||aerobic<0||aerobic>10||muscular<0||muscular>10)return {value:null,reason:'missing_planned_inputs'};
  const computed=computeTrainleafLoad({...workout,status:'completed',postSession:{aerobic,muscular}});
  return knownSnapshot(computed)?{value:computed.value,source:'explicit_plan'}:{value:null,reason:computed.reason||'invalid_plan'};
 }
 return {value:null,reason:'not_a_session'};
}

/** Candidate empty dates for an explicit, bulk confirmation; this function confirms nothing. */
export function historyConfirmationDays({workouts=[],start,end,today}){
 if(!validDate(today)||!validDate(start)||!validDate(end)||start>end||end>today)return {error:'Wybierz poprawny zakres dat, najpóźniej do dzisiaj.'};
 const count=Math.round((dateValue(end)-dateValue(start))/dayMs)+1;
 if(count>3660)return {error:'Potwierdź zakres nie dłuższy niż 3660 dni.'};
 const occupied=new Set(canonicalReserveWorkouts(workouts,today).filter(w=>!excluded(w)&&validDate(w.date)&&w.date>=start&&w.date<=end).map(w=>w.date));
 const dates=Array.from({length:count},(_,index)=>addDays(start,index)).filter(date=>!occupied.has(date));
 return {dates,blockedDays:occupied.size,start,end};
}

/** Capture an explicit seven-day reference; return error without partial capture. */
export function createReserveReference({workouts=[],start,end,today,kind='completed'}){
 if(!validDate(today)||!validDate(start)||!validDate(end)||addDays(start,6)!==end)return {error:'Wybierz pełny zakres siedmiu kolejnych dni.'};
 if(!['completed','planned'].includes(kind))return {error:'Wybierz wykonany lub zaplanowany tydzień.'};
 if(kind==='completed'&&end>today)return {error:'Tydzień odniesienia musi być w całości zakończony.'};
 const canonical=canonicalReserveWorkouts(workouts,today).filter(w=>!excluded(w));
 const records=canonical.filter(w=>w.status===kind&&validDate(w.date)&&w.date>=start&&w.date<=end);
 if(!records.length)return {error:'W tym tygodniu nie ma sesji wybranego rodzaju.'};
 const captured=records.map(w=>({id:w.id??null,date:w.date,...reserveSessionLoad(w,today,{allowHistoricalPlan:kind==='planned'})}));
 if(captured.some(w=>w.value===null))return {error:kind==='completed'?'Każda sesja odniesienia potrzebuje zapisanego wyniku Trainleaf load.':'Każda sesja odniesienia potrzebuje czasu i obu jawnie zaplanowanych ocen zmęczenia.'};
 const value=captured.reduce((sum,w)=>sum+w.value,0);
 if(!Number.isFinite(value)||value<=0)return {error:'Suma wybranego tygodnia musi być większa od zera.'};
 const uncompletedPlanCount=kind==='completed'?canonical.filter(w=>w.status==='planned'&&validDate(w.date)&&w.date>=start&&w.date<=end).length:0;
 const emptyDates=kind==='completed'?historyConfirmationDays({workouts,start,end,today}).dates:[];
 return {algorithm:RESERVE_ALGORITHM,value,source:{start,end,kind},capturedOn:today,sessions:captured,uncompletedPlanCount,emptyDates,convention:'sum_selected_week_load',lookbackDays:RESERVE_LOOKBACK_DAYS,halfLifeDays:2,halfLifeScenarios:[...RESERVE_HALF_LIFE_SCENARIOS]};
}

const validReference=reference=>reference?.algorithm===RESERVE_ALGORITHM&&typeof reference.value==='number'&&Number.isFinite(reference.value)&&reference.value>0&&validDate(reference.source?.start)&&validDate(reference.source?.end)&&['completed','planned'].includes(reference.source?.kind);
/** A planning convention, not a physiological readiness or wellness score. */
export function forecastReserve({workouts=[],dates=[],today,reference,confirmedRestDays=[]}){
 if(!validDate(today))throw new RangeError('forecastReserve wymaga daty today w formacie YYYY-MM-DD.');
 const records=canonicalReserveWorkouts(workouts,today).filter(w=>!excluded(w)&&validDate(w.date));
 const hasReference=validReference(reference);
 const referenceDays=hasReference&&reference.source.kind==='completed'&&reference.confirmedComplete===true&&Array.isArray(reference.confirmedRestDays)?reference.confirmedRestDays.filter(date=>date>=reference.source.start&&date<=reference.source.end):[];
 const confirmed=new Set([...(Array.isArray(confirmedRestDays)?confirmedRestDays:[]),...referenceDays].filter(date=>validDate(date)&&date<=today));
 const byDate=new Map();records.forEach(workout=>{if(!byDate.has(workout.date))byDate.set(workout.date,[]);byDate.get(workout.date).push(workout)});
 const result={};
 for(const date of [...new Set(dates)]){
  if(!validDate(date))continue;
  const start=addDays(date,-RESERVE_LOOKBACK_DAYS);
  const days=Array.from({length:RESERVE_LOOKBACK_DAYS},(_,index)=>{
   const day=addDays(start,index),sessions=(byDate.get(day)||[]).map(workout=>({id:workout.id??null,...reserveSessionLoad(workout,today)}));
   if(!sessions.length){
    const status=day>today?'estimated':confirmed.has(day)?'recorded':'unknown';
    return {date:day,status,load:status==='unknown'?null:0,knownLoad:0,missingCount:0,sessions,reason:status==='unknown'?'unconfirmed_empty_day':status==='estimated'?'empty_future_plan':'confirmed_empty_day'};
   }
   const missingCount=sessions.filter(session=>session.value===null).length,knownLoad=sessions.reduce((sum,session)=>sum+(session.value??0),0);
   const status=missingCount?'unknown':sessions.some(session=>['explicit_plan','explicit_plan_mental_zero'].includes(session.source))?'estimated':'recorded';
   return {date:day,status,load:missingCount?null:knownLoad,knownLoad,missingCount,sessions};
  });
  const missingDays=days.filter(day=>day.status==='unknown').map(day=>day.date),missingCount=days.reduce((sum,day)=>sum+day.missingCount,0);
  const coverage={recordedDays:days.filter(day=>day.status==='recorded').length,estimatedDays:days.filter(day=>day.status==='estimated').length,unknownDays:missingDays.length,totalDays:RESERVE_LOOKBACK_DAYS};
  const residuals=RESERVE_HALF_LIFE_SCENARIOS.map(h=>days.reduce((sum,day)=>sum+day.knownLoad*2**(-((dateValue(date)-dateValue(day.date))/dayMs)/h),0));
  const knownBalances=hasReference?residuals.map(residual=>reference.value/(reference.value+residual)):null;
  const complete=missingDays.length===0,scenarios=RESERVE_HALF_LIFE_SCENARIOS.map((halfLifeDays,index)=>({halfLifeDays,residual:complete?residuals[index]:null,knownResidual:residuals[index],balance:complete&&hasReference?knownBalances[index]:null,knownBalance:hasReference?knownBalances[index]:null}));
  // `residual` remains the known partial for existing prototype consumers; scenarios distinguish full/known.
  const common={value:complete&&hasReference?knownBalances[1]:null,lower:complete&&hasReference?Math.min(...knownBalances):null,upper:complete&&hasReference?Math.max(...knownBalances):null,knownValue:hasReference?knownBalances[1]:null,knownLower:hasReference?Math.min(...knownBalances):null,knownUpper:hasReference?Math.max(...knownBalances):null,residual:residuals[1],knownResidual:residuals[1],missingCount,missingDays,coverage,days,scenarios,window:{start,end:addDays(date,-1)}};
  const missingDetail=`${missingCount?`${missingCount} sesji bez wartości. `:''}${missingDays.length?`${missingDays.length} z 21 wcześniejszych dni ma niepełne dane. `:''}`;
  if(!hasReference){result[date]={...common,state:'unknown',status:'no-reference',label:'Ustaw odniesienie',detail:`Wybierz i zapisz własny tydzień odniesienia. ${missingDetail}`.trim()};continue;}
  if(!complete){result[date]={...common,state:'low-confidence',status:'incomplete',label:'Niepełne dane',detail:`${missingDetail}Znana część nie jest pełną prognozą.`};continue;}
  result[date]={...common,state:'forecast',status:coverage.estimatedDays?'estimated':'recorded',label:'Prognoza rezerwy',detail:'Początek dnia · scenariusze zanikania 1, 2 i 3 dni. Umowny model planowania.'};
 }
 return result;
}
