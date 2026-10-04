# Trainleaf · przekazanie iteracji 3

Stan: 2026-10-04. To opis działającego prototypu `design/mobile-ui` i przekazanie warstwy wizualnej na istniejący frontend Android. Obejmuje Dzisiaj, planowanie, szczegóły wpisów, Postępy, samopoczucie, cele, rezerwę i anatomię. Nie potwierdza wydania APK ani trwałości SQLite. **W sprawach danych i obliczeń obowiązuje aktualny [kontrakt produkcyjny](../../docs/mobile-iteration-3-contract.md); prototyp nie jest wobec niego nadrzędny.** Jawne różnice poniżej nie są instrukcją zmiany produkcji na zachowanie prototypu.

## Otwieranie i izolacja danych

- Podgląd: `http://127.0.0.1:4186/?demo=six-months&v=iteration3` po uruchomieniu `serve.mjs`.
- Stała data demonstracji: 2026-10-04; historia od 2026-04-04. Wszystkie wpisy demonstracyjne są fikcyjne.
- Klucz tego podglądu: `trainleaf-six-month-demo-iteration3-v1`.
- `&qa=1` dodaje sufiks `-qa`; testy nie powinny pisać do podstawowego klucza demonstracji.
- Pozostają osobne klucze wcześniejszej demonstracji i pustego prototypu. Nie importować żadnego z nich do produkcji.
- Nie przenosić `demo-history.js`, seedów, `demoToday`, lokalnego magazynu prototypu, scenariuszy błędów ani narzędzi podglądu do aplikacji użytkownika.

## Warstwa wizualna i hierarchia

Kolejność stylów w `index.html`: `style.css`, `week-ui.css`, `profile-ui.css`, `exercise-editor.css`, `iteration.css`, `planning-ui.css`, `insights-ui.css`, `anatomy-ui.css`, `iteration3.css`, `appearance-ui.css`, `theme.css`. `iteration3.css` zawiera korekty układu iteracji 3, a ostatni arkusz nadpisuje paletę. Blokujący `appearance-bootstrap.js` rozstrzyga motyw przed arkuszami. Szczegóły Jasny/Ciemny/Systemowy, nowe teksty PL i jawne ograniczenia QA są w [THEME-HANDOFF.md](THEME-HANDOFF.md). Poniższa tabela opisuje paletę jasną.

| Token | Aktualna wartość / zastosowanie |
| --- | --- |
| Tło strony / papier | `#E9EDE3` / `--paper:#F7F8F2` |
| Tekst / tekst pomocniczy | `--ink:#203B2C` / `--muted:#58685D` |
| Akcent / obrys / fokus | `#2F6048` / `#D7DED1` / `#58754A` |
| Sage / sand / leaf | `--sage:#DCE8CC`, `--sand:#F0E1BE`, `--leaf:#C9D7B7` |
| Rytm sekcji | `--section-gap:30px`; rzeczywiste odstępy zależą od komponentu: 22–30 px |
| Tekst bazowy | 16 px / 1.55, Segoe UI Variable Text → Segoe UI → system-ui |
| Nagłówki redakcyjne / liczby | Georgia → Times New Roman → serif; liczby tabularne |
| Dzisiaj / zwykły nagłówek strony | 2.4 rem / 1.08; Plan zachowuje bazowe 2.65 rem / 1.13 |
| Szczegół sesji | tytuł 2 rem / 1.08; promień hero `4px 35px 4px 4px` |
| Sekcja / główna liczba Postępów | 1.14 rem / 2.7 rem; liczba przy 360 px: 2.45 rem |
| Ramka | maks. 440 px; główna treść przy wąskim ekranie: 20 px po bokach |
| Nawigacja | cztery pozycje; stała u dołu; dolny inset przez `env(safe-area-inset-bottom)` |
| Przyciski / fokus | bazowa wysokość 48 px, kompaktowe akcje zwykle 44 px; widoczny obrys 3 px |

Rodzaj sesji ma pełne kolorowe tło oraz własną ikonę; kolory nie zastępują etykiety i statusu.

| Rodzaj | Tekst | Tło |
| --- | --- | --- |
| Siłowy | `#674333` | `#F1DFD2` |
| Biegowy | `#35583D` | `#DDEBD9` |
| Wydolnościowy | `#345C68` | `#DCEBF0` |
| Techniczny | `#665027` | `#F1E8CB` |
| Drużynowy | `#51476F` | `#E8E2F1` |
| Mentalny | `#6B445A` | `#F0DFE9` |

