import {anatomySVG,muscleGroups} from './anatomy/geometry.js';
export {muscleGroups};

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value??'').trim().toLocaleLowerCase('pl');
const shortDate=value=>new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'short'}).format(new Date(value+'T12:00:00'));
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'');
const targetValue=value=>{
 if(value==null||value==='')return null;
 const raw=typeof value==='object'?(value.sets??value.target??value.value):value;
 if(raw==null||raw==='')return null;
 const numeric=Number(raw);return Number.isFinite(numeric)&&numeric>=0&&numeric<=100?numeric:null;
};
function weekOf(day){const date=new Date(day+'T12:00:00Z'),offset=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-offset);return Array.from({length:7},(_,i)=>{const d=new Date(date);d.setUTCDate(date.getUTCDate()+i);return d.toISOString().slice(0,10)})}
const alias=new Map(muscleGroups.flatMap(group=>[group.id,...group.tags].map(tag=>[normalize(tag),group.id])));

const amount=value=>Number(value).toLocaleString('pl-PL',{maximumFractionDigits:1});
export function normalizeMuscleRoles(exercise){
 const roles=exercise?.muscleRoles;if(!roles||typeof roles!=='object')return null;
 const direct=[...new Set((Array.isArray(roles.direct)?roles.direct:[]).map(value=>alias.get(normalize(value))).filter(Boolean))];
 const indirect=[...new Set((Array.isArray(roles.indirect)?roles.indirect:[]).map(value=>alias.get(normalize(value))).filter(value=>value&&!direct.includes(value)))];
 return direct.length||indirect.length?{direct,indirect}:null;
}
export function workingSets(exercise,workout){
 const raw=exercise.sets!==''&&exercise.sets!=null?exercise.sets:exercise.groupId?workout.groups?.find(group=>group.id===exercise.groupId)?.rounds:null;
 if(raw==null||raw==='')return null;
 const value=Number(raw);return Number.isInteger(value)&&value>0&&value<=100?value:null;
}
const strength=exercise=>exercise.modality?exercise.modality==='strength':['siła','siłowy','trening siłowy'].includes(normalize(exercise.kind));
const visualPalettes={
 light:{unknown:'#aeb6a8',stops:[[188,107,89],[198,138,78],[180,170,86],[65,134,91]],sky:0xfff9e7,ground:0x657a65,ambient:2.3,key:0xfff8e5,keyIntensity:3.2,fill:0xb5d2c2,fillIntensity:1.2},
 dark:{unknown:'#85988a',stops:[[217,147,128],[216,176,119],[197,191,124],[120,179,142]],sky:0xd9e5d8,ground:0x334b38,ambient:1.65,key:0xe5eddc,keyIntensity:2.1,fill:0x8aaea0,fillIntensity:1}
};
const currentTheme=root=>(root?.ownerDocument||globalThis.document)?.documentElement.dataset.theme==='dark'?'dark':'light';
function progressColor(ratio,theme='light'){const stops=visualPalettes[theme].stops,position=Math.max(0,Math.min(1,ratio))*3,index=Math.min(2,Math.floor(position)),t=position-index;return '#'+stops[index].map((value,i)=>Math.round(value+(stops[index+1][i]-value)*t).toString(16).padStart(2,'0')).join('')}
const coverageColors=(coverage,theme)=>Object.fromEntries(coverage.groups.map(group=>[group.id,['unconfigured','excluded','unknown','nodata'].includes(group.status)?visualPalettes[theme].unknown:progressColor(group.ratio,theme)]));
function styleGroup(group,mode){
 const value=group[mode+'Sets'],unknown=group[mode+'Unknown'];
 const status=group.target===null?'unconfigured':group.target===0?'excluded':unknown?'unknown':!group[mode+'HasData']?'nodata':value<group.target?'below':value===group.target?'met':'above';
 const label={unconfigured:'Brak celu',excluded:'Poza celem',unknown:'Niepełne dane',nodata:'Brak danych',below:'Poniżej celu',met:'Cel osiągnięty',above:'Powyżej celu'}[status];
 const ratio=group.target?value/group.target:null;
 const color=['unconfigured','excluded','unknown','nodata'].includes(status)?'#aeb6a8':progressColor(ratio);
 return {...group,value,unknown,status,statusLabel:label,ratio,color,mode};
}

/** Estimated resistance volume: working sets directly attributed to a muscle,
 * plus half the sets explicitly attributed indirectly. No broad-tag inference.
 * Planned and completed channels are independent and never added together. */
