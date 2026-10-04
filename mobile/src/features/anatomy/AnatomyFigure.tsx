import { useEffect, useRef, useState } from 'react';
import type * as Three from 'three';
import { anatomySVG, makeAnatomy, type AnatomyModel } from './geometry.js';
import { geometryMuscles } from './presentation';
import type { Muscle } from '../../data/domain';
import { useI18n } from '../../i18n';
type SceneControls = { view: (side: 'front' | 'back') => void; colors: (colors: Record<string, string>) => void };
export function AnatomyFigure({ colors, onSelect }: { colors: Record<string, string>; onSelect: (muscle: Muscle) => void }) {
  const { t } = useI18n();
  const [side, setSide] = useState<'front' | 'back'>('front'), [webgl, setWebgl] = useState(false);
  const ref = useRef<HTMLDivElement>(null), controls = useRef<SceneControls | null>(null);
  const inputs = useRef({ colors, side, onSelect });
  useEffect(() => { inputs.current = { colors, side, onSelect }; controls.current?.colors(colors); controls.current?.view(side); }, [colors, side, onSelect]);
  useEffect(() => {
    let disposed = false, cleanup = () => {};
    void import('three').then(THREE => {
      const container = ref.current; if (disposed || !container) return;
      let renderer: Three.WebGLRenderer;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7)); renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-2.4, 2.4, 4.15, -4.15, .1, 50);
      camera.position.set(0, 3.85, 14); camera.lookAt(0, 3.85, 0);
      scene.add(new THREE.HemisphereLight(0xfff9e7, 0x657a65, 2.3));
      const light = new THREE.DirectionalLight(0xfff8e5, 3.2); light.position.set(-3, 7, 5); scene.add(light);
      const fill = new THREE.DirectionalLight(0xb5d2c2, 1.2); fill.position.set(4, 4, -5); scene.add(fill);
      const anatomy: AnatomyModel = makeAnatomy(THREE, inputs.current.colors); scene.add(anatomy.model);
      container.append(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true'); renderer.domElement.setAttribute('tabindex', '-1');
      const render = () => { if (!disposed) renderer.render(scene, camera); };
      const resize = () => { const rect = container.getBoundingClientRect(); if (!rect.width || !rect.height) return; const h = 4.13, w = h * rect.width / rect.height; camera.left = -w; camera.right = w; camera.top = h; camera.bottom = -h; camera.updateProjectionMatrix(); renderer.setSize(rect.width, rect.height, false); render(); };
      const observer = new ResizeObserver(resize); observer.observe(container);
      controls.current = { view: view => { anatomy.model.rotation.y = view === 'back' ? Math.PI : 0; render(); }, colors: next => { anatomy.setColors(next); render(); } };
      controls.current.view(inputs.current.side); resize(); setWebgl(true);
      const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
      let press: { x: number; y: number } | null = null;
      const down = (event: PointerEvent) => { if (event.button === 0) press = { x: event.clientX, y: event.clientY }; };
      const abort = () => { press = null; };
      const pick = (event: PointerEvent) => { const origin = press; press = null; if (!origin || Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) return; const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(anatomy.pickable)[0]; const muscle = hit && geometryMuscles[hit.object.userData.muscleId]; if (muscle) inputs.current.onSelect(muscle); };
      const lost = (event: Event) => { event.preventDefault(); setWebgl(false); };
      renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointerup', pick); renderer.domElement.addEventListener('pointercancel', abort); renderer.domElement.addEventListener('webglcontextlost', lost);
      cleanup = () => { controls.current = null; observer.disconnect(); renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointerup', pick); renderer.domElement.removeEventListener('pointercancel', abort); renderer.domElement.removeEventListener('webglcontextlost', lost); anatomy.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
    }).catch(() => {});
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div className="muscle-figure"><div className="muscle-side-switch" role="group" aria-label={t('muscleMap.figureView')}><button className="secondary" aria-pressed={side === 'front'} onClick={() => setSide('front')}>{t('muscleMap.front')}</button><button className="secondary" aria-pressed={side === 'back'} onClick={() => setSide('back')}>{t('muscleMap.back')}</button></div><div className="muscle-stage"><div className="muscle-fallback" style={{ visibility: webgl ? 'hidden' : 'visible' }} onClick={event => { const target = event.target as HTMLElement; const id = target.closest('[data-anatomy-muscle]')?.getAttribute('data-anatomy-muscle'); if (id && geometryMuscles[id]) onSelect(geometryMuscles[id]); }} dangerouslySetInnerHTML={{ __html: anatomySVG(colors, side) }}/><div className="muscle-canvas" ref={ref} style={{ visibility: webgl ? 'visible' : 'hidden' }}/></div><p className="field-hint">{t(webgl ? side === 'front' ? 'muscleMap.figure3dFront' : 'muscleMap.figure3dBack' : side === 'front' ? 'muscleMap.figureSimpleFront' : 'muscleMap.figureSimpleBack')}</p></div>;
}
