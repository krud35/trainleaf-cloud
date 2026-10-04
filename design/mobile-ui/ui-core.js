const paths={
 target:'<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><path d="m11 13 9-9m-5 0h5v5"/>',
 journal:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 8H3m2 8H3m7-9h6m-6 5h6m-6 5h4"/>',
 plan:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
 library:'<path d="M4 4h6v16H4zM14 5l5-1 3 15-5 1zM4 8h6m5-1 5-1"/>',
 progress:'<path d="M4 4v16h17M8 15l4-5 4 2 5-7"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',chevron:'<path d="m9 5 7 7-7 7"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
 disc:'<ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-25 12 12)"/><path d="M8 11c1-2 5-3 7-2"/>',
 strength:'<path d="m8 8 8 8M3 8l5-5m8 18 5-5M6 11l5-5m2 12 5-5"/>',
 running:'<path d="m9 7 5 2 2 5h4M5 12l4-5 4-2m0 4-3 5-5 4m5-4 4 4v3"/><circle cx="16" cy="3" r="1.5"/>',
 mobility:'<path d="M4 17c0-6 5-10 8-10s8 4 8 10M8 17v-5m8 5v-5M3 21h18"/><circle cx="12" cy="3" r="1.5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>'
};
export const icon=name=>`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.disc}</svg>`;

export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
paths.more='<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>';
paths.team='<circle cx="9" cy="8" r="3"/><path d="M3 21v-4c0-4 12-4 12 0v4M16 5a3 3 0 0 1 0 6m2 3c3 0 3 3 3 6"/>';
paths.mental='<path d="M8 21v-4a7 7 0 1 1 11-6l2 3h-4v5h-5M8 8h6m-3-3v6"/>';
paths.endurance='<path d="M2 12h5l3-8 4 16 3-8h5"/>';
paths.settings='<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>';

