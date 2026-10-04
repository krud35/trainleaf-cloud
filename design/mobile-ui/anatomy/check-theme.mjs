import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from './vendor/three.module.js';
import {makeAnatomy,muscleGroups} from './geometry.js';
import {anatomyCoverage,workingSets,normalizeMuscleRoles} from '../anatomy-ui.js';

// Node-only regression check: real Three objects, with only the browser renderer
// and DOM replaced. It does not launch a browser or need a WebGL context.
const exercise={id:'squat',name:'Przysiad',kind:'Siła',section:'main',sets:3,muscleRoles:{direct:['quads'],indirect:['glutes']}};
const props={day:'2026-10-04',today:'2026-10-04',targets:{quads:5,glutes:1},workouts:[{id:'done',date:'2026-10-02',status:'completed',trainingType:'strength',exercises:[exercise,{...exercise,id:'warm',section:'warmup',sets:10}],planned:{date:'2026-10-02',exercises:[{...exercise,sets:5}]}}]};
const coverage=anatomyCoverage(props),group=(id,value=coverage)=>value.groups.find(item=>item.id===id);
assert.equal(group('quads').completedSets,3);
assert.equal(group('glutes').completedSets,1.5);
assert.equal(group('quads').plannedSets,5);
assert.equal(group('glutes').status,'above');
assert.equal(group('chest').target,null);
assert.equal(workingSets({...exercise,sets:'',groupId:'g'},{groups:[{id:'g',rounds:4}]}),4);
assert.equal(workingSets({...exercise,groupId:'g'},{groups:[{id:'g',rounds:4}]}),3);
assert.equal(normalizeMuscleRoles({muscles:['Nogi']}),null);
assert.equal(group('quads',anatomyCoverage({...props,targets:{quads:0}})).status,'excluded');
const incomplete=anatomyCoverage({...props,workouts:[...props.workouts,{id:'unknown',date:'2026-10-01',status:'completed',exercises:[{...exercise,muscleRoles:undefined}]}]});
assert.equal(group('quads',incomplete).completedUnknown,true);
assert.equal(group('quads',incomplete).completedSets,3);
assert.equal(group('quads',incomplete).status,'unknown');

const colors=Object.fromEntries(coverage.groups.map(item=>[item.id,item.color]));
const anatomy=makeAnatomy(THREE,colors);
anatomy.model.rotation.y=1.37;
anatomy.setSelected('quads');
const pieces=anatomy.model.children.map(item=>({item,geometry:item.geometry,material:item.material,position:item.geometry.attributes.position.array.slice()}));
const surface=anatomy.model.children.find(item=>item.isMesh&&!item.userData.muscleId).material;
const fibers=anatomy.model.children.find(item=>item.isLine).material;
anatomy.setTheme('dark');
assert.equal(anatomy.model.rotation.y,1.37);
assert.equal(surface.color.getHexString(),'718574');
assert.equal(fibers.opacity,.12);
for(const {item,geometry,material,position} of pieces){
  assert.ok(anatomy.model.children.includes(item));
  assert.equal(item.geometry,geometry);
  assert.equal(item.material,material);
  assert.deepEqual(item.geometry.attributes.position.array,position);
}
for(const piece of anatomy.pickable){
  assert.equal(piece.material.color.getHexString(),colors[piece.userData.muscleId].slice(1));
  assert.equal(piece.material.emissiveIntensity,piece.userData.muscleId==='quads'?.18:0);
}
assert.equal(anatomy.pickable.find(item=>item.userData.muscleId==='quads').material.emissive.getHexString(),'b8d9a4');
anatomy.setTheme('light');
assert.equal(surface.color.getHexString(),'c6c6b9');
assert.equal(fibers.opacity,.055);
assert.equal(anatomy.model.rotation.y,1.37);
const resources=new Set(pieces.flatMap(item=>[item.geometry,item.material])),disposals=new Map();
resources.forEach(resource=>resource.addEventListener('dispose',()=>disposals.set(resource,(disposals.get(resource)||0)+1)));
anatomy.dispose();
assert.ok([...resources].every(resource=>disposals.get(resource)===1));

