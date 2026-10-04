# Trainleaf — kontrakt danych iteracji 3

Status: kontrakt wdrożony w warstwie danych, DB7 i backup4. Źródłem kompatybilności jest dostarczona baza v5 i backup v3. Migracje 1–6 są zamrożone; zapisane obliczenia load v1 pozostają bez zmian. Nie można wykluczyć utrwalonego podglądu z wcześniejszą, ograniczoną do wydarzeń wersją DB6. Nowa migracja7 sprawdza istniejące kolumny/tabele i dodaje tylko brakujące elementy: obsługuje zarówno taki wariant, jak i pełną DB6, atomowo i bez resetu lub przepisywania danych. Prognoza i indywidualne ustawienia mięśni nie mają uniwersalnych celów ani progów oceny zdrowia.

Pochodzenie parametrów prognozy: Roboczy kontrakt prototypu wybrany przez zespół 2026-10-04 w ramach zleconego researchu i wdrożenia; parametry nie zostały osobno zatwierdzone przez użytkownika ani zwalidowane fizjologicznie. Osobno zatwierdzone przez użytkownika load v1 pozostaje niezmienione.

## Wydarzenia

Eksporty z `mobile/src/data/domain.ts`:

```ts
type EventKind = 'event' | 'competition' | 'trip';
type EventAvailability = 'available' | 'limited' | 'unavailable';
type LocalEventInput = {
  profileId: string;
  kind: EventKind;
  title: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD, >= start, oba dni włącznie
  time?: string | null; // HH:mm, default null
  location?: string;    // default ''
  notes?: string;       // default ''
  availability?: EventAvailability | null; // default null
};
type LocalEvent = Required<LocalEventInput> & {
  id: string; revision: number; createdAt: string; updatedAt: string;
  syncState: 'local-only';
};
```

`EventInput` jest aliasem `LocalEventInput`. Schematy: `eventInputSchema` oraz `eventSchema` (alias `localEventSchema`). Tytuł wymagany, do 160 znaków; miejsce do 300, notatka do 10 000. Brak godziny lub dostępności nie jest domyślną odpowiedzią. Podróż nie otrzymuje automatycznej niedostępności. Dostępność jest wyłącznie jawną informacją użytkownika: nie zmienia gotowości, obciążeń ani realizacji celów.

`LocalSnapshot.events: LocalEvent[]`; starsze kopie wczytują `events: []`. Nowa tabela `local_events` przechowuje standardowe kolumny tożsamości/rewizji i payload JSON. API repozytorium:

```ts
createEvent(input: LocalEventInput, expectedEpoch?: number): Promise<LocalEvent>
updateEvent(id: string, expectedRevision: number, input: LocalEventInput, expectedEpoch?: number): Promise<LocalEvent>
deleteEvent(id: string, expectedRevision: number, expectedEpoch?: number): Promise<void>
```

Usunięcie fizyczne zachowuje revision floor, a import unieważnia stare formularze przez epoch tak jak w pozostałych encjach. Wydarzenia nie są treningami i nie zwiększają czasu, liczby sesji, dni aktywnych ani load. CSV zawiera wiersz `wydarzenie`, a pełny rekord zachowuje koniec, godzinę, miejsce, typ i dostępność. Backup eksportowany ma wersję 4; wersje 1/2/3 pozostają czytelne. Eksport ratunkowy uwzględnia tabelę wydarzeń.

Eksporty kalendarza z `mobile/src/data/analytics.ts`:

```ts
dateRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean
eventsInRange(events: LocalEvent[], start: string, end: string): LocalEvent[]
eventsForDate(events: LocalEvent[], date: string): LocalEvent[]
eventsForWeek(events: LocalEvent[], anchor: string): LocalEvent[]
eventsForMonth(events: LocalEvent[], anchor: string): LocalEvent[]
monthRange(anchor: string): { start: string; end: string }
```

Zakresy mają granice włącznie. Tydzień trwa poniedziałek–niedziela. Miesiąc jest miesiącem wskazanego dnia; nie zawiera dopełnienia siatki tygodniami. Wynik jest nową tablicą, każde wydarzenie występuje raz, posortowane po początku, godzinie (brak przed podaną), końcu, tytule i ID. Nakładające się niezależne wydarzenia nie są usuwane. Dla listy wybranego dnia wydarzenie wielodniowe nadal jest jednym wydarzeniem.