export const trainingTypes=[
 {id:'strength',label:'Siłowy',short:'Siła',icon:'strength',color:'var(--type-strength-ink,#674333)',background:'var(--type-strength-paper,#F1DFD2)'},
 {id:'running',label:'Biegowy',short:'Bieg',icon:'running',color:'var(--type-running-ink,#35583D)',background:'var(--type-running-paper,#DDEBD9)'},
 {id:'endurance',label:'Wydolnościowy',short:'Wydol.',icon:'endurance',color:'var(--type-endurance-ink,#345C68)',background:'var(--type-endurance-paper,#DCEBF0)'},
 {id:'technique',label:'Techniczny',short:'Techn.',icon:'target',color:'var(--type-technique-ink,#665027)',background:'var(--type-technique-paper,#F1E8CB)'},
 {id:'team',label:'Drużynowy',short:'Druż.',icon:'team',color:'var(--type-team-ink,#51476F)',background:'var(--type-team-paper,#E8E2F1)'},
 {id:'mental',label:'Mentalny',short:'Mental.',icon:'mental',color:'var(--type-mental-ink,#6B445A)',background:'var(--type-mental-paper,#F0DFE9)'}
];
export function typeOf(workout){
 const explicit=trainingTypes.find(t=>t.id===workout.trainingType);
 if(explicit)return explicit;
 const sport=workout.sport||'';
 const legacy=sport==='Trening siłowy'?'strength':sport==='Bieganie'?'running':['Kolarstwo','Pływanie'].includes(sport)?'endurance':'technique';
 return trainingTypes.find(t=>t.id===legacy);
}
export function typeBadge(workout,{compact=false}={}){
 const type=typeOf(workout);
 return `<span class="type-badge" style="--type-ink:${type.color};--type-bg:${type.background}">${icon(type.icon)}<span>${compact?type.short:type.label}</span></span>`;
}
export const helpTexts={
 'trainleaf-load':['Trainleaf load · własny wskaźnik','Wynik zależy od wykonanego czasu, rodzaju treningu oraz obu ocen zmęczenia po sesji. To własny wskaźnik Trainleaf z ustalonymi przez Ciebie wagami, nie naukowo zwalidowana ocena. Trening mentalny nie nalicza obciążenia fizycznego. Satysfakcja i RPE nie wchodzą do tego wzoru. Brak oceny pozostaje brakiem. Zmiana czasu, rodzaju lub ocen zaktualizuje wynik po zapisaniu sesji.'],
 rir:['RIR · zapas powtórzeń','Ile dodatkowych powtórzeń możesz jeszcze wykonać na końcu serii, zachowując prawidłową technikę. RIR 2 oznacza zapas około dwóch powtórzeń; RIR 0 — brak kolejnego poprawnego powtórzenia. W planie wpisujesz docelowy zapas. To oszacowanie.'],
 'strength-tempo':['Tempo siłowe','Liczby oznaczają sekundy: faza ekscentryczna → pauza → faza koncentryczna. W przysiadzie 2–2–2 to 2 sekundy schodzenia, 2 sekundy zatrzymania i 2 sekundy wstawania. Czwarta liczba, jeśli występuje, oznacza pauzę po fazie koncentrycznej. X oznacza wykonanie danej fazy możliwie dynamicznie, z kontrolą.'],
 'running-pace':['Tempo biegu','Czas pokonania kilometra. 5:30 min/km oznacza 5 minut i 30 sekund na kilometr. Niższa wartość oznacza szybszy bieg.'],
 rest:['Przerwa między seriami','Czas odpoczynku po zakończeniu serii przed rozpoczęciem kolejnej.'],
 superset:['Superseria','Wykonaj po jednej serii każdego ćwiczenia w podanej kolejności, a potem zacznij kolejną rundę. Możesz połączyć dowolną liczbę ćwiczeń. Przy trzech lub więcej ćwiczeniach grupa może też być nazywana obwodem. Przejście między ćwiczeniami i odpoczynek po całej rundzie to osobne ustawienia.'],
 rpe:['RPE · wysiłek całej sesji','Twoja ocena tego, jak ciężka była cała sesja: od 0 (bez wysiłku) do 10 (maksymalny wysiłek). To inne pytanie niż zmęczenie odczuwane po zakończeniu.'],
 'muscle-plan':['Grupy mięśniowe w planie','Zestawienie oznaczeń ćwiczeń w zaplanowanych sesjach tego tygodnia. Jedna sesja może obejmować kilka grup. Brak oznaczeń nie oznacza braku pracy mięśni. To podgląd planu, nie wykonania ani zalecanych proporcji.']
};
export function helpButton(topic){return `<button type="button" class="help-trigger" data-help="${esc(topic)}" aria-label="Pomoc: ${esc(helpTexts[topic]?.[0]||topic)}" aria-haspopup="dialog">?</button>`}
export function bindHelp(root=document){
 let returnTo=null;
 const dialog=document.createElement('dialog');dialog.className='help-dialog';dialog.setAttribute('aria-labelledby','help-title');dialog.innerHTML='<div class="help-dialog-heading"><h2 id="help-title"></h2><button type="button" data-close-help aria-label="Zamknij pomoc">×</button></div><p id="help-description"></p>';dialog.setAttribute('aria-describedby','help-description');document.body.append(dialog);
 root.addEventListener('click',e=>{const trigger=e.target.closest('[data-help]');if(trigger){e.preventDefault();const text=helpTexts[trigger.dataset.help];if(!text)return;returnTo=trigger;dialog.querySelector('h2').textContent=text[0];dialog.querySelector('p').textContent=text[1];dialog.querySelector('.help-sources')?.remove();if(Array.isArray(text[2]))dialog.insertAdjacentHTML('beforeend','<div class="help-sources">'+text[2].filter(source=>/^https:\/\//.test(source.url)).map(source=>'<a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">'+esc(source.label)+'</a>').join('')+'</div>');dialog.showModal()}if(e.target.closest('[data-close-help]'))dialog.close()});
 dialog.addEventListener('close',()=>returnTo?.isConnected&&returnTo.focus());
}
