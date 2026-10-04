import {z} from 'zod';

export const wellnessSlots=['morning','daytime','evening'] as const;
export type WellnessSlot=typeof wellnessSlots[number];
export const slotNames={morning:{pl:'Rano',en:'Morning'},daytime:{pl:'W ciągu dnia',en:'Daytime'},evening:{pl:'Wieczorem',en:'Evening'}};
export const wellnessQuestions={
 sleepHours:{label:{pl:'Długość snu',en:'Sleep duration'},question:{pl:'Ile godzin snu masz za sobą ostatniej nocy?',en:'How many hours did you sleep last night?'},min:0,max:24,step:.25,ends:{pl:'Godziny snu, nie czas spędzony w łóżku.',en:'Hours asleep, rather than time spent in bed.'}},
 sleepQuality:{label:{pl:'Jakość snu',en:'Sleep quality'},question:{pl:'Jak oceniasz jakość ostatniego snu?',en:'How was the quality of your last sleep?'},min:1,max:5,step:1,ends:{pl:'1 · bardzo słaba → 5 · bardzo dobra',en:'1 · very poor → 5 · very good'}},
 fatigue:{label:{pl:'Zmęczenie',en:'Fatigue'},question:{pl:'Jak duże zmęczenie odczuwasz teraz?',en:'How tired do you feel now?'},min:0,max:10,step:1,ends:{pl:'0 · brak → 10 · bardzo duże',en:'0 · none → 10 · very high'}},
 soreness:{label:{pl:'Bolesność mięśni',en:'Muscle soreness'},question:{pl:'Jak duża jest teraz bolesność mięśni?',en:'How sore do your muscles feel now?'},min:0,max:10,step:1,ends:{pl:'0 · brak → 10 · bardzo duża',en:'0 · none → 10 · very high'}},
 energy:{label:{pl:'Energia',en:'Energy'},question:{pl:'Ile energii masz w tej chwili?',en:'How much energy do you have right now?'},min:1,max:5,step:1,ends:{pl:'1 · bardzo mało → 5 · bardzo dużo',en:'1 · very little → 5 · very much'}},
 stress:{label:{pl:'Stres',en:'Stress'},question:{pl:'Jak duży stres odczuwasz teraz?',en:'How stressed do you feel now?'},min:0,max:10,step:1,ends:{pl:'0 · brak → 10 · bardzo duży',en:'0 · none → 10 · very high'}},
 mood:{label:{pl:'Nastrój',en:'Mood'},question:{pl:'Jak oceniasz swój nastrój w tej chwili?',en:'How is your mood right now?'},min:1,max:5,step:1,ends:{pl:'1 · bardzo zły → 5 · bardzo dobry',en:'1 · very low → 5 · very good'}},
 focus:{label:{pl:'Koncentracja',en:'Focus'},question:{pl:'Jak łatwo jest Ci się teraz skupić?',en:'How easy is it to focus right now?'},min:1,max:5,step:1,ends:{pl:'1 · bardzo trudno → 5 · bardzo łatwo',en:'1 · very difficult → 5 · very easy'}},
 recovery:{label:{pl:'Czas na odpoczynek',en:'Time for rest'},question:{pl:'Na ile udało Ci się dziś znaleźć czas na odpoczynek?',en:'How much time were you able to make for rest today?'},min:1,max:5,step:1,ends:{pl:'1 · wcale → 5 · w pełni wystarczająco',en:'1 · none → 5 · fully enough'}},
};
export type WellnessMetric=keyof typeof wellnessQuestions;
export const slotQuestions:Record<WellnessSlot,WellnessMetric[]>={morning:['sleepHours','sleepQuality','fatigue','soreness'],daytime:['energy','stress','mood','focus'],evening:['fatigue','soreness','stress','recovery']};
const scale=(max:number,min=0)=>z.number().finite().int().min(min).max(max).optional();
export const wellnessAnswersSchema=z.object({sleepHours:z.number().finite().min(0).max(24).multipleOf(.25).optional(),sleepQuality:scale(5,1),fatigue:scale(10),soreness:scale(10),energy:scale(5,1),stress:scale(10),mood:scale(5,1),focus:scale(5,1),recovery:scale(5,1)}).strict();
export type WellnessAnswers=z.infer<typeof wellnessAnswersSchema>;
export const wellnessFields={slot:z.enum(wellnessSlots),answers:wellnessAnswersSchema};
export const wellnessResponseSchema=z.object(wellnessFields).superRefine((v,ctx)=>{
 const keys=Object.keys(v.answers).filter(k=>v.answers[k as WellnessMetric]!==undefined);
 if(!keys.length)ctx.addIssue({code:'custom',message:'Uzupełnij przynajmniej jedną odpowiedź.',params:{code:'wellnessAnswerRequired'}});
 if(keys.some(k=>!slotQuestions[v.slot].includes(k as WellnessMetric)))ctx.addIssue({code:'custom',message:'Pytanie nie pasuje do wybranej pory dnia.',params:{code:'wellnessQuestionSlot'}});
});
export function wellnessText(answers:WellnessAnswers,lang:'pl'|'en'='pl'){
 return (Object.keys(wellnessQuestions) as WellnessMetric[]).filter(k=>answers[k]!==undefined).map(k=>`${wellnessQuestions[k].label[lang]}: ${answers[k]}${k==='sleepHours'?' h':'/'+wellnessQuestions[k].max}`).join(' · ');
}
export const wellnessSources=[{label:'Saw, Main & Gastin · Monitoring athletes through self-report (2015)',url:'https://pubmed.ncbi.nlm.nih.gov/25729301/'},{label:'Clemente et al. · Fatigue, soreness, stress and sleep (2019)',url:'https://pubmed.ncbi.nlm.nih.gov/31523318/'},{label:'Kupperman et al. · Workload and wellness (2021)',url:'https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2021.702419/full'}];
