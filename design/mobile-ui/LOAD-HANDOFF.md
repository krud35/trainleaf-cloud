# Trainleaf — własny wskaźnik obciążenia v1

Wdrożone: czysty model `load-model.js` oraz testy `check-load.mjs`. To własny wskaźnik z wagami wybranymi przez użytkownika. Nie dostarcza progów zdrowotnych, gotowości ani zaleceń treningowych. Dotychczasowy czas × RPE pozostaje osobną metryką.

## Ustalone obliczenie

`load = waga rodzaju × wykonane minuty × (0,5 + zmęczenie oddechowe / 10) × (0,5 + zmęczenie mięśniowe / 10)`

| Rodzaj | Identyfikator | Waga |
|---|---|---:|
| Mentalny | `mental` | 0 |
| Techniczny | `technique` | 0,6 |
| Wydolnościowy | `endurance` | 0,8 |
| Biegowy | `running` | 1,05 |
| Siłowy | `strength` | 1,3 |
| Drużynowy | `team` | 1 |

`technical` jest akceptowanym aliasem `technique`; nie tworzy dodatkowej kategorii. Typ musi być zapisany jawnie w `trainingType`; brakującego lub nieznanego typu nie wyznaczamy z dyscypliny. Satysfakcja, samopoczucie dnia i RPE nie wchodzą do wzoru. Oba zmęczenia po sesji są osobnymi skalami od 0 do 10. Wynik zachowuje pełną precyzję liczby JavaScript; dopiero prezentacja pokazuje jedno miejsce po przecinku.

## API i zapis

```js
import {computeTrainleafLoad, snapshotTrainleafLoad, loadDisplay, loadSummary} from './load-model.js';
const preview = computeTrainleafLoad(workout);
workout.loadSnapshot = snapshotTrainleafLoad(workout); // tylko przy jawnym zapisie
const label = loadDisplay(workout.loadSnapshot);
const summary = loadSummary(workoutsInRequestedPeriod, todayISO);
```

Wejście: `workout.status`, `workout.trainingType`, `workout.duration` (wykonane minuty; liczba albo tekst liczbowy), `workout.postSession.aerobic` oraz `.muscular`. Nie sięgamy do `workout.planned.duration`.

Obliczenie zwraca `{status, value, reason, algorithm, parameters, inputs}`. `algorithm` to `trainleaf-load-v1`. `parameters` zapisuje wszystkie wagi oraz `{offset:0.5, divisor:10}`. `inputs` zawiera surowe `trainingType`, `duration`, `aerobic`, `muscular`; brak właściwości zapisuje jako `null`, a tekst z formularza pozostaje tekstem. Nie dodajemy zmiennej daty obliczenia. Wynik jest deterministyczny i nie zmienia treningu.

`status:'calculated'` oznacza poprawny wynik liczbowy (także zero), `reason:null`. `status:'unavailable'` oznacza `value:null` i kod przyczyny. Niekompletnego wpisu nie uzupełniamy zerami. Biały znak, pusty tekst, `null` lub brak pola to brak odpowiedzi.

Mentalny ukończony trening ma wynik **0**, nawet bez czasu i obu ocen fizycznych; zachowuje ich braki w snapshot. Mentalny plan/szkic nie ma jeszcze wyniku. Pozostałe rodzaje wymagają ukończenia, dodatniego skończonego czasu oraz dwóch skończonych ocen w zakresie 0–10. Ocena `0` jest poprawna i ma modyfikator `0,5`.

## Przyczyny niedostępności

| `reason` | Sugerowany krótki tekst |
|---|---|
| `not_completed` | Wynik pojawi się po ukończeniu treningu. |
| `missing_training_type` | Brak rodzaju treningu. |
| `unknown_training_type` | Ten rodzaj nie ma ustalonej wagi. |
| `missing_duration` | Brak wykonanego czasu. |
| `invalid_duration` | Wykonany czas musi być większy od zera. |
| `missing_aerobic` | Brak oceny zmęczenia oddechowego. |
| `invalid_aerobic` | Ocena zmęczenia oddechowego jest poza skalą. |
| `missing_muscular` | Brak oceny zmęczenia mięśniowego. |
| `invalid_muscular` | Ocena zmęczenia mięśniowego jest poza skalą. |
| `invalid_result` | Nie udało się obliczyć wyniku dla zapisanych wartości. |

Przy kilku brakach zwracana jest pierwsza przyczyna w kolejności z tabeli. Kod nie jest tekstem do bezpośredniego pokazania użytkownikowi.

## Podsumowanie historii

`loadSummary(workouts, today)` obejmuje tylko ukończone sesje z poprawną datą nie późniejszą niż `today`. Zakres tygodnia/miesiąca wybiera aplikacja przed wywołaniem. `today` musi być poprawną datą ISO, inaczej funkcja zgłasza błąd.

Podsumowanie używa **wyłącznie już zapisanych `loadSnapshot`**. Nie liczy na nowo historycznych wartości ani nie tworzy brakujących snapshotów podczas otwierania ekranu. Sesja bez snapshot pozostaje bez wyniku, nawet jeśli jej obecne pola pozwalałyby go obliczyć. Późniejsza edycja surowych danych nie zmieni prezentowanej historii przed jawnym zapisem nowego snapshot.

Pola wyniku:

- `total`: suma zapisanych wyników; `null`, gdy żaden wynik nie jest obliczony. Prawidłowy wynik zerowy daje `0`.
- `completedCount`, `calculatedCount`, `missingCount`: kompletność danych w wybranym zbiorze.
- `mentalCount`, `mentalZeroCount`: sesje mentalne oraz zapisane mentalne zera, odróżnione od braków.
- `missingByReason`: liczności przyczyn; dodatkowo `missing_snapshot` i `invalid_snapshot` dla brakujących/uszkodzonych zapisów.
- `algorithmCounts`, `mixedAlgorithms`: wersje obliczenia występujące w historycznych wynikach. Starsze prawidłowe wyniki są sumowane bez przeliczenia, a mieszane wersje pozostają wykrywalne.

`loadDisplay(snapshot)` daje np. `78,0`, `0,0` albo `—`. Dla sumy aplikacja może użyć analogicznego formatowania; nie mylić `total:null` z zerem ani częściowej sumy z kompletną.

## Weryfikacja

Uruchomienie: `node design/mobile-ui/check-load.mjs`. Testy obejmują wszystkie wagi, alias rodzaju, oba modyfikatory, rzeczywiste zero, brak czasu/ocen, nieprawidłowe dane, brak domyślania dyscypliny, mentalne zero, status planu, niezależność satysfakcji/RPE, precyzję i izolację snapshot, format polski, datę graniczną, brak cichego przeliczania, rozdzielenie braków od zera oraz mieszane wersje.
