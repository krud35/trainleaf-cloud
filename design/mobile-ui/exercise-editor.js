import {esc,icon,helpButton} from './ui-core.js';

const sections=[['warmup','Rozgrzewka'],['main','Część główna'],['cooldown','Cooldown']];
const selection={draftId:null,active:false,ids:new Set(),message:''};
const clone=value=>JSON.parse(JSON.stringify(value));
const uid=()=>crypto.randomUUID();
const text=value=>String(value??'');
const normalize=value=>text(value).trim().toLocaleLowerCase('pl');

// A catalog is metadata, not a prescription. Saved drafts are never passed here.
export function prepareExercise(ex){
  const result={...clone(ex),id:uid(),sets:'',quantity:'',rir:'',tempo:'',pace:'',rest:'',section:ex.section||'main'};
  delete result.groupId;
  delete result.kg;
  delete result.load;
  return result;
}

function ensure(draft){
  draft.exercises??=[];
  draft.groups??=[];
  const ids=new Set();
  for(const ex of draft.exercises){
    if(!ex.id||ids.has(ex.id))ex.id=uid();
    ids.add(ex.id);
    ex.section=sections.some(([value])=>value===ex.section)?ex.section:'main';
    if(ex.groupId&&!draft.groups.some(group=>group.id===ex.groupId))delete ex.groupId;
  }
  if(selection.draftId!==draft.id){
    selection.draftId=draft.id;
    selection.active=false;
    selection.ids.clear();
    selection.message='';
  }
  for(const id of selection.ids){if(!draft.exercises.some(ex=>ex.id===id&&!ex.groupId))selection.ids.delete(id)}
}

