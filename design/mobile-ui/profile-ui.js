import {esc,icon} from './ui-core.js';

const sportGroups=[
  {name:'Drużynowe',sports:['Ultimate frisbee','Piłka nożna','Siatkówka','Koszykówka','Piłka ręczna','Rugby','Hokej']},
  {name:'Wytrzymałość',sports:['Bieganie','Kolarstwo','Pływanie','Triathlon','Wioślarstwo','Chód sportowy']},
  {name:'Siła i sprawność',sports:['Trening siłowy','Kalistenika','Cross training','Podnoszenie ciężarów','Gimnastyka']},
  {name:'Z rakietą',sports:['Tenis','Badminton','Tenis stołowy','Padel','Squash']},
  {name:'Ruch i technika',sports:['Wspinaczka','Taniec','Joga','Pilates','Sporty walki']},
  {name:'W terenie',sports:['Turystyka górska','Narciarstwo','Snowboard','Rolki','Łyżwiarstwo']}
];
export const sportChoices=sportGroups.flatMap(group=>group.sports);

const modules=[
  {id:'library',name:'Katalog ćwiczeń',description:'Znajdź ćwiczenie i zajrzyj do jego opisu.',symbol:'library'},
  {id:'templates',name:'Szablony treningów',description:'Zacznij od zestawu, który już znasz.',symbol:'plan'},
  {id:'history',name:'Historia treningów',description:'Wróć do wykonanych sesji i notatek.',symbol:'journal'},
  {id:'wellness',name:'Samopoczucie',description:'Check-in i Twoje wcześniejsze odpowiedzi.',symbol:'sun'},
  {id:'export',name:'Eksport danych',description:'Zachowaj treningi w wybranym pliku.',symbol:'lock'}
];
const moduleIds=modules.map(module=>module.id);
const fold=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/Ł/g,'L').toLocaleLowerCase('pl').trim();
const clean=value=>String(value??'').trim().replace(/\s+/g,' ');
const unique=values=>{const seen=new Set();return values.map(clean).filter(value=>value&&!seen.has(fold(value))&&seen.add(fold(value)));};
const currentSports=profile=>unique(Array.isArray(profile?.sports)?profile.sports:[]);
const currentModules=profile=>{
  if(!Array.isArray(profile?.modules))return [...moduleIds];
  if(!profile.modules.length)return [];
  const selected=moduleIds.filter(id=>profile.modules.includes(id));
  // Previous prototypes stored broad feature labels, rather than shortcut IDs.
  return selected.length?selected:[...moduleIds];
};
const heading=(title,description)=>`<div class="page-heading"><h1>${title}</h1><p class="muted">${description}</p></div>`;
const back=route=>`<button type="button" class="subtle profile-back" data-go="${route}">← Wróć</button>`;
const shortcut=(module,compact=false)=>`<button type="button" class="more-shortcut${compact?' more-shortcut-compact':''}" data-go="${module.id}"><span class="more-symbol" aria-hidden="true">${icon(module.symbol)}</span><span><strong>${module.name}</strong>${compact?'':`<small>${module.description}</small>`}</span>${icon('chevron')}</button>`;
const sportOption=(sport,selected)=>`<label class="sport-option" data-sport-option data-sport-name="${esc(sport)}"><input type="checkbox" name="sport" value="${esc(sport)}"${selected?' checked':''}><span>${esc(sport)}</span></label>`;

export function renderMore(profile={}){
  const selected=currentModules(profile);
  return `<section class="more-hub">${heading('Inne','Twoje narzędzia, w jednym miejscu.')}<div class="more-section-heading"><h2>Na skróty</h2><button type="button" class="subtle" data-go="modules">Dostosuj ${icon('arrow')}</button></div><div class="more-shortcuts">${selected.length?modules.filter(module=>selected.includes(module.id)).map(module=>shortcut(module)).join(''):'<p class="more-empty">Tutaj pojawią się wybrane przez Ciebie skróty. Wszystkie narzędzia znajdziesz poniżej.</p>'}</div><details class="more-all"><summary>Wszystkie narzędzia <span>${modules.length}</span></summary><div>${modules.map(module=>shortcut(module,true)).join('')}</div></details><button type="button" class="more-settings" data-go="settings"><span><strong>Ustawienia</strong><small>Twoje sporty i preferencje</small></span>${icon('arrow')}</button></section>`;
}