Dzisiaj: opcjonalny check-in → treningi dzisiejsze lub zwarty tydzień → zapis treningu → kontekst własnego celu i okresu. Rozwinięcie tygodnia zastępuje listę dnia; nie dodaje drugiej sekcji tych samych sesji.
Plan: nagłówek → tydzień/miesiąc/sezon → okruszki → dominujący kalendarz → akcje dodawania → zwinięte filtry. Anatomia jest poniżej kalendarza, tylko w trybie tygodnia.
Sesja: kolorowy hero i fakty → jawne Edytuj / Zapisz wykonanie → notatka → przebieg → oceny po treningu → zamknięte obciążenie → okresy. Otwieranie wpisu nie pokazuje formularza.
Postępy: wykonane sesje, dni aktywne, minuty, regularność → aktywność i fakty → cele i samopoczucie → zwinięta analiza load/RPE → ostatnie oceny. Liczby mają większą wagę niż techniczne wzory.
Samopoczucie: trend jednej miary w jednej porze → średnia i kompletność → historia → szczegół wpisu → jawna edycja. Cele mają ciepły papier; osiągnięcia i trendy mają sage; notatka sesji przypomina kartkę notesu.

## Kontrakt 360 px i tekstu 200%

- `.large` ustawia root na 32 px. To test powiększenia tekstu; nie jest dowodem poprawności natywnych insetów Androida.
- Strona nie przewija się poziomo. Kalendarze i oś sezonu mogą przewijać się we własnych nazwanych regionach z `tabindex=0`.
- Tydzień ma zawsze siedem kolumn; minimum siatki 19 rem, przy `.large` 21 rem. Miesiąc stosuje ten sam kontrakt.
- Kafelek otwiera sesję; pełna nazwa jest w dostępnej nazwie przycisku i rozwijanej liście. Długie tytuły w pełnych wierszach zawijają się.
- Lista tygodnia/miesiąca i lista okresów/wydarzeń zapewniają alternatywę dla siatki. Filtry pozostają natywnymi polami.
- Przy 200% fakty sesji, formularze/akcje oraz wybrane zestawienia przechodzą do jednej kolumny; dolna nawigacja przechodzi do dwóch kolumn.
- Pomoc jest pod małym oznaczonym `?`, w dialogu; Escape zamyka dialog i przywraca fokus. Nie umieszczać długiej legendy nad kalendarzem.
- Canvas anatomii jest ukryty przed czytnikiem; wszystkie grupy mają równoważne przyciski HTML. Gest poziomy obraca model, pionowy zachowuje przewijanie strony.
- Zachować `viewport-fit=cover`, safe areas, preferencję ograniczenia ruchu i rzeczywisty test na telefonie. Nie sumować insetu natywnego z tą samą wartością CSS.

## Trasy i akcje

Nawigacja główna: `journal` / `plan` / `progress` / `more` → Dzisiaj / Plan / Postępy / Inne. `session` pamięta pochodzenie w `sessionReturn`; `wellnessDetail` prowadzi do `wellness` wyłącznie po akcji edycji. `wellnessTrends`, `goals` i ich szczegóły należą do Postępów.

| Atrybut / pole | Zachowanie kontrolera |
| --- | --- |
| `data-edit`, `data-week-session` | Otwórz `session`; nie edytor |
| `data-session-edit`, `data-session-complete` | Jawny edytor; przyszłe wykonanie zablokowane |
| `data-today-week` | Zamień listę dziś na tydzień bez drugiej listy dnia |
| `data-plan-mode`, `data-plan-season` | Tryb kalendarza / wybrany root okres |
| `data-week-date`, `data-plan-day`, `data-plan-week` | Wybierz datę; przejdź do tygodnia w Planie |
| `data-week-shift`, `data-month-shift` | ±7 dni / miesiąc; obecny kontroler miesiąca ustawia dzień 1 |
| `data-plan`, `data-event-new/edit`, `data-period-new/period` | Istniejące oddzielne edytory sesji, wydarzenia, okresu |
| `plan-search`, `plan-trainingtype`, `plan-date` | Stan filtrów i daty; ponowne otwarcie filtrów i fokus |
| `data-progress-range`, `data-wellness-range` | `week`, `month`, `six-months` |
| `wellness-trend-slot`, `wellness-trend-metric` | Dokładna pora i miara; zmiana pory resetuje miarę |
| `data-wellness-entry`, `data-edit-wellness` | Klucz `YYYY-MM-DD|slot`; szczegół / jawna edycja |
| `data-checkin`, `data-new-goal`, `data-edit-goal` | Nowy check-in / pusty własny cel / edycja celu |
| `data-energy-reference/settings`, `data-reference-preview` | Wybór odniesienia → podgląd → potwierdzenie |
| `data-muscle-target`, `data-muscle-id` | Własny cel mięśnia dla okresu/tygodnia |
| `data-muscle-mapping`, `data-session-id`, `data-exercise-id`, `data-mapping-channel` | Jawne role w właściwym szkicu planu albo wykonania |
| `data-help` | Globalny dialog `week-legend`, `energy-calendar`, RPE/RIR/load itd. |