export function anatomyCoverage({workouts=[],periods=[],day,today,targets={},mode='completed'}={}){
 const selected=validDate(day)?day:validDate(today)?today:new Date().toISOString().slice(0,10),dates=weekOf(selected);
 const current=validDate(today)?today:selected;
 const groups=muscleGroups.map(group=>({...group,completed:[],planned:[],completedSets:0,plannedSets:0,completedUnknown:false,plannedUnknown:false,completedHasData:false,plannedHasData:false,target:targetValue(targets[group.id]),targetSource:targets[group.id]?.source||null}));
 const byId=new Map(groups.map(group=>[group.id,group]));const channels={completed:[],planned:[]},missing={completed:[],planned:[]},exposures={completed:[],planned:[]};
 for(const workout of workouts){
  if(workout.status==='completed'&&workout.date<=current&&dates.includes(workout.date))channels.completed.push(workout);
  if(workout.status==='planned'&&dates.includes(workout.date))channels.planned.push(workout);
  if(workout.status==='completed'&&workout.planned&&dates.includes(workout.planned.date||workout.date))channels.planned.push({...workout.planned,id:workout.id,date:workout.planned.date||workout.date});
 }
 for(const channel of ['completed','planned']){
  let anyKnown=false;
  for(const workout of channels[channel]){
   const rows=workout.exercises||[];
   if(!rows.length&&workout.trainingType==='strength'){
    missing[channel].push({sessionId:workout.id,exerciseId:'',name:workout.title||'Trening siłowy',reason:'Brak ćwiczeń'});groups.forEach(group=>group[channel+'Unknown']=true);
   }
   for(const exercise of rows){
    if(!strength(exercise)){if(exercise.section!=='warmup')exposures[channel].push({sessionId:workout.id,name:exercise.name||workout.title,modality:exercise.modality});continue}
    if(exercise.section==='warmup')continue;
    const roles=normalizeMuscleRoles(exercise),sets=workingSets(exercise,workout);
    if(!roles||sets===null){
     missing[channel].push({sessionId:workout.id,exerciseId:exercise.id||'',name:exercise.name||'Ćwiczenie',reason:!roles?'Brak ról mięśni':'Brak liczby serii'});
     const affected=roles?[...roles.direct,...roles.indirect]:groups.map(group=>group.id);affected.forEach(id=>byId.get(id)[channel+'Unknown']=true);
    }
    if(!roles)continue;
    for(const [role,ids]of Object.entries(roles))for(const id of ids){
     const group=byId.get(id),weighted=sets===null?null:sets*(role==='direct'?1:.5);
     group[channel].push({id:workout.id,title:workout.title||'Trening',date:workout.date,exerciseId:exercise.id,name:exercise.name||'Ćwiczenie',sets,weighted,role,rir:exercise.rir,kg:exercise.kg});
     if(weighted!==null){group[channel+'Sets']+=weighted;group[channel+'HasData']=true;anyKnown=true}
    }
   }
  }
  // With all resistance records mapped, zero attribution is a meaningful zero.
  if(anyKnown)groups.forEach(group=>{if(!group[channel+'Unknown'])group[channel+'HasData']=true});
 }
 return {groups:groups.map(group=>styleGroup(group,mode)),dates,selected,current,channels,missing,exposures,mode,periods:periods.filter(p=>p.start<=selected&&p.end>=selected)};
}

