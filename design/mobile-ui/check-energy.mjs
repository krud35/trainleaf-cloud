import assert from 'node:assert/strict';
import {createReserveReference,forecastReserve,canonicalReserveWorkouts,reserveSessionLoad,historyConfirmationDays} from './energy-model.js';

const today='2026-10-04';
const addDays=(date,offset)=>new Date(new Date(date+'T12:00:00Z').valueOf()+offset*86400000).toISOString().slice(0,10);
const previousDays=date=>Array.from({length:21},(_,index)=>addDays(date,index-21));
const actual=(id,date,value)=>({id,date,status:'completed',trainingType:'strength',duration:'30',loadSnapshot:{status:'calculated',value}});
const reference=createReserveReference({workouts:[actual('reference','2026-09-21',100)],start:'2026-09-21',end:'2026-09-27',today});
assert.equal(reference.value,100);assert.equal(reference.algorithm,'plan-reserve-v1');
assert.deepEqual(reference.emptyDates,['2026-09-22','2026-09-23','2026-09-24','2026-09-25','2026-09-26','2026-09-27']);
assert.equal(reference.confirmedComplete,undefined);assert.equal(reference.confirmedRestDays,undefined);
const forecast=workouts=>forecastReserve({workouts,dates:[today],today,reference,confirmedRestDays:previousDays(today)})[today];
const unconfirmed=(workouts=[],extra={})=>forecastReserve({workouts,dates:[today],today,reference,...extra})[today];

// Known loads are monotonic, aggregated once per day, and use the start of the forecast day.
const one=forecast([actual('one','2026-10-03',40)]),two=forecast([actual('one','2026-10-03',40),actual('two','2026-10-03',40)]);
assert.ok(one.value>two.value);assert.ok(one.lower<one.value&&one.value<one.upper);
assert.equal(one.residual,40*2**(-1/2));assert.equal(two.residual,80*2**(-1/2));
assert.equal(one.knownValue,one.value);assert.equal(one.coverage.recordedDays,21);
assert.equal(forecast([actual('same-day',today,1000)]).value,1);
assert.equal(forecast([actual('one','2026-10-03',0)]).value,1);
assert.equal(forecast([actual('outside',addDays(today,-22),1000)]).residual,0);
assert.ok(forecast([actual('edge',addDays(today,-21),1000)]).residual>0);

// Empty history needs explicit confirmation. History start and the existence of a reference prove nothing.
assert.equal(unconfirmed().value,null);assert.equal(unconfirmed().knownValue,1);
assert.deepEqual(unconfirmed().coverage,{recordedDays:0,estimatedDays:0,unknownDays:21,totalDays:21});
assert.deepEqual(unconfirmed().missingDays,previousDays(today));
assert.equal(unconfirmed([],{historyStart:'2020-01-01'}).coverage.unknownDays,21);
assert.equal(unconfirmed([],{confirmedRestDays:previousDays(today).slice(1)}).coverage.unknownDays,1);
assert.equal(unconfirmed([],{confirmedRestDays:previousDays(today)}).value,1);
const noReference=forecastReserve({workouts:[actual('debug','2026-10-03',40)],dates:[today],today,confirmedRestDays:previousDays(today)})[today];
assert.equal(noReference.label,'Ustaw odniesienie');assert.equal(noReference.value,null);assert.equal(noReference.knownValue,null);
assert.equal(noReference.knownLower,null);assert.equal(noReference.residual,40*2**(-1/2));
assert.ok(noReference.scenarios.every(scenario=>scenario.knownBalance===null));

// One missing session keeps the whole day unknown while preserving the known session and residual.
const missing={...actual('missing','2026-10-03',30),loadSnapshot:null,postSession:{aerobic:2,muscular:2}};
const partial=forecast([actual('known','2026-10-03',40),missing]);
assert.equal(partial.state,'low-confidence');assert.equal(partial.value,null);assert.equal(partial.lower,null);assert.equal(partial.upper,null);
assert.equal(partial.knownResidual,40*2**(-1/2));assert.equal(partial.knownValue,one.value);
assert.equal(partial.missingCount,1);assert.deepEqual(partial.missingDays,['2026-10-03']);
assert.deepEqual(partial.coverage,{recordedDays:20,estimatedDays:0,unknownDays:1,totalDays:21});
assert.equal(partial.days.at(-1).load,null);assert.equal(partial.days.at(-1).knownLoad,40);
assert.ok(partial.scenarios.every(scenario=>scenario.balance===null&&scenario.residual===null&&scenario.knownBalance!==null));
assert.ok(partial.knownLower<partial.knownValue&&partial.knownValue<partial.knownUpper);