Zmiana tygodnia/miesiąca nie zapisuje sesji. Wydarzenie wielodniowe zajmuje wszystkie daty inclusive; nie jest treningiem ani mnożnikiem obciążenia. Nowy cel nie ma wypełnionego targetu; sen jest własną wartością, również ułamkową, bez domyślnej normy.
`savePatch` zapisuje dopiero po walidacji; błąd/brak miejsca utrzymuje treść i notatkę, a rzeczywisty błąd persistence przywraca wcześniejszy stan. Sukces zamyka formularz i wraca do ekranu źródłowego. Jawne zero jest odpowiedzią, pusty string/null jest brakiem.

## Dane i adaptery do produkcji

Źródłem produkcyjnych nazw, tożsamości, rewizji i epoch jest [kontrakt danych](../../docs/mobile-iteration-3-contract.md), nie obiekty prototypu. Rozstrzygnięcie zespołu D1–D8 przekazane po audycie 2026-10-04 zastępuje wcześniejsze niejednoznaczne reguły D2/D3. Ponowny odczyt kontraktu o SHA-256 `67F8E0708E267E6E5BF570ED325EABFFD5F31D643E94DCFE141E05CC4C5F0821` oraz `mobile/src/data/readiness.ts` potwierdził uwzględnienie D2/D3, mentalnego 0 i braku maskowania niekompletnej sesji przez potwierdzenie odpoczynku. To weryfikacja źródeł, bez edycji produkcji, bez testu APK i bez deklaracji jego odbioru. Produkcyjny dokument, format zapisu i implementację prowadzi Android.

| Prototyp / kontroler | Mapowanie produkcyjne |
| --- | --- |
| `workouts`, `date/time/trainingType/status` | `Workout`; profileId i sportId filtrować w repo/analytics |
| `duration`, `loadSnapshot` | Odróżnić plannedMinutes/actualMinutes oraz osobne plannedLoadCalculation/actual loadCalculation |
| `plannedExertion:{aerobic,muscular}` | `plannedFatigue:{aerobicFatigue,muscularFatigue}`; jawne null, wersjonowana migawka |
| `workout.planned` | Zachować pierwotne wartości pozycji planned i actual; nie sumować kanałów |
| `events:{title,kind,start,end,...}` | `LocalEvent`, `local_events`, CRUD z revision/epoch; brak availability → null |
| `periods:{id,name,start,end,parentId}` | Istniejące okresy; niezależne nakładanie i relacja nadrzędna |
| `wellnessEntries`, `answer-*`, `date|slot` | `Wellness.answers`, stabilne ID, dokładna pora; np. rano `answers.sleepHours` |
| `goals.type`, własny target, period | Kanoniczne GoalMetric; `goalProgress` uwzględnia profil, sport i elapsed days |
| `reserveReference`, `calendarEnergy()` | `readinessReferences` i adapter `readinessForecast`; świadomy wybór snapshotu |
| `muscleRoles:{direct:[],indirect:[]}` | `MuscleRoleAssignment[]`, snapshot Item; stare shares nie generują ról |
| `state.muscleTargets` | Wersjonowane MuscleTarget; tygodniowy override i provenance, bez historycznej mutacji |

Cele: count = sesje, activeDays/checkinDays = unikalne daty, minutes = zmierzone minuty, sleepAverageHours = tylko zapisany sen rano. Brak snu ma null; zapisane 0 pozostaje pomiarem. Kompletność liczy dni od start do `min(end,today)`, nie przyszłe dni. Pasek snu ogranicza procent do 100, pozostałe wyniki mogą go przekroczyć.
### Różnice prognozy — reguły do integracji Androida

