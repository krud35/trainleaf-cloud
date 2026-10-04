import {seed, exercises as catalog} from './data.js';
import {snapshotTrainleafLoad} from './load-model.js';

export const SIX_MONTH_TODAY = '2026-10-04';
export const SIX_MONTH_START = '2026-04-04';
const clone = value => structuredClone(value);
const dateAt = index => new Date(Date.UTC(2026, 3, 4 + index)).toISOString().slice(0, 10);
const dayIndex = date => Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${SIX_MONTH_START}T12:00:00Z`)) / 86400000);
const customExercises = [
  {id: 'demo-swim', name: 'Pływanie kraulem', kind: 'Wytrzymałość', modality: 'swimming', unit: 'm', muscles: ['Plecy', 'Ramiona', 'Nogi'], description: 'Pływanie kraulem na basenie.'},
  {id: 'demo-walk', name: 'Marsz w terenie', kind: 'Wytrzymałość', modality: 'walking', unit: 'min', muscles: ['Nogi', 'Pośladki'], description: 'Marsz po trasie w terenie.'},
  {id: 'demo-forehand', name: 'Forehand w ruchu', kind: 'Technika', modality: 'skill', unit: 'rzuty', muscles: [], description: 'Rzuty forehand po zmianie pozycji.'},
  {id: 'demo-cuts', name: 'Wyjścia do dysku i zmiany kierunku', kind: 'Technika', modality: 'skill', unit: 'min', muscles: ['Nogi', 'Pośladki'], description: 'Praca nad wyjściem do podania i zmianą kierunku biegu.'},
  {id: 'demo-game', name: 'Gra zadaniowa z drużyną', kind: 'Technika', modality: 'skill', unit: 'min', muscles: ['Nogi', 'Tułów'], description: 'Gra drużynowa z zapisanym tematem sesji.'}
];
const allExercises = [...catalog, ...customExercises];
const notesByType = {
  strength: ['Równy rytm serii. Ostatnia wymagała większego skupienia.', 'Dobrze udało się utrzymać zaplanowane przerwy.', 'Krótsza sesja po pracy. Zapisuję wykonane serie.', 'Ćwiczenia w grupie pomogły sprawnie przejść przez trening.'],
  running: ['Znana trasa przez park. Pierwsze minuty spokojniej.', 'Bieg po pracy, bez sprawdzania zegarka co chwilę.', 'Równe tempo. Ostatni odcinek pod wiatr.', 'Inna trasa niż zwykle, trochę więcej podbiegów.'],
  endurance: ['Spokojny początek, potem równy rytm.', 'Sesja w plenerze. Na końcu krótka przerwa na wodę.', 'Dobrze pasowało do dnia bez treningu drużynowego.', 'Krótszy wariant ze względu na pozostałe plany dnia.'],
  technique: ['Najwięcej uwagi na ustawienie do podania.', 'Rzuty w parach. Zapisuję temat na następną sesję.', 'Lepiej wychodziły podania w ruchu niż ze stania.', 'Krótka sesja z dużą liczbą spokojnych powtórzeń.'],
  team: ['Gra zadaniowa i komunikacja w obronie.', 'Dużo pracy nad wyjściem do dysku. Na koniec gra.', 'Ćwiczenia w małych grupach, potem fragmenty meczu.', 'Trening na boisku. Notatki o ustawieniu zostawiam poniżej.'],
  mental: ['Krótki przegląd sytuacji z ostatniej gry.', 'Spisałem dwa elementy, na których chcę się skupić.', 'Spokojna wizualizacja przed kolejną sesją z drużyną.', 'Kilka minut na uporządkowanie własnych notatek.']
};

function exercise(id, workoutId, index, values = {}) {
  return {...clone(allExercises.find(item => item.id === id)), id: `${workoutId}-ex-${index}`, sets: '', quantity: '', rir: '', tempo: '', pace: '', rest: '', notes: '', section: 'main', ...values};
}

function createWorkout(date, type, ordinal, status = 'completed') {
  const id = `demo-six-month-${date}-${type}`, week = Math.floor(dayIndex(date) / 7);
  const variation = ordinal % 4, progress = Math.min(4, Math.floor(Math.max(0, week) / 6));
  const enduranceSport = ['Kolarstwo', 'Pływanie', 'Turystyka górska'][ordinal % 3];
  const titles = {
    strength: ['Siła całego ciała', 'Nogi i plecy', 'Siła · spokojne serie', 'Trening siłowy po pracy'],
    running: ['Bieg przez park', 'Spokojny bieg', 'Bieg po pracy', 'Bieg na znajomej trasie'],
    endurance: {Kolarstwo: 'Rower · pętla za miastem', Pływanie: 'Basen · równy rytm', 'Turystyka górska': 'Marsz na szlaku'},
    technique: ['Backhand i forehand', 'Rzuty w ruchu', 'Dokładność podań', 'Rzuty i praca nóg'],
    team: ['Trening drużyny', 'Gra zadaniowa', 'Wyjścia do dysku i obrona', 'Trening na boisku'],
    mental: ['Przygotowanie mentalne', 'Wizualizacja przed grą', 'Przegląd własnych notatek', 'Skupienie przed treningiem']
  };
  const duration = {strength: 45 + variation * 5 + progress * 2, running: 28 + variation * 4 + progress * 3, endurance: enduranceSport === 'Turystyka górska' ? 75 + variation * 10 : 35 + variation * 10, technique: 25 + variation * 5, team: 70 + variation * 10, mental: 10 + variation * 5}[type];
  const sport = {strength: 'Trening siłowy', running: 'Bieganie', endurance: enduranceSport, technique: 'Ultimate frisbee', team: 'Ultimate frisbee', mental: 'Ultimate frisbee'}[type];
  const completed = status === 'completed';
  const workout = {
    id, title: type === 'endurance' ? titles.endurance[sport] : titles[type][variation], trainingType: type, sport, date,
    time: {strength: variation % 2 ? '18:30' : '17:45', running: variation % 2 ? '07:15' : '18:00', endurance: '09:30', technique: '17:00', team: '10:00', mental: '20:30'}[type],
    duration: String(duration), rpe: completed ? (ordinal % 19 === 0 ? '' : String({strength: 5 + variation % 3, running: 3 + variation, endurance: 3 + variation % 3, technique: 2 + variation, team: 5 + variation, mental: 1 + variation % 2}[type])) : '',
    status, notes: completed ? notesByType[type][variation] : date < SIX_MONTH_TODAY ? 'Plan pozostał bez zapisanego wykonania.' : 'Przykładowy plan do obejrzenia w prototypie.', exercises: [], groups: [], demonstration: true
  };
  if (type === 'strength') {
    const groupId = `${id}-group-1`, grouped = ordinal % 3 === 0;
    workout.exercises = [
      exercise('hips', id, 0, {section: 'warmup', sets: '1', quantity: '5'}),
      exercise('goblet', id, 1, {sets: '3', quantity: '8', rir: String(2 + variation % 2), tempo: '2-1-1', rest: '90', ...(completed ? {kg: 16 + progress * 2} : {})}),
      exercise('row', id, 2, {sets: '3', quantity: '10', rir: '2', tempo: '2-1-1', rest: '75', ...(completed ? {kg: 12 + progress * 2} : {})}),
      exercise('rdl', id, 3, {sets: '3', quantity: '8', rir: '3', tempo: '3-1-1', rest: '90', ...(completed ? {kg: 20 + progress * 4} : {})}),
      exercise('hips', id, 4, {section: 'cooldown', sets: '1', quantity: '3'})
    ];
    if (grouped) {
      workout.groups = [{id: groupId, section: 'main', rounds: '3', transitionRest: '20', roundRest: '90'}];
      for (const item of workout.exercises.slice(1, 4)) { item.groupId = groupId; item.sets = ''; item.rest = ''; }
    }
  } else if (type === 'running') {
    const seconds = 380 - progress * 5 + variation * 7;
    workout.exercises = [exercise('hips', id, 0, {section: 'warmup', sets: '1', quantity: '4'}), exercise('run', id, 1, {sets: '1', quantity: String(Math.max(15, duration - 7)), pace: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}), exercise('hips', id, 2, {section: 'cooldown', quantity: '3', sets: '1'})];
  } else if (type === 'endurance') {
    const source = sport === 'Kolarstwo' ? 'cycle' : sport === 'Pływanie' ? 'demo-swim' : 'demo-walk';
    workout.exercises = [exercise(source, id, 0, {sets: sport === 'Pływanie' ? '6' : '1', quantity: sport === 'Pływanie' ? '150' : String(duration), rest: sport === 'Pływanie' ? '45' : ''})];
  } else if (type === 'technique') {
    workout.exercises = [exercise('backhand', id, 0, {sets: '3', quantity: '15'}), exercise('demo-forehand', id, 1, {sets: '3', quantity: '12'}), exercise('demo-cuts', id, 2, {sets: '2', quantity: '5'})];
  } else if (type === 'team') {
    workout.exercises = [exercise('hips', id, 0, {section: 'warmup', quantity: '8', sets: '1'}), exercise('demo-cuts', id, 1, {sets: '2', quantity: '10'}), exercise('demo-game', id, 2, {sets: '1', quantity: String(duration - 28)})];
  } else workout.exercises = [exercise('mental', id, 0, {sets: '1', quantity: String(duration)})];
  if (completed) {
    workout.postSession = {
      aerobic: type === 'mental' ? null : type === 'strength' ? 2 + variation : type === 'technique' && variation === 0 ? 0 : type === 'team' ? 5 + variation : 3 + variation,
      muscular: type === 'mental' ? null : type === 'strength' ? 5 + variation : type === 'technique' && variation === 0 ? 0 : 2 + variation,
      satisfaction: ordinal % 19 === 0 ? null : 6 + variation,
      notes: ordinal % 4 === 0 ? ['Dobra sesja, mimo krótszego czasu.', 'Następnym razem wcześniej przygotować sprzęt.', 'Warto wrócić do tego samego układu.', 'Zapisuję odczucia, zanim o nich zapomnę.'][Math.floor(ordinal / 4) % 4] : ''
    };
    if (type !== 'mental' && ordinal % 17 === 0) workout.postSession.muscular = null;
    if (type !== 'mental' && ordinal % 29 === 0) { workout.postSession.aerobic = null; workout.postSession.muscular = null; }
    if (ordinal % 7 === 0) workout.notes = '';
    workout.loadSnapshot = snapshotTrainleafLoad(workout);
  }
  return workout;
}

function createWellness() {
  const entries = [];
  for (let index = 0; dateAt(index) < SIX_MONTH_TODAY; index++) {
    const date = dateAt(index), phase = Math.floor(index / 7), activeDay = [1, 2, 4, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
    if (index % 11 !== 0) entries.push({
      id: `demo-wellness-${date}-morning`, date, slot: 'Rano',
      'answer-Sen (godziny)': index % 23 === 0 ? '' : String(6 + ((index * 7) % 11) / 4),
      'answer-Jakość snu': String(2 + (index + phase) % 4),
      'answer-Zmęczenie': String(activeDay ? 1 + index % 5 : index % 3),
      'answer-Bolesność mięśni': index % 17 === 0 ? '' : String((index + phase) % 5),
      notes: index % 18 === 0 ? 'Wcześniejsza pobudka niż zwykle.' : index % 25 === 0 ? 'Spokojny poranek i więcej czasu na śniadanie.' : '', demonstration: true
    });
    if (index % 6 === 2) entries.push({
      id: `demo-wellness-${date}-evening`, date, slot: 'Wieczorem',
      'answer-Zmęczenie': String(2 + index % 5), 'answer-Bolesność mięśni': String(index % 4),
      'answer-Stres': String(1 + Math.floor(index / 6) % 5), 'answer-Czas na odpoczynek': String(2 + Math.floor(index / 6) % 4),
      notes: index % 18 === 2 ? 'Udało się odłożyć telefon na koniec dnia.' : '', demonstration: true
    });
    if (index % 18 === 5) entries.push({
      id: `demo-wellness-${date}-daytime`, date, slot: 'W ciągu dnia',
      'answer-Energia': String(2 + Math.floor(index / 18) % 4), 'answer-Stres': String(1 + index % 6),
      'answer-Nastrój': String(3 + Math.floor(index / 18) % 3), 'answer-Koncentracja': String(2 + Math.floor(index / 18) % 4),
      notes: '', demonstration: true
    });
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date) || ['Rano', 'W ciągu dnia', 'Wieczorem'].indexOf(a.slot) - ['Rano', 'W ciągu dnia', 'Wieczorem'].indexOf(b.slot));
}

/** Synthetic, deterministic demonstration data. No network, device, or user data. */
export function createSixMonthDemo() {
  const state = clone(seed), workouts = [];
  const missedDates = new Set(['2026-04-23', '2026-05-19', '2026-06-13', '2026-07-16', '2026-08-25', '2026-09-24']);
  for (let index = 0; dateAt(index) < SIX_MONTH_TODAY; index++) {
    const date = dateAt(index), day = new Date(`${date}T12:00:00Z`).getUTCDay(), week = Math.floor(index / 7);
    const type = day === 1 || day === 4 ? 'strength' : day === 2 ? 'running' : day === 6 ? 'team' : day === 3 && week % 2 === 0 ? 'mental' : day === 5 && week % 2 === 1 ? 'endurance' : day === 0 && week % 2 === 0 ? 'technique' : null;
    if (type) workouts.push(createWorkout(date, type, workouts.length, missedDates.has(date) ? 'planned' : 'completed'));
  }
  const todayDone = createWorkout(SIX_MONTH_TODAY, 'running', 145);
  Object.assign(todayDone, {title: 'Niedzielny bieg przez park', time: '09:00', duration: '42', rpe: '4', notes: 'Równa, znana trasa. Po drodze krótki odcinek pod wiatr.'});
  todayDone.postSession = {aerobic: 4, muscular: 3, satisfaction: 8, notes: 'Dobry początek niedzieli.'};
  todayDone.exercises[1].quantity = '35';
  todayDone.loadSnapshot = snapshotTrainleafLoad(todayDone);
  workouts.push(todayDone);
  const todayPlan = createWorkout(SIX_MONTH_TODAY, 'technique', 146, 'planned');
  Object.assign(todayPlan, {title: 'Rzuty w parach · dokładność podań', time: '17:00', duration: '30', notes: 'Przykładowy plan: spokojna sesja rzutów w parach.'});
  workouts.push(todayPlan);
  [['2026-10-05', 'strength'], ['2026-10-06', 'running'], ['2026-10-07', 'mental'], ['2026-10-08', 'strength'], ['2026-10-09', 'endurance'], ['2026-10-10', 'team']].forEach(([date, type], index) => workouts.push(createWorkout(date, type, 147 + index, 'planned')));
  state.workouts = workouts.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  // Explicit fictional annotations for UI demonstration, never inferred from tags/shares.
  const demoRoles={
    'Przysiad goblet':{direct:['quads','glutes'],indirect:['abs']},
    'Martwy ciąg rumuński':{direct:['hamstrings','glutes'],indirect:['abs']},
    'Wiosłowanie hantlem w podparciu':{direct:['lats','traps'],indirect:['biceps']}
  };
  for(const [index,w] of state.workouts.entries()){
    for(const exercise of w.exercises)if(demoRoles[exercise.name])exercise.muscleRoles=clone(demoRoles[exercise.name]);
    if(w.status==='planned')w.plannedExertion={aerobic:4,muscular:w.trainingType==='strength'?6:4,source:{kind:'demo-own-estimate'},algorithm:'planned-exertion-v1'};
    if(w.status==='completed'&&index%3===0){w.planned=clone(w);w.planned.status='planned';delete w.planned.postSession;delete w.planned.loadSnapshot;w.planned.plannedExertion={aerobic:4,muscular:5,source:{kind:'demo-own-estimate'},algorithm:'planned-exertion-v1'};}
  }
  state.muscleTargets=Object.fromEntries([['quads',5],['glutes',8],['hamstrings',4],['lats',4]].map(([muscleId,target])=>[muscleId+'|demo-autumn',{muscleId,target,unit:'effective-sets',source:'demo-user-example',scope:'period',periodId:'demo-autumn',start:'2026-09-28',end:'2026-10-25',updatedAt:'2026-09-28T12:00:00Z'}]));
  state.wellnessEntries = createWellness();
  state.wellness = null; // Today's check-in intentionally remains unanswered.
  state.draft = null;
  state.goal = 'Regularnie trenować i czuć więcej swobody na boisku.';
  state.profile = {...state.profile, sports: ['Ultimate frisbee', 'Bieganie', 'Trening siłowy', 'Kolarstwo', 'Pływanie', 'Turystyka górska'], modules: ['library', 'templates', 'history', 'wellness', 'export']};
  state.customExercises = clone(customExercises);
  state.exerciseNotes = {'Przysiad goblet': 'Zapis demonstracyjny: zwrócić uwagę na spokojny początek ruchu.', 'Backhand w parach': 'Zapis demonstracyjny: najpierw dokładność, później odległość.', 'Spokojny bieg': 'Ulubiona przykładowa trasa prowadzi przez park.'};
  state.periods = [
    {id: 'demo-spring', name: 'Wiosna · budowanie regularności', start: '2026-04-04', end: '2026-05-31', phase: 'Przygotowanie ogólne', goal: 'Znaleźć rytm pasujący do tygodnia.', parentId: null},
    {id: 'demo-april', name: 'Kwiecień · spokojny początek', start: '2026-04-04', end: '2026-04-30', phase: 'Pierwszy blok', goal: 'Zebrać pierwsze własne zapisy.', parentId: 'demo-spring'},
    {id: 'demo-may', name: 'Maj · praca nad podstawami', start: '2026-05-01', end: '2026-05-31', phase: 'Podstawy techniki i siły', goal: 'Wracać do sprawdzonych ćwiczeń.', parentId: 'demo-spring'},
    {id: 'demo-summer', name: 'Lato · więcej gry', start: '2026-06-01', end: '2026-08-31', phase: 'Sezon letni', goal: 'Połączyć własne sesje z treningami drużyny.', parentId: null},
    {id: 'demo-june', name: 'Czerwiec · praca zespołowa', start: '2026-06-01', end: '2026-06-28', phase: 'Technika w grze', goal: 'Zapisywać obserwacje z boiska.', parentId: 'demo-summer'},
    {id: 'demo-holiday', name: 'Lipiec · elastyczny rytm', start: '2026-06-29', end: '2026-07-26', phase: 'Różne formy ruchu', goal: 'Dopasować sesje do wyjazdów.', parentId: 'demo-summer'},
    {id: 'demo-august', name: 'Sierpień · powrót do drużyny', start: '2026-07-27', end: '2026-08-31', phase: 'Regularna gra', goal: 'Odtworzyć swój tygodniowy rytm.', parentId: 'demo-summer'},
    {id: 'demo-autumn', name: 'Jesień · regularność i swoboda', start: '2026-09-01', end: '2026-11-30', phase: 'Przygotowania jesienne', goal: 'Utrzymać rytm, który dobrze pasuje do codzienności.', parentId: null},
    {id: 'demo-september', name: 'Wrzesień · technika w ruchu', start: '2026-09-01', end: '2026-09-27', phase: 'Dokładność i decyzje', goal: 'Łączyć rzuty z pracą nóg.', parentId: 'demo-autumn'},
    {id: 'demo-current', name: 'Październik · siła i precyzja', start: '2026-09-28', end: '2026-10-25', phase: 'Bieżący blok', goal: 'Dopracować ruchy i znaleźć czas na odpoczynek.', parentId: 'demo-autumn'}
  ];
  state.demo = {id: 'trainleaf-six-month-v1', title: 'Pół roku przykładowych zapisów', synthetic: true, start: SIX_MONTH_START, today: SIX_MONTH_TODAY, description: 'Fikcyjne wpisy do sprawdzenia interfejsu. Nie pochodzą od użytkownika ani nie stanowią gotowego planu treningowego.'};
  return state;
}

export function getDemoSummary(state) {
  const workouts = state.workouts || [], completed = workouts.filter(item => item.status === 'completed');
  return {
    from: SIX_MONTH_START, today: SIX_MONTH_TODAY,
    completed: completed.length,
    missedPlans: workouts.filter(item => item.status === 'planned' && item.date < SIX_MONTH_TODAY).length,
    todayCompleted: completed.filter(item => item.date === SIX_MONTH_TODAY).length,
    todayPlanned: workouts.filter(item => item.status === 'planned' && item.date === SIX_MONTH_TODAY).length,
    upcomingPlans: workouts.filter(item => item.status === 'planned' && item.date > SIX_MONTH_TODAY).length,
    wellnessEntries: state.wellnessEntries?.length || 0,
    wellnessDays: new Set((state.wellnessEntries || []).map(item => item.date)).size,
    types: [...new Set(completed.map(item => item.trainingType))],
    periods: state.periods?.length || 0,
    calculatedLoads: completed.filter(item => item.loadSnapshot?.status === 'calculated').length,
    missingLoads: completed.filter(item => item.loadSnapshot?.status === 'unavailable').length,
    superseries: completed.filter(item => item.groups?.length).length
  };
}
