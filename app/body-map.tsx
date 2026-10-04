'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { muscles, type Muscle } from '../lib/domain';
import { muscleEducation } from '../lib/research-content';

type Props = { values: Record<Muscle, number>; maximum: number; lang: 'pl' | 'en'; selected?: Muscle; onSelect?: (muscle: Muscle) => void };
type RegionMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
type View = { render: () => void; rotate: (degrees: number) => void; regions: RegionMesh[] };
const neutral = '#cbd5da';
const namesEn: Record<Muscle, string> = { quads:'Quadriceps', hamstrings:'Hamstrings', glutes:'Gluteus maximus', calves:'Calves', chest:'Pectorals', shoulders:'Shoulders', lats:'Latissimus dorsi', upper_back:'Upper back', lower_back:'Spinal extensors', biceps:'Elbow flexors', triceps:'Triceps', forearms:'Forearms', abs:'Anterior abdominals', obliques:'Obliques', adductors:'Hip adductors', abductors:'Hip abductors', hip_flexors:'Hip flexors · deep', back:'Back · aggregate', arms:'Arms · aggregate', core:'Trunk · aggregate' };
const regions = muscleEducation.groups.map(group => group.id as Muscle);
const aggregateRegions: Muscle[] = ['back', 'arms', 'core'];

/** Shared RGB interpolation for the diagram and its numeric legend. No medical threshold is implied. */
export function muscleColor(value: number, maximum: number): string {
  const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
  const ratio = Number.isFinite(maximum) && maximum > 0 ? Math.min(1, amount / maximum) : 0;
  const green = [42, 167, 116], yellow = [240, 194, 68], red = [224, 74, 63];
  const start = ratio <= .5 ? green : yellow, end = ratio <= .5 ? yellow : red;
  const t = ratio <= .5 ? ratio * 2 : (ratio - .5) * 2;
  return '#' + start.map((component, i) => Math.round(component + (end[i] - component) * t).toString(16).padStart(2, '0')).join('');
}

