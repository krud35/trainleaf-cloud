/* Original Trainleaf schematic surface anatomy. All outlines and geometry below
   were authored for this prototype. They are not a clinical anatomy dataset. */

export const muscleGroups = [
  {id:'chest',label:'Klatka piersiowa',tags:['klatka piersiowa','piersiowe','chest','pectorals']},
  {id:'deltoids',label:'Barki',tags:['barki','naramienne','deltoids','shoulders']},
  {id:'biceps',label:'Biceps',tags:['biceps','bicepsy','dwugłowy ramienia']},
  {id:'triceps',label:'Triceps',tags:['triceps','tricepsy','trójgłowy ramienia']},
  {id:'abs',label:'Brzuch',tags:['brzuch','prosty brzucha','abs']},
  {id:'obliques',label:'Skośne brzucha',tags:['skośne brzucha','obliques']},
  {id:'lats',label:'Najszersze grzbietu',tags:['najszersze grzbietu','najszerszy grzbietu','lats']},
  {id:'traps',label:'Czworoboczne',tags:['czworoboczne','czworoboczny','kaptury','traps']},
  {id:'glutes',label:'Pośladki',tags:['pośladki','pośladkowe','glutes']},
  {id:'quads',label:'Przód uda',tags:['przód uda','czworogłowe','czworogłowy uda','quads']},
  {id:'hamstrings',label:'Tył uda',tags:['tył uda','dwugłowy uda','hamstrings']},
  {id:'calves',label:'Łydki',tags:['łydki','łydka','calves']},
];

// Clockwise surface contours in metres; mirrored from the subject's left side.
// Each anatomical group comprises its characteristic subdivisions, not ellipses.
const forms = [
 ['chest','front',[[.045,6.21],[.34,6.28],[.74,6.23],[.96,6.07],[.9,5.82],[.53,5.70],[.08,5.78]],.14,8],
 ['deltoids','front',[[.81,6.28],[1.02,6.28],[1.19,6.14],[1.26,5.89],[1.18,5.64],[1.04,5.83],[.96,6.02]],.14,6],
 ['biceps','front',[[1.20,5.90],[1.31,5.57],[1.36,5.25],[1.26,5.04],[1.16,5.29],[1.10,5.65]],.12,5],
 ['obliques','front',[[.52,5.60],[.81,5.68],[.73,5.30],[.61,4.95],[.55,4.63],[.39,4.50],[.40,4.90]],.09,6],
 ['quads','front',[[.28,4.30],[.51,4.33],[.59,4.03],[.56,3.62],[.50,3.20],[.41,2.86],[.32,2.93],[.26,3.35]],.16,7],
 ['quads','front',[[.53,4.30],[.73,4.16],[.79,3.82],[.77,3.40],[.66,2.95],[.53,2.75],[.48,3.02],[.58,3.57]],.13,5],
 ['quads','front',[[.26,3.58],[.29,3.25],[.39,2.88],[.36,2.63],[.22,2.79],[.17,3.02],[.20,3.36]],.12,5],
 ['calves','front',[[.55,2.49],[.65,2.31],[.69,1.91],[.62,1.45],[.51,.85],[.44,.77],[.44,1.26],[.52,1.93]],.075,5],
 ['traps','back',[[.02,6.69],[.21,6.51],[.40,6.31],[.81,6.25],[.68,6.01],[.38,5.80],[.04,5.42]],.11,9],
 ['deltoids','back',[[.77,6.23],[1.00,6.30],[1.19,6.13],[1.26,5.87],[1.16,5.64],[.99,5.92],[.85,6.00]],.15,6],
 ['triceps','back',[[1.02,5.97],[1.18,5.90],[1.33,5.60],[1.40,5.28],[1.29,5.06],[1.14,5.28],[1.06,5.64]],.14,6],
 ['lats','back',[[.19,5.74],[.49,5.91],[.86,5.99],[.82,5.49],[.65,5.07],[.40,4.72],[.13,4.62],[.13,5.12]],.12,10],
 ['glutes','back',[[.08,4.69],[.38,4.79],[.68,4.56],[.77,4.26],[.67,4.05],[.37,3.99],[.07,4.18]],.22,7],
 ['hamstrings','back',[[.26,4.04],[.48,4.04],[.52,3.72],[.44,3.28],[.33,2.77],[.20,2.65],[.19,3.16]],.13,7],
 ['hamstrings','back',[[.52,4.02],[.72,4.08],[.77,3.76],[.72,3.32],[.60,2.79],[.48,2.66],[.44,2.86],[.55,3.48]],.14,6],
 ['calves','back',[[.27,2.48],[.42,2.52],[.49,2.25],[.47,1.94],[.35,1.52],[.27,1.38],[.18,1.75],[.18,2.09]],.16,6],
 ['calves','back',[[.46,2.48],[.62,2.43],[.70,2.16],[.69,1.91],[.56,1.55],[.43,1.39],[.43,1.83],[.49,2.16]],.15,6],
];
for(let row=0;row<4;row++){
 const y=5.66-row*.29,w=.265-row*.018;
 forms.push(['abs','front',[[.045,y],[w,y+.025],[w+.015,y-.18],[.06,y-.215]],.085,4]);
}
// Uncoloured accessory anatomy gives continuity to the body silhouette.
const accents=[
 ['forearm','front',[[1.31,5.00],[1.45,4.88],[1.56,4.55],[1.70,4.02],[1.60,3.94],[1.41,4.33],[1.29,4.72]],.08,7],
 ['forearm','back',[[1.35,5.04],[1.49,4.82],[1.64,4.38],[1.71,4.05],[1.60,3.96],[1.42,4.35],[1.30,4.75]],.085,6],
 ['spine','back',[[.035,5.76],[.13,5.34],[.13,4.70],[.055,4.53]],.06,2],
 ['adductor','front',[[.19,4.32],[.34,4.17],[.26,3.76],[.19,3.16],[.11,3.06],[.07,3.56]],.055,4],
];
export const anatomyContours=[...forms,...accents].flatMap(([id,side,points,depth,fibers])=>[-1,1].map(mirror=>({id,side,points:points.map(([x,y])=>[x*mirror,y]),depth,fibers,mirror,interactive:forms.some(form=>form[0]===id)})));