## Cele i postępy

```ts
type GoalMetric = 'count' | 'minutes' | 'activeDays' | 'checkinDays' | 'sleepAverageHours';
goalProgress(goal: Goal, workouts: Workout[], anchor?: string, wellness?: Wellness[]): GoalProgress;
type GoalProgress = {
  start: string; end: string;
  actual: number | null; target: number; percent: number | null;
  met: boolean | null; hasData: boolean;
  observedDays: number; expectedDays: number;
};
```

Trzy dotychczasowe argumenty zachowują znaczenie; `anchor` domyślnie jest lokalnym `today()`, czwarty argument domyślnie `[]`. Cotygodniowe cele używają tygodnia `anchor`, okresowe własnych granic. Pod uwagę wchodzą tylko rekordy danego `goal.profileId` i dni niepóźniejsze niż lokalne `today()`. Przyszłe zapisane wykonania i przyszłe wpisy samopoczucia nie udają historii.

- `count`: liczba ukończonych sesji; kilka sesji tego samego dnia liczy się osobno.
- `minutes`: suma wyłącznie zmierzonych minut ukończonych sesji; brak pomiaru nie tworzy pomiaru zero. Dotychczasowa suma 0 pozostaje, a `hasData`/`met` wskazują brak oceny.
- `activeDays`: unikalne dni przynajmniej jednej ukończonej sesji.
- `checkinDays`: unikalne dni przynajmniej jednego zapisu samopoczucia z dowolnej pory. Trzy pory tego samego dnia to jeden dzień. Ankieta po treningu nie jest takim zapisem.
- `sleepAverageHours`: średnia wyłącznie zapisanych `answers.sleepHours` w porannym samopoczuciu. Brak pola nie jest zerem, zapisane 0 jest pomiarem. Przy braku pomiarów `actual`, `percent` i `met` są `null`.

Filtr sportu dotyczy tylko count/minutes/activeDays. Dla checkinDays/sleepAverageHours zapis przez repozytorium normalizuje `sportId` do `null`; odczyt i import nie zmieniają historycznie zapisanego sportu, a obliczenie świadomie go ignoruje.

`observedDays` oznacza dni mające rekordy istotne dla danego celu: wykonania, zmierzone minuty, check-iny lub zapisany sen rano. `expectedDays` to liczba dni kalendarzowych od początku zakresu do `min(end, today())`, włącznie; dla całkowicie przyszłego zakresu wynosi 0. Nie jest liczbą wszystkich przyszłych dni tygodnia. Kompletność ma być widoczna, ale nie generuje wymyślonej kary ani progu jakości.

Dla count/activeDays/checkinDays pusta lista daje jawne `actual: 0`, `percent: 0`, `hasData: false`, `met: null`; zero liczy wpisy, a nie stan zdrowia. Dla minut przy braku jakiegokolwiek pomiaru analogicznie `met: null`. Jawny pomiar 0 minut daje `hasData: true`.

`met` jest porównaniem do indywidualnego targetu, tylko gdy `hasData`. Postęp count/minutes/activeDays/checkinDays zachowuje zaokrąglony procent i może przekroczyć 100 jak dotychczas. Dla snu procent jest ograniczony do 100: przekroczenie własnego celu nie daje bonusu i nie oznacza lepszego zdrowia. Nie interpretujemy wyniku klinicznie. Cel snu jest jawnie ustawianą liczbą godzin >0 i <=24, bez narzuconego defaultu; cele liczby sesji/dni są całkowite.

## Ochrona danych

Migracja 6 dodaje cztery tabele: wydarzenia, odniesienia prognozy, ustawienia ról mięśni i cele mięśniowe oraz dwie kolumny treningów: planned_fatigue i planned_load_calculation. Nie przebudowuje ani nie przelicza wcześniejszych treningów. Surowe szkice i zapisane load v1 pozostają bajtowo niezmienione w istniejących tabelach. Domyślne puste kolekcje dotyczą odczytu starszych danych. Nowe zapisy, importy, eksporty i wycofanie nieudanej transakcji zachowują zasady rewizji oraz epoch.