const total=(group,channel)=>group[channel+'Unknown']?(group[channel+'Sets']?`≥${amount(group[channel+'Sets'])}`:'—'):group[channel+'HasData']?amount(group[channel+'Sets']):'—';
const stateText=group=>group.target===null?'Brak celu':group.target===0?'Poza celem':`${group.statusLabel}${group.ratio!==null&&!group.unknown&&group[group.mode+'HasData']?' · '+Math.round(group.ratio*100)+'%':''}`;
const button=(label,attrs,cls='')=>`<button type="button" class="${cls}" ${attrs}>${label}</button>`;
function row(group,color=group.color){return `<li>${button(`<span class="anatomy-dot ${group.unknown?'is-unknown':''}" data-anatomy-color="${group.id}" style="--muscle-color:${color}" aria-hidden="true"></span><span class="anatomy-group-copy"><strong>${escape(group.label)}</strong><small>Wykonanie ${total(group,'completed')} · Plan ${total(group,'planned')}</small></span><span class="anatomy-group-state">${group.target===null?'Ustaw cel':`${total(group,group.mode)} / ${amount(group.target)}`}<small>${escape(stateText(group))}</small></span><span aria-hidden="true">›</span>`,`data-anatomy-muscle="${group.id}" aria-label="${escape(group.label)}: wykonanie ${total(group,'completed')}, plan ${total(group,'planned')}, ${group.target===null?'brak celu':'cel '+amount(group.target)+' serii'}. ${escape(stateText(group))}. Zobacz szczegóły.`,'anatomy-group-button')}</li>`}
function dataNote(coverage){
 const missing=coverage.missing[coverage.mode],exposure=coverage.exposures[coverage.mode];
 return `<summary>${missing.length?`Niepełne dane · ${missing.length} ${missing.length===1?'wpis':'wpisów'} do uzupełnienia`:'Jak liczymy objętość mięśni'}</summary><p>Serie robocze: bezpośrednie + ½ pośrednich, według jawnie zapisanych ról mięśni. Rozgrzewka nie wchodzi do wyniku. Szacunek objętości, nie pomiar zmęczenia.</p>${missing.length?`<ul class="anatomy-missing">${missing.slice(0,6).map(entry=>`<li><span><strong>${escape(entry.name)}</strong><small>${escape(entry.reason)}</small></span>${button('Uzupełnij',`data-muscle-mapping data-session-id="${escape(entry.sessionId)}" data-exercise-id="${escape(entry.exerciseId)}" data-mapping-channel="${coverage.mode}"`)}</li>`).join('')}</ul>${missing.length>6?`<p>Łącznie ${missing.length} wpisów z brakami. Uzupełnij ćwiczenia w edytorze treningu.</p>`:''}<p>Znak ≥ oznacza znaną część objętości. Brak danych nie jest zerem.</p>`:''}${exposure.length?`<p>${exposure.length} ćwiczeń z innych aktywności pozostaje poza sumą serii. Biegu, treningu drużynowego i techniki nie przeliczamy na serie siłowe.</p>`:''}<p>Próg koloru to Twój cel. Powyżej celu kolor pozostaje zielony, a liczba pokazuje przekroczenie. Mapa nie mierzy gotowości, ryzyka kontuzji ani różnic między stronami ciała.</p>`;
}
export function renderAnatomy(props={}){
 const coverage=anatomyCoverage(props),colors=coverageColors(coverage,currentTheme());
 const missing=coverage.groups.every(group=>group.target===null);
 return `<section class="anatomy-card" data-anatomy aria-labelledby="anatomy-title">
  <div class="anatomy-heading"><span class="eyebrow">Mapa mięśni</span><h2 id="anatomy-title">Obciążenie w tym tygodniu</h2><p>Objętość treningu siłowego<br>${shortDate(coverage.dates[0])} – ${shortDate(coverage.dates[6])} · serie ważone</p></div>
  <div class="anatomy-metric-switch" role="group" aria-label="Dane na mapie">${button('Wykonanie',`data-anatomy-mode-select="completed" aria-pressed="${coverage.mode==='completed'}"`)}${button('Plan',`data-anatomy-mode-select="planned" aria-pressed="${coverage.mode==='planned'}"`)}</div>
  <div class="anatomy-topline"><span><i aria-hidden="true"></i> <span data-anatomy-metric-label>${coverage.mode==='planned'?'Plan':'Wykonanie'} względem Twojego celu</span></span>${button('?','data-anatomy-help aria-label="Pomoc: jak czytać mapę mięśni"','anatomy-help')}</div>
  <div class="anatomy-stage" data-anatomy-stage><div class="anatomy-canvas" data-anatomy-canvas aria-hidden="true"></div><div class="anatomy-fallback" data-anatomy-fallback>${anatomySVG(colors)}</div><div class="anatomy-view-control" role="group" aria-label="Strona sylwetki">${button('Przód','data-anatomy-view="front" aria-pressed="true"')}${button('Tył','data-anatomy-view="back" aria-pressed="false"')}</div><div class="anatomy-stage-label"><span data-anatomy-mode>Sylwetka anatomiczna</span><small>Dotknij mięśnia, aby zobaczyć wpisy</small></div></div>
  ${missing?`<div class="anatomy-goal-prompt"><strong>Twój cel nadaje kolor.</strong><p>Ustal tygodniową liczbę serii ważonych dla wybranych mięśni. Dopasuj cel do swojego okresu treningowego.</p>${button('Ustaw cel dla mięśni','data-muscle-target="chest" data-muscle-id="chest"','anatomy-target-button')}</div>`:''}
  <details class="anatomy-data-note">${dataNote(coverage)}</details>
  <div class="anatomy-list-heading"><h3>Grupy mięśniowe</h3><span>Objętość / cel · serie</span></div><ul class="anatomy-groups">${coverage.groups.map(group=>row(group,colors[group.id])).join('')}</ul>
  <dialog class="anatomy-dialog" data-anatomy-dialog aria-labelledby="anatomy-detail-title"><div data-anatomy-detail></div></dialog>
 </section>`;
}
function detailHTML(group,color=group.color){
 const entries=(label,rows)=>`<section class="anatomy-contributors"><h4>${label}</h4>${rows.length?`<ul>${[...rows].sort((a,b)=>a.date.localeCompare(b.date)).map(entry=>`<li><span>${shortDate(entry.date)} · ${escape(entry.title)}</span><strong>${escape(entry.name)}</strong><small>${entry.sets===null?'Brak liczby serii':`${amount(entry.sets)} × ${entry.role==='direct'?'1 bezpośrednio':'½ pośrednio'} = ${amount(entry.weighted)} serii`}${entry.rir!==''&&entry.rir!=null?` · RIR ${escape(entry.rir)}`:''}${entry.kg!==''&&entry.kg!=null?` · ${escape(entry.kg)} kg`:''}</small>${button('Edytuj oznaczenia',`data-muscle-mapping data-session-id="${escape(entry.id)}" data-exercise-id="${escape(entry.exerciseId)}" data-mapping-channel="${label==='Plan'?'planned':'completed'}"`,'anatomy-edit-role')}</li>`).join('')}</ul>`:'<p>Brak przypisanych ćwiczeń.</p>'}</section>`;
 return `<div class="anatomy-dialog-head"><span class="eyebrow">Ten tydzień · serie ważone</span>${button('×','data-anatomy-close aria-label="Zamknij szczegóły mięśni"','anatomy-close')}</div><h3 id="anatomy-detail-title">${escape(group.label)}</h3><div class="anatomy-detail-metrics"><div><strong>${total(group,'completed')}</strong><span>wykonanie</span></div><div><strong>${total(group,'planned')}</strong><span>plan</span></div><div><strong>${group.target===null?'—':amount(group.target)}</strong><span>Twój cel</span></div></div><p class="anatomy-detail-state"><i class="anatomy-dot ${group.unknown?'is-unknown':''}" data-anatomy-color="${group.id}" style="--muscle-color:${color}"></i>${escape(stateText(group))}</p>${group.targetSource?`<p class="anatomy-detail-note">Źródło celu: ${escape(({user:'Twój zapis','demo-user-example':'Przykładowy cel',period:'Cel okresu',week:'Cel tygodnia'})[group.targetSource]||'Twój cel')}</p>`:''}${group.unknown?'<p class="anatomy-detail-note">Część ról mięśni lub liczby serii jest nieznana. Znak ≥ oznacza znaną część objętości.</p>':''}${button(group.target===null?'Ustaw mój cel':'Zmień mój cel',`data-muscle-target="${group.id}" data-muscle-id="${group.id}"`,'anatomy-target-button')}${entries('Wykonanie',group.completed)}${entries('Plan',group.planned)}<p class="anatomy-detail-note">Serie bezpośrednie + ½ pośrednich. RIR i ciężar to kontekst; nie zmieniają tej sumy. Plan i wykonanie są oddzielne.</p>`;
}
export function mountAnatomy(root,props={}){
 const host=root.matches?.('[data-anatomy]')?root:root.querySelector('[data-anatomy]');if(!host)return()=>{};
 let theme=currentTheme(host),coverage=anatomyCoverage(props),colors=coverageColors(coverage,theme);
 const dialog=host.querySelector('[data-anatomy-dialog]'),slot=host.querySelector('[data-anatomy-detail]'),stage=host.querySelector('[data-anatomy-stage]'),fallback=host.querySelector('[data-anatomy-fallback]');
 let disposed=false,disposeScene=()=>{},setView=()=>{},highlight=()=>{},setColors=()=>{},setSceneTheme=()=>{},lastFocus=null,currentSide='front',selectedGroup=null;
 function openGroup(id,source){const group=coverage.groups.find(group=>group.id===id);if(!group)return;lastFocus=source||host.querySelector(`[data-anatomy-muscle="${id}"]`);slot.innerHTML=detailHTML(group,colors[id]);selectedGroup=id;highlight(id);dialog.showModal();dialog.querySelector('[data-anatomy-close]').focus()}
 function close(){dialog.close();selectedGroup=null;highlight(null);if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true})}
 // Theme changes only touch paint: keep dialog contents, focus, mode and rotation.
 const themeWindow=host.ownerDocument.defaultView;
 function updateTheme(){
  theme=currentTheme(host);colors=coverageColors(coverage,theme);
  host.querySelectorAll('[data-anatomy-color]').forEach(dot=>dot.style.setProperty('--muscle-color',colors[dot.dataset.anatomyColor]));
  fallback.querySelectorAll('[data-anatomy-muscle]').forEach(path=>path.setAttribute('fill',colors[path.dataset.anatomyMuscle]));
  setSceneTheme(theme,colors);
 }
 themeWindow.addEventListener('trainleaf:themechange',updateTheme);updateTheme();
 function click(event){
  const target=event.target.closest('[data-anatomy-muscle],[data-anatomy-view],[data-anatomy-close],[data-anatomy-help],[data-muscle-target],[data-muscle-mapping],[data-anatomy-mode-select]');if(!target||!host.contains(target))return;
  if(target.hasAttribute('data-muscle-target')||target.hasAttribute('data-muscle-mapping')){if(dialog.open){dialog.close();selectedGroup=null;highlight(null)}return}
  event.stopPropagation();
  if(target.dataset.anatomyModeSelect){coverage=anatomyCoverage({...props,mode:target.dataset.anatomyModeSelect});colors=coverageColors(coverage,theme);host.querySelector('.anatomy-groups').innerHTML=coverage.groups.map(group=>row(group,colors[group.id])).join('');host.querySelector('.anatomy-data-note').innerHTML=dataNote(coverage);host.querySelector('[data-anatomy-metric-label]').textContent=(coverage.mode==='planned'?'Plan':'Wykonanie')+' względem Twojego celu';host.querySelectorAll('[data-anatomy-mode-select]').forEach(button=>button.setAttribute('aria-pressed',String(button===target)));fallback.innerHTML=anatomySVG(colors,currentSide);setColors(colors)}
  else if(target.dataset.anatomyMuscle)openGroup(target.dataset.anatomyMuscle,target.matches('button')?target:null);
  else if(target.dataset.anatomyView){currentSide=target.dataset.anatomyView;host.querySelectorAll('[data-anatomy-view]').forEach(button=>button.setAttribute('aria-pressed',String(button===target)));fallback.innerHTML=anatomySVG(colors,currentSide);setView(currentSide)}
  else if(target.hasAttribute('data-anatomy-close'))close();
  else{lastFocus=target;slot.innerHTML=`<div class="anatomy-dialog-head"><span class="eyebrow">Mapa mięśni</span>${button('×','data-anatomy-close aria-label="Zamknij pomoc mapy mięśni"','anatomy-close')}</div><h3 id="anatomy-detail-title">Jak czytać mapę</h3><div class="anatomy-legend" aria-label="Legenda mapy"><span><i style="background:var(--anatomy-unknown,#aeb6a8)"></i>Brak celu / pełnych danych</span><span><i style="background:var(--anatomy-progress-low,#bc6b59)"></i>Poniżej celu</span><span><i style="background:var(--anatomy-progress-met,#41865b)"></i>Cel osiągnięty</span><span><b aria-hidden="true">↑</b>Powyżej celu · &gt;100%</span></div><div class="anatomy-help-copy"><p>Kolor pokazuje wybraną objętość względem Twojego celu na tydzień. Plan i wykonanie pozostają oddzielne. Po przekroczeniu 100% zieleń nie ciemnieje; przekroczenie pokazują procent i opis.</p><p>Serie bezpośrednie liczymy w całości, pośrednie w połowie. To przybliżenie objętości treningu siłowego, zależne od jawnie przypisanych ról. RIR i ciężar pozostają kontekstem.</p><p>Szary: brak celu, cel 0 (poza celem), brak lub niepełne dane. Znak ≥ oznacza znaną część sumy. Ogólne etykiety, takie jak „Nogi”, nie przypisują serii do konkretnych mięśni.</p><p>Sylwetka 3D jest autorskim, uproszczonym modelem powierzchniowym. Dane odnoszą się do całej grupy mięśni, bez oceny lewej i prawej strony. To nie pomiar zmęczenia, gotowości ani ryzyka kontuzji.</p><p>Źródła metody: <a href="https://doi.org/10.1007/s40279-025-02344-w" target="_blank" rel="noreferrer">Pelland i wsp. · przeliczanie serii</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/41843416/" target="_blank" rel="noreferrer">ACSM · trening oporowy</a>. Cel wybierasz samodzielnie.</p></div>`;dialog.showModal();dialog.querySelector('[data-anatomy-close]').focus()}
 }
 const cancel=event=>{event.preventDefault();close()};host.addEventListener('click',click);dialog.addEventListener('cancel',cancel);
 const backdrop=event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close()}};dialog.addEventListener('click',backdrop);

 // Lazy offline module; SVG plus the complete HTML list already work before it
 // arrives, during reduced hardware capability, or if WebGL cannot initialize.
 Promise.all([import('./anatomy/vendor/three.module.js'),import('./anatomy/geometry.js')]).then(([THREE,{makeAnatomy}])=>{
  if(disposed||!host.isConnected)return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}catch{return}
  const container=host.querySelector('[data-anatomy-canvas]');renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2.4,2.4,4.15,-4.15,.1,50);camera.position.set(0,3.85,14);camera.lookAt(0,3.85,0);
  const palette=visualPalettes[theme];
  const ambient=new THREE.HemisphereLight(palette.sky,palette.ground,palette.ambient);scene.add(ambient);
  const light=new THREE.DirectionalLight(palette.key,palette.keyIntensity);light.position.set(-3,7,5);scene.add(light);
  const fill=new THREE.DirectionalLight(palette.fill,palette.fillIntensity);fill.position.set(4,4,-5);scene.add(fill);
  const anatomy=makeAnatomy(THREE,colors,theme);scene.add(anatomy.model);
  container.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');host.classList.add('anatomy-has-webgl');host.querySelector('[data-anatomy-mode]').textContent='Sylwetka 3D · przeciągnij, aby obrócić';
  const render=()=>{if(!disposed)renderer.render(scene,camera)};
  function resize(){const rect=container.getBoundingClientRect();if(!rect.width||!rect.height)return;const halfHeight=4.13,halfWidth=halfHeight*rect.width/rect.height;camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);render()}
  const observer=new ResizeObserver(resize);observer.observe(container);
  setSceneTheme=(next,nextColors)=>{
   const palette=visualPalettes[next];
   ambient.color.set(palette.sky);ambient.groundColor.set(palette.ground);ambient.intensity=palette.ambient;
   light.color.set(palette.key);light.intensity=palette.keyIntensity;fill.color.set(palette.fill);fill.intensity=palette.fillIntensity;
   anatomy.setTheme(next);anatomy.setColors(nextColors);render();
  };
  setView=side=>{anatomy.model.rotation.y=side==='back'?Math.PI:0;render()};highlight=id=>{anatomy.setSelected(id);render()};setColors=next=>{anatomy.setColors(next);render()};setView(currentSide);highlight(selectedGroup);resize();
  let drag=null;const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const down=event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,angle:anatomy.model.rotation.y,moved:false};renderer.domElement.setPointerCapture(event.pointerId)};
  const move=event=>{if(!drag)return;const delta=event.clientX-drag.x;if(Math.abs(delta)>7)drag.moved=true;if(drag.moved){anatomy.model.rotation.y=drag.angle+delta*.012;render()}};
  const up=event=>{if(!drag)return;const state=drag;drag=null;if(!state.moved&&Math.abs(event.clientY-state.y)<12){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(anatomy.pickable)[0];if(hit)openGroup(hit.object.userData.muscleId,host.querySelector(`button[data-anatomy-muscle="${hit.object.userData.muscleId}"]`))}};
  const abort=()=>{drag=null};const lost=event=>{event.preventDefault();host.classList.remove('anatomy-has-webgl');host.querySelector('[data-anatomy-mode]').textContent='Sylwetka anatomiczna · widok uproszczony'};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',abort);renderer.domElement.addEventListener('webglcontextlost',lost);
  disposeScene=()=>{observer.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',abort);renderer.domElement.removeEventListener('webglcontextlost',lost);anatomy.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()};
 }).catch(()=>{});
 return()=>{disposed=true;themeWindow.removeEventListener('trainleaf:themechange',updateTheme);host.removeEventListener('click',click);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('click',backdrop);if(dialog.open)dialog.close();disposeScene()};
}
