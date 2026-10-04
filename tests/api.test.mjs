import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const anonymous=await fetch(base+'/api/state');assert.equal(anonymous.status,401);
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
assert.ok(cookie,'Local mock sign-in must be enabled.');
async function req(path,method='GET',body){const r=await fetch(base+path,{method,headers:{'Origin':base,'Content-Type':'application/json','Cookie':cookie},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
const a=await req('/api/state');assert.equal(a.status,200);const before=a.data;
const saved=await req('/api/state','PUT',before);assert.equal(saved.status,200);
const stale=await req('/api/state','PUT',before);assert.equal(stale.status,409);
const malformed=structuredClone(before);malformed.revision=saved.data.revision;malformed.state.profiles=[];assert.equal((await req('/api/state','PUT',malformed)).status,400);
const wrongOrigin=await fetch(base+'/api/state',{method:'PUT',headers:{Origin:'https://different.example','Content-Type':'application/json'},body:JSON.stringify(before)});assert.equal(wrongOrigin.status,403);
const profiles=before.state.profiles;assert.ok(profiles.length>=2,'Create a second LOCAL TEST profile first.');
for(const p of profiles.slice(0,2)){const conn=await req('/api/sheets?profileId='+p.id);assert.equal(conn.status,200);assert.equal('secret' in conn.data,false);assert.equal(conn.data.configured,false);}
assert.equal((await req('/api/sheets','POST',{action:'sync',profileId:'nonexistent'})).status,404);
assert.equal((await req('/api/sheets','POST',{action:'configure',profileId:profiles[0].id,endpoint:'http://localhost/internal',spreadsheetId:'a'.repeat(30),secret:'x'.repeat(40)})).status,400);
console.log('PASS: persisted data, revision conflicts, invalid schema, origin checks, profile-scoped settings, absent secret, invalid profile and endpoint rejected.');

