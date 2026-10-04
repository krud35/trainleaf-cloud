import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('./appearance-bootstrap.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const appCode=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
function boot({saved,dark=false,failRead=false,failWrite=false,mediaMode='modern'}={}){
  const values=new Map([['workout-data','{invalid training data']]);if(saved!==undefined)values.set('trainleaf-appearance-v1',saved);
  const reads=[],writes=[],events=[],windowListeners=new Map(),windowListenerOptions=new Map(),documentListeners=new Map(),mediaListeners=new Map();
  const controls=[{value:'system'},{value:'system'}],statuses=[{textContent:''},{textContent:''}];
  // The bootstrap may change appearance controls, but must never replace the planner DOM.
  const form={notes:'Unsaved notes',date:'2026-10-04',selectionStart:3};
  const meta={},root={dataset:{},style:{}},media={matches:dark};
  if(mediaMode==='modern')media.addEventListener=(name,fn)=>mediaListeners.set(name,fn);
  if(mediaMode==='legacy')media.addListener=fn=>mediaListeners.set('change',fn);
  const dialogListeners=new Map(),dialog={open:false,showModal(){this.open=true},close(){this.open=false;dialogListeners.get('close')?.()},addEventListener:(name,fn)=>dialogListeners.set(name,fn)};
  const loading={hidden:false,setAttribute(name){if(name==='hidden')this.hidden=true}},failure={hidden:true,removeAttribute(name){if(name==='hidden')this.hidden=false}};
  const startup={querySelector:selector=>selector==='[data-startup-loading]'?loading:selector==='[data-startup-error]'?failure:null};
  let startupMounted=true;
  const document={documentElement:root,querySelectorAll:selector=>selector==='[data-appearance-select]'?controls:selector==='[data-appearance-status]'?statuses:[],querySelector:selector=>selector==='meta[name="theme-color"]'?{setAttribute:(name,value)=>meta[name]=value}:selector==='#appearance-dialog'?dialog:selector==='[data-startup]'&&startupMounted?startup:null,addEventListener:(name,fn)=>documentListeners.set(name,fn)};
  const storage={getItem:key=>{reads.push(key);if(failRead)throw Error('blocked');return values.get(key)??null},setItem:(key,value)=>{if(failWrite)throw Error('blocked');writes.push([key,value]);values.set(key,value)}};
  const window={dispatchEvent:event=>events.push(event),addEventListener:(name,fn,options)=>{windowListeners.set(name,fn);windowListenerOptions.set(name,options)}};
  if(mediaMode!=='absent')window.matchMedia=()=>media;
  vm.runInNewContext(code,{window,document,localStorage:storage,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}});
  return {api:window.TrainleafAppearance,root,meta,values,reads,writes,events,media,mediaListeners,windowListeners,windowListenerOptions,documentListeners,controls,statuses,form,dialog,loading,failure,unmountStartup:()=>{startupMounted=false}};
}
const fresh=boot();assert.equal(fresh.api.getPreference(),'system');assert.equal(fresh.root.dataset.theme,'light');assert.deepEqual(fresh.writes,[]);
assert.deepEqual(fresh.reads,['trainleaf-appearance-v1']);assert.equal(fresh.values.get('workout-data'),'{invalid training data');
const system=boot({dark:true});assert.equal(system.root.dataset.theme,'dark');assert.equal(system.root.style.colorScheme,'dark');assert.equal(system.root.style.backgroundColor,'#101A15');assert.equal(system.meta.content,'#17231C');
system.media.matches=false;system.mediaListeners.get('change')();assert.equal(system.root.dataset.theme,'light');
assert.equal(system.api.setPreference('dark'),true);assert.equal(system.values.get('trainleaf-appearance-v1'),'dark');
system.media.matches=false;system.mediaListeners.get('change')();assert.equal(system.root.dataset.theme,'dark');
assert.equal(boot({saved:system.values.get('trainleaf-appearance-v1')}).root.dataset.theme,'dark');
const savedLight=boot({saved:'light',dark:true});assert.equal(savedLight.root.dataset.theme,'light');
assert.equal(savedLight.api.setPreference('unknown'),false);assert.equal(savedLight.api.getPreference(),'light');
assert.equal(boot({saved:'invalid',dark:true}).api.getPreference(),'system');
const blocked=boot({dark:true,failRead:true,failWrite:true});assert.equal(blocked.root.dataset.theme,'dark');assert.equal(blocked.api.setPreference('light'),false);assert.equal(blocked.root.dataset.theme,'light');
fresh.windowListeners.get('storage')({key:'trainleaf-appearance-v1',newValue:'dark'});assert.equal(fresh.root.dataset.theme,'dark');
fresh.windowListeners.get('storage')({key:'workout-data',newValue:'anything'});assert.equal(fresh.root.dataset.theme,'dark');
fresh.windowListeners.get('storage')({key:'trainleaf-appearance-v1',newValue:null});assert.equal(fresh.api.getPreference(),'system');
assert.ok(html.indexOf('appearance-bootstrap.js')<html.indexOf('rel="stylesheet"'));
assert.ok(html.indexOf('appearance-bootstrap.js')<html.indexOf('type="module"'));
assert.ok(html.includes('data-startup-error'));assert.ok(html.includes('id="appearance-dialog"'));assert.ok(html.includes('data-appearance-open'));
assert.ok(system.events.every(event=>event.type==='trainleaf:themechange'));