## Rozszerzenie: prognoza v1 i ustawienia mięśni

Poniższy kontrakt jest finalizowany przez migrację7. Zamrożona migracja6 pozostaje niezmieniona. Zapisane actual `loadCalculation` v1 nie zmieniają formatu, wartości ani parametrów.

### Oddzielna prognoza dawki

`Workout.plannedFatigue = { aerobicFatigue: number|null, muscularFatigue: number|null }` (całkowite 0–10, oba domyślnie null). `Workout.plannedLoadCalculation: LoadCalculation|null` jest osobną migawką opartą na `plannedMinutes`, rodzaju i tych dwóch odpowiedziach. Nigdy nie używa postWorkout. Wagi i wzór są v1; mentalny ma 0 także bez czasu/ocen. Pozostałe braki dają null. Repozytorium przelicza planowaną migawkę tylko przy zmianie jej wejść; actual v1 pozostaje niezależny. Kopia sesji zachowuje jawny plan i jego migawkę, a usuwa wykonanie. Stare rekordy otrzymują puste plannedFatigue i null migawki, bez wnioskowania z ankiety wykonania.

### Odniesienie prognozy

Eksportowane typy `ReadinessReferenceInput`, `ReadinessReference` oraz `readinessReferenceInputSchema`, `readinessReferenceSchema`:

```ts
type ReadinessReferenceInput = {
  profileId: string; name: string;
  source: 'confirmed-week'|'example-week';
  weekStart: string;
  dailyLoads: number[]; // dokładnie 7 jawnych, skończonych wartości >=0; suma >0
  confirmedComplete: true;
  confirmedRestDays?: string[]; // konkretne dni bez sesji, potwierdzone przez użytkownika
};
// ReadinessReference zawiera powyższe z default [] oraz standardowe metadata,
// referenceLoad (suma S), version:'readiness-v1',
// parameters:{lookbackDays:21,halfLives:[1,2,3]}.
```

`LocalSnapshot.readinessReferences` oraz `createReadinessReference`, `updateReadinessReference`, `deleteReadinessReference` mają standardowe signature revision/epoch. Wybranie odniesienia jest jawne po stronie UI; samo pojawienie się nowego treningu nie zmienia S. S i siedem liczb to snapshot, nie zapytanie do aktualnej historii. Dla `confirmed-week` zapisane dni z zerem również są świadomym potwierdzeniem odpoczynku; przykład tygodnia nie udaje historii. Jawne dodatkowe `confirmedRestDays` pomagają uzupełnić ostatnie 21 dni. Aktualizacja konfiguracji dotyczy wybranego odniesienia, nie przelicza historycznego actual load.

> **0.4.1:** `readinessForecast` i panel punktu odniesienia zostały usunięte. Schematy i metody repozytorium dla `readinessReferences` pozostają wyłącznie po to, by stare dane dało się odczytać, wyeksportować i zaimportować. Obowiązujący kontrakt prognozy: `docs/mobile-forecast-v2.md`.

```ts
readinessForecast(workouts: Workout[], day: string, reference: ReadinessReference|null,
  wellness?: Wellness[], asOf?: string): ReadinessForecast
```

Eksport z analytics. Wynik zawiera `version`, `day`, `window:{start,end}`, skopiowane `reference` i `parameters`, `status:'no-reference'|'incomplete'|'estimated'|'recorded'`, `coverage:{recordedDays,estimatedDays,unknownDays,totalDays:21}`, `days` oraz `scenarios`, `latestWellness`.

Każdy `days` ma `date`, `load:number|null`, `knownLoad:number`, `source:'recorded'|'estimated'|'mixed'|'confirmed-rest'|'unknown'`, `unknownWorkoutIds`, `contributions` z `workoutId`, `source:'actual'|'planned'|'unknown'`, `load:number|null`, `calculation:LoadCalculation|null`.

Każdy scenariusz ma `halfLifeDays:1|2|3`, `residual:number|null`, `knownResidual:number`, `balance:number|null`, `knownBalance:number|null`. Liczymy START dnia: wyłącznie 21 wcześniejszych dni i odległość kalendarzową d−i. R jest sumą L_i × 2^(-(d−i)/h), B=S/(S+R). Znane części mogą dać `knownBalance` do kreskowanego widoku; przy niepełnej historii zwykłe `balance` pozostaje null i nie wolno pokazać pełnej pewności. To heurystyka produktu, nie procent gotowości medycznej.

