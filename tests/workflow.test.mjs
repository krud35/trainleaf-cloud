import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.FIELDWORK_TEST_URL||'http://127.0.0.1:5173';
if(!base.startsWith('http://127.0.0.1:'))throw Error('Run this state-restoring test only against the local preview.');
async function call(path,method='GET',body,cookie=''){const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,headers:r.headers,data:await r.json()};}
assert.equal((await call('/api/state')).status,401);
assert.equal((await call('/api/auth/session')).data.role,'anonymous');
const signIn=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'}),coachCookie=signIn.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
const before=await call('/api/state','GET',undefined,coachCookie);assert.equal(before.status,200);
const id='qa-'+randomUUID(),username='qa-'+randomUUID(),password=randomUUID()+randomUUID();
let revision=before.data.revision;
try{
 const state=structuredClone(before.data.state),exercise=state.exercises.find(e=>e.id==='catalog-back-squat');
 state.profiles.push({id,name:'QA test profile',role:'',notes:'coach-private-sentinel',warmupId:''});
 state.workouts.push({id,profileId:id,name:'QA future workout',date:'2027-02-08',time:'18:00',category:'strength',status:'planned',duration:60,actualMinutes:null,rpe:null,notes:'Coach instructions',sections:{warmup:[],main:[{id:'item-'+id,exercise,planned:{sets:3,quantity:8,kg:40,prescription:'3 × 8',tempo:'3-1-X-0',rest:'120s',effort:'2 RIR'},actual:null}],cooldown:[]}});
 const saved=await call('/api/state','PUT',{state,revision},coachCookie);assert.equal(saved.status,200);revision=saved.data.revision;
 assert.equal((await call('/api/auth/athlete-account','POST',{profileId:id,username,password},coachCookie)).status,200);
 const login=await call('/api/auth/login','POST',{username,password});assert.equal(login.status,200);
 const cookie=login.headers.getSetCookie()[0];assert.match(cookie,/HttpOnly/i);assert.match(cookie,/Secure/i);assert.match(cookie,/SameSite=Lax/i);const athleteCookie=cookie.split(';')[0];
 const snapshot=await call('/api/state','GET',undefined,athleteCookie);assert.equal(snapshot.status,200);assert.equal(snapshot.data.state.profiles.length,1);assert.equal(snapshot.data.state.profiles[0].id,id);assert.equal(snapshot.data.state.profiles[0].notes,'');assert.ok(snapshot.data.state.workouts.every(w=>w.profileId===id));assert.ok(!JSON.stringify(snapshot.data).includes('coach-private-sentinel'));
 assert.equal((await call('/api/state','PUT',{state,revision},athleteCookie)).status,403);
 assert.equal((await call('/api/sheets?profileId='+id,'GET',undefined,athleteCookie)).status,403);
 const completed=await call('/api/athlete','POST',{action:'workout',revision,workoutId:id,status:'completed',actualMinutes:52,rpe:7,athleteNotes:'Done',items:[{id:'item-'+id,actual:{sets:3,quantity:8,kg:35},athleteNotes:'Reduced load'}]},athleteCookie);assert.equal(completed.status,200);revision=completed.data.revision;assert.equal(completed.data.state.workouts[0].sections.main[0].planned.kg,40);
 const fatigue=await call('/api/athlete','POST',{action:'fatigue',revision,date:'2027-02-08',value:0,notes:'Fresh'},athleteCookie);assert.equal(fatigue.status,200);revision=fatigue.data.revision;
 for(const [slot,answers] of [['morning',{sleepHours:7.5,fatigue:0}],['daytime',{energy:4,stress:2}],['evening',{fatigue:5,recovery:3}]]){const w=await call('/api/athlete','POST',{action:'wellness',revision,date:'2026-10-03',slot,answers,notes:'QA wellbeing'},athleteCookie);assert.equal(w.status,200);revision=w.data.revision}
 const wellnessReload=await call('/api/state','GET',undefined,athleteCookie);assert.equal(wellnessReload.data.state.wellness.length,3);assert.ok(wellnessReload.data.state.wellness.every(w=>w.profileId===id));assert.equal(wellnessReload.data.state.wellness[0].answers.fatigue,0);
 const event=await call('/api/athlete','POST',{action:'event',revision,event:{title:'Tournament trip',start:'2027-02-12',end:'2027-02-14',time:'09:00',kind:'competition',location:'Test venue',notes:'Personal event'}},athleteCookie);assert.equal(event.status,200);revision=event.data.revision;assert.equal(event.data.state.events[0].createdBy,'athlete');
 assert.equal((await call('/api/auth/athlete-account','POST',{profileId:id,username,password:randomUUID()+randomUUID()},coachCookie)).status,200);
 assert.equal((await call('/api/state','GET',undefined,athleteCookie)).status,401);
 console.log('PASS: local coach/athlete login, private profile isolation, denied planning/Sheets, actual logging, zero fatigue, events, reset revocation.');
}finally{
 const current=await call('/api/state','GET',undefined,coachCookie);assert.equal(current.status,200);await call('/api/auth/athlete-account','DELETE',{profileId:id},coachCookie);
 const restored=await call('/api/state','PUT',{state:before.data.state,revision:current.data.revision},coachCookie);assert.equal(restored.status,200);console.log('Original local planner restored.');
}