const legacy=boot({dark:true,mediaMode:'legacy'});legacy.media.matches=false;legacy.mediaListeners.get('change')();assert.equal(legacy.root.dataset.theme,'light');
const absent=boot({mediaMode:'absent'});assert.equal(absent.root.dataset.theme,'light');assert.equal(absent.api.setPreference('dark'),true);assert.equal(absent.root.dataset.theme,'dark');
system.api.setPreference('system');system.media.matches=true;system.mediaListeners.get('change')();assert.equal(system.root.dataset.theme,'dark');assert.equal(system.values.get('trainleaf-appearance-v1'),'system');
system.api.setPreference('light');const eventCount=system.events.length;system.media.matches=true;system.mediaListeners.get('change')();assert.equal(system.root.dataset.theme,'light');assert.equal(system.events.length,eventCount);
fresh.windowListeners.get('storage')({key:null,newValue:null});assert.equal(fresh.api.getPreference(),'system');
fresh.windowListeners.get('storage')({key:'trainleaf-appearance-v1',newValue:'invalid'});assert.equal(fresh.api.getPreference(),'system');
assert.ok(blocked.statuses.every(status=>status.textContent.includes('tej sesji')));
const readBlocked=boot({failRead:true});assert.equal(readBlocked.api.setPreference('dark'),true);assert.ok(readBlocked.statuses.every(status=>status.textContent.includes('ponownym uruchomieniu')));

const ui=boot(),formBefore={...ui.form},dataBefore=new Map(ui.values);
ui.documentListeners.get('DOMContentLoaded')();
const opener={isConnected:true,focusCount:0,focus(){this.focusCount++}};
ui.documentListeners.get('click')({target:{closest:selector=>selector==='[data-appearance-open]'?opener:null}});
assert.equal(ui.dialog.open,true);
ui.documentListeners.get('change')({target:{value:'dark',matches:selector=>selector==='[data-appearance-select]'}});
assert.ok(ui.controls.every(control=>control.value==='dark'));assert.equal(ui.root.dataset.theme,'dark');
assert.deepEqual(ui.form,formBefore);assert.equal(ui.values.get('workout-data'),dataBefore.get('workout-data'));
ui.documentListeners.get('click')({target:{closest:selector=>selector==='[data-appearance-close]'?{}:null}});
assert.equal(ui.dialog.open,false);assert.equal(opener.focusCount,1);
opener.isConnected=false;ui.dialog.close();assert.equal(opener.focusCount,1);
// Closing via native Escape raises the same close event used above. Actual focus trapping
// and keyboard navigation are native-dialog behavior and still need a browser check.
ui.windowListeners.get('error')();assert.equal(ui.loading.hidden,true);assert.equal(ui.failure.hidden,false);
assert.equal(ui.windowListenerOptions.get('error'),true,'Resource/script errors do not bubble: startup recovery must listen during capture');
const rejection=boot();rejection.windowListeners.get('unhandledrejection')();assert.equal(rejection.failure.hidden,false);
rejection.unmountStartup();assert.doesNotThrow(()=>rejection.windowListeners.get('error')());
assert.equal(ui.values.get('workout-data'),'{invalid training data');
assert.ok(html.includes('aria-haspopup="dialog"'));assert.ok(html.includes('aria-labelledby="appearance-title"'));

// Exercise the real app input/change listeners alongside the appearance listener.
// Theme selects intentionally have no form name and live outside planner forms.
const appListeners=[];
const appContext={document:{addEventListener:(name,listener)=>appListeners.push([name,listener])},draft:{title:'Unsaved workout',notes:'Keep this',exercises:[]},render(){throw Error('Theme selection must not redraw the planner')},persist(){throw Error('Theme selection must not save workout data')}};
const changeRegistrations=appCode.split('\n').filter(line=>line.startsWith("document.addEventListener('change',event=>"));
assert.equal(changeRegistrations.length,2);
const inputRegistration=appCode.match(/document\.addEventListener\('input',event=>\{[\s\S]*?\n\}\);/)?.[0];
assert.ok(inputRegistration);
vm.runInNewContext([...changeRegistrations,inputRegistration].join('\n'),appContext);
const themeTarget={value:'dark',name:'',id:'',closest:()=>null,matches:selector=>selector==='[data-appearance-select]'};
const draftBefore=JSON.stringify(appContext.draft);
for(const [,listener] of appListeners)listener({target:themeTarget});
assert.equal(JSON.stringify(appContext.draft),draftBefore);
console.log('PASS: system/default and explicit restart, OS changes only in system mode, modern/legacy/no media API, storage failure/recovery, independent controls, DOM/data preservation, close focus callback, startup ordering and error callbacks. Native dialog/keyboard and visual layout require browser verification.');