Poniższa tabela opisuje **nowsze reguły zespołu po audycie**, które zastępują wcześniejsze dopuszczenie planowanego szacunku w D2/D3. Reguły zostały wdrożone w odwracalnym prototypie; potwierdzenie zgodności finalnego Androida wymaga osobnego testu. Nazwy pól obu modeli pozostają różne.

| Przypadek | Obecny prototyp | Obowiązujący kontrakt Androida / wymaganie dla UI |
| --- | --- | --- |
| Przeszły plan bez wykonania | `unknown`, również mentalny, nawet z oczekiwanymi ocenami | D2: `unknown`, również przy zapisanym planowanym load. Plan bieżący/przyszły może być estimated. Plan nie jest dowodem wykonania. |
| Nieprzyszłe wykonanie bez actual load | Fizyczne: `unknown`; żaden plan nie uzupełnia wyniku. Mentalne: wyłączone z fizycznego load, bez tworzenia snapshotu | D3: fizyczne `unknown`, bez automatycznego zastępowania wcześniejszym planem. Planned load można pokazać osobno informacyjnie. Mentalny pozostaje wagą 0; odczyt nie zapisuje historycznej ankiety/snapshotu. Actual ma pierwszeństwo i jest liczony raz. |
| Pusty dzień historyczny lub dzisiejszy | Usunięto skrót `historyStart`; wymagane jawne `confirmedRestDays` | D4: `unknown` bez świadomego potwierdzenia. Zbiorcze potwierdzenie zakresu obejmuje wyłącznie PUSTE dni. Nie zeruje przeszłego planu ani wykonania bez load. Zera z potwierdzonego rzeczywistego tygodnia mogą poświadczać odpoczynek; przykład S nie potwierdza historii. |
| Pusty dzień przyszły w oknie prognozy | 0 jako planowany brak load | `estimated`, bez zapewnienia przyszłego odpoczynku. |
| Niepełna historia | `value/lower/upper:null`, znana część w `knownValue/knownLower/knownUpper`, dzienne pokrycie | Produkcyjne `balance/residual:null`, znane części w `knownBalance/knownResidual`, pokrycie w `coverage` i `days`. Pasek znanej części jest kreskowany i opisany jako niepełny. Nie przepisywać części do pełnego wyniku. Bez odniesienia również `knownBalance:null`. |
| Wersje tego samego ID | Najnowsze pominięcie/usunięcie wyłącza wkład; wykonanie nieprzyszłe zastępuje plan | Zachować tę samą regułę. Przyszłe zaimportowane wykonanie jest unknown nawet ze starym planem. Sam pominięty wpis nie dowodzi kompletności pustego dnia. |

Wcześniejszy prototyp dawał `value:1` dla całkowicie pustego okresu objętego `historyStart`. To zachowanie zostało usunięte, a jego regresję obejmuje `check-energy.mjs`. Data pierwszego wpisu i początek demonstracji nie potwierdzają kompletności.

### Odniesienie — zapis i adapter

- Prototyp przechowuje pojedyncze `{algorithm:'plan-reserve-v1',value,source:{start,end,kind},sessions,capturedOn,...}`. Produkcja przechowuje kolekcję `ReadinessReference` z `profileId`, `name`, `source:'confirmed-week'|'example-week'`, `weekStart`, dokładnie siedmioma `dailyLoads`, `confirmedComplete:true`, `confirmedRestDays` oraz standardowymi ID/revision/epoch/metadata.
- W formularzu produkcyjnym `completed` odpowiada intencji `confirmed-week`, a `planned` intencji `example-week`; nie kopiować obiektu. Należy pokazać wszystkie siedem dziennych wartości i uzyskać wymagane kontraktem jawne potwierdzenie. Brakującego dnia nie wolno automatycznie potwierdzić jako odpoczynku na podstawie zera po agregacji. Zera w **potwierdzonym** tygodniu oznaczają potwierdzone dni bez sesji; przykład tygodnia nie potwierdza historycznego odpoczynku.
- `referenceLoad` jest sumą siedmiu jawnych wartości, `version:'readiness-v1'`, parametry pochodzą z kontraktu. Lista `sessions` prototypu jest materiałem podglądu, nie wymaganą kolekcją produkcyjnego backupu. Dodatkowe potwierdzone dni odpoczynku zapisywać poprzez produkcyjne API, z revision/epoch; nie dopisywać ich przez `historyStart`.
- Przesunięcie treningu nie zmienia snapshotu S. Jawne zastąpienie odniesienia zachowuje stare migawki; wybór najnowszego jawnego zapisu używa `updatedAt` i stabilnego rozstrzygnięcia remisu. Nazwy bazy i wersję `readiness-v1` zachować zgodnie z kontraktem; nazwa widoczna dla użytkownika pozostaje „Rezerwa w planie”.
- Przy integracji zachować `days[].load:null` i `knownLoad`, źródła wkładów oraz niekompletność każdego dnia. Nie spłaszczać wyniku produkcyjnego do samej liczby paska prototypu. Brak odniesienia, niepełna historia i wynik estimated to różne stany.
- Nowa akcja prototypu: **Plan → Rezerwa w planie → Ustawienia/Ustaw odniesienie → Kompletność historii**. Daty i podgląd liczby pustych dni poprzedzają wymagane „W tym okresie mam zapisane wszystkie treningi”. Zmiana zakresu usuwa zaznaczenie. Nieudany zapis pozostawia wybór; skuteczny zapis potwierdza wyłącznie puste daty, także gdy zakres zawiera niekompletne sesje. Prototyp przechowuje `confirmedRestDays` i rejestr `historyConfirmations`; produkcyjny format oraz revision/epoch dobiera Android. Nie kopiować tych lokalnych kolekcji do produkcyjnej bazy.