Każdą sesję sumujemy raz po ID. Ukończone, nieprzyszłe wykonanie z realnym zapisanym load zastępuje plan. Fizyczne wykonanie bez actual load jest unknown: w MVP nie zastępujemy go wcześniejszym planowanym szacunkiem. Ukończony mentalny ma fizyczne 0 również bez migawki actual, wyłącznie w prognozie i bez zmieniania historii. Nieukończony przeszły plan jest unknown, również mentalny: nie stanowi dowodu wykonania. Planowane szacunki dotyczą dzisiaj/przyszłości. Pominięte/usunięte sesje nie wchodzą. Pusty przeszły dzień jest unknown, chyba że jawnie potwierdzono odpoczynek. Potwierdzenie odpoczynku nie maskuje sesji z brakującym pomiarem. Pusty przyszły dzień ma planowane 0 i status estimated — nie stanowi zapewnienia przyszłego odpoczynku. Najnowsze dostępne samopoczucie jest osobnym kontekstem, bez mnożnika lub kary.

### Jawne role mięśni i cele

`MuscleRoleAssignment = {muscle: Muscle, role:'direct'|'indirect'}`. `Item.muscleRoles: MuscleRoleAssignment[]|null` to snapshot (default null). Nie jest wyprowadzany z shares. `ExerciseRolesInput = {profileId,exerciseId,roles:MuscleRoleAssignment[]}`; role niepuste, mięsień niepowtórzony. `LocalSnapshot.exerciseRoles` i standardowe `createExerciseRoles/updateExerciseRoles/deleteExerciseRoles`. Zmiana ustawienia katalogu dotyczy tylko nowych pozycji. `muscleRolesForExercise(configs,exerciseId)` zwraca kopię ról albo null, do jawnego zapisania przy dodaniu nowego Item. Historia oraz edytowane istniejące pozycje zachowują swoje role.

`MuscleTargetInput = {profileId,muscle,unit:'effectiveSets'|'exposures',target:number|null,start,end,provenance:string}`; zakres inclusive. Target null oznacza brak ustalonego celu, 0 wyłącza cel. Brak automatycznego 10. `MuscleTarget` dodaje metadata oraz `scope:'period'|'week-override'`, `definitionRevision:number`, `supersedesId:string|null`. `LocalSnapshot.muscleTargets`.

```ts
createMuscleTarget(input: MuscleTargetInput, expectedEpoch?:number): Promise<MuscleTarget>
reviseMuscleTarget(id:string, expectedRevision:number, input:MuscleTargetInput, expectedEpoch?:number): Promise<MuscleTarget>
createMuscleWeekOverride(input: Omit<MuscleTargetInput,'start'|'end'> & {weekStart:string}, expectedEpoch?:number): Promise<MuscleTarget>
muscleTargetForWeek(targets:MuscleTarget[], muscle:Muscle, anchor:string): MuscleTarget|null
```

Cel okresowy i jego nowa wersja mogą zaczynać się najwcześniej w aktualny poniedziałek. Poprzednia definicja zostaje zachowana; jej revision techniczna unieważnia stary formularz po utworzeniu następcy. Jawny tygodniowy override jest osobną metodą pozwalającą świadomie wybrać również historyczny tydzień. Nie usuwamy definicji fizycznie. Pierwszeństwo ma override wybranego tygodnia, następnie najwyższa definitionRevision/createdAt. Okresowy target jest wartością tygodniową obowiązującą w zadanym okresie; nie proratujemy niepełnego tygodnia, UI pokazuje zakres i provenance.

```ts
muscleWorkSummary(workouts:Workout[], start:string, end:string, mode:'planned'|'actual')
```

