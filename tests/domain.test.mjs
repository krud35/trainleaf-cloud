import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function loadTs(file){const absolute=path.resolve(root,file);if(modules.has(absolute))return modules.get(absolute).exports;const module={exports:{}};modules.set(absolute,module);const js=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const localRequire=name=>name.startsWith('.')?loadTs(path.relative(root,path.resolve(path.dirname(absolute),name+'.ts'))):require(name);new Function('require','module','exports',js)(localRequire,module,module.exports);return module.exports;}
const d=loadTs('lib/domain.ts');
const {initialState}=loadTs('lib/seed.ts');
const {upgradeState}=loadTs('lib/seed.ts');
const {buildWeeklySheets}=loadTs('lib/sheets-weeks.ts');
test('wellbeing accepts three independent slots and zero, rejects duplicates, wrong slots and profiles',()=>{
 const s=initialState(),base={profileId:'me',date:'2026-10-03',notes:'',recordedBy:'athlete'};
 s.wellness=[{...base,id:'am',slot:'morning',answers:{sleepHours:7.25,fatigue:0}},{...base,id:'day',slot:'daytime',answers:{energy:4}},{...base,id:'pm',slot:'evening',answers:{fatigue:5}}];
 assert.equal(d.stateSchema.safeParse(s).success,true);
 for(const patch of [{id:'duplicate'}, {id:'unknown',profileId:'other'}, {id:'wrong',slot:'daytime'}, {id:'empty',answers:{}}, {id:'high',answers:{fatigue:11}}, {id:'fraction',answers:{fatigue:1.5}}, {id:'unknown-field',answers:{readiness:99}}]){const invalid=d.clone(s);invalid.wellness=[{...invalid.wellness[0],...patch}];if(patch.id==='duplicate')invalid.wellness.push({...invalid.wellness[0],id:'another'});assert.equal(d.stateSchema.safeParse(invalid).success,false,patch.id)}
});
test('wellbeing-only weeks export every slot, omit other profiles and preserve bridge widths',()=>{
 const s=initialState();s.profiles.push({...s.profiles[0],id:'other',name:'Hidden'});s.wellness=[{id:'am',profileId:'me',date:'2026-10-03',slot:'morning',answers:{fatigue:0},notes:'=unsafe',recordedBy:'coach'},{id:'pm',profileId:'me',date:'2026-10-03',slot:'evening',answers:{stress:7},notes:'Evening note',recordedBy:'athlete'},{id:'secret',profileId:'other',date:'2027-01-01',slot:'daytime',answers:{mood:1},notes:'PRIVATE',recordedBy:'athlete'}];
 const weeks=buildWeeklySheets(s,'me');assert.equal(weeks.length,1);assert.equal(weeks[0].key,'2026-09-28');assert.ok(weeks[0].rows.every(r=>r.length===8));assert.deepEqual(weeks[0].rows.filter(r=>r[0]==='Samopoczucie').map(r=>r[1]),['Rano','Wieczorem']);assert.ok(weeks[0].rows.some(r=>r[7]==="'=unsafe"));assert.ok(!JSON.stringify(weeks).includes('PRIVATE'));
 const csv=d.exportRows(s,'me');assert.ok(csv.every(r=>r.length===24));assert.equal(csv.filter(r=>r[0]==='samopoczucie').length,2);assert.ok(csv.some(r=>String(r[20]).includes('Zmęczenie: 0/10')));assert.ok(!JSON.stringify(csv).includes('PRIVATE'));
});
test('catalog upgrade preserves edits and historical snapshots while adding classified exercises once',()=>{
 const s=initialState();s.catalogVersion=3;s.exercises=s.exercises.filter(e=>!e.id.startsWith('v4-'));s.exercises[0].name='My edited squat';s.exercises[0].types=['stability'];s.fatigue=[{id:'old',profileId:'me',date:'2026-10-01',value:4,notes:'History'}];delete s.wellness;
 const next=upgradeState(s);assert.equal(next.exercises.filter(e=>e.id.startsWith('v4-')).length,37);assert.equal(next.exercises[0].name,'My edited squat');assert.deepEqual(next.exercises[0].types,['stability']);assert.deepEqual(next.wellness,[]);assert.deepEqual(next.fatigue,s.fatigue);assert.deepEqual(upgradeState(next),next);assert.ok(next.exercises.every(e=>e.types.length));
});
test('mobility and stretching-only sets do not inflate resistance set totals',()=>{
 const s=initialState(),w=d.newWorkout(s.profiles[0],[],'2026-10-03');w.name='Mobility';w.sections.main=[d.makeItem(s.exercises.find(e=>e.id==='v4-child-pose'))];assert.equal(d.summarizeSets([w],'planned').total,0);w.sections.main.push(d.makeItem(s.exercises.find(e=>e.id==='v4-pallof-press')));assert.equal(d.summarizeSets([w],'planned').total,1);
});
test('legacy mobility snapshots use guarded classification without rewriting saved workouts',()=>{
 const s=initialState(),w=d.newWorkout(s.profiles[0],[],'2026-10-03');w.name='Legacy mobility';const item=d.makeItem(s.exercises.find(e=>e.id==='catalog-wrist-movement-sequence'));delete item.exercise.types;w.sections.main=[item];const snapshot=d.clone(w);assert.equal(d.summarizeSets([w],'planned').total,0);assert.deepEqual(w,snapshot);item.exercise.name='My resistance exercise';assert.equal(d.summarizeSets([w],'planned').total,1);
 const full=initialState();full.catalogVersion=3;full.exercises=Array.from({length:970},(_,i)=>({...d.clone(full.exercises[0]),id:'custom-'+i}));assert.equal(upgradeState(full).exercises.length,1000);
});
function sample(){const s=initialState();const w=d.newWorkout(s.profiles[0],[], '2026-10-02');w.name='Test sesji';const i=d.makeItem(s.exercises[0]);i.planned={sets:3,quantity:10,kg:20};i.actual={sets:2,quantity:8,kg:15};w.sections.main=[i];w.status='completed';w.actualMinutes=60;w.rpe=7;s.workouts.push(w);return{s,w,i}}
test('initial data and profile references validate',()=>{const s=initialState();assert.equal(d.stateSchema.safeParse(s).success,true);s.workouts.push({...sample().w,profileId:'other'});assert.equal(d.stateSchema.safeParse(s).success,false)});
test('volume separates planned, actual, and unit; muscle weights conserve volume',()=>{const{s,w}=sample();const p=d.summarize(s.workouts,'planned','kg');assert.equal(p.total,600);assert.equal(Object.values(p.muscles).reduce((a,b)=>a+b,0),600);assert.equal(d.summarize(s.workouts,'actual','kg').total,240);assert.equal(d.summarize(s.workouts,'actual','meters').total,0);w.status='skipped';assert.equal(d.summarize(s.workouts,'actual','kg').total,0)});
test('session and template snapshots are independent',()=>{const s=initialState(),w=d.newWorkout(s.profiles[0],s.templates);const old=w.sections.warmup[0].exercise.name;s.templates[0].items[0].exercise.name='Changed';assert.equal(w.sections.warmup[0].exercise.name,old);const i=d.makeItem(s.exercises[0]);s.exercises[0].shares[0].weight=0;assert.equal(i.exercise.shares[0].weight,.45)});
test('fatigue zero is valid, duplicate dates and invalid bounds are rejected',()=>{const s=initialState();s.fatigue=[{id:'f',profileId:'me',date:'2026-10-02',value:0,notes:''}];assert.equal(d.stateSchema.safeParse(s).success,true);s.fatigue.push({...s.fatigue[0],id:'f2'});assert.equal(d.stateSchema.safeParse(s).success,false);assert.equal(d.daySchema.safeParse('2026-02-30').success,false);assert.equal(d.daySchema.safeParse('2028-02-29').success,true);assert.equal(d.doseSchema.safeParse({sets:1,quantity:Infinity,kg:0}).success,false)});
test('date arithmetic survives week/year/daylight transitions',()=>{assert.equal(d.monday('2027-01-03'),'2026-12-28');assert.equal(d.addDays('2026-10-24',2),'2026-10-26');assert.equal(d.addDays('2026-03-28',2),'2026-03-30')});
test('export is rectangular and session measurements are emitted once',()=>{const{s,w,i}=sample();w.sections.main.push({...d.clone(i),id:'second'});const rows=d.exportRows(s,'me');assert.ok(rows.every(r=>r.length===24));assert.equal(rows.slice(1).reduce((a,r)=>a+Number(r[18]),0),60);assert.equal(rows.slice(1).reduce((a,r)=>a+Number(r[17]),0),7);assert.equal(rows.slice(1).reduce((a,r)=>a+Number(r[15]),0),480);w.status='skipped';assert.equal(d.exportRows(s,'me').slice(1).reduce((a,r)=>a+Number(r[15]),0),0);assert.equal(d.exportRows(s,'me')[1][18],'')});
test('exports isolate profiles and protect formula-like cells',()=>{const{s,w}=sample();s.profiles.push({...s.profiles[0],id:'client',name:'Client'});s.fatigue.push({id:'f',profileId:'client',date:'2026-10-02',value:9,notes:''});w.name='=IMPORTXML("url")';const rows=d.exportRows(s,'me');assert.equal(rows.length,2);assert.ok(rows[1][3].startsWith("'="));assert.equal(d.exportRows(s,'client').length,2);assert.equal(d.sheetSafe('  +SUM(1)'),"'  +SUM(1)")});
test('unsafe video protocol and invalid muscle share fail validation',()=>{const e=initialState().exercises[0];assert.equal(d.exerciseSchema.safeParse({...e,video:'javascript:alert(1)'}).success,false);assert.equal(d.exerciseSchema.safeParse({...e,shares:[{muscle:'core',weight:.5}]}).success,false)});
// Executable Apps Script v2 coverage lives in sheets.test.mjs.
test('set totals allocate strength sets by shares and exclude conditioning and skipped sessions',()=>{
 const{s,w,i}=sample();const conditioning=d.clone(i);conditioning.id='conditioning';conditioning.exercise.category='conditioning';conditioning.planned.sets=90;conditioning.actual.sets=80;w.sections.cooldown.push(conditioning);
 const plan=d.summarizeSets(s.workouts,'planned'),actual=d.summarizeSets(s.workouts,'actual');assert.equal(plan.total,3);assert.equal(actual.total,2);assert.ok(Math.abs(Object.values(plan.muscles).reduce((a,b)=>a+b,0)-3)<1e-8);assert.ok(Math.abs(Object.values(actual.muscles).reduce((a,b)=>a+b,0)-2)<1e-8);
 const full=d.summarizeSets(s.workouts,'planned',false);assert.equal(full.total,3);for(const share of i.exercise.shares)assert.equal(full.muscles[share.muscle],share.weight>0?3:0);assert.ok(Object.values(full.muscles).reduce((a,b)=>a+b,0)>full.total,'Full sets may count the same set for several muscles');
 w.status='skipped';assert.equal(d.summarizeSets(s.workouts,'planned').total,0);assert.equal(d.summarizeSets(s.workouts,'actual').total,0);
});
test('copy week isolates profile, preserves weekdays and plan, and resets all completion data',()=>{
 const{s,w,i}=sample();w.athleteNotes='old result';i.athleteNotes='old exercise result';s.profiles.push({...s.profiles[0],id:'other'});s.workouts.push({...d.clone(w),id:'other-session',profileId:'other'});
 const copied=d.copyWeek(s,'me','2026-09-30','2026-10-29');assert.equal(copied.workouts.length,3);const next=copied.workouts.at(-1);assert.equal(next.date,'2026-10-30');assert.equal(next.profileId,'me');assert.notEqual(next.id,w.id);assert.notEqual(next.sections.main[0].id,i.id);assert.deepEqual(next.sections.main[0].planned,i.planned);assert.equal(next.status,'planned');assert.equal(next.actualMinutes,null);assert.equal(next.rpe,null);assert.equal(next.athleteNotes,'');assert.equal(next.sections.main[0].actual,null);assert.equal(next.sections.main[0].athleteNotes,'');assert.equal(s.workouts.length,2);assert.equal(w.athleteNotes,'old result');assert.throws(()=>d.copyWeek(s,'me','2026-09-30','2026-10-04'));
});
test('period parents enforce same profile, hierarchy and containment',()=>{
 const s=initialState();s.profiles.push({...s.profiles[0],id:'other'});const base={profileId:'me',phase:'Dowolna faza',goal:''};s.periods=[{...base,id:'macro',name:'Season',start:'2026-01-01',end:'2026-12-31',level:'macro',parentId:''},{...base,id:'meso',name:'Block',start:'2026-10-01',end:'2026-10-31',level:'meso',parentId:'macro'},{...base,id:'micro',name:'Week',start:'2026-10-05',end:'2026-10-11',level:'micro',parentId:'meso'}];assert.equal(d.stateSchema.safeParse(s).success,true);
 for(const patch of [{profileId:'other'},{end:'2026-11-01'},{parentId:'macro'},{parentId:'micro'}]){const invalid=d.clone(s);Object.assign(invalid.periods[2],patch);assert.equal(d.stateSchema.safeParse(invalid).success,false)}
});
test('CSV exports new events and personal notes with isolation and formula safety',()=>{
 const{s,w,i}=sample();w.athleteNotes='Session feedback';i.athleteNotes='Exercise feedback';s.profiles.push({...s.profiles[0],id:'other',name:'Other'});
 s.events=[{id:'event',profileId:'me',title:'=IMPORTXML("bad")',start:'2026-10-03',end:'2026-10-04',time:'09:30',kind:'trip',location:'Warsaw',notes:'Travel note',createdBy:'athlete'},{id:'private-event',profileId:'other',title:'PRIVATE OTHER',start:'2026-10-03',end:'2026-10-03',time:'10:00',kind:'event',location:'',notes:'',createdBy:'coach'}];
 s.exerciseNotes=[{id:'note',profileId:'me',exerciseId:i.exercise.id,notes:'=SUM(1)'},{id:'private-note',profileId:'other',exerciseId:i.exercise.id,notes:'PRIVATE OTHER'}];
 const rows=d.exportRows(s,'me');assert.equal(rows.length,4);assert.ok(rows.every(row=>row.length===24));assert.equal(JSON.stringify(rows).includes('PRIVATE OTHER'),false);
 const workout=rows.find(row=>row[0]==='trening');assert.ok(workout[20].includes('Session feedback'));assert.ok(workout[20].includes('Exercise feedback'));
 const event=rows.find(row=>row[0]==='wydarzenie');assert.equal(event[2],'2026-10-03');assert.equal(event[19],'2026-10-04');assert.ok(event[3].startsWith("'="));assert.ok(event[20].includes('09:30'));assert.ok(event[20].includes('Travel note'));
 const note=rows.find(row=>row[0]==='notatka ćwiczenia');assert.equal(note[6],i.exercise.name);assert.equal(note[20],"'=SUM(1)");assert.equal(note[23],'note');
});
