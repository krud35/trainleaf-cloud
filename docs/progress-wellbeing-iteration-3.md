# Postępy i Samopoczucie — iteracja 3

Status: komponenty gotowe; finalne wyniki testów poniżej. Nie zmieniono App, data, lib, Androida, zależności ani globalnych stylów. Kontrakt celów: `docs/mobile-iteration-3-contract.md`; kierunek wizualny: `design/mobile-ui/HANDOFF-ITERATION-3.md` i `design/mobile-ui/INSIGHTS-ITERATION-3.md` oraz obraz referencyjny Inne.

## Publiczne komponenty i integracja

`ProgressView` zachowuje eksport i props `{ repository, snapshot, onChanged }`. Dwie podsekcje: Trening / Samopoczucie. Początek: wykonane sesje, zapisane minuty z kompletnością, unikalne dni aktywne, wykres. 7/28 dni to **zakresy kroczące**, a poprzedni zakres ma tyle samo dni i te same filtry. Anchor jest ograniczony do lokalnego dzisiaj; szczegóły filtrów i obciążenia są zwinięte. Wybór Samopoczucia nie stosuje filtrów sportu/rodzaju. Cele korzystają z produkcyjnego `goalProgress(goal, workouts, anchor, wellness)`.

`WellnessView` zachowuje eksport i wymagane props. Opcjonalne props:

```ts
initialMode?: 'trends' | 'new' | 'detail' | 'edit'; // domyślnie trends
entryId?: string; // konkretny wpis dla detail/edit
onClose?: () => void; // powrót do źródła dla initialMode new/detail/edit
onSavedNotice?: (notice: string) => void; // dokładnie „Zapisano samopoczucie”
onRefreshError?: (message: string) => void; // trwały zapis OK, odświeżenie nieudane
registerExitGuard?: (guard: (proceed: () => void) => void) => () => void;
```

Dla Today: montuj świeży komponent `key` identyfikujący otwarcie z `initialMode="new"`, `onClose` wracającym do źródła oraz `onSavedNotice` i `onRefreshError` przekazującymi komunikaty do właściciela nawigacji. `initialMode`/`entryId` są **inicjalizacją**, nie kontrolowanym trybem; przy nowym otwarciu zmień key. `new` nigdy automatycznie nie otwiera istniejącego check-inu; duplikat daty/pory blokuje zapis i wymaga jawnego wyboru istniejącego wpisu. Brak entryId dla edit/detail wraca bezpiecznie do trendów. Domyślne initialMode=trends traktuje nowe wpisy i szczegóły jako własny wewnętrzny przepływ: ich powrót/zapis otwiera trendy, nawet jeśli App przekazuje onClose. Tylko bezpośrednio otwarte new/detail/edit wywołują onClose po zapisie/powrocie. Gdy App przekazuje onSavedNotice/onRefreshError, widok nie dubluje tych samych komunikatów lokalnie.

`registerExitGuard` daje App funkcję do wywołania **przed** przełączeniem zakładki, ekranem wstecz lub natywnym back. Właściciel przekazuje kontynuację nawigacji i czeka na jej wywołanie; brudny formularz pokazuje dialog odrzuć/anuluj. Zwrócona funkcja odłącza guard. Lokalny przycisk powrotu i przed zamknięciem przeglądarki pozostają chronione. Bez tego opcjonalnego spięcia App nie może chronić zewnętrznego unmountu.

Przechodzenie po wpisie otwiera read-only podsumowanie; dopiero „Edytuj wpis” otwiera formularz. Kopia rekordu zachowuje revision, formularz przechowuje epoch z otwarcia. Nie nadpisuje ich odświeżenie snapshotu. Po trwałym zapisie formularz znika, błąd samego zapisu zostawia wartości i formularz. Błąd refreshu nie jest błędem commitu i trafia oddzielnie do `onRefreshError` zanim widok wróci do źródła.

`features/wellbeing/WellbeingTrends.tsx`:

```ts
{ records: Wellness[]; end?: string; initialDays?: 7 | 28; onNewEntry?: () => void }
```

Ten sam komponent w obu widokach. Pory i pytania osobno; 7/28 dni, średnia + odpowiedzi/dni zakresu i odpowiedzi/wpisy pory; zachowuje zero, pomija null/undefined i przyszłość. Punkty nie łączą brakujących dni. Tabelaryczna lista odpowiedzi w details; pusty stan bez fikcyjnej średniej. Porównanie z poprzednim równym zakresem podaje kompletność obu.

`features/entry-details/WellnessEntryDetail.tsx`:

```ts
{ entry: Wellness; onEdit: () => void; onClose: () => void }
```

`features/entry-details/WorkoutEntryDetail.tsx`:

```ts
{ workout: Workout; onEdit: () => void; onClose: () => void;
  periods?: readonly Pick<Period, 'id' | 'name' | 'level'>[];
  actions?: ReactNode }
```