Wyłącznie rozpoznane ćwiczenia oporowe z typem strength; main/cooldown, bez warmup. Plan: wasPlanned i status różny od skipped, zawsze pierwotne planned.sets, także po ukończeniu. Actual: ukończone, nieprzyszłe, wyłącznie actual.sets. Każda pozycja raz, bez mnożnika rund superserii. Direct sets +0,5×indirect sets. Exposures to unikalne sesje z co najmniej jedną znaną dodatnią serią dla danego mięśnia, bez dublowania wielu ćwiczeń tej samej sesji. Bieganie nie staje się seriami oporowymi przez samą mapę mięśni.

Wynik: `{mode,start,end,hasData,complete,unknownRolesCount,unknownSetsCount,missingActualCount,muscles:[{muscle,name,directSets,indirectSets,knownEffectiveSets,effectiveSets:number|null,exposures:number|null,complete}]}`. KnownEffectiveSets zachowuje znaną część; `effectiveSets` i `exposures` nie udają pełnego pomiaru przy odpowiednich brakach. Brak jakichkolwiek kwalifikujących danych również pozostaje null. UI ma pokazywać niekompletność, bez dobierania uniwersalnych norm.

Wynik zawiera także `incompleteWorkoutIds:string[]`: unikalne sesje z brakującymi rolami, seriami lub actual, do przejścia bezpośrednio z mapy do uzupełnienia sesji. `hasData` oznacza obecność kwalifikujących pozycji, niezależnie od kompletności. Nieznane role mogą dotyczyć każdego mięśnia, więc wszystkie wiersze są wówczas niekompletne; brak serii przy znanych rolach dotyczy tylko wskazanych mięśni. Znane części pozostają dostępne. Licznik missingActualCount jest osobny od unknownSetsCount.

Aktualne odniesienie w UI wybierane jest z najnowszego jawnego zapisu (updatedAt). Zastąpienie tworzy nowe odniesienie; stare migawki pozostają w kopii. Nie ma automatycznego przełączania wskutek nowego treningu. Przy równym czasie zapisu UI powinno zachować porządek zapisu lub stosować stabilny dodatkowy klucz.

Prognoza rozstrzyga powtarzające się ID niezależnie od kolejności: najnowszy tombstone/pominięcie wyłącza sesję, a w pozostałych przypadkach wykonanie nieprzyszłe ma pierwszeństwo przed planem. Przyszłe zaimportowane wykonanie pozostaje unknown, nawet jeśli zawiera stare plannedLoadCalculation. Pusty dzień dzisiejszy nie jest potwierdzonym odpoczynkiem. Wszystkie nowe kolekcje mają pełne rekordy w CSV i surowym eksporcie ratunkowym; kopie v1/v2/v3 pozostają czytelne.

Reguły po audycie: procent snu jest całkowity, ale przy actual < target ma górny limit99; 100 oznacza spełnienie celu, bez premii za nadwyżkę. Nowe zapisy i edycje activeDays/checkinDays nie mogą przekraczać7 dla tygodnia ani liczby dni inclusive w zakresie własnym. Odczyt/import dawnych celów nie stosuje tej nowej reguły wiarygodności. Rewizja celu mięśni mającego już następcę jest odrzucana także po ponownym odczytaniu aktualnej rewizji technicznej starego rekordu: nie powstają rozgałęzienia. Wybór historycznego celu pozostaje stabilny.

Test zgodności używa zamrożonego prawdziwego SQLite w tests/support/mobile-0.2-fixture/released-v5.sqlite. Plik utworzono przez repozytorium i migracje z outputs/trainleaf-0.2.0-audit; podczas generowania SHA256 każdego użytego źródła zweryfikowano względem AUDIT-MANIFEST.json. Towarzyszą mu backup-v3.json i provenance.json z hashami plików, użytych źródeł, manifestu i APK źródłowego oraz identyfikacją zegara fixture. Dane są wyłącznie syntetyczne. Testy weryfikują hashe fixture i pracują na jego kopii: nie wymagają katalogu outputs ani sąsiedniego archiwum. Sprawdzane są baza wydania5, wariant preview events-only6 oraz pełna6, migracja7, rollback i ponowne otwarcie. Migracje1–5 porównano z kodem0.2.0 i pozostają identyczne. Brak snapshotu źródeł0.1.0: dostępny APK i opis weryfikacji nie wystarczają do oznaczenia fixture jako dokładnego wydania0.1.0. Testy wcześniejszych wersji schematu nie są zastępstwem takiego dowodu.