// A past plan is unknown, including mental plans and plans carrying an old computed snapshot.
const plan={id:'same',date:today,status:'planned',trainingType:'strength',duration:'30',plannedExertion:{aerobic:2,muscular:3,source:'user'}};
assert.equal(reserveSessionLoad(plan,today).value,21.84);
assert.equal(reserveSessionLoad({...plan,date:'2026-10-03'},today).value,null);
assert.equal(forecast([{...plan,date:'2026-10-03',loadSnapshot:{status:'calculated',value:100}}]).value,null);
assert.equal(reserveSessionLoad({...plan,trainingType:'mental',duration:'',plannedExertion:null},today).value,0);
assert.equal(reserveSessionLoad({...plan,date:'2026-10-03',trainingType:'mental',duration:'',plannedExertion:null},today).value,null);
assert.equal(reserveSessionLoad({...plan,plannedExertion:null,postSession:{aerobic:2,muscular:3}},today).value,null);
assert.equal(reserveSessionLoad({...missing,planned:plan,plannedExertion:plan.plannedExertion},today).value,null);

// Completed mental sessions have known physical zero, without synthesizing or mutating saved answers.
const mental={id:'mental',date:'2026-10-03',status:'completed',trainingType:'mental'};
const mentalBefore=JSON.stringify(mental);
assert.equal(reserveSessionLoad(mental,today).value,0);assert.equal(forecast([mental]).value,1);
assert.equal(JSON.stringify(mental),mentalBefore);
assert.equal(reserveSessionLoad({...mental,date:'2026-10-05'},today).reason,'future_completion');
assert.equal(reserveSessionLoad(actual('future','2026-10-05',40),today).value,null);

// Canonical identity prevents double counting and respects later skipped/deleted revisions.
const completed={...actual('same','2026-10-03',60),planned:plan};
assert.equal(canonicalReserveWorkouts([completed,plan]).length,1);assert.equal(forecast([completed,plan]).residual,60*2**(-1/2));
assert.equal(forecast([plan,completed]).residual,60*2**(-1/2));
const oldActual={...completed,revision:1},newPlan={...plan,revision:2};
for(const records of [[oldActual,newPlan],[newPlan,oldActual]]){
 assert.equal(canonicalReserveWorkouts(records,today)[0],oldActual);
 assert.equal(forecast(records).residual,60*2**(-1/2));
 assert.equal(historyConfirmationDays({workouts:records,start:'2026-10-03',end:today,today}).dates[0],today);
 assert.equal(createReserveReference({workouts:records,start:'2026-09-28',end:today,today}).value,60);
}
const deletedAt={...completed,revision:3,deletedAt:'2026-10-04T11:00:00Z'};
for(const records of [[oldActual,newPlan,deletedAt],[deletedAt,newPlan,oldActual]]){
 assert.equal(canonicalReserveWorkouts(records,today)[0],deletedAt);
 assert.equal(forecast(records).residual,0);
 assert.equal(historyConfirmationDays({workouts:records,start:'2026-10-03',end:'2026-10-03',today}).dates[0],'2026-10-03');
 assert.ok(createReserveReference({workouts:records,start:'2026-09-28',end:today,today}).error);
}
const restored={...completed,revision:4,deletedAt:null};
assert.equal(canonicalReserveWorkouts([restored,deletedAt,newPlan,oldActual],today)[0],restored);
assert.equal(forecast([oldActual,newPlan,deletedAt,restored]).residual,60*2**(-1/2));
const futureActual={...actual('future-duplicate','2026-10-05',40),revision:2},futurePlan={...plan,id:'future-duplicate',date:'2026-10-05',revision:1};
assert.equal(canonicalReserveWorkouts([futureActual,futurePlan],today)[0],futureActual);
assert.equal(reserveSessionLoad(canonicalReserveWorkouts([futurePlan,futureActual],today)[0],today).reason,'future_completion');
const newerFuture={...oldActual,date:'2026-10-05',revision:10};
assert.equal(canonicalReserveWorkouts([oldActual,newerFuture,newPlan],today)[0],oldActual);
for(const status of ['skipped','deleted']){
 const removed={...completed,status,revision:2};
 assert.equal(forecast([{...completed,revision:1},removed]).residual,0);
 assert.equal(forecast([removed,{...completed,revision:1}]).residual,0);
 assert.equal(unconfirmed([removed]).coverage.unknownDays,21);
 assert.equal(forecast([removed,{...completed,revision:3}]).residual,60*2**(-1/2));
 assert.equal(forecast([{...completed,updatedAt:'2026-10-03T10:00:00Z'},{...removed,revision:undefined,updatedAt:'2026-10-03T11:00:00Z'}]).residual,0);
}

// Bulk confirmation proposes only empty days. It does not silence missing sessions or unknown statuses.
const confirmationWorkouts=[actual('ok','2026-09-21',10),{...plan,date:'2026-09-22'},{...missing,date:'2026-09-23'},{id:'other',status:'draft',date:'2026-09-24'},{id:'skip',status:'skipped',date:'2026-09-25'},{id:'deleted',status:'deleted',date:'2026-09-26'}];
const confirmation=historyConfirmationDays({workouts:confirmationWorkouts,start:'2026-09-21',end:'2026-09-27',today});
assert.deepEqual(confirmation,{dates:['2026-09-25','2026-09-26','2026-09-27'],blockedDays:4,start:'2026-09-21',end:'2026-09-27'});
assert.deepEqual(historyConfirmationDays({workouts:[...confirmationWorkouts,{...confirmationWorkouts[0],status:'deleted',revision:1}],start:'2026-09-21',end:'2026-09-21',today}).dates,['2026-09-21']);
assert.ok(historyConfirmationDays({start:'2026-02-30',end:'2026-03-01',today}).error);
assert.ok(historyConfirmationDays({start:'2026-10-04',end:'2026-10-03',today}).error);
assert.ok(historyConfirmationDays({start:'2026-10-04',end:'2026-10-05',today}).error);
assert.ok(historyConfirmationDays({start:'2010-01-01',end:today,today}).error);
assert.equal(historyConfirmationDays({start:today,end:today,today}).dates[0],today);
assert.equal(forecast(confirmationWorkouts).missingCount,3);

