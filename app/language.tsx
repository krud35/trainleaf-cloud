'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {categories,muscles,metrics,sections,type Exercise,type Muscle} from '@/lib/domain';
export type Language='pl'|'en';
const Context=createContext({lang:'pl' as Language,setLang:(_v:Language)=>{},t:(pl:string,_en:string)=>pl});
export function LanguageProvider({children}:{children:ReactNode}){const[lang,setLang]=useState<Language>('pl');useEffect(()=>{setLang(localStorage.getItem('fieldwork-language')==='en'?'en':'pl')},[]);useEffect(()=>{document.documentElement.lang=lang},[lang]);return <Context.Provider value={{lang,setLang:v=>{setLang(v);localStorage.setItem('fieldwork-language',v)},t:(pl,en)=>lang==='pl'?pl:en}}>{children}</Context.Provider>}
export const useLanguage=()=>useContext(Context);
const musclesEn:Record<Muscle,string>={quads:'Quadriceps',hamstrings:'Hamstrings',glutes:'Glutes',calves:'Calves',chest:'Chest',shoulders:'Deltoids',lats:'Latissimus dorsi',upper_back:'Upper back',lower_back:'Spinal erectors',biceps:'Biceps',triceps:'Triceps',forearms:'Forearms',abs:'Rectus abdominis',obliques:'Obliques',adductors:'Hip adductors',abductors:'Hip abductors',hip_flexors:'Hip flexors',back:'Back · general',arms:'Arms · general',core:'Trunk · general'};
export const muscleName=(k:Muscle,lang:Language)=>lang==='pl'?muscles[k]:musclesEn[k];
export const categoryName=(k:keyof typeof categories,lang:Language)=>lang==='pl'?categories[k]:({strength:'Strength',running:'Running',throwing:'Throwing',conditioning:'Conditioning'})[k];
export const metricName=(k:keyof typeof metrics,lang:Language)=>lang==='pl'?metrics[k]:({kg:'kg·reps',reps:'reps',meters:'m',throws:'throws',minutes:'min'})[k];
export const sectionName=(k:keyof typeof sections,lang:Language)=>lang==='pl'?sections[k]:({warmup:'Warm-up',main:'Main session',cooldown:'Cooldown'})[k];
export const exerciseName=(e:Exercise,lang:Language)=>lang==='en'&&e.nameEn?e.nameEn:e.name;
export const fmtDay=(day:string,lang:Language,options:Intl.DateTimeFormatOptions={day:'numeric',month:'short'})=>new Date(day+'T12:00:00').toLocaleDateString(lang==='pl'?'pl-PL':'en-GB',options);
export const num=(n:number,lang:Language)=>new Intl.NumberFormat(lang==='pl'?'pl-PL':'en-GB',{maximumFractionDigits:1}).format(n);
export function LanguageSwitch(){const{lang,setLang}=useLanguage();return <select className="language-switch" aria-label="Language / Język" value={lang} onChange={e=>setLang(e.target.value as Language)}><option value="pl">PL</option><option value="en">EN</option></select>}
