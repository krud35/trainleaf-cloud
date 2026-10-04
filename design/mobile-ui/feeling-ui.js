import {esc} from './ui-core.js';
const button=(label,action,cls='')=>`<button type="button" class="${cls}" ${action}>${label}</button>`;
export const feelingLabels={
 'Jakość snu':['Sen w ogóle nie dał odpoczynku','Słaby, niespokojny sen','Sen w porządku, ale bez rewelacji','Dobry, spokojny sen','Świetny sen, pełen wypoczynek'],
 'Zmęczenie':['Czuję pełną świeżość','Prawie nie czuję zmęczenia','Czuję tylko lekkie zmęczenie','Trochę brakuje mi sił','Zmęczenie zaczyna przeszkadzać','Czuję wyraźne zmęczenie','Coraz trudniej utrzymać tempo','Mam już mało sił','Nawet małe rzeczy mnie męczą','Ledwo starcza mi sił','Nie mam już sił'],
 'Bolesność mięśni':['Nic mnie nie boli','Ledwo czuję mięśnie','Lekko czuję mięśnie przy ruchu','Mięśnie trochę mi dokuczają','Bolesność zaczyna przeszkadzać','Mięśnie wyraźnie mnie bolą','Ból coraz bardziej mi dokucza','Ból utrudnia swobodny ruch','Nawet mały ruch mocno boli','Ból jest bardzo trudny do zniesienia','Ból jest nie do zniesienia'],
 'Energia':['Brakuje mi energii na cokolwiek','Trudno mi się rozkręcić','Mam energię na zwykły dzień','Mam dużo energii do działania','Energia mnie rozpiera'],
 'Stres':['Pełen spokój','Prawie nic mnie nie stresuje','Czuję drobne napięcie','Trochę się przejmuję','Stres zaczyna mi przeszkadzać','Mam sporo stresu','Trudno mi się rozluźnić','Napięcie nie odpuszcza','Stres mocno mnie przytłacza','Bardzo trudno mi się uspokoić','Stres całkowicie mnie przytłacza'],
 'Nastrój':['Jest mi dziś bardzo źle','Mam słabszy dzień','Ani dobrze, ani źle','Mam dobry humor','Mam świetny humor'],
 'Koncentracja':['Wszystko mnie rozprasza','Trudno mi utrzymać skupienie','Skupiam się, ale czasem odpływam','Łatwo mi się skupić','Nic mnie nie rozprasza'],
 'Czas na odpoczynek':['Nie było chwili na odpoczynek','Tylko krótka przerwa','Trochę odpoczynku, ale za mało','Był czas porządnie odpocząć','Tyle odpoczynku, ile potrzebuję']
};
export function feelingField(n,min,max,value,index){
 const answered=value!==''&&value!==undefined&&value!==null;
 const position=answered?Number(value):Math.round((min+max)/2),id=`feeling-${index}`;
 const caption=answered?feelingLabels[n][position-min]:'Przesuń suwak lub dotknij wybranej pozycji.';
 const bounds={'Zmęczenie oddechowe / tlenowe':['brak','maksymalne'],'Zmęczenie mięśniowe / siłowe':['brak','maksymalne'],'Przyjemność / satysfakcja':['brak','bardzo duża'],'Jakość snu':['bardzo słaba','bardzo dobra'],'Zmęczenie':['brak','bardzo duże'],'Bolesność mięśni':['brak','bardzo duża'],'Energia':['bardzo mało','bardzo dużo'],'Stres':['brak','bardzo duży'],'Nastrój':['bardzo zły','bardzo dobry'],'Koncentracja':['bardzo trudno','bardzo łatwo'],'Czas na odpoczynek':['wcale','w pełni wystarcza']}[n];
 return `<section class="feeling ${answered?'answered':''}" data-feeling="${esc(n)}"><div class="feeling-heading"><label for="${id}">${esc(n)}</label><output for="${id}" class="feeling-value">${answered?position:'—'}<small> / ${max}</small></output></div><input id="${id}" class="feeling-range" type="range" min="${min}" max="${max}" step="1" value="${position}" aria-label="${esc(n)} · ${min}–${max}" aria-describedby="${id}-caption" aria-valuetext="${answered?esc(position+' — '+caption):'Bez odpowiedzi'}" style="--fill:${answered?(position-min)/(max-min)*100:0}%"><input type="hidden" name="answer-${esc(n)}" value="${answered?position:''}" class="feeling-answer"><div class="feeling-ticks" aria-hidden="true">${Array.from({length:max-min+1},(_,i)=>`<span>${i+min}</span>`).join('')}</div><p id="${id}-caption" class="feeling-caption">${esc(caption)}</p><div class="feeling-footer"><span>${min} · ${bounds[0]} → ${max} · ${bounds[1]}</span>${button('Pomiń','data-skip-feeling aria-label="Pomiń: '+esc(n)+'"','subtle')}</div></section>`;
}
export function updateFeeling(range,skip=false){
 const block=range.closest('.feeling'),n=block.dataset.feeling,value=Number(range.value),min=Number(range.min),max=Number(range.max);
 const caption=skip?'Przesuń suwak lub dotknij wybranej pozycji.':feelingLabels[n][value-min];
 block.classList.toggle('answered',!skip);block.querySelector('.feeling-answer').value=skip?'':String(value);
 block.querySelector('output').innerHTML=`${skip?'—':value}<small> / ${max}</small>`;
 block.querySelector('.feeling-caption').textContent=caption;
 range.style.setProperty('--fill',`${skip?0:(value-min)/(max-min)*100}%`);
 range.setAttribute('aria-valuetext',skip?'Bez odpowiedzi':`${value} — ${caption}`);
}

Object.assign(feelingLabels,{
 'Zmęczenie oddechowe / tlenowe':['Brak zmęczenia oddechowego','Prawie bez zmęczenia','Lekko odczuwalne','Niewielkie zmęczenie','Wyraźnie odczuwalne','Umiarkowane zmęczenie','Dość duże zmęczenie','Duże zmęczenie','Bardzo duże zmęczenie','Blisko maksymalnego','Maksymalne zmęczenie'],
 'Zmęczenie mięśniowe / siłowe':['Mięśnie bez zmęczenia','Prawie bez zmęczenia','Lekko odczuwalne','Niewielkie zmęczenie','Wyraźnie odczuwalne','Umiarkowane zmęczenie','Dość duże zmęczenie','Duże zmęczenie','Bardzo duże zmęczenie','Blisko maksymalnego','Maksymalne zmęczenie'],
 'Przyjemność / satysfakcja':['Bez satysfakcji','Bardzo mało satysfakcji','Mało satysfakcji','Raczej mało satysfakcji','Trochę satysfakcji','Umiarkowana satysfakcja','Całkiem satysfakcjonująco','Dużo satysfakcji','Bardzo satysfakcjonująco','Prawie pełna satysfakcja','Pełna satysfakcja']
});
