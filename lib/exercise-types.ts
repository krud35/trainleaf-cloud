import {legacyExerciseTypes} from './legacy-exercise-types';
import type {Exercise} from './domain';
export const exerciseTypes={strength:{pl:'Siła',en:'Strength'},power:{pl:'Moc · power',en:'Power'},speed:{pl:'Szybkość',en:'Speed'},agility:{pl:'Zmiana kierunku / zwinność',en:'Change of direction / agility'},conditioning:{pl:'Wydolność',en:'Conditioning'},mobility:{pl:'Mobilność',en:'Mobility'},stretching:{pl:'Rozciąganie',en:'Stretching'},stability:{pl:'Stabilizacja',en:'Stability'},throwing:{pl:'Technika rzutu',en:'Throwing technique'}} as const;
export type ExerciseType=keyof typeof exerciseTypes;
export function inferExerciseTypes(e:Exercise):ExerciseType[]{
 if(e.types?.length)return e.types;
 const original=legacyExerciseTypes[e.id];if(original?.name===e.name&&original.category===e.category)return [...original.types];
 const n=(e.name+' '+(e.nameEn||'')).toLowerCase();
 if(e.category==='throwing')return ['throwing'];
 if(/stretch|rozciąg|rozciag/.test(n))return ['stretching'];
 if(/mobil|90\/90|open book|world.s greatest/.test(n))return ['mobility'];
 if(/jump|skok|podskok|plyo|bound|pogo|hop|medicine ball|piłk.*lekars|swing|clean|snatch|push press/.test(n))return ['power'];
 if(/plank|podpór|pallof|dead bug|bird dog|carry|spacer.*farmer|copenhagen/.test(n))return ['stability'];
 if(/cut|kierunk|agility|shuttle|wahadł|shuffle|react|reak/.test(n))return ['agility'];
 if(/sprint|accel|przyspiesz|flying|a.skip|b.skip/.test(n))return ['speed'];
 return [e.category==='strength'?'strength':'conditioning'];
}
export const exerciseDatabases=[
 {name:'Catalyst Athletics · Exercise Library',url:'https://www.catalystathletics.com/exercises/'},
 {name:'ACE Exercise Library',url:'https://www.acefitness.org/resources/everyone/exercise-library/'},
 {name:'NASM Exercise Library',url:'https://www.nasm.org/resource-center/exercise-library'},
];
