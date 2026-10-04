export const leafMark=()=>"<svg aria-hidden=\"true\" viewBox=\"0 0 32 32\" fill=\"none\">\n  \n  <path d=\"M16 27V14C13 8 8 6 3 6v9c0 7 5 11 13 12Z\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/>\n  <path d=\"M16 27V14c3-6 8-8 13-8v9c0 7-5 11-13 12Z\" fill=\"currentColor\"/>\n  <path d=\"m7 12 9 11\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>\n</svg>\n";
// The blade is drawn to the content's dimensions, keeping its tip and petiole
// intact when text grows. HTML controls stay independent of the illustration.
export const leafArt=()=>`<svg class="leaf-illustration" aria-hidden="true" focusable="false" preserveAspectRatio="none"><g class="leaf-drawing"><path class="leaf-blade"/><path class="leaf-wash"/><path class="leaf-midrib"/><path class="leaf-veins"/><path class="leaf-edge-detail"/><path class="leaf-stem"/></g></svg>`;
function drawLeaf(card){
  const svg=card.querySelector(':scope > .leaf-illustration');
  if(!svg)return;
  const w=card.clientWidth,h=card.clientHeight,bx=w*.23,by=h-49;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const mirrored=card.matches('.goal-feature,.goal-card');
  svg.querySelector('g').setAttribute('transform',mirrored?`translate(${w} 0) scale(-1 1)`:'');
  const set=(name,d)=>svg.querySelector('.'+name).setAttribute('d',d);
  const rightEdge=`C${w-24} 62 ${w-7} 95 ${w-4} 142 C${w+4} ${h*.55} ${w+4} ${h-155} ${w-17} ${h-107} C${w-57} ${h-32} ${w*.62} ${h-16} ${bx} ${by}`;
  set('leaf-blade',`M${bx} ${by} C34 ${h-71} 9 ${h-122} 10 ${h-171} C8 ${Math.min(h-215,h*.46)} 8 154 33 106 C66 28 ${w*.65} 55 ${w-14} 9 ${rightEdge} Z`);
  set('leaf-wash',`M${bx} ${by} C${w*.54} ${h*.73} ${w*.67} ${h*.36} ${w-14} 9 ${rightEdge} Z`);
  set('leaf-midrib',`M${bx} ${by} C${w*.54} ${h*.73} ${w*.67} ${h*.36} ${w-14} 9`);
  set('leaf-veins',`M${w*.32} ${h-83} Q${w*.17} ${h-103} 25 ${h*.64} M${w*.43} ${h*.71} Q${w*.75} ${h*.79} ${w-30} ${h*.66} M${w*.49} ${h*.60} Q${w*.22} ${h*.51} 29 ${h*.37} M${w*.60} ${h*.44} Q${w*.81} ${h*.47} ${w-21} ${h*.34} M${w*.68} ${h*.31} Q${w*.48} ${h*.22} ${w*.38} 66 M${w*.79} ${h*.18} Q${w*.89} ${h*.20} ${w-21} 71`);
  set('leaf-edge-detail',`M38 118 C48 81 72 66 100 60 M${w-17} ${h*.58} Q${w-28} ${h*.77} ${w*.72} ${h-47}`);
  set('leaf-stem',`M${bx+4} ${by-5} Q${bx-16} ${h-25} 19 ${h-8} M${bx+9} ${by-4} Q${bx-12} ${h-22} 22 ${h-6}`);
}
const leafObserver=new ResizeObserver(entries=>entries.forEach(({target})=>drawLeaf(target)));

export function updateLeaves(root){leafObserver.disconnect();root.querySelectorAll(".leaf-illustration").forEach(svg=>{drawLeaf(svg.parentElement);leafObserver.observe(svg.parentElement)});}