class Node {
  constructor(document,dataset={}){this.ownerDocument=document;this.dataset=dataset;this.listeners=new Map();this.attributes=new Map();this.style={setProperty:(key,value)=>this.attributes.set(key,value)};this.isConnected=true;this.writes=0;this._html='';this.classList={add(){},remove(){}}}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn)}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn)}
  emit(type,event={}){for(const fn of this.listeners.get(type)||[])fn({target:this,preventDefault(){},stopPropagation(){},...event})}
  setAttribute(name,value){this.attributes.set(name,value)}
  hasAttribute(name){return this.attributes.has(name)}
  closest(){return this}
  matches(selector){return selector==='button'}
  focus(){this.ownerDocument.activeElement=this}
  get innerHTML(){return this._html}
  set innerHTML(value){this.writes++;this._html=value}
  getBoundingClientRect(){return {left:0,top:0,right:320,bottom:420,width:320,height:420}}
  setPointerCapture(){}
  remove(){this.isConnected=false}
}
function fixture(){
  const document={documentElement:{dataset:{theme:'light'}},activeElement:null};
  const window=new Node(document);window.devicePixelRatio=1;document.defaultView=window;
  const nodes=Object.fromEntries(['dialog','detail','stage','fallback','canvas','groups','note','label','mode','close','help'].map(key=>[key,new Node(document)]));
  const host=new Node(document);host.matches=selector=>selector==='[data-anatomy]';host.contains=()=>true;
  const dots=muscleGroups.map(item=>new Node(document,{anatomyColor:item.id}));
  const paths=muscleGroups.map(item=>new Node(document,{anatomyMuscle:item.id}));
  const buttons=Object.fromEntries(muscleGroups.map(item=>[item.id,new Node(document,{anatomyMuscle:item.id})]));
  const modes=['completed','planned'].map(value=>new Node(document,{anatomyModeSelect:value}));
  const views=['front','back'].map(value=>new Node(document,{anatomyView:value}));
  const detailDot=new Node(document,{anatomyColor:'quads'});
  nodes.close.attributes.set('data-anatomy-close','');nodes.help.attributes.set('data-anatomy-help','');
  nodes.dialog.showModal=()=>nodes.dialog.open=true;nodes.dialog.close=()=>nodes.dialog.open=false;
  nodes.dialog.querySelector=()=>nodes.close;
  nodes.fallback.querySelectorAll=()=>paths;
  nodes.canvas.append=child=>nodes.canvas.child=child;
  host.querySelector=selector=>{
    if(selector==='.anatomy-groups')return nodes.groups;
    if(selector==='.anatomy-data-note')return nodes.note;
    if(selector==='[data-anatomy-metric-label]')return nodes.label;
    const key=selector.match(/^\[data-anatomy-(dialog|detail|stage|fallback|canvas|mode)\]$/)?.[1];
    if(key)return nodes[key];
    return buttons[selector.match(/data-anatomy-muscle="([^"]+)"/)?.[1]];
  };
  host.querySelectorAll=selector=>selector==='[data-anatomy-color]'?[...dots,...(nodes.dialog.open?[detailDot]:[])]:selector==='[data-anatomy-mode-select]'?modes:selector==='[data-anatomy-view]'?views:[];
  const click=target=>host.emit('click',{target});
  const theme=value=>{document.documentElement.dataset.theme=value;window.emit('trainleaf:themechange')};
  return {document,window,nodes,host,dots,paths,buttons,modes,views,detailDot,click,theme};
}
const renderers=[],observers=[];
class Renderer {
  constructor(){this.domElement=new Node(globalThis.document);renderers.push(this)}
  setPixelRatio(){} setClearColor(){} setSize(){}
  render(scene,camera){this.scene=scene;this.camera=camera;this.renders=(this.renders||0)+1}
  dispose(){this.disposed=true} forceContextLoss(){this.contextLost=true}
}
class Observer {constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}}
const saved=Object.fromEntries(['document','window','ResizeObserver','__anatomyThemeTestThree'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
try{
  globalThis.__anatomyThemeTestThree={...THREE,WebGLRenderer:Renderer};
  globalThis.ResizeObserver=Observer;
  const geometryURL=new URL('./geometry.js',import.meta.url).href;
  // Substitute only the platform boundary; all anatomy application logic and
  // Three geometry/material/light implementations remain the real modules.
  const source=(await readFile(new URL('../anatomy-ui.js',import.meta.url),'utf8'))
    .replace("from './anatomy/geometry.js'",`from ${JSON.stringify(geometryURL)}`)
    .replace("import('./anatomy/geometry.js')",`import(${JSON.stringify(geometryURL)})`)
    .replace("import('./anatomy/vendor/three.module.js')",'Promise.resolve(globalThis.__anatomyThemeTestThree)');
  const {mountAnatomy,renderAnatomy}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const f=fixture();globalThis.document=f.document;globalThis.window=f.window;
  const lightHTML=renderAnatomy(props),dispose=mountAnatomy(f.host,props);
  f.click(f.views[1]);f.click(f.modes[1]);f.click(f.buttons.quads);
  // A preference change before the lazy scene initializes must also survive.
  f.theme('dark');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(renderers.length,1);
  const renderer=renderers[0],model=renderer.scene.children.find(item=>item.isGroup);
  assert.equal(model.rotation.y,Math.PI);
  assert.equal(f.nodes.dialog.open,true);
  assert.equal(f.document.activeElement,f.nodes.close);
  const selected=model.children.find(item=>item.userData.muscleId==='quads');
  assert.equal(selected.material.emissiveIntensity,.18);
  assert.equal(selected.material.color.getHexString(),'78b38e');
  assert.equal(f.dots.find(item=>item.dataset.anatomyColor==='quads').attributes.get('--muscle-color'),'#78b38e');
  const canvas=renderer.domElement;
  canvas.emit('pointerdown',{button:0,clientX:100,clientY:100,pointerId:1});
  canvas.emit('pointermove',{clientX:140,clientY:100});
  canvas.emit('pointerup',{clientX:140,clientY:100});
  const rotation=model.rotation.y,writes=Object.values(f.nodes).map(node=>node.writes),dialogHTML=f.nodes.detail.innerHTML;
  const geometryRefs=model.children.map(item=>item.geometry);
  f.theme('light');
  assert.equal(model.rotation.y,rotation);
  assert.equal(f.nodes.dialog.open,true);
  assert.equal(f.document.activeElement,f.nodes.close);
  assert.equal(f.nodes.detail.innerHTML,dialogHTML);
  assert.deepEqual(Object.values(f.nodes).map(node=>node.writes),writes);
  assert.deepEqual(model.children.map(item=>item.geometry),geometryRefs);
  assert.equal(selected.material.emissiveIntensity,.25);
  assert.equal(selected.material.color.getHexString(),'41865b');
  assert.equal(f.detailDot.attributes.get('--muscle-color'),'#41865b');
  assert.equal(f.paths.find(item=>item.dataset.anatomyMuscle==='quads').attributes.get('fill'),'#41865b');
  assert.equal(f.modes[1].attributes.get('aria-pressed'),'true');
  assert.deepEqual(anatomyCoverage(props),coverage);
  f.theme('dark');
  assert.notEqual(renderAnatomy(props),lightHTML);
  assert.deepEqual(anatomyCoverage(props),coverage);
  f.nodes.dialog.emit('cancel');
  assert.equal(f.document.activeElement,f.buttons.quads);
  assert.equal(selected.material.emissiveIntensity,0);
  f.click(f.nodes.help);const helpHTML=f.nodes.detail.innerHTML;f.theme('light');
  assert.equal(f.nodes.detail.innerHTML,helpHTML);assert.equal(f.document.activeElement,f.nodes.close);
  const renderCount=renderer.renders;
  dispose();
  assert.equal(f.window.listeners.get('trainleaf:themechange').size,0);
  assert.equal(f.host.listeners.get('click').size,0);
  assert.equal(f.nodes.dialog.listeners.get('cancel').size,0);
  assert.equal(f.nodes.dialog.listeners.get('click').size,0);
  assert.ok(renderer.disposed&&renderer.contextLost&&observers[0].disconnected);
  assert.equal(renderer.domElement.isConnected,false);
  assert.ok([...canvas.listeners.values()].every(listeners=>listeners.size===0));
  f.theme('dark');assert.equal(renderer.renders,renderCount);
  // Disposal while lazy imports are pending must never initialize a scene.
  const pending=fixture();globalThis.document=pending.document;globalThis.window=pending.window;
  mountAnatomy(pending.host,props)();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(renderers.length,1);
  // Unsupported WebGL still receives live SVG/list/detail theme updates.
  globalThis.__anatomyThemeTestThree={...THREE,WebGLRenderer:class{constructor(){throw Error('WebGL unavailable')}}};
  const fallback=fixture();globalThis.document=fallback.document;globalThis.window=fallback.window;
  const disposeFallback=mountAnatomy(fallback.host,props);
  await new Promise(resolve=>setImmediate(resolve));
  fallback.click(fallback.buttons.quads);
  const fallbackWrites=Object.values(fallback.nodes).map(node=>node.writes);
  fallback.theme('dark');
  assert.equal(fallback.nodes.dialog.open,true);
  assert.equal(fallback.document.activeElement,fallback.nodes.close);
  assert.deepEqual(Object.values(fallback.nodes).map(node=>node.writes),fallbackWrites);
  assert.notEqual(fallback.paths.find(item=>item.dataset.anatomyMuscle==='quads').attributes.get('fill'),group('quads').color);
  assert.equal(fallback.paths.find(item=>item.dataset.anatomyMuscle==='chest').attributes.get('fill'),'#85988a');
  assert.equal(renderers.length,1);
  disposeFallback();assert.equal(fallback.window.listeners.get('trainleaf:themechange').size,0);
}finally{
  for(const [key,descriptor]of Object.entries(saved))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
}
console.log('PASS: coverage edge cases and theme independence; real Three geometry/material/rotation/selection preservation; lazy scene theme; in-place SVG/list/dialog paint; mode/focus retention; WebGL failure fallback; complete listener/resource cleanup.');