export default function BodyMap({ values, maximum, lang, selected, onSelect }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<View | null>(null);
  const latest = useRef({ values, maximum, selected, onSelect });
  const [angle, setAngle] = useState(0);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState<Muscle | null>(null);
  const polish = lang === 'pl';
  const name = (muscle: Muscle) => polish ? muscles[muscle] : namesEn[muscle];
  const amount = (muscle: Muscle) => Number.isFinite(values[muscle]) ? Math.max(0, values[muscle]) : 0;
  const number = (value: number) => value.toLocaleString(polish ? 'pl-PL' : 'en-GB', { maximumFractionDigits: 1 });

  useEffect(() => { latest.current = { values, maximum, selected, onSelect }; }, [values, maximum, selected, onSelect]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.touchAction = 'pan-y';
    canvas.setAttribute('aria-hidden', 'true');
    mount.appendChild(canvas);
    const scene = new THREE.Scene();
    const body = new THREE.Group();
    scene.add(body);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x77788a, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xcfe7ff, 2); rim.position.set(3, 2, -5); scene.add(rim);
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 50);
    camera.position.set(0, .05, 11.9); camera.lookAt(0, .05, 0);
    const geometry = new THREE.SphereGeometry(1, 32, 24);
    const regionMeshes: RegionMesh[] = [];
    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [geometry];
    const skin = new THREE.MeshStandardMaterial({ color: neutral, roughness: .82, metalness: .03 });
    materials.push(skin);
    function ellipsoid(x: number, y: number, z: number, sx: number, sy: number, sz: number, muscle?: Muscle, rotate = 0): RegionMesh {
      const material = muscle ? new THREE.MeshStandardMaterial({ color: muscleColor(latest.current.values[muscle], latest.current.maximum), roughness: .58, metalness: .04 }) : skin;
      if (muscle) materials.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.rotation.z = rotate;
      if (muscle) { mesh.userData.muscle = muscle; regionMeshes.push(mesh); }
      body.add(mesh); return mesh;
    }
    function limb(from: THREE.Vector3, to: THREE.Vector3, radius: number, depth: number) {
      const mesh = ellipsoid(0, 0, 0, radius, from.distanceTo(to) / 2 + radius * .15, depth);
      mesh.position.copy(from).add(to).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    }
    // Neutral body geometry sits beneath the distinct surface regions.
    ellipsoid(0, 2.9, 0, .31, .39, .29);
    ellipsoid(0, 2.45, 0, .15, .23, .15);
    ellipsoid(0, 1.51, 0, .56, .91, .31);
    ellipsoid(0, .59, 0, .43, .47, .28);
    ellipsoid(0, .20, -.01, .45, .38, .30);
    for (const side of [-1, 1]) {
      limb(new THREE.Vector3(side * .60, 2.09, 0), new THREE.Vector3(side * .93, 1.16, 0), .19, .16);
      ellipsoid(side * .94, 1.15, 0, .14, .15, .14);
      limb(new THREE.Vector3(side * .95, 1.10, 0), new THREE.Vector3(side * 1.15, .34, .025), .14, .115);
      ellipsoid(side * 1.19, .16, .035, .12, .22, .07, undefined, side * .17);
      limb(new THREE.Vector3(side * .26, .20, 0), new THREE.Vector3(side * .31, -1.28, .015), .235, .23);
      ellipsoid(side * .31, -1.29, .01, .16, .17, .16);
      limb(new THREE.Vector3(side * .31, -1.42, 0), new THREE.Vector3(side * .30, -2.60, .025), .145, .14);
      ellipsoid(side * .30, -2.75, .10, .15, .12, .30);
      // Anterior upper body: pectorals, deltoid, biceps, abdominal wall.
      ellipsoid(side * .265, 1.99, .273, .285, .28, .11, 'chest', -side * .14);
      ellipsoid(side * .637, 2.03, 0, .24, .30, .215, 'shoulders', side * .22);
      ellipsoid(side * .807, 1.57, .125, .148, .365, .095, 'biceps', side * .33);
      ellipsoid(side * .833, 1.57, -.132, .15, .385, .10, 'triceps', side * .33);
      ellipsoid(side * 1.038, .754, .044, .135, .31, .113, 'forearms', side * .25);
      // Forearm extensors also occupy the posterior surface of this coarse region.
      ellipsoid(side * 1.038, .754, -.086, .13, .31, .075, 'forearms', side * .25);
      ellipsoid(side * .387, 1.02, .146, .12, .40, .145, 'obliques', side * .13);
      // Posterior torso: trapezius/rhomboid region, lats and spinal extensors.
      ellipsoid(side * .205, 1.94, -.263, .25, .38, .11, 'upper_back', side * .32);
      ellipsoid(side * .340, 1.36, -.251, .205, .42, .095, 'lats', -side * .23);
      ellipsoid(side * .116, .870, -.243, .105, .29, .073, 'lower_back');
      // Hips and legs: posterior glutes/hamstrings; anterior quads; medial adductors.
      ellipsoid(side * .231, .177, -.264, .245, .32, .14, 'glutes');
      ellipsoid(side * .430, .282, -.018, .105, .28, .25, 'abductors', -side * .14);
      ellipsoid(side * .117, -.437, .070, .116, .52, .15, 'adductors', -side * .09);
      ellipsoid(side * .309, -.506, .192, .20, .635, .125, 'quads', side * .025);
      ellipsoid(side * .304, -.529, -.188, .188, .63, .135, 'hamstrings', side * .025);
      ellipsoid(side * .300, -1.96, -.105, .15, .42, .13, 'calves');
      // Iliopsoas lies deep: a ring is a location marker, never an external muscle patch.
      const ringGeometry = new THREE.TorusGeometry(.066, .012, 8, 24); geometries.push(ringGeometry);
      const markerMaterial = new THREE.MeshStandardMaterial({ color: muscleColor(latest.current.values.hip_flexors, latest.current.maximum), roughness: .6 }); materials.push(markerMaterial);
      const marker = new THREE.Mesh(ringGeometry, markerMaterial); marker.position.set(side * .155, .372, .333); marker.userData.muscle = 'hip_flexors'; marker.userData.deep = true;
      body.add(marker); regionMeshes.push(marker);
    }
    for (const y of [1.54, 1.26, .98, .72]) {
      for (const side of [-1, 1]) ellipsoid(side * .107, y, .306, .096, .122, .05, 'abs');
    }
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let alive = true, frame = 0;
    const render = () => {
      if (!alive || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; if (alive) renderer.render(scene, camera); });
    };
    const resize = () => {
      const width = Math.max(mount.clientWidth, 1), height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Keep the full body visible in narrow panels without cropping feet or head.
      camera.position.z = Math.max(11.9, 5.0 / camera.aspect);
      camera.updateProjectionMatrix(); render();
    };
    const observer = new ResizeObserver(resize); observer.observe(mount);
    const pick = (event: PointerEvent): Muscle | null => {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      // Intersect the neutral surface too, preventing selection of a hidden back patch.
      const hit = raycaster.intersectObjects(body.children, false)[0];
      return hit?.object.userData.muscle ?? null;
    };
    let drag: { id: number; x: number; start: number; moved: boolean } | null = null;
    const down = (event: PointerEvent) => { if (event.button !== 0) return; drag = { id:event.pointerId, x:event.clientX, start:body.rotation.y, moved:false }; canvas.setPointerCapture(event.pointerId); };
    const move = (event: PointerEvent) => {
      if (drag?.id === event.pointerId) {
        const dx = event.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true;
        body.rotation.y = drag.start + dx * .012; render();
        setAngle(Math.round(((body.rotation.y * 180 / Math.PI) % 360 + 360) % 360));
      } else { const hit = pick(event); setHovered(hit); canvas.style.cursor = hit ? 'pointer' : 'grab'; }
    };
    const up = (event: PointerEvent) => { if (drag?.id !== event.pointerId) return; if (!drag.moved) { const hit = pick(event); if (hit) latest.current.onSelect?.(hit); } drag = null; };
    const cancel = () => { drag = null; setHovered(null); };
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('pointerleave', () => setHovered(null)); canvas.addEventListener('webglcontextlost', lost);
    view.current = { render, regions:regionMeshes, rotate: degrees => { body.rotation.y = degrees * Math.PI / 180; render(); } };
    resize();
    return () => {
      alive = false; if (frame) cancelAnimationFrame(frame); observer.disconnect();
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel); canvas.removeEventListener('webglcontextlost', lost);
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
      renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss();
      canvas.remove(); view.current = null;
    };
  }, []);
  useEffect(() => {
    for (const mesh of view.current?.regions ?? []) {
      const muscle = mesh.userData.muscle as Muscle;
      mesh.material.color.set(muscleColor(values[muscle], maximum));
      mesh.material.emissive.set(muscle === selected ? '#234f73' : '#000000');
      mesh.material.emissiveIntensity = muscle === selected ? .55 : 0;
    }
    view.current?.render();
  }, [values, maximum, selected]);
  const turn = (degrees: number) => { setAngle(degrees); view.current?.rotate(degrees); };
  const active = hovered ?? selected;
  const list = [...regions, ...aggregateRegions.filter(muscle => amount(muscle) > 0)];
  return <div className="body-map-3d" style={{ width:'100%' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:8 }}>
      <div style={{ display:'flex', gap:6 }}>
        <button type="button" onClick={() => turn(0)} aria-pressed={angle === 0}>{polish ? 'Przód' : 'Front'}</button>
        <button type="button" onClick={() => turn(180)} aria-pressed={angle === 180}>{polish ? 'Tył' : 'Back'}</button>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>{polish ? 'Obrót' : 'Rotation'}
        <input aria-label={polish ? 'Obrót modelu w stopniach' : 'Model rotation in degrees'} type="range" min="0" max="360" step="1" value={angle} onChange={event => turn(Number(event.target.value))} disabled={failed} style={{ maxWidth:140 }} />
      </label>
    </div>
    {!failed && <div ref={host} style={{ height:430, width:'100%', borderRadius:14, background:'radial-gradient(ellipse at center, #f3f6f6, #e9eff1)', position:'relative', overflow:'hidden' }} role="img" aria-label={polish ? 'Obrotowy schemat 3D regionów mięśniowych. Użyj listy poniżej, aby wybrać region.' : 'Rotatable 3D muscle-region schematic. Use the list below to select a region.'} />}
    {failed && <p role="status" style={{ padding:'20px 0', fontSize:13 }}>{polish ? 'Widok 3D jest niedostępny na tym urządzeniu. Wszystkie wartości i regiony są dostępne w tabeli poniżej.' : 'The 3D view is unavailable on this device. All values and regions are available in the table below.'}</p>}
    <div aria-live="polite" style={{ minHeight:25, fontSize:13, marginTop:8 }}>{active ? <strong>{name(active)} · {number(amount(active))}</strong> : <span>{polish ? 'Przeciągnij, aby obrócić. Wybierz region lub pozycję na liście.' : 'Drag to rotate. Select a region or an item in the list.'}</span>}</div>
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'9px 0', fontSize:11 }}><span>{polish ? '0' : '0'}</span><div aria-hidden="true" style={{ height:7, flex:1, borderRadius:20, background:'linear-gradient(90deg, '+muscleColor(0,1)+', '+muscleColor(.5,1)+', '+muscleColor(1,1)+')' }} /><span>{number(Math.max(0, Number.isFinite(maximum) ? maximum : 0))}</span></div>
    <p style={{ fontSize:11, color:'#63717c', margin:'8px 0' }}>{polish ? 'Pierścienie przy biodrach oznaczają głębokie zginacze biodra. Kolor odnosi się do wybranej skali, nie progu bezpieczeństwa. Schemat pokazuje regiony, nie dokładne granice wszystkich mięśni.' : 'Hip rings mark deep hip flexors. Colour follows the selected scale, not a safety threshold. This schematic shows regions, not exact boundaries of every muscle.'}</p>
    <details open={failed} style={{ marginTop:12 }}>
      <summary style={{ fontSize:12, cursor:'pointer' }}>{polish ? 'Wszystkie regiony i wartości' : 'All regions and values'}</summary>
      <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', marginTop:8 }}><caption className="sr-only">{polish ? 'Wartości w bieżącej jednostce' : 'Values in the current unit'}</caption><thead><tr><th style={{ textAlign:'left' }}>{polish ? 'Region' : 'Region'}</th><th style={{ textAlign:'right' }}>{polish ? 'Wartość' : 'Value'}</th></tr></thead><tbody>{list.map(muscle => <tr key={muscle} style={{ borderBottom:'1px solid #e4e8ec' }}><td style={{ padding:'5px 0' }}><button type="button" aria-pressed={selected === muscle} onClick={() => onSelect?.(muscle)} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12 }}><span aria-hidden="true" style={{ width:9, height:9, borderRadius:20, background:muscleColor(amount(muscle),maximum) }} />{name(muscle)}</button></td><td style={{ textAlign:'right' }}>{number(amount(muscle))}</td></tr>)}</tbody></table>
      {aggregateRegions.some(muscle => amount(muscle) > 0) && <p style={{ fontSize:11, color:'#63717c' }}>{polish ? 'Starsze wpisy ogólne (plecy, ramiona, tułów) pozostają w tabeli. Przypisz je do szczegółowych regionów, aby pojawiły się na modelu.' : 'Older aggregate entries (back, arms, trunk) remain in the table. Assign specific regions to show them on the model.'}</p>}
    </details>
  </div>;
}