Android musi podpiąć detail do sesji Today/Plan/History, a edycję wyłącznie do `onEdit`. `periods` przekazuje właściciel nawigacji, np. `periodsForDate(snapshot.periods, workout.date)` w automatycznej kolejności. Brak przekazania różni się od pustej listy okresów. Komponent nie zapisuje/usuwa i nie przelicza load; `actions` to dodatkowe jawne działania właściciela. Pokazuje typ z kolorem + ikoną + tekstem, współdzielonymi z Planem przez features/shared/TrainingTypeBadge; status z features/planning/sessionStatus, w tym jawny przyszły zapis wykonania. Dalej pokazuje, sport, datę/godzinę, status, plan/czas wykonania, okres, notatki, trzy sekcje, ćwiczenia z dawnego snapshotu, plan/wykonanie, RIR, tempo, przerwy i superserie oraz ankietę (zero != brak). Założenia planu są oddzielone od ankiety; zamknięte „Zapisane obciążenie” odczytuje oddzielnie plannedLoadCalculation i loadCalculation. Przycisk Edytuj i opcjonalne actions są od razu pod faktami, przed ćwiczeniami.

## Cele

count/minutes/activeDays/checkinDays/sleepAverageHours z kontraktu. Wellness cele bez pola sportu; submit przekazuje sportId:null. Dni/sesje całkowite; minuty/sen mogą być ułamkowe. Cel snu bez domyślnej wartości, >0 i <=24; UI nie proponuje normy. `hasData:false` nie daje realizacji; minuty bez pomiarów i sen bez odpowiedzi pokazują —. Sen nie nagradza przekroczenia celu; progress bar max100, tekst opiera się na `met`. Każdy cel pokazuje observedDays/expectedDays. Android jest właścicielem walidacji repozytorium, migracji i obliczeń.

## Zmienione ścieżki

- mobile/src/ui/ProgressView.tsx
- mobile/src/ui/WellnessView.tsx
- mobile/src/ui/wellness.css
- mobile/src/features/progress/summary.ts
- mobile/src/features/wellbeing/trends.ts
- mobile/src/features/wellbeing/WellbeingTrends.tsx
- mobile/src/features/entry-details/WellnessEntryDetail.tsx
- mobile/src/features/entry-details/WorkoutEntryDetail.tsx
- tests/mobile-progress-v3.test.mjs
- mobile/tests/progress-v3.spec.ts
- docs/progress-wellbeing-iteration-3.md

## Weryfikacja i pozostałe prace integratora

- Własne obliczenia: **8/8 PASS** (`node --test tests/mobile-progress-v3.test.mjs`), w tym null/zero, przyszłość, mentalny czas/regularność, zapisany load bez przeliczania, równy zakres przez rok/przestępny luty, kompletność pór i skali, cele snu/check-inów.
- **mobile:typecheck PASS** w końcowym przebiegu. Wcześniejsze błędy w plikach integratora zostały usunięte w trakcie jego równoległej pracy; nie edytowałem tych plików.
- **7/7 Chrome PASS** w jednym przebiegu (11,9 s): domyślne trendy, detail→edit→save→close, błąd zapisu i ponowienie, udany zapis mimo błędu odświeżenia i powrót Today, brak duplikatu, guard/fokus/Tab/Escape, 360 px i 200% tekstu dla Postępów/trendów/formularza/szczegółu, rozwinięte filtry bez overflow, jawny własny cel snu, zachowanie revision/epoch przy odświeżeniu snapshotu, wewnętrzne powroty do Samopoczucia i pojedynczy komunikat zapisu. Po drobnej korekcie minimalnego targetu ponownie PASS test snu oraz typecheck.
- **ESLint PASS** na wszystkich zmienionych komponentach i nowych modułach.
- Browser test używa kontrolowanego repozytorium testowego: sprawdza przepływ po rozwiązaniu/odrzuceniu zapisu i przekazywanie revision/epoch, nie trwałość SQLite po restarcie. Testy produkcyjnej bazy pozostają po stronie Androida.
- Test browser generuje test-only harness w odizolowanym `.qa-v3-*` pod features/progress, usuwa własne dwa pliki i katalog po testach, startuje własny serwer dev na automatycznie wybranym wolnym porcie. Harness nie jest importowany przez App ani dodawany do bundle produkcyjnego. Nie dotyka wspólnego dist-mobile, serwera preview ani produkcyjnej bazy. Trwałość SQLite/migracje/regresje całej aplikacji/nowy APK pozostają po stronie Androida.



Polecenia integratora:

```text
node --test tests/mobile-progress-v3.test.mjs
npm run mobile:typecheck
node node_modules/@playwright/test/cli.js test --config mobile/playwright.config.ts progress-v3.spec.ts
```

Końcowy własny przebieg Chrome używał odizolowanej konfiguracji bez wspólnego webServer (tymczasowy `trainleaf-progress-v3-playwright.config.mjs`) i wyników `C:/Users/marod/AppData/Local/Temp/trainleaf-progress-v3-results`. Zwykła konfiguracja powyżej może dodatkowo uruchomić preview 4174, natomiast sam spec nadal korzysta z własnego wolnego portu. Wszystkie wygenerowane katalogi `.qa-v3-*` z własnych prób zostały usunięte. Kod nie zawiera fixture/harness w App ani w produkcyjnym bundle.

Do końcowej integracji: Android musi zachować key przy zewnętrznym otwarciu check-inu, `registerExitGuard` na zewnętrznej nawigacji/back, komunikaty właściciela oraz automatyczne `periodsForDate` do WorkoutEntryDetail. Bieżący App już korzysta z tych propsów; pełne regresje wspólnego klienta, trwałość native i APK wymagają końcowego przebiegu integratora. Własne pliki nie wymagają dodatkowego kontraktu danych.