// Only an explicitly confirmed real reference may confirm its own empty dates; examples never confirm history.
const referenceDays={...reference,confirmedRestDays:reference.emptyDates};
assert.equal(unconfirmed([],{reference:referenceDays}).coverage.recordedDays,0);
assert.equal(unconfirmed([],{reference:{...referenceDays,confirmedComplete:true}}).coverage.recordedDays,6);
assert.equal(unconfirmed([],{reference:{...referenceDays,confirmedComplete:true,confirmedRestDays:[...reference.emptyDates,'2026-10-03']}}).coverage.recordedDays,6);
assert.equal(unconfirmed([],{reference:{...referenceDays,confirmedComplete:true,source:{...reference.source,kind:'planned'}}}).coverage.recordedDays,0);
const referenceWithPlan=createReserveReference({workouts:[actual('ref','2026-09-21',100),{...plan,date:'2026-09-22'}],start:'2026-09-21',end:'2026-09-27',today});
assert.equal(referenceWithPlan.uncompletedPlanCount,1);assert.ok(!referenceWithPlan.emptyDates.includes('2026-09-22'));

// Today remains unknown when empty; future empty dates are explicitly estimated zero.
const farFuture=addDays(today,22),future=forecastReserve({workouts:[],dates:[farFuture],today,reference})[farFuture];
assert.equal(future.value,1);assert.equal(future.status,'estimated');assert.equal(future.coverage.estimatedDays,21);
const nextDay=forecastReserve({workouts:[],dates:[addDays(today,1)],today,reference,confirmedRestDays:previousDays(today)})[addDays(today,1)];
assert.deepEqual(nextDay.missingDays,[today]);
const plannedMonday=forecastReserve({workouts:[plan],dates:['2026-10-05'],today,reference,confirmedRestDays:previousDays('2026-10-05')})['2026-10-05'];
assert.equal(plannedMonday.status,'estimated');assert.ok(plannedMonday.value<1);
const monday=forecastReserve({workouts:[actual('sun',today,100)],dates:['2026-10-05'],today,reference,confirmedRestDays:previousDays('2026-10-05')})['2026-10-05'];
assert.ok(monday.value<1);
for(const [prior,date,current] of [['2026-03-28','2026-03-29','2026-03-29'],['2026-10-24','2026-10-25','2026-10-25'],['2025-12-31','2026-01-01','2026-01-01']]){
 const result=forecastReserve({workouts:[actual('boundary',prior,40)],dates:[date],today:current,reference,confirmedRestDays:previousDays(date)})[date];
 assert.equal(result.residual,40*2**(-1/2));assert.equal(result.coverage.totalDays,21);
}

// Reference capture stays an immutable candidate and rejects insufficient inputs.
const before=JSON.stringify(reference);forecastReserve({workouts:[{...plan,date:'2026-10-08'}],dates:['2026-10-09'],today,reference});assert.equal(JSON.stringify(reference),before);
assert.ok(createReserveReference({workouts:[actual('zero','2026-09-21',0)],start:'2026-09-21',end:'2026-09-27',today}).error);
assert.ok(createReserveReference({workouts:[actual('bad','2026-09-21',NaN)],start:'2026-09-21',end:'2026-09-27',today}).error);
assert.ok(createReserveReference({workouts:[plan],start:'2026-10-01',end:'2026-10-07',today,kind:'completed'}).error);
assert.ok(createReserveReference({workouts:[plan],start:'2026-10-01',end:'2026-10-08',today,kind:'planned'}).error);
assert.equal(createReserveReference({workouts:[plan],start:'2026-10-01',end:'2026-10-07',today,kind:'planned'}).value,21.84);
assert.equal(createReserveReference({workouts:[{...plan,date:'2026-09-21'}],start:'2026-09-21',end:'2026-09-27',today,kind:'planned'}).value,21.84);
assert.deepEqual(createReserveReference({workouts:[{...plan,date:'2026-09-21'}],start:'2026-09-21',end:'2026-09-27',today,kind:'planned'}).emptyDates,[]);
const snapshot=JSON.stringify(plan);forecast([plan]);assert.equal(JSON.stringify(plan),snapshot);
console.log('OK: explicit empty-day confirmation, history gaps, partial-day known balance, past plans, missing actual load, mental zero, versioned deletion, immutable references, 21-day bounds, start-of-day, DST and year boundaries.');