export function renderProfile(profile={}){
  const selected=currentSports(profile),known=new Set(sportChoices.map(fold)),custom=selected.filter(sport=>!known.has(fold(sport)));
  const groups=sportGroups.map((group,index)=>{
    const count=group.sports.filter(sport=>selected.some(value=>fold(value)===fold(sport))).length;
    return `<details class="sport-group" data-sport-group${count||(!selected.length&&index===0)?' open':''}><summary>${group.name}<span class="sport-group-count" data-group-count>${count?`Wybrano: ${count}`:''}</span></summary><fieldset><legend class="profile-visually-hidden">${group.name}</legend>${group.sports.map(sport=>sportOption(sport,selected.some(value=>fold(value)===fold(sport)))).join('')}</fieldset></details>`;
  }).join('');
  return `<section class="sport-picker">${back('settings')}${heading('Twoje sporty','Wybierz jeden lub kilka. Własny sport też ma tu miejsce.')}<form id="profile"><label class="field sport-search">Znajdź sport<input id="sport-search" type="search" autocomplete="off" placeholder="Np. bieganie, frisbee…" aria-controls="sport-options" data-sport-search></label><p class="sport-selection-status" role="status" aria-live="polite" aria-atomic="true" data-sport-status>Wybrane sporty: ${selected.length}</p><div id="sport-options">${groups}<details class="sport-group sport-custom-group" data-sport-group${custom.length?' open':''}><summary>Własne sporty<span class="sport-group-count" data-group-count>${custom.length?`Wybrano: ${custom.length}`:''}</span></summary><fieldset data-custom-options><legend class="profile-visually-hidden">Własne sporty</legend>${custom.map(sport=>sportOption(sport,true)).join('')}</fieldset><p class="sport-custom-empty" data-custom-empty${custom.length?' hidden':''}>Dodaj poniżej nazwę swojego sportu.</p></details></div><p class="sport-no-results" data-sport-no-results hidden>Nie ma takiego sportu na liście. Możesz dodać go poniżej.</p><div class="sport-custom-entry"><h2>Dodaj własny sport</h2><label class="field">Nazwa sportu<input type="text" name="customSport" maxlength="80" autocomplete="off" placeholder="Np. disc golf" data-custom-sport aria-describedby="custom-sport-hint"></label><p id="custom-sport-hint" class="sport-hint">Możesz dodać kilka, po jednym.</p><button type="button" class="sport-add" data-add-sport>${icon('plus')} Dodaj sport</button></div><p class="sport-save-note">Zmiana wyboru nie usuwa wcześniejszych treningów.</p><button type="submit" class="primary wide">Zapisz sporty</button></form></section>`;
}

export function renderModules(profile={}){
  const selected=currentModules(profile);
  return `<section class="module-picker">${back('more')}${heading('Dostosuj Inne','Wybierz narzędzia, które chcesz mieć pod ręką.')}<form id="modules"><fieldset><legend class="profile-visually-hidden">Skróty w sekcji Inne</legend>${modules.map(module=>`<label class="module-option"><input type="checkbox" name="module" value="${module.id}"${selected.includes(module.id)?' checked':''}><span><strong>${module.name}</strong><small>${module.description}</small></span></label>`).join('')}</fieldset><p class="module-help">Ukryte skróty znajdziesz we „Wszystkich narzędziach”. Ich dane pozostają bez zmian.</p><button type="submit" class="primary wide">Zapisz skróty</button></form></section>`;
}