const surfacePalettes={
 light:{skin:0xc6c6b9,muscle:'#b8bbae',unknown:'#aeb6a8',fiber:0x3d483e,fiberOpacity:.055,selected:0x1d3223,selectedIntensity:.25},
 dark:{skin:0x718574,muscle:'#85988a',unknown:'#85988a',fiber:0x1f3326,fiberOpacity:.12,selected:0xb8d9a4,selectedIntensity:.18}
};
export function makeAnatomy(THREE,colors={},theme='light'){
 const model=new THREE.Group(),pickable=[],resources=[],materials=new Map(),fiberMaterials=[];
 let palette=surfacePalettes[theme==='dark'?'dark':'light'],selectedId=null;
 const keep=value=>(resources.push(value),value);
 const skin=keep(new THREE.MeshStandardMaterial({color:palette.skin,roughness:.72,metalness:.08}));
 const muscle=id=>{if(!materials.has(id))materials.set(id,keep(new THREE.MeshStandardMaterial({color:colors[id]||palette.muscle,roughness:.64,metalness:.07})));return materials.get(id)};
 const mesh=(geometry,material)=>{const item=new THREE.Mesh(keep(geometry),material);model.add(item);return item};

 // Continuous lofts, using nonuniform anatomical stations, produce a full body
 // under the superficial muscle layers. Limbs bend and taper toward joints.
 function loft(stations){
  const positions=[],indices=[],steps=40;
  stations.forEach(([x,y,z,rx,rz],j)=>{for(let i=0;i<=steps;i++){const t=i/steps*Math.PI*2;positions.push(x+Math.cos(t)*rx,y,z+Math.sin(t)*rz);if(j&&i){const a=j*(steps+1)+i;indices.push(a,a-1,a-steps-2,a,a-steps-2,a-steps-1)}}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 mesh(loft([[0,4.0,0,.43,.24],[0,4.23,0,.65,.30],[0,4.56,0,.63,.29],[0,4.89,0,.53,.25],[0,5.25,0,.64,.29],[0,5.65,0,.84,.33],[0,5.97,0,.94,.35],[0,6.17,0,.85,.29],[0,6.33,0,.39,.21],[0,6.56,0,.22,.20],[0,6.79,0,.21,.19]]),skin);
 for(const s of [-1,1]){
  mesh(loft([[s*.43,4.35,0,.34,.27],[s*.44,4.04,0,.35,.29],[s*.46,3.70,0,.33,.28],[s*.45,3.20,0,.26,.25],[s*.40,2.75,0,.205,.20],[s*.39,2.56,0,.19,.18],[s*.42,2.29,-.01,.23,.21],[s*.44,1.93,-.015,.25,.23],[s*.44,1.48,0,.18,.19],[s*.44,.97,.025,.12,.14],[s*.44,.58,.04,.115,.14]]),skin);
  mesh(loft([[s*.87,6.20,0,.24,.22],[s*1.04,6.06,0,.27,.24],[s*1.16,5.72,0,.24,.22],[s*1.27,5.30,0,.185,.18],[s*1.33,5.02,0,.135,.145],[s*1.40,4.80,0,.17,.17],[s*1.53,4.39,0,.15,.145],[s*1.66,4.03,0,.105,.10],[s*1.72,3.80,.015,.13,.08],[s*1.79,3.53,.02,.125,.065],[s*1.80,3.46,.025,.025,.035]]),skin);
  const foot=mesh(new THREE.SphereGeometry(1,28,20),skin);foot.scale.set(.17,.13,.36);foot.position.set(s*.44,.47,.17);
  // Five sculpted digits, with varied lengths, attached to each palm.
  for(let d=0;d<4;d++){const finger=mesh(new THREE.CapsuleGeometry(.031,.19-(d===3?.05:0),4,8),skin);finger.position.set(s*(1.68+d*.073),3.46-(d===0?.02:d===1?.055:d===2?.04:0),.02);finger.rotation.z=-s*.26}
  const thumb=mesh(new THREE.CapsuleGeometry(.047,.15,4,8),skin);thumb.position.set(s*1.58,3.68,.07);thumb.rotation.z=s*.40;
 }
 const head=mesh(new THREE.SphereGeometry(1,40,32),skin);head.position.set(0,7.05,.015);head.scale.set(.33,.47,.29);
 const jaw=mesh(new THREE.SphereGeometry(1,28,20),skin);jaw.position.set(0,6.89,.065);jaw.scale.set(.255,.28,.255);
 const nose=mesh(new THREE.SphereGeometry(1,20,16),skin);nose.position.set(0,7.015,.285);nose.scale.set(.055,.105,.075);
 for(const s of [-1,1]){const ear=mesh(new THREE.SphereGeometry(1,18,14),skin);ear.position.set(s*.322,7.025,.005);ear.scale.set(.06,.11,.07)}

 function surfaceZ(x,y,side){
  let z=.24;
  if(y>5.72)z=.27-Math.max(0,Math.abs(x)-.65)*.17;
  else if(y>4.6&&Math.abs(x)<.9)z=.235-Math.max(0,Math.abs(x)-.3)*.11;
  else if(y>4.0&&Math.abs(x)<.9)z=.23;
  else if(y>2.6&&Math.abs(x)<.9)z=.20;
  else if(y<=2.6)z=.145;
  if(Math.abs(x)>1)z=.14;
  if(Math.abs(x)>1.45)z=.09;
  if(y>6.4)z=.15;
  return side==='front'?z:-z;
 }
 for(const contour of anatomyContours){
  const {points,depth,side,id,interactive}=contour,sign=side==='front'?1:-1;
  const cx=points.reduce((sum,p)=>sum+p[0],0)/points.length,cy=points.reduce((sum,p)=>sum+p[1],0)/points.length;
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x,y,0)),true,'centripetal',.5);
  const rim=curve.getPoints(64).slice(0,-1),radial=13,positions=[],indices=[];
  for(let j=0;j<=radial;j++){const r=j/radial;for(let i=0;i<rim.length;i++){
   const x=cx+(rim[i].x-cx)*r,y=cy+(rim[i].y-cy)*r;
   // Shallow ridges follow each fan's radial fibres; actual surface variation.
   const ridge=1+Math.sin(i/rim.length*Math.PI*2*contour.fibers)*.008;
   const z=surfaceZ(x,y,side)+sign*(.012+depth*Math.pow(Math.max(0,1-r*r),.70)*ridge);
   positions.push(x,y,z);
   if(j){const prev=(i+rim.length-1)%rim.length,a=j*rim.length+i,b=j*rim.length+prev,c=(j-1)*rim.length+i,d=(j-1)*rim.length+prev;
    const normalSign=contour.mirror*sign;
    if(normalSign>0)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);
   }
  }}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=interactive?muscle(id):skin;material.side=THREE.DoubleSide;
  const piece=mesh(geometry,material);piece.userData.muscleId=interactive?id:null;if(interactive)pickable.push(piece);
  // Fine surface fibres remain subordinate to the silhouettes and state colours.
  const lineMaterial=keep(new THREE.LineBasicMaterial({color:palette.fiber,transparent:true,opacity:palette.fiberOpacity,depthWrite:false}));fiberMaterials.push(lineMaterial);
  for(let f=1;f<contour.fibers;f++){
   const v=f/contour.fibers;const a=curve.getPoint(v*.47),b=curve.getPoint(.53+v*.45),line=[];
   for(let k=0;k<=22;k++){
    const t=k/22,dx=a.x*(1-t)+b.x*t,dy=a.y*(1-t)+b.y*t;
    const x=dx*.83+cx*.17,y=dy*.83+cy*.17;
    // Find approximate distance to contour in this direction to rest on patch.
    const angle=Math.atan2(y-cy,x-cx);let best=Infinity,outer=1;
    rim.forEach(p=>{const pa=Math.atan2(p.y-cy,p.x-cx),delta=Math.abs(Math.atan2(Math.sin(pa-angle),Math.cos(pa-angle)));if(delta<best){best=delta;outer=Math.hypot(p.x-cx,p.y-cy)}});
    const r=Math.min(.98,Math.hypot(x-cx,y-cy)/outer);
    const z=surfaceZ(x,y,side)+sign*(.02+depth*Math.pow(1-r*r,.70));line.push(new THREE.Vector3(x,y,z));
   }
   const item=new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(line)),lineMaterial);model.add(item);
  }
 }
 function setSelected(id){selectedId=id;for(const [key,material]of materials){material.emissive.set(key===id?palette.selected:0x000000);material.emissiveIntensity=key===id?palette.selectedIntensity:0}}
 return {model,pickable,setColors(next){for(const [key,material]of materials)material.color.set(next[key]||palette.unknown)},setSelected,setTheme(next){palette=surfacePalettes[next==='dark'?'dark':'light'];skin.color.set(palette.skin);fiberMaterials.forEach(material=>{material.color.set(palette.fiber);material.opacity=palette.fiberOpacity});setSelected(selectedId)},dispose(){resources.forEach(resource=>resource.dispose())}};
}

