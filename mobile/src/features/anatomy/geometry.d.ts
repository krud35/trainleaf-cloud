import type * as THREE from 'three';
export type AnatomyModel = { model: THREE.Group; pickable: THREE.Mesh[]; setColors: (colors: Record<string, string>) => void; setSelected: (id: string | null) => void; dispose: () => void };
export const muscleGroups: Array<{ id: string; label: string; tags: string[] }>;
export const anatomyContours: Array<{ id: string; side: 'front' | 'back'; points: [number, number][]; depth: number; fibers: number; mirror: number; interactive: boolean }>;
export function makeAnatomy(three: typeof THREE, colors?: Record<string, string>): AnatomyModel;
export function anatomySVG(colors?: Record<string, string>, side?: 'front' | 'back'): string;
