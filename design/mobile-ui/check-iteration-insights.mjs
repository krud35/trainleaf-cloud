import assert from 'node:assert/strict';
import {insightRange,progressFacts,wellnessTrendFacts,goalFacts,renderProgressView,renderWellnessTrends,renderWellnessDetail,renderGoalsView} from './insights-ui.js';
const today='2026-10-04';
const base={id:'one',status:'completed',date:'2026-10-02',trainingType:'technique',title:'Trening',duration:'30',rpe:'0',postSession:{aerobic:0,muscular:null,satisfaction:8}};
const workouts=[base,{...base,id:'two',duration:'',postSession:null},{...base,id:'plan',status:'planned'},{...base,id:'future',date:'2026-10-05'},{...base,id:'old',date:'2026-09-01'}];
assert.deepEqual(insightRange(today),{start:'2026-09-28',end:today,days:7});
assert.equal(insightRange('2026-08-31','six-months').start,'2026-02-28');
const facts=progressFacts(workouts,today);
assert.equal(facts.done.length,2);assert.equal(facts.activeDays,1);assert.equal(facts.minutes,30);assert.equal(facts.rpeTotal,0);assert.equal(facts.rpeCount,1);
assert.equal(progressFacts([{...base,duration:''}],today).minutes,null);
const entries=[
 {date:'2026-10-01',slot:'Rano','answer-Sen (godziny)':'6','answer-Zmęczenie':'0'},
 {date:'2026-10-02',slot:'Rano','answer-Sen (godziny)':'8','answer-Zmęczenie':''},
 {date:'2026-10-01',slot:'Wieczorem','answer-Zmęczenie':'10','answer-Sen (godziny)':'12'},
 {date:'2026-10-01',slot:'Rano','answer-Sen (godziny)':'24'},
 {date:'2026-10-05',slot:'Rano','answer-Sen (godziny)':'24'}
];
const trend=wellnessTrendFacts({entries,today,slot:'Rano',metric:'Zmęczenie'});
assert.equal(trend.points.length,1);assert.equal(trend.average,0);assert.equal(trend.rows.length,2);
const sleep=goalFacts({type:'sleep',target:7,period:'week'},{workouts,entries,today});
assert.equal(sleep.value,7);assert.equal(sleep.observations,2);assert.equal(sleep.days,7);
assert.equal(goalFacts({type:'checkins',target:5},{entries,today}).value,2);
assert.equal(goalFacts({metric:'checkinDays',target:5},{entries,today}).value,2);
assert.equal(goalFacts({metric:'sleepAverageHours',target:7},{entries:[],today}).met,null);
assert.equal(goalFacts({metric:'sleepAverageHours',target:7},{entries:[{date:'2026-10-04',slot:'Rano','answer-Sen (godziny)':0}],today}).value,0);
assert.equal(goalFacts({type:'sleep',target:7},{entries,today:'2026-10-02'}).expectedDays,5);
assert.equal(goalFacts({type:'minutes',target:90},{workouts:[{...base,duration:''}],today}).hasData,false);
assert.equal(goalFacts({type:'minutes',target:90},{workouts,today}).value,30);
assert.equal(goalFacts({type:'sleep',target:7},{entries:[],today}).value,null);
const sleepGoal={id:'sleep-boundary',metric:'sleepAverageHours',target:8,period:'week'};
const sleepWeek=['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04'].map((date,i)=>({date,slot:'Rano','answer-Sen (godziny)':i===6?7.75:8}));
const belowSleep=goalFacts(sleepGoal,{entries:sleepWeek,today});
assert.equal(belowSleep.actual,55.75/7);assert.equal(belowSleep.met,false);assert.equal(belowSleep.percent,99);
const belowSleepHtml=renderGoalsView({goals:[sleepGoal],entries:sleepWeek,today});
assert.match(belowSleepHtml,/<strong>7,96<\/strong><span> \/ 8 h/);
assert.match(belowSleepHtml,/aria-valuenow="99" aria-valuetext="7,96 z 8 h, poniżej celu"/);
assert.match(belowSleepHtml,/Średnia jest poniżej Twojego celu/);
for(const [hours,percent,met] of [[0,0,false],[8,100,true],[9,100,true],[7.999,99,false]]){
 const sample=[{date:today,slot:'Rano','answer-Sen (godziny)':hours}],f=goalFacts(sleepGoal,{entries:sample,today});
 assert.equal(f.actual,hours);assert.equal(f.percent,percent);assert.equal(f.met,met);assert.equal(f.hasData,true);
 if(hours===7.999)assert.match(renderGoalsView({goals:[sleepGoal],entries:sample,today}),/aria-valuetext="8 z 8 h, poniżej celu"/);
}
const missingSleep=goalFacts(sleepGoal,{entries:[],today});
assert.equal(missingSleep.actual,null);assert.equal(missingSleep.percent,null);assert.equal(missingSleep.met,null);
const missingSleepHtml=renderGoalsView({goals:[sleepGoal],entries:[],today});
assert.match(missingSleepHtml,/<strong>—<\/strong><span> \/ 8 h/);assert.doesNotMatch(missingSleepHtml,/role="progressbar"|poniżej Twojego celu/);
assert.equal(goalFacts({type:'count',target:1},{workouts,today}).percent,200);
const custom=goalFacts({type:'sessions',target:1,period:{start:'2026-09-01',end:'2026-09-30'}},{workouts,today});assert.equal(custom.value,1);
const before=JSON.stringify(workouts),html=renderProgressView({workouts,wellness:entries,today});
assert.equal(JSON.stringify(workouts),before);assert.equal(workouts[0].loadSnapshot,undefined);
assert.ok(html.indexOf('Twoja wykonana praca')<html.indexOf('Analiza wysiłku'));
assert.match(html,/<details class="insight-analysis">/);assert.doesNotMatch(html,/<details class="insight-analysis"[^>]*open/);
assert.match(html,/Oddech<b>0 \/ 10/);assert.match(html,/Mięśnie<b>—/);
const activity=html.match(/<div class="insight-activity">[\s\S]*?<\/svg>/)[0];
assert.equal((activity.match(/<rect /g)||[]).length,7);assert.match(activity,/Dzień po dniu/);
const halfYearActivity=renderProgressView({workouts,today,range:'six-months'}).match(/<div class="insight-activity">[\s\S]*?<\/svg>/)[0];
assert.equal((halfYearActivity.match(/<rect /g)||[]).length,27);assert.match(halfYearActivity,/Tygodnie w tym okresie/);
const recent=renderProgressView({workouts:Array.from({length:6},(_,i)=>({...base,id:String(i),date:`2026-10-0${i+1}`})),today});
assert.equal((recent.match(/class="insight-rating"/g)||[]).length,4);
assert.match(renderWellnessTrends({entries,today,slot:'Rano',metric:'Zmęczenie'}),/class="insight-trend-svg"/);
assert.match(renderWellnessDetail({entry:entries[0]}),/data-edit-wellness="2026-10-01\|Rano"/);
assert.match(renderWellnessDetail({entry:{...entries[0],notes:'<script>'}}),/&lt;script&gt;/);
console.log('OK: calendar bounds, completion filters, null/zero, exact slots, dedupe, morning sleep, sleep target rounding and accessible values, custom goals, snapshots immutable, last four, actions and escaping.');