const isStrength=ex=>ex.modality?ex.modality==='strength':['siła','siłowy','trening siłowy'].includes(normalize(ex.kind));
const isRunning=ex=>ex.modality?ex.modality==='running':/\b(bieg|bieganie|biegowy)\b/.test(normalize(ex.name))||['bieganie','biegowy','bieg'].includes(normalize(ex.kind));
const action=(label,name,attrs='',className='')=>`<button type="button" class="ex-button ${className}" data-ex-action="${name}" ${attrs}>${label}</button>`;
const suffix=index=>{let out='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))out=String.fromCharCode(97+(n-1)%26)+out;return out};
const sectionLabel=value=>sections.find(([id])=>id===value)?.[1]||'Część główna';

function input(index,key,label,value,{type='number',attrs='',help='',groupId=''}={}){
  const id=groupId?`ex-group-${groupId}-${key}`:`ex-${index}-${key}`;
  const data=groupId?`data-ex-group="${esc(groupId)}"`:`data-ex-index="${index}"`;
  return `<div class="ex-field"><div class="ex-field-label"><label for="${id}">${label}</label>${help?helpButton(help):''}</div><input id="${id}" name="${id}" ${data} data-ex-field="${key}" type="${type}" value="${esc(value)}" ${attrs}></div>`;
}

function sectionSelect(index,value,groupId=''){
  const id=groupId?`ex-group-${groupId}-section`:`ex-${index}-section`;
  return `<label class="ex-field" for="${id}">Sekcja<select id="${id}" name="${id}" ${groupId?`data-ex-group="${esc(groupId)}"`:`data-ex-index="${index}"`} data-ex-field="section">${sections.map(([key,label])=>`<option value="${key}" ${value===key?'selected':''}>${label}</option>`).join('')}</select></label>`;
}

function exerciseCard(draft,ex,index,number,group=null,memberIndex=0,memberCount=0){
  const strength=isStrength(ex),running=isRunning(ex);
  const canShowWeight=ex.kg!==undefined&&ex.kg!==null&&ex.kg!=='';
  const memberControls=group?`<div class="ex-member-actions" aria-label="Kolejność: ${esc(ex.name)}">${action('↑ W górę','up',`data-ex-index="${index}" aria-label="Przenieś wyżej: ${esc(ex.name)}" ${memberIndex===0?'disabled':''}`)}${action('↓ W dół','down',`data-ex-index="${index}" aria-label="Przenieś niżej: ${esc(ex.name)}" ${memberIndex===memberCount-1?'disabled':''}`)}${action('Wyjmij z grupy','detach',`data-ex-index="${index}"`)}</div>`:'';
  const selectionBox=selection.active&&!group?`<label class="ex-select"><input type="checkbox" data-ex-select="${esc(ex.id)}" ${selection.ids.has(ex.id)?'checked':''}><span>Dodaj do nowej superserii</span></label>`:'';
  return `<article class="ex-item ${group?'ex-member':''}" id="ex-item-${esc(ex.id)}" aria-labelledby="ex-name-${esc(ex.id)}"><header class="ex-item-heading"><span class="ex-number" aria-label="Ćwiczenie ${number}">${number}</span><div><h3 id="ex-name-${esc(ex.id)}">${esc(ex.name)}</h3><p class="ex-meta">${esc(ex.kind||'Własne ćwiczenie')}${group?` · ${sectionLabel(group.section)}`:''}</p></div>${action('Usuń','remove',`data-ex-index="${index}" aria-label="Usuń ćwiczenie: ${esc(ex.name)}"`,'ex-remove')}</header>${selectionBox}${!group?sectionSelect(index,ex.section):''}<div class="ex-fields">${!group?input(index,'sets','Serie',ex.sets,{attrs:'min="1" max="100" step="1" inputmode="numeric"'}):''}${input(index,'quantity',esc(ex.unit||'Powtórzenia'),ex.quantity,{attrs:'min="0" step="any" inputmode="decimal"'})}${strength?input(index,'rir','RIR · zapas powtórzeń',ex.rir,{attrs:'min="0" max="20" step="1" inputmode="numeric"',help:'rir'}):''}</div>${canShowWeight?`<p class="ex-preserved">Zapisany ciężar: <strong>${esc(ex.kg)} kg</strong><span>Zachowany z wcześniejszego zapisu.</span></p>`:''}<details class="ex-details"><summary>Tempo, odpoczynek i notatka</summary><div class="ex-fields">${strength?input(index,'tempo','Tempo ruchu',ex.tempo,{type:'text',attrs:'maxlength="30" autocomplete="off"',help:'strength-tempo'}):''}${running?input(index,'pace','Tempo biegu · min/km',ex.pace,{type:'text',attrs:'maxlength="12" inputmode="decimal" autocomplete="off"',help:'running-pace'}):''}${!group?input(index,'rest','Przerwa między seriami · s',ex.rest,{attrs:'min="0" step="1" inputmode="numeric"',help:'rest'}):'<p class="ex-inline-note">Odpoczynek ustalasz dla całej grupy poniżej.</p>'}</div>${ex.instructions?`<p class="ex-instructions">${esc(ex.instructions)}</p>`:''}<label class="ex-field" for="ex-${index}-notes">Moja notatka<textarea id="ex-${index}-notes" name="ex-${index}-notes" data-ex-index="${index}" data-ex-field="notes" rows="2">${esc(ex.notes)}</textarea></label></details>${strength?`<button type="button" class="subtle wide" data-exercise-roles="${index}">Role mięśni · ${ex.muscleRoles?'zapisane':'do uzupełnienia'}</button>`:''}${memberControls}</article>`;
}

function groupCard(draft,group,number){
  const members=draft.exercises.map((ex,index)=>({ex,index})).filter(({ex})=>ex.groupId===group.id);
  const candidates=draft.exercises.map((ex,index)=>({ex,index})).filter(({ex})=>!ex.groupId);
  return `<section class="ex-group" id="ex-group-${esc(group.id)}" aria-labelledby="ex-group-title-${esc(group.id)}"><div class="ex-group-heading"><div><span class="ex-group-kicker">${members.length>2?'Grupa / obwód':'Ćwiczenia połączone'}</span><h3 id="ex-group-title-${esc(group.id)}">Superseria ${number}</h3></div>${helpButton('superset')}</div><p class="ex-group-intro">W każdej rundzie wykonaj po jednej serii każdego ćwiczenia, w podanej kolejności.</p><div class="ex-fields">${sectionSelect(0,group.section||'main',group.id)}${input(0,'rounds','Rundy grupy',group.rounds,{attrs:'min="1" max="100" step="1" inputmode="numeric"',groupId:group.id})}</div><div class="ex-members">${members.map(({ex,index},j)=>exerciseCard(draft,ex,index,`${number}${suffix(j)}`,group,j,members.length)).join('')}</div><div class="ex-group-rest"><p>Odpoczynek w superserii</p><div class="ex-fields">${input(0,'transitionRest','Między ćwiczeniami · s',group.transitionRest,{attrs:'min="0" step="1" inputmode="numeric"',groupId:group.id})}${input(0,'roundRest','Po całej rundzie · s',group.roundRest,{attrs:'min="0" step="1" inputmode="numeric"',groupId:group.id})}</div><small>Po ostatnim ćwiczeniu obowiązuje odpoczynek po rundzie. Czasy się nie sumują.</small></div>${candidates.length?`<div class="ex-append"><label class="ex-field" for="ex-add-${esc(group.id)}">Dodaj ćwiczenie do tej grupy<select id="ex-add-${esc(group.id)}" data-ex-group-picker="${esc(group.id)}"><option value="">Wybierz ćwiczenie z treningu</option>${candidates.map(({ex})=>`<option value="${esc(ex.id)}">${esc(ex.name)}</option>`).join('')}</select></label>${action('Dodaj do grupy','append',`data-ex-group="${esc(group.id)}"`)}</div>`:'<p class="ex-inline-note">Kolejne ćwiczenie dodaj najpierw z katalogu, a potem do tej grupy.</p>'}${action('Rozgrupuj ćwiczenia','ungroup',`data-ex-group="${esc(group.id)}"`,'ex-ungroup')}<small class="ex-group-explanation">Po wyjęciu lub rozgrupowaniu liczba rund staje się liczbą serii. Uzupełnij wtedy przerwy między seriami.</small></section>`;
}

export function renderExerciseEditor(draft){
  ensure(draft);
  let number=0;
  const shown=new Set();
  const blocks=draft.exercises.map((ex,index)=>{
    if(ex.groupId){
      if(shown.has(ex.groupId))return '';
      shown.add(ex.groupId);
      return groupCard(draft,draft.groups.find(group=>group.id===ex.groupId),++number);
    }
    return exerciseCard(draft,ex,index,++number);
  }).join('');
  return `<section class="exercise-composer" aria-labelledby="exercise-composer-title"><div class="ex-composer-heading"><h2 id="exercise-composer-title">Ćwiczenia <small>· opcjonalnie</small></h2>${draft.exercises.filter(ex=>!ex.groupId).length>=2&&!selection.active?action(`${icon('plus')} Superseria`,'select') :''}</div>${selection.active?`<div class="ex-selection-bar"><p>Zaznacz co najmniej dwa ćwiczenia. Ułożymy je według kolejności w treningu.</p><span data-ex-selection-count aria-live="polite">Wybrano: ${selection.ids.size}</span><div class="ex-selection-actions">${action('Połącz zaznaczone','create',`${selection.ids.size<2?'disabled':''}`,'primary')}${action('Anuluj wybór','cancel')}</div></div>`:''}<p class="ex-feedback" role="status">${esc(selection.message)}</p>${blocks||'<p class="ex-empty">Dodaj ćwiczenia z katalogu. Serie, powtórzenia i pozostałe wartości uzupełnisz według własnego planu.</p>'}</section>`;
}

function leaveGroup(ex,group){
  delete ex.groupId;
  ex.sets=group.rounds??'';
  // Group recovery rules cannot silently turn into a per-exercise rest rule.
  ex.rest='';
}

function tidyGroup(draft,groupId){
  const group=draft.groups.find(item=>item.id===groupId);
  if(!group)return;
  const remaining=draft.exercises.filter(ex=>ex.groupId===groupId);
  if(remaining.length<2){
    remaining.forEach(ex=>leaveGroup(ex,group));
    draft.groups=draft.groups.filter(item=>item.id!==groupId);
  }
}

export function handleExerciseClick(button,draft){
  const type=button.dataset.exAction;
  if(!type||!draft)return {handled:false,changed:false};
  ensure(draft);
  selection.message='';
  const index=Number(button.dataset.exIndex),ex=draft.exercises[index];
  const group=draft.groups.find(item=>item.id===button.dataset.exGroup);
  let focusSelector;
  if(type==='select'){selection.active=true;selection.ids.clear();focusSelector='[data-ex-select]'}
  else if(type==='cancel'){selection.active=false;selection.ids.clear();focusSelector='[data-ex-action="select"]'}
  else if(type==='create'){
    const members=draft.exercises.filter(item=>selection.ids.has(item.id)&&!item.groupId);
    if(members.length<2)return {handled:true,changed:false};
    const newGroup={id:uid(),rounds:members.every(item=>text(item.sets)===text(members[0].sets))?members[0].sets??'':'',transitionRest:'',roundRest:'',section:members.every(item=>item.section===members[0].section)?members[0].section:'main'};
    const insert=draft.exercises.indexOf(members[0]);
    for(const item of members){item.groupId=newGroup.id;item.section=newGroup.section}
    draft.exercises=draft.exercises.filter(item=>!selection.ids.has(item.id));
    draft.exercises.splice(insert,0,...members);
    draft.groups.push(newGroup);
    selection.active=false;selection.ids.clear();selection.message=`Utworzono superserię z ${members.length} ćwiczeń.`;
    focusSelector=`[data-ex-group="${newGroup.id}"][data-ex-field="rounds"]`;
  }
  else if(type==='remove'&&ex){
    const groupId=ex.groupId;
    draft.exercises.splice(index,1);
    tidyGroup(draft,groupId);
    selection.message='Usunięto ćwiczenie z tego treningu.';
  }
  else if((type==='up'||type==='down')&&ex?.groupId){
    const indices=draft.exercises.map((item,i)=>item.groupId===ex.groupId?i:-1).filter(i=>i>=0);
    const position=indices.indexOf(index),target=indices[position+(type==='up'?-1:1)];
    if(target===undefined)return {handled:true,changed:false};
    [draft.exercises[index],draft.exercises[target]]=[draft.exercises[target],draft.exercises[index]];
    focusSelector=`#ex-item-${ex.id} [data-ex-action="${type==='up'&&position===1?'down':type==='down'&&position===indices.length-2?'up':type}"]`;
    selection.message='Zmieniono kolejność w superserii.';
  }
  else if(type==='detach'&&ex?.groupId){
    const oldGroup=draft.groups.find(item=>item.id===ex.groupId);
    if(!oldGroup)return {handled:true,changed:false};
    draft.exercises.splice(index,1);
    const last=draft.exercises.reduce((found,item,i)=>item.groupId===oldGroup.id?i:found,-1);
    leaveGroup(ex,oldGroup);
    draft.exercises.splice(last+1,0,ex);
    tidyGroup(draft,oldGroup.id);
    selection.message='Ćwiczenie jest poza grupą. Sprawdź serie i uzupełnij przerwę.';
    focusSelector=`#ex-item-${ex.id} [data-ex-field="sets"]`;
  }
  else if(type==='ungroup'&&group){
    draft.exercises.filter(item=>item.groupId===group.id).forEach(item=>leaveGroup(item,group));
    draft.groups=draft.groups.filter(item=>item.id!==group.id);
    selection.message='Rozgrupowano ćwiczenia. Liczba rund stała się liczbą serii; uzupełnij przerwy.';
  }
  else if(type==='append'&&group){
    const picker=button.closest('.ex-group')?.querySelector('[data-ex-group-picker]');
    const candidate=draft.exercises.find(item=>item.id===picker?.value&&!item.groupId);
    if(!candidate){
      if(picker){picker.setCustomValidity('Wybierz ćwiczenie z listy.');picker.reportValidity()}
      return {handled:true,changed:false};
    }
    draft.exercises=draft.exercises.filter(item=>item!==candidate);
    const last=draft.exercises.reduce((found,item,i)=>item.groupId===group.id?i:found,-1);
    candidate.groupId=group.id;candidate.section=group.section||'main';candidate.sets=group.rounds??'';
    draft.exercises.splice(last+1,0,candidate);
    selection.message='Dodano ćwiczenie na końcu superserii.';
    focusSelector=`#ex-item-${candidate.id} [data-ex-field="quantity"]`;
  }
  else return {handled:true,changed:false};
  return {handled:true,changed:true,focusSelector};
}

export function handleExerciseInput(input,draft){
  if(!draft)return false;
  if(input.dataset.exSelect!==undefined){
    if(input.checked)selection.ids.add(input.dataset.exSelect);else selection.ids.delete(input.dataset.exSelect);
    const composer=input.closest('.exercise-composer');
    const counter=composer?.querySelector('[data-ex-selection-count]');
    const create=composer?.querySelector('[data-ex-action="create"]');
    if(counter)counter.textContent=`Wybrano: ${selection.ids.size}`;
    if(create)create.disabled=selection.ids.size<2;
    return true;
  }
  if(input.dataset.exGroupPicker!==undefined){input.setCustomValidity('');return true}
  const key=input.dataset.exField;
  if(!key)return false;
  if(input.dataset.exGroup){
    const group=draft.groups.find(item=>item.id===input.dataset.exGroup);
    if(!group||!['rounds','transitionRest','roundRest','section'].includes(key))return true;
    group[key]=input.value;
    if(key==='rounds')draft.exercises.filter(ex=>ex.groupId===group.id).forEach(ex=>{ex.sets=input.value});
    if(key==='section'){
      draft.exercises.filter(ex=>ex.groupId===group.id).forEach(ex=>{ex.section=input.value});
      const region=input.closest('.ex-group');
      region?.querySelectorAll('.ex-meta').forEach(element=>{const article=element.closest('[id^="ex-item-"]');const item=draft.exercises.find(ex=>`ex-item-${ex.id}`===article.id);element.textContent=`${item?.kind||'Własne ćwiczenie'} · ${sectionLabel(input.value)}`});
    }
    return true;
  }
  const ex=draft.exercises[Number(input.dataset.exIndex)];
  if(ex&&['sets','quantity','rir','tempo','pace','rest','section','notes'].includes(key))ex[key]=input.value;
  return true;
}