### Doprecyzowania mapy i celów

- `strength` dotyczy **typu rozpoznanego ćwiczenia oporowego**, nie samego `Workout.trainingType`. Ćwiczenie oporowe w sesji drużynowej może się kwalifikować; bieg w sesji nazwanej siłową nie staje się serią. `power/speed` nie kwalifikują się automatycznie. Korzystać z produkcyjnej klasyfikacji, nie kopiować polskich `kind` i `modality` prototypu jako domeny produkcji.
- Cel okresowy jest wartością tygodniową. Przy przecięciu okresu z częścią tygodnia stosuje się cały target, bez proraty; pokazać daty obowiązywania i provenance. Pierwszeństwo i wersjonowanie pozostają w `muscleTargetForWeek` i repozytorium. Prototyp nie zastępuje `definitionRevision/supersedesId`.
- Prototyp może użyć rund grupy jako brakujących sets. Produkcja liczy zapisane planned/actual sets bez dodatkowego mnożenia rund i zachowuje braki. Nie kopiować tego fallbacku jako równoważnego modelu.
- `met` zależy od dokładnego pomiaru. Uzupełnienie bieżącego kontraktu ogranicza procent snu do 99, jeśli actual < target, i do 100 po osiągnięciu. Prezentacja zachowuje różnicę pomiędzy średnią i targetem; test granicy opisano poniżej. Nie zmieniać surowych odpowiedzi ani targetu dla zaokrąglonej etykiety.

## Rezerwa: konwencja produktu i źródła

**Pochodzenie parametrów (D1): Roboczy kontrakt prototypu wybrany przez zespół 2026-10-04 w ramach zleconego researchu i wdrożenia; parametry nie zostały osobno zatwierdzone przez użytkownika ani zwalidowane fizjologicznie.** Dotyczy to 21 dni, półczasów 1/2/3, `B=S/(S+R)` i wagi 0,5 dla serii pośrednich. Takie samo pochodzenie mają rozstrzygnięcia D2–D7. Upoważnienie do przygotowania odwracalnego prototypu nie oznacza osobistego zatwierdzenia tych liczb.

Oddzielnie użytkownik zatwierdził własny **load v1**: `m(x)=0,5+x/10` i wagi mental 0, technical 0,6, endurance 0,8, running 1,05, strength 1,3, team 1. Ten algorytm i zapisane wyniki pozostają bez zmian. Korekta prognozy nie przelicza snapshotów actual load.

