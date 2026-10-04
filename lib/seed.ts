import { type Exercise,type State,makeItem,stateSchema } from './domain';
import {catalogExercises} from './catalog';
import {catalogV4,catalogTypeMap} from './catalog-v4';
import {inferExerciseTypes} from './exercise-types';
import {findExerciseGuidance} from './research-content';
const entries: [string,string,Exercise['category'],Exercise['metric'],[string,number][]][] = [
['squat','Przysiad goblet','strength','kg',[['quads',.45],['glutes',.35],['core',.2]]],
['rdl','Martwy ciąg rumuński','strength','kg',[['hamstrings',.45],['glutes',.35],['back',.1],['core',.1]]],
['lunge','Wykrok w tył','strength','kg',[['quads',.4],['glutes',.4],['hamstrings',.1],['core',.1]]],
['lateral','Wykrok boczny','strength','reps',[['quads',.4],['glutes',.4],['hamstrings',.1],['core',.1]]],
['calf','Wspięcia na palce','strength','reps',[['calves',.9],['core',.1]]],
['pushup','Pompki','strength','reps',[['chest',.4],['arms',.3],['shoulders',.2],['core',.1]]],
['row','Wiosłowanie hantlem','strength','kg',[['back',.55],['arms',.25],['shoulders',.1],['core',.1]]],
['press','Wyciskanie nad głowę','strength','kg',[['shoulders',.55],['arms',.25],['core',.2]]],
['easy','Bieg ciągły','running','meters',[['quads',.25],['hamstrings',.2],['glutes',.25],['calves',.2],['core',.1]]],
['accel','Przyspieszenia po prostej','running','meters',[['quads',.25],['hamstrings',.25],['glutes',.3],['calves',.15],['core',.05]]],
['shuttle','Bieg wahadłowy','running','meters',[['quads',.3],['hamstrings',.2],['glutes',.3],['calves',.15],['core',.05]]],
['cut','Zmiana kierunku · cutting','running','meters',[['quads',.3],['hamstrings',.2],['glutes',.3],['calves',.1],['core',.1]]],
['shuffle','Przemieszczanie bokiem','running','meters',[['quads',.3],['glutes',.4],['calves',.2],['core',.1]]],
['backhand','Backhand do celu','throwing','throws',[['shoulders',.3],['arms',.25],['core',.3],['back',.15]]],
['forehand','Forehand do celu','throwing','throws',[['shoulders',.3],['arms',.3],['core',.25],['back',.15]]],
['alternating','Backhand + forehand','throwing','throws',[['shoulders',.3],['arms',.25],['core',.3],['back',.15]]],
['pivot','Pivot i podanie','throwing','throws',[['shoulders',.2],['arms',.2],['core',.3],['quads',.15],['glutes',.15]]],
['moving','Podanie do zawodnika w ruchu','throwing','throws',[['shoulders',.25],['arms',.25],['core',.35],['back',.15]]],
['huck','Długie podanie · huck','throwing','throws',[['shoulders',.25],['arms',.2],['core',.35],['back',.1],['glutes',.1]]],
['rope','Skakanka','conditioning','minutes',[['calves',.5],['quads',.15],['glutes',.1],['shoulders',.1],['core',.15]]],
['plank','Podpór na przedramionach','strength','minutes',[['core',.65],['shoulders',.2],['glutes',.15]]],
['sideplank','Podpór bokiem','strength','minutes',[['core',.6],['shoulders',.2],['glutes',.2]]],
['bike','Rower stacjonarny','conditioning','minutes',[['quads',.4],['glutes',.3],['hamstrings',.2],['calves',.1]]],
['walk','Spokojny marsz','conditioning','minutes',[['quads',.3],['glutes',.3],['hamstrings',.2],['calves',.2]]],
];
export function initialState():State{
const exercises=entries.map(([id,name,category,metric,s])=>({id,name,category,metric,shares:s.map(([muscle,weight])=>({muscle,weight})),video:'',notes:'Podawaj łączną liczbę powtórzeń obu stron. Ciężar oznacza sumę obciążenia zewnętrznego.'})) as Exercise[];
const items=(ids:string[])=>ids.map(id=>makeItem(exercises.find(e=>e.id===id)!));
return upgradeState({version:1,profiles:[{id:'me',name:'Mój profil',role:'Zawodnik / zawodniczka',notes:'',warmupId:'warmup-basic'}],exercises,templates:[{id:'warmup-basic',name:'Rozgrzewka ogólna',category:'running',section:'warmup',items:items(['easy','shuffle'])},{id:'main-strength',name:'Siła · całe ciało',category:'strength',section:'main',items:items(['squat','rdl','row','pushup'])},{id:'cooldown-basic',name:'Spokojne zakończenie',category:'conditioning',section:'cooldown',items:items(['walk'])}],workouts:[],fatigue:[],periods:[],events:[],exerciseNotes:[]});}
export function upgradeState(raw:unknown):State{
 const s=stateSchema.parse(raw);
 if((s.catalogVersion||0)>=4)return s;
 if((s.catalogVersion||0)<3){
 const removed=new Set(['backhand','forehand','alternating','pivot','moving','huck']);
 s.exercises=s.exercises.filter(e=>!removed.has(e.id)||e.category!=='throwing'||e.video||e.notes!=='Podawaj łączną liczbę powtórzeń obu stron. Ciężar oznacza sumę obciążenia zewnętrznego.');
 s.templates=s.templates.filter(t=>t.id!=='main-throws'||t.name!=='Technika rzutu');
 const existing=new Set(s.exercises.map(e=>e.id));
 for(const e of catalogExercises())if(!existing.has(e.id)){const g=findExerciseGuidance(e.name)||findExerciseGuidance(e.nameEn||'');if(g){e.cues=g.cues.pl;e.cuesEn=g.cues.en;e.variants=g.variants.pl;e.variantsEn=g.variants.en;e.sourceUrls=[...new Set([...(e.sourceUrls||[]),...g.sourceUrls])].slice(0,12)}s.exercises.push(e);}
 const english:Record<string,string>={squat:'Goblet squat',rdl:'Romanian deadlift',lunge:'Reverse lunge',lateral:'Lateral lunge',calf:'Calf raise',pushup:'Push-up',row:'Single-arm dumbbell row',press:'Overhead press',easy:'Easy continuous run',accel:'Straight-line acceleration',shuttle:'Shuttle run',cut:'Change of direction',shuffle:'Lateral shuffle',rope:'Jump rope',plank:'Forearm plank',sideplank:'Side plank',bike:'Stationary bike',walk:'Easy walk'};
 for(const e of s.exercises){const old=entries.find(row=>row[0]===e.id&&row[1]===e.name);if(!old)continue;e.nameEn=e.nameEn||english[e.id];const g=findExerciseGuidance(e.name)||findExerciseGuidance(e.nameEn||'');if(g){e.cues=e.cues||g.cues.pl;e.cuesEn=e.cuesEn||g.cues.en;e.variants=e.variants||g.variants.pl;e.variantsEn=e.variantsEn||g.variants.en;e.sourceUrls=[...new Set([...(e.sourceUrls||[]),...g.sourceUrls])].slice(0,12)}e.notesEn=e.notesEn||'Enter total repetitions for both sides. Weight means the total external load.';}
 s.periods=s.periods.map(p=>({...p,level:p.level||'meso',parentId:p.parentId||''}));
 const enrichLegacy=(e:Exercise)=>{const original=entries.find(row=>row[0]===e.id&&row[1]===e.name);if(!original)return;const current=s.exercises.find(x=>x.id===e.id);if(current&&e!==current){e.nameEn=e.nameEn||current.nameEn;e.notesEn=e.notesEn||current.notesEn;e.cues=e.cues||current.cues;e.cuesEn=e.cuesEn||current.cuesEn;e.variants=e.variants||current.variants;e.variantsEn=e.variantsEn||current.variantsEn;e.sourceUrls=e.sourceUrls||current.sourceUrls}const unchanged=JSON.stringify(e.shares)===JSON.stringify(original[4].map(([muscle,weight])=>({muscle,weight})));if(unchanged)e.shares=e.shares.map(a=>({...a,muscle:a.muscle==='core'?(e.id==='sideplank'?'obliques':'abs'):a.muscle==='back'?(e.id==='rdl'?'lower_back':'lats'):a.muscle==='arms'?(['pushup','press'].includes(e.id)?'triceps':'biceps'):a.muscle}));};
 s.exercises.forEach(enrichLegacy);s.templates.forEach(template=>template.items.forEach(item=>enrichLegacy(item.exercise)));
 s.catalogVersion=3;
 }
 const ids=new Set(s.exercises.map(e=>e.id));
 for(const e of catalogV4)if(!ids.has(e.id)&&s.exercises.length<1000)s.exercises.push(structuredClone(e));
 for(const e of s.exercises)if(!e.types?.length)e.types=catalogTypeMap[e.id]||inferExerciseTypes(e);
 for(const template of s.templates)for(const item of template.items)if(!item.exercise.types?.length)item.exercise.types=catalogTypeMap[item.exercise.id]||inferExerciseTypes(item.exercise);
 s.catalogVersion=4;return stateSchema.parse(s);
}