export function bindProfile(root){
  const form=root.matches?.('form#profile')?root:root.querySelector('form#profile');
  if(!form||form.dataset.profileBound)return;
  form.dataset.profileBound='true';
  const search=form.querySelector('[data-sport-search]'),customInput=form.querySelector('[data-custom-sport]'),status=form.querySelector('[data-sport-status]');
  const groups=[...form.querySelectorAll('[data-sport-group]')];
  let savedOpen=null;
  const options=()=>[...form.querySelectorAll('[data-sport-option]')];
  const updateCounts=()=>{
    const count=form.querySelectorAll('input[name="sport"]:checked').length;
    for(const group of groups){const n=group.querySelectorAll('input[name="sport"]:checked').length;group.querySelector('[data-group-count]').textContent=n?`Wybrano: ${n}`:'';}
    return count;
  };
  function filterSports(){
    const query=fold(search.value),words=query.split(/\s+/).filter(Boolean);
    if(query&&!savedOpen)savedOpen=groups.map(group=>group.open);
    let matches=0;
    for(const option of options()){const match=words.every(word=>fold(option.dataset.sportName).includes(word));option.hidden=!match;if(match)matches++;}
    groups.forEach((group,index)=>{
      const visible=group.querySelector('[data-sport-option]:not([hidden])');
      group.hidden=Boolean(query&&!visible);
      if(query&&visible)group.open=true;
      if(!query&&savedOpen)group.open=savedOpen[index];
    });
    if(!query)savedOpen=null;
    form.querySelector('[data-sport-no-results]').hidden=!query||matches>0;
    const count=updateCounts();
    status.textContent=query?`Wyniki: ${matches}. Wybrane sporty: ${count}.`:`Wybrane sporty: ${count}`;
  }
  function addCustom(){
    const value=clean(customInput.value);
    if(!value){customInput.focus();return;}
    const existing=options().find(option=>fold(option.dataset.sportName)===fold(value));
    if(existing)existing.querySelector('input').checked=true;
    else form.querySelector('[data-custom-options]').insertAdjacentHTML('beforeend',sportOption(value,true));
    customInput.value='';search.value='';filterSports();
    const selected=existing||options().at(-1);selected.closest('[data-sport-group]').open=true;
    form.querySelector('[data-custom-empty]').hidden=Boolean(form.querySelector('[data-custom-options] input'));
    status.textContent=`Wybrano: ${value}. Wybrane sporty: ${updateCounts()}.`;
    customInput.focus();
  }
  search.addEventListener('input',filterSports);
  form.addEventListener('change',event=>{if(event.target.matches('input[name="sport"]'))filterSports();});
  form.querySelector('[data-add-sport]').addEventListener('click',addCustom);
  customInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addCustom();}});
  search.addEventListener('keydown',event=>{if(event.key==='Enter')event.preventDefault();});
}

export function readProfile(form,existing={}){
  const data=new FormData(form),selected=unique(data.getAll('sport')),pending=clean(data.get('customSport'));
  if(pending.length>80)return {profile:null,error:'Skróć nazwę własnego sportu do 80 znaków.'};
  if(pending&&!selected.some(sport=>fold(sport)===fold(pending))){
    const known=sportChoices.find(sport=>fold(sport)===fold(pending));selected.push(known||pending);
  }
  if(!selected.length)return {profile:null,error:'Wybierz przynajmniej jeden sport lub dodaj własny.'};
  const selectedKeys=new Set(selected.map(fold)),previous=currentSports(existing).filter(sport=>selectedKeys.has(fold(sport)));
  return {profile:{...existing,sports:unique([...previous,...selected])},error:null};
}

export function readModules(form,existing={}){
  const selected=new Set(new FormData(form).getAll('module'));
  return {...existing,modules:moduleIds.filter(id=>selected.has(id))};
}