Podpis **Rezerwa w planie**, tooltip **Początek dnia · symulacja**. S > 0 to suma load jawnie wybranego i potwierdzonego siedmiodniowego tygodnia. Snapshot S oraz jego źródło nie zmieniają się automatycznie po przesunięciu sesji.
Dla poprzednich 21 dni: `R(d,h)=Σ L(i)×2^(-(d-i)/h)`, `B=S/(S+R)`; środkowy h=2, scenariusze h=1/3 dni. Dzień d nie zawiera własnych sesji. Każdy rekord po ID raz; wykonanie zastępuje plan. Wydarzenia, sen i samopoczucie nie mają arbitralnej kary/mnożnika.
Bez odniesienia neutralny pasek i konfiguracja; niepełne dane są kreskowane. Brak nie udaje zera. Nie pokazujemy procentu energii/gotowości; lower/upper nie są przedziałem ufności. Szczegóły i reguły: [ENERGY-ITERATION-3.md](ENERGY-ITERATION-3.md).
Badania opisują zróżnicowane, opóźnione związki obciążenia i samopoczucia, a nie walidację tego wzoru: [rugby](https://pubmed.ncbi.nlm.nih.gov/39758184/), [przegląd](https://pubmed.ncbi.nlm.nih.gov/30067591/), [konsensus](https://pubmed.ncbi.nlm.nih.gov/29345524/), [planowana/odczuwana intensywność](https://pubmed.ncbi.nlm.nih.gov/24235774/). Wybór S, 21 dni oraz h=1/2/3 jest heurystyką produktu; brak klinicznej walidacji. Rozdzielenie źródeł: [zasady metod](../../docs/mobile-iteration-3-methods.md).

## Anatomia: oryginalny model, objętość i fallback

Offline WebGL pokazuje oryginalną proceduralną figurę 3D z konturami mięśni, światłem, front/back, obrotem i raycast picking. `anatomy/geometry.js` powstał w tym projekcie; nie pochodzi ze skanu, zewnętrznego mesh ani klinicznego zbioru danych. Three.js 0.186.1 jest lokalnie vendored, MIT, z pełnym `anatomy/vendor/LICENSE-three.txt`; [upstream](https://github.com/mrdoob/three.js).
Bez WebGL lub po utracie kontekstu pozostaje SVG z tych samych konturów i pełna lista HTML. `mountAnatomy` zwraca disposal; wywołać przed wymianą widoku. Renderer rysuje na interakcję/resize, bez ciągłej pętli GPU.
Podpis **Objętość treningu siłowego**: serie bezpośrednie + 0.5 × pośrednie, bez rozgrzewki i bez sumowania Plan/Wykonanie. RIR/kg są kontekstem. Nie przeliczać biegu, boiska ani minut na serie. Brak ról/serii jest niekompletnością, nie zerem.
Własny cel null jest neutralny, 0 oznacza Poza celem. Czerwony → pomarańczowy → żółty → zielony oznacza pokrycie własnego celu; ponad cel zachowuje opis i nieograniczony procent. Bez uniwersalnego celu 10 serii, diagnozy asymetrii lub ryzyka urazu.
[Pelland](https://link.springer.com/article/10.1007/s40279-025-02344-w) informuje estymację direct/indirect; [ACSM 2026](https://pubmed.ncbi.nlm.nih.gov/41843416/) i [IUSCA](https://journal.iusca.org/index.php/Journal/article/download/81/140) są kontekstem, nie walidacją geometrii ani osobistego targetu. Pełne API, licencje i ograniczenia: [ANATOMY-ITERATION-3.md](ANATOMY-ITERATION-3.md).

## Miejsca migracji i odpowiedzialność

| Zakres | Istniejące ścieżki produkcyjne do aktualizacji |
| --- | --- |
| Dzisiaj / ramka / marka | `mobile/src/ui/TodayView.tsx`, `SessionList.tsx`, `LeafCard.tsx`, `layout.css`, `trainleaf.css`, `features/today/today.css` |
| Tydzień i planowanie | `ui/WeekOverview.tsx`, `WeekOverview.css`, `PlanningView.tsx`; `features/planning/MonthCalendar.tsx`, `SeasonOverview.tsx`, `DayDetails.tsx`, `LegendDialog.tsx`, `EventEditor.tsx`, `EventView.tsx`, `planning.css` |
| Szczegóły / jawna edycja | `features/entry-details/WorkoutEntryDetail.tsx`, `WellnessEntryDetail.tsx`; `ui/WorkoutEditor.tsx`, `WellnessView.tsx` |
| Postępy / cele / samopoczucie | `ui/ProgressView.tsx`, `features/progress/summary.ts`, `features/wellbeing/WellbeingTrends.tsx`, `trends.ts` |
| Rezerwa / odniesienie | `features/readiness/ForecastPanel.tsx`, `ReferenceForm.tsx`, `MoveWorkoutDialog.tsx`, `readiness.css`; `data/analytics.ts` |
| Role i anat. cele | `features/workout-planning/MuscleRolesEditor.tsx`, `PlannedFatigueFields.tsx`; nowy odrębny komponent figury z disposal; `data/analytics.ts` |
| Routing / trwałość | `App.tsx`, `features/navigation/useAppNavigation.ts`, `MoreView.tsx`; `data/domain.ts`, `repository.ts`, `database.ts` |

Ścieżki w tabeli, poza jawnie pokazanym prefiksem, są względem `mobile/src`. To punkty integracji, nie instrukcja kopiowania magazynu prototypu. Właściciel Android prowadzi trwałość, wersjonowanie, insets, aktualizację i APK. Odrębny chat Postępy może wdrożyć swój zakres z tego dokumentu i [INSIGHTS](INSIGHTS-ITERATION-3.md), zachowując kontrakt danych; nie wymaga wysyłania wiadomości między chatami przez tę implementację.

## Weryfikacja i dowody

[Audyt Claude etap 1](../../../audit-reports/2026-10-04-trainleaf-0.3.0-contract.md) opisuje stan **15:48–15:56 dnia 2026-10-04 podczas integracji**. Nie jest oceną gotowego APK. Opisane tam błędy kompilacji, brak podpięcia modułów i brak tego handoffu wymagają odniesienia do późniejszego stabilnego zestawu źródeł; nie przenosić ich automatycznie jako aktualnych usterek. To przekazanie również nie rozstrzyga autoryzacji heurystyk: prowadzi ją właściciel planowania/koordynator.

### UX do ponownego sprawdzenia na finalnym APK

Status wszystkich czterech punktów: **oczekuje na re-test gotowego APK**, bez deklaracji naprawy APK. Prototyp ma już poprawiony procent snu; pozostałe trzy przejścia nadal nie są wzorcem do bezkrytycznego kopiowania.

| Punkt | Scenariusz i warunek akceptacji | Stan prototypu odczytany 2026-10-04 |
| --- | --- | --- |
| Powrót z Samopoczucia | Inne → Samopoczucie → szczegół → Wróć do samopoczucia zachowuje trend, porę i zakres. Dopiero wyjście z całego modułu wraca do Inne; wejście z Postępów wraca do Postępów. Sprawdzić pasek, systemowy Wstecz, edycję, zapis i anulowanie. | `renderWellnessTrends` ma stały powrót do Postępów; `nav` i obsługa Inne w `app.js` nie zachowują pełnego kontekstu wejścia. To nie jest wzorzec produkcyjnego powrotu. |
| Drugi check-in z Dzisiaj | Po porannym zapisie jawna akcja nowego wpisu pozwala wybrać inną porę tego dnia. Poranne odpowiedzi pozostają; klik istniejącego wpisu nadal otwiera szczegół przed edycją. | `journal` i `iterationClick` w `app.js` po zapisie otwierają istniejący wpis; nowa pora wymaga przejścia przez Samopoczucie. |
| Sezon i wybrany rok | Przejść tydzień/miesiąc przez granicę roku; wybrać sezon → tydzień → sesję → wrócić. Okruszek, jego docelowy rok/sezon oraz aktualny wybór mają być zgodne. | `selectedSeasonId` w `planning-ui.js` i kontrolerze `app.js` pozostaje niezależny od daty. Renderer może pokazać Sezon 2025 nad październikiem 2026. |
| Cel snu blisko 100% | Cel 8 h, sześć poranków po 8 h i jeden 7,75 h: średnia 7,9642857 h, `met:false`. Zgodnie z uzupełnionym kontraktem procent ma limit 99 poniżej targetu; etykiety zachowują różnicę. Osobno brak → null, jawne 0, dokładny target i przekroczenie bez bonusu ponad 100%. | Poprawiono `goalFacts` i renderer: 7,96 / 8 h, 99%, informacja o niespełnionym celu również dostępna dla czytnika. Przeszedł test regresji prototypu; wynik APK nadal wymaga re-testu. |

Wynik re-testu powinien wskazywać wersję i SHA-256 APK, stabilny punkt źródeł oraz środowisko/urządzenie. W tej aktualizacji zmieniono wyłącznie prototyp i jego przekazanie; produkcję tylko odczytano. Nie uruchamiano finalnego APK ani migracji SQLite. Przy odbiorze prognozy dodatkowo sprawdzić osobno: przeszły plan z migawką/bez niej (oba unknown), fizyczne wykonanie bez actual z planem/bez planu (oba unknown), mentalne 0 bez zapisu historycznej migawki, 21 pustych niepotwierdzonych dni, zbiorcze potwierdzenie samych pustych dat bez ukrycia niekompletnych sesji, potwierdzone zera tygodnia kontra przykład, częściowe `knownBalance`, zastąpienie planu wykonaniem i niezmienne S po przesunięciu sesji.

**D8 — wersja na telefonie:** użytkownik nie podał wprost zainstalowanych `versionName/versionCode`. Potwierdzenie działania i zrzuty nowych funkcji nie dowodzą wersji 0.2.0. Odbiór Androida powinien sprawdzić aktualizację z 0.1.0 i 0.2.0, bez przedstawiania syntetycznego starszego schematu jako dokładnej bazy wydania. Natywne restart/update/share pozostają niepotwierdzone przez tę pracę.

### Dotychczasowe testy samego prototypu

- Po korekcie D1–D8: [qa/iteration3-reserve-alignment.json](qa/iteration3-reserve-alignment.json) — testy modelu i celu snu oraz bezpośrednie browser QA zbiorczego potwierdzenia. [Formularz 360 px](qa/iteration3-history-completeness-360.jpg), [tekst 200% przy 360 px](qa/iteration3-history-completeness-200.jpg). Potwierdzenie pięciu pustych dni nie usunęło jednej brakującej sesji; błąd zachował zakres/checkbox, zmiana dat wyczyściła checkbox, przykład odniesienia nie poświadcza historii. Brak poziomego overflow formularza i błędów konsoli w sprawdzonym podglądzie.

- W tej gałęzi pracy bezpośrednio sprawdzono renderery kalendarza, UTC/DST, escaping i długie tytuły, wszystkie tryby przy 360 px/200%, otwarte listy/filtry oraz brak duplikacji sekcji dnia; bez poziomego overflow strony.
- Zespół raportuje zaliczone czyste testy load, insights i energy oraz komponentu anatomii; konkretne zakresy są w ich dokumentach i skryptach `check-load.mjs`, `check-iteration-insights.mjs`, `check-energy.mjs`, `anatomy/check-anatomy.mjs`.
- Właściciel integracji raportuje browser QA: Dzisiaj/tydzień bez duplikacji, pomoc/Escape, szczegół bez formularza; check-in 0, błąd zachowujący notatkę i sukces zamykający edytor; podgląd i potwierdzenie odniesienia; tworzenie wydarzenia w miesiącu/sezonie; pusty target i własny sen 7.5; trendy według pory.
- Anatomy handoff dokumentuje WebGL/raycast/front/back, dialog/fokus, disposal i symulowany fallback bez WebGL. Nie rozszerzać tego na kliniczną poprawność modelu.
- Zapis scenariuszy i wyników integracji: [qa/iteration3-integration.json](qa/iteration3-integration.json). Przechwytywanie CUA używało izolowanego `qa=1`; zmiany testowe są wyłącznie w magazynie `-qa`.
- Zrzuty `-360` i `-200` pochodzą z rzeczywistego podglądu QA przy viewport 360 px; `-200` oznacza powiększenie tekstu do 200%. Zrzuty `-desktop` mają viewport 1280 px i są osobnym podglądem kompozycji.

| Ekran | 360 px | 360 px, tekst 200% | Desktop 1280 px |
| --- | --- | --- | --- |
| Dzisiaj | [today-360](qa/iteration3-today-360.jpg) | [today-200](qa/iteration3-today-200.jpg) | [today-desktop](qa/iteration3-today-desktop.jpg) |
| Plan tygodnia | [plan-360](qa/iteration3-plan-360.jpg) | [plan-200](qa/iteration3-plan-200.jpg) | [plan-desktop](qa/iteration3-plan-desktop.jpg) |
| Miesiąc | [month-360](qa/iteration3-month-360.jpg) | — | [month-desktop](qa/iteration3-month-desktop.jpg) |
| Sezon | [season-360](qa/iteration3-season-360.jpg) | — | [season-desktop](qa/iteration3-season-desktop.jpg) |
| Postępy | [progress-360](qa/iteration3-progress-360.jpg) | [progress-200](qa/iteration3-progress-200.jpg) | [progress-desktop](qa/iteration3-progress-desktop.jpg) |
| Samopoczucie | [wellness-360](qa/iteration3-wellness-360.jpg) | — | [wellness-desktop](qa/iteration3-wellness-desktop.jpg) |
| Inne | [more-360](qa/iteration3-more-360.jpg) | [more-200](qa/iteration3-more-200.jpg) | [more-desktop](qa/iteration3-more-desktop.jpg) |

- Pozostaje weryfikacja migracji SQLite, revision/epoch, importu/exportu i aktualizacji na rzeczywistym Androidzie. Testy programu i podglądu nie oznaczają walidacji fizjologicznej ani gotowości do publikacji.