// Same original contours used when WebGL is unavailable; native HTML controls
// below the figure carry all data and keyboard interactions in both modes.
export function anatomySVG(colors={},side='front'){
 const xy=([x,y])=>`${(x*50+105).toFixed(1)},${(390-y*50).toFixed(1)}`;
 const path=points=>{const n=points.length;return points.map((point,i)=>{const next=points[(i+1)%n],mid=[(point[0]+next[0])/2,(point[1]+next[1])/2];return `${i?'Q':'M'}${i?xy(point)+' ':''}${xy(mid)}`}).join(' ')+'Z'};
 const silhouette='M100 54 Q86 48 87 32 Q86 14 105 13 Q124 14 123 32 Q124 48 110 54 L116 70 Q145 72 155 86 L165 135 L180 185 L189 211 Q186 219 178 213 L171 201 L168 188 L149 148 L140 118 L140 148 Q141 167 138 186 L147 224 L143 258 L143 284 L139 347 L143 363 Q142 371 129 370 L119 368 L120 345 L119 306 L116 279 L116 256 L108 222 L105 205 L102 222 L94 256 L94 279 L91 306 L90 345 L91 368 L81 370 Q68 371 67 363 L71 347 L67 284 L67 258 L63 224 L72 186 Q69 167 70 148 L70 118 L61 148 L42 188 L39 201 L32 213 Q24 219 21 211 L30 185 L45 135 L55 86 Q65 72 94 70Z';
 return `<svg viewBox="0 0 210 385" aria-hidden="true" class="anatomy-svg"><defs><linearGradient id="anatomy-shade" x1="0" y1="0" x2="1" y2=".4"><stop stop-color="var(--anatomy-shade-start,#858e80)"/><stop offset=".35" stop-color="var(--anatomy-shade-light,#e0e2d7)"/><stop offset=".7" stop-color="var(--anatomy-shade-mid,#c1c8b8)"/><stop offset="1" stop-color="var(--anatomy-shade-end,#798371)"/></linearGradient><filter id="anatomy-volume"><feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b"/><feSpecularLighting in="b" surfaceScale="3" specularConstant=".2" specularExponent="14" lighting-color="var(--anatomy-specular,#fff)" result="light"><fePointLight x="-100" y="-100" z="200"/></feSpecularLighting><feComposite in="light" in2="SourceAlpha" operator="in"/><feComposite in2="SourceGraphic" operator="arithmetic" k2="1" k3="1"/></filter></defs><path d="${silhouette}" fill="url(#anatomy-shade)"/>${anatomyContours.filter(c=>c.side===side).map(c=>`<path ${c.interactive?`data-anatomy-muscle="${c.id}"`:''} d="${path(c.points)}" fill="${colors[c.id]||'var(--anatomy-accessory,#b8bbae)'}" stroke="var(--anatomy-outline,#6c7767)" stroke-opacity=".5" stroke-width=".55" filter="url(#anatomy-volume)"/>`).join('')}</svg>`;
}
