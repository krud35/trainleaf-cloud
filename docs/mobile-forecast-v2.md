# Trainleaf 0.4.1 — adaptacyjna „Rezerwa w planie” (`plan-reserve-v2`)

Dokument opisuje model pasków rezerwy w kalendarzu planu. Zastępuje część „Rezerwa w planie v1” z `docs/mobile-iteration-3-methods.md` (prognoza „na początek dnia” z ręcznym punktem odniesienia). Kod: `mobile/src/data/reserve.ts`. Testy: `tests/mobile-reserve.test.mjs`.

**Status.** Parametry dobrał zespół wdrożeniowy 2026-10-05 jako robocze założenia produktu. Model **nie został zwalidowany naukowo** ani na danych użytkowników. Pasek jest orientacyjną pomocą do porównania rozkładu sesji. Zielony pasek oznacza szacowaną rezerwę w planie i nie jest obietnicą bezpieczeństwa treningu, gotowości, zdrowia ani niskiego ryzyka urazu.

## 1. Co się zmieniło względem v1

| Obszar | v1 (`readiness-v1`) | v2 (`plan-reserve-v2`) |
| --- | --- | --- |
| Punkt odniesienia | ręcznie wybrany tydzień lub wpisane punkty load | brak; start z quizu, dalej automatycznie |
| Semantyka paska | początek dnia (bez sesji tego dnia) | dzień **łącznie z jego sesjami** |
| Puste dni historii | wymagały potwierdzenia, inaczej „Niepełne dane” | nie blokują; brak wpisu to brak informacji |
| Niepełna historia | status blokujący wartość paska | szacunek z niższą pewnością (kreskowanie) |
| Plan bez oczekiwanych ocen | nieznany | szacowany z rodzaju, czasu i podobnych sesji |
| Tolerancja | stała `S` | wolno zmienna, dopasowywana z danych |

Zapisane rekordy `readinessReferences` (wersja `readiness-v1`, w tym `confirmedRestDays`) pozostają w bazie, w eksporcie i w imporcie. Nowy model ich nie czyta. Trainleaf load v1 i zapisane wyniki nie są przeliczane: model tylko je odczytuje.

## 2. Wzory

Oznaczenia: `d` to lokalna data kalendarzowa, `asOf` to dzisiejsza data, `w(typ)` to waga rodzaju treningu z load v1 (siłowy 1,3; biegowy 1,05; drużynowy 1; wydolnościowy 0,8; techniczny 0,6; mentalny 0; bez rodzaju 1), `m(r) = 0,5 + r/10` to mnożnik oceny zmęczenia 0–10 z load v1.

### 2.1 Obciążenie pojedynczej sesji `L`

Każda sesja (najnowsza wersja identyfikatora; bez usuniętych i pominiętych) wnosi dokładnie jedną wartość:

1. **Wykonana, data ≤ dziś, zapisany load v1** → zapisany wynik (`actual`). Plan tej sesji nie jest doliczany.
2. **Wykonana mentalna** → 0 (`actual`).
3. **Wykonana bez wyniku** (brak ankiety lub czasu) → szacunek (`estimated`): `minuty × w × a × b`, gdzie `minuty` to czas wykonany, w razie braku planowany, w razie braku typowy; `a`, `b` to mnożniki podanych ocen, a dla brakującej oceny `√I(typ)`.
4. **Plan na dziś lub przyszłość** (`planned`): jeśli zapisano szacunek planu (`plannedLoadCalculation`, czyli użytkownik sam podał obie oczekiwane oceny), używamy go. W przeciwnym razie `minuty planowane (lub typowe) × w × a × b` jak w punkcie 3, z ocen oczekiwanych, jeśli podano choć jedną. Wykonanie zapisane z przyszłą datą traktujemy jak plan.
5. **Plan z przeszłości bez wykonania i bez oznaczenia „pominięty”** (`unconfirmed`) → połowa szacunku z punktu 4.

`I(typ)` to typowa intensywność rodzaju sesji (iloczyn obu mnożników): mediana z `n` wykonanych sesji tego rodzaju z ostatnich 90 dni, ściągnięta do wartości z quizu: `I = (n × mediana + 3 × I_quiz) / (n + 3)`. Typowy czas to mediana czasu sesji tego rodzaju (od 3 sesji), inaczej czas z quizu, inaczej 60 min. Nie pytamy o przyszłe zmęczenie: pola oczekiwanych ocen w edytorze pozostają opcjonalne.

### 2.2 Chwilowe zmęczenie `F`

`F(d) = Σ L(i) × 2^(−(d − i)/2)` po dniach `i` od `d − 28` do `d` **włącznie z `d`**.

Połowa wpływu sesji zostaje po 2 dniach, jedna czwarta po 4; po 28 dniach sesja nie jest liczona. Suma jest ciągła w czasie, więc wpływ przechodzi między tygodniami, miesiącami i latami. Dwie sesje sumują się.

### 2.3 Wolna tolerancja `W`

`W = clamp(B × g × p, 60, 6000)` (jednostki load v1 na tydzień), gdzie:

- **`B` — poziom bazowy.** `B = (2 × W_quiz + k × W_obs) / (2 + k)`. `W_obs` to średnia tygodniowa *ekspozycja* z tych spośród ostatnich 6 siedmiodniowych okien, w których zapisano wykonaną sesję; `k` to liczba takich okien (0–6). Okno liczy się dopiero, gdy w całości mieści się w historii użytkownika. Okno bez wpisów jest pomijane: brak wpisu nie jest dowodem odpoczynku. Ekspozycja sesji to `minuty × w × I(typ)`, czyli jej *oczekiwane* obciążenie, nie zgłoszone po niej zmęczenie.
- **`g` — współczynnik samopoczucia**, `0,8 ≤ g ≤ 1,2`, opisany w 2.5.
- **`p` — przerwa.** Gdy od ostatniej wykonanej sesji minęło więcej niż 14 dni: `p = max(0,7; 1 − 0,05 × (przerwa − 14)/7)`.

### 2.4 Pasek

`sufit = 1,3 × W`, `rezerwa(d) = clamp(1 − F(d)/sufit, 0, 1)`.

Długość paska to `rezerwa`. Kolor: zielony od 0,5; żółty od 0,25; czerwonobrązowy poniżej. Tekst alternatywny i podpis w szczegółach dnia podają poziom słownie (duża / średnia / mała), więc kolor nie jest jedynym nośnikiem informacji.

**Niższa pewność** (kreskowanie, dopisek w tekście) pojawia się, gdy (a) quiz pominięto lub nie wypełniono i są mniej niż 2 tygodnie zapisanej historii, albo (b) ponad 25% zmęczenia `F(d)` pochodzi z sesji bez wyniku (`estimated`, `unconfirmed`). Nigdy nie blokuje wartości paska.

### 2.5 Uczenie z samopoczucia

Dla każdego dnia z ostatnich 56 dni bierzemy jeden wpis samopoczucia (kolejność: rano, w ciągu dnia, wieczorem):

- `napięcie` ∈ [0, 1]: średnia z `zmęczenie/10` i `bolesność/10` (rano, wieczorem) albo `(5 − energia)/4` (w ciągu dnia). Sen, stres, nastrój nie są używane.
- `obciążenie względne = F_goła(d) / (1,3 × B_goła)`, gdzie „goła” ekspozycja to wyłącznie `minuty × w` wykonanych sesji, a `B_goła` to ten sam wzór co `B`, policzony w tych jednostkach. Wpis poranny i dzienny porównujemy ze stanem z dni poprzednich (bez sesji tego dnia), wieczorny ze stanem łącznie z tym dniem.
- **+1** (toleruje więcej, niż zakładamy): `napięcie ≤ 0,3` i `obciążenie względne ≥ 0,30`.
- **−1** (toleruje mniej): `napięcie ≥ 0,7` i `0,15 ≤ obciążenie względne ≤ 0,50`.
- W pozostałych przypadkach wpis jest zgodny z modelem albo nie da się go przypisać treningowi i niczego nie zmienia (np. duże zmęczenie bez niedawnego treningu, zmęczenie po bardzo ciężkim bloku, świeżość po lekkim dniu).

`g = clamp(1 + 0,02 × Σ kierunek × 2^(−wiek/21), 0,8, 1,2)`.

Jeden wpis zmienia tolerancję najwyżej o 2%. Wpływ wpisu maleje o połowę co 21 dni i znika po 56 dniach. Zmiana łączna jest ograniczona do ±20%.

## 3. Jak uniknięto błędnego koła

Zmęczenie zgłaszane w ankiecie po sesji jest składnikiem Trainleaf load v1. Gdyby ta sama odpowiedź służyła jako dowód, że użytkownik „źle zniósł” obciążenie, jedna liczba byłaby jednocześnie przyczyną i skutkiem.

1. **Sygnałem uczenia są wyłącznie wpisy samopoczucia** (osobna encja `wellness`, wypełniana w kolejnych dniach). Ankieta po sesji nie jest sygnałem uczenia.
2. **Strona „obciążenie” w uczeniu nie zawiera żadnej oceny po sesji.** Liczymy ją z minut i rodzaju sesji (`minuty × w`), także w mianowniku. Test `learning never reads post-session ratings` zmienia wszystkie oceny po sesjach na 0/0 i 10/10 i sprawdza, że lista dowodów i `g` są identyczne.
3. **Poziom bazowy `B` korzysta z oczekiwanego, a nie zgłoszonego obciążenia.** Sesja oceniona wyjątkowo ciężko zmniejsza rezerwę swojego dnia (przez `F`), ale nie podnosi tolerancji. Pozostaje jedna wolna ścieżka: `I(typ)` jest medianą ocen z 90 dni, ściągniętą do quizu. Kalibruje ona jednostkę do stylu oceniania użytkownika i zmienia się powoli; test sprawdza, że pojedyncza skrajna ocena zmienia tolerancję o mniej niż 5%.
4. **Plany nie uczą modelu.** `B`, `g` i `p` czytają tylko wykonane sesje z datą ≤ dziś i wpisy samopoczucia z datą ≤ dziś. Test `future and unconfirmed plans never change the tolerance` porównuje cały obiekt tolerancji.

Model jest deterministyczny i odtwarzalny z danych (treningi, samopoczucie, quiz, data). Nie zapisuje własnego stanu, więc nie wymaga migracji stanu ani jego kopii.

## 4. Quiz i ustawienia początkowe

Quiz w wersji 1 (`quizVersion: 1`) zapisuje surowe odpowiedzi w tabeli `local_training_quiz`. Mapowanie odpowiedzi jest częścią wersji modelu, nie zapisu.

| Pytanie | Opcje (zapisywane identyfikatory) | Wpływ |
| --- | --- | --- |
| Staż regularnego treningu | `under6m`, `6to24m`, `2to5y`, `over5y` | mnożnik 0,85 / 0,95 / 1 / 1,05 |
| Samoocena poziomu | `beginner`, `intermediate`, `advanced`, `competitive` | mnożnik 0,9 / 1 / 1,05 / 1,1 |
| Treningi w tygodniu (ostatnie tygodnie) | 0 (mniej niż jeden) … 8 (8 lub więcej) | `n`; 0 liczymy jako 0,5 |
| Typowy czas treningu | 30, 45, 60, 75, 90, 120 min | `t`; także typowy czas sesji bez podanego czasu |
| Główne rodzaje i odczuwana intensywność | 1–5 rodzajów; `light` / `moderate` / `hard` | oceny zastępcze 3 / 5 / 7 → intensywność 0,64 / 1 / 1,44 dla rodzaju |
| Obecny rytm | `steady`, `building`, `lighter`, `returning` | mnożnik 1 / 0,9 / 1,1 / 0,8 |

`W_quiz = clamp(n × t × średnia(w × intensywność) × clamp(staż × poziom × rytm, 0,7, 1,2), 60, 6000)`.

Pominięcie lub brak quizu: `W_quiz = 150` (około trzech umiarkowanych 50-minutowych sesji w tygodniu), intensywność 1, czas 60 min i oznaczenie niższej pewności do czasu zebrania 2 tygodni historii. Wartość jest celowo ostrożna: mniejsza tolerancja skraca paski.

## 5. Podstawy badawcze a założenia produktu

### Co wynika z literatury (kierunek, nie parametry)

- **Obciążenie jako czas × odczuwana intensywność** (session-RPE): [Foster i wsp. 2001](https://pubmed.ncbi.nlm.nih.gov/11708692/). Trainleaf load v1 jest własnym wariantem tej idei i nie jest tożsamy z sRPE.
- **Dwa procesy o różnej szybkości** (wolna adaptacja i szybciej zanikające zmęczenie po bodźcu treningowym): model impuls–odpowiedź Banistera, np. [Morton, Fitz-Clarke i Banister 1990](https://pubmed.ncbi.nlm.nih.gov/2246166/). Stąd rozdzielenie chwilowego `F` od wolnej tolerancji `W`.
- **Powrót sprawności po ciężkim wysiłku trwa zwykle dni, nie godziny, i zależy od rodzaju bodźca i osoby**: [Thomas i wsp. 2018](https://pubmed.ncbi.nlm.nih.gov/30067591/), [konsensus Kellmann i wsp. 2018](https://pubmed.ncbi.nlm.nih.gov/29345524/).
- **Obciążenie dnia wpływa na samopoczucie z opóźnieniem i w zróżnicowany sposób**: [Crewther i wsp. 2025](https://pubmed.ncbi.nlm.nih.gov/39758184/) (22 rugbystów, trzy tygodnie). Uzasadnia to czytanie wpisów z kolejnych dni, ale nie wyznacza progów.
- **Samoopis (zmęczenie, bolesność) reaguje na zmiany obciążenia**: przegląd systematyczny [Saw, Main i Gastin 2016](https://pubmed.ncbi.nlm.nih.gov/26423706/); zalecenia monitorowania: [Bourdon i wsp. 2017](https://pubmed.ncbi.nlm.nih.gov/28463642/).
- **Obciążenie, do którego ktoś jest przyzwyczajony, ma znaczenie przy ocenie nowego obciążenia** (obciążenie „chroniczne”, średnie ważone wykładniczo): [Gabbett 2016](https://pubmed.ncbi.nlm.nih.gov/26758673/), [Hulin i wsp. 2016](https://pubmed.ncbi.nlm.nih.gov/26511006/), [Murray i wsp. 2017](https://pubmed.ncbi.nlm.nih.gov/28003238/). Jednocześnie wskaźnik ostre:chroniczne ma poważne zastrzeżenia metodologiczne i nie powinien służyć do przewidywania urazów: [Impellizzeri i wsp. 2020](https://pubmed.ncbi.nlm.nih.gov/32502973/). Dlatego pasek **nie** jest wskaźnikiem ryzyka urazu i nie pokazujemy żadnego ilorazu.
- **Przerwa w treningu obniża wytrenowanie w skali tygodni**: [Mujika i Padilla 2000](https://pubmed.ncbi.nlm.nih.gov/10966148/).

Identyfikatory PubMed powyżej sprawdzono 2026-10-05 w usłudze E-utilities (autor, rok, tytuł). Treści publikacji nie weryfikowano ponownie w ramach tego zadania.

### Robocze założenia produktu (nie pochodzą z badań)

Wszystkie liczby modelu: półokres 2 dni i okno 28 dni; sufit 1,3 tygodnia tolerancji; progi kolorów 0,5 i 0,25; połowa obciążenia dla niepotwierdzonego planu; okno 90 dni i waga 3 sesji przy typowej intensywności; 6 okien tygodniowych i waga 2 tygodni dla quizu; progi `napięcia` 0,3 i 0,7; progi obciążenia względnego 0,30 / 0,15 / 0,50; krok 2%, zakres ±20%, półokres aktualności 21 dni i okno 56 dni; przerwa 14 dni, 5% na tydzień, dolna granica 0,7; wszystkie mnożniki quizu, zakres 0,7–1,2 i wartość 150 po pominięciu; próg 25% i 2 tygodnie dla niższej pewności. Także sama postać wzoru `1 − F/sufit` i wybór pól samopoczucia są konwencją interfejsu.

## 6. Granice

- Model nie zna treningów, których nie zapisano. Tydzień bez wpisów nie obniża poziomu bazowego, ale też go nie podnosi.
- Plan z przeszłości bez oznaczenia liczy się w połowie; oznaczenie „wykonany” albo „pominięty” usuwa tę niepewność.
- Tolerancja jest liczona na dziś i stosowana do wszystkich wyświetlanych dni, także przeszłych. Pasek dawnego dnia może się więc nieznacznie zmienić wraz z nowymi danymi.
- Wydarzenia, wyjazdy, sen i stres nie wpływają na pasek.
- Zmiana parametrów lub wzorów wymaga nowej nazwy wersji (`plan-reserve-v3`) i aktualizacji tego dokumentu.

## 7. Kontrakt danych 0.4.1

**Migracja 8** (`DATABASE_VERSION = 8`), addytywna, w tej samej transakcji co zapis `user_version`:

```sql
CREATE TABLE local_training_quiz (
  id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL REFERENCES local_profiles(id),
  revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  sync_state TEXT NOT NULL CHECK (sync_state = 'local-only'), payload TEXT NOT NULL
)
```

Migracje 1–7 pozostają bez zmian. Żadna istniejąca tabela ani wiersz nie jest modyfikowany; `local_readiness_references` zostaje.

**Rekord quizu** (`payload`, najwyżej jeden na profil):

```ts
{ id, profileId, revision, createdAt, updatedAt, syncState: 'local-only',
  quizVersion: 1, status: 'completed' | 'skipped', answeredAt: string /* ISO */,
  answers: null /* skipped */ | { experience, level, sessionsPerWeek, typicalMinutes,
    kinds: { type, intensity }[], rhythm } }
```

`repository.saveTrainingQuiz({ profileId, status, answers }, expectedEpoch?)` tworzy albo zastępuje ten rekord (ten sam `id`, rosnąca `revision`). Zapis „pominięto” nigdy nie zastępuje ukończonych odpowiedzi.

**Kopia zapasowa, format 5**: format 4 + kolekcja `trainingQuizzes` (0 lub 1 rekord). Formaty 1–4 nadal się importują, z pustą kolekcją. Import zachowuje identyfikatory jak dotąd (rewizje są celowo zerowane do nowej epoki). Jeśli importowana kopia ma profil, ale nie ma rekordu quizu, zostaje rekord quizu z urządzenia; dzięki temu jednorazowy quiz nie wraca po imporcie starszej kopii. Aplikacja 0.4.0 nie zaimportuje formatu 5 (nieznana wersja jest odrzucana przed zapisem, bez zmiany danych).

Plik ratunkowy obejmuje nową tabelę. Eksport CSV dostaje wiersz `quiz_startowy`.

**API prognozy**: `buildReserveModel({ workouts, wellness, trainingQuizzes }, asOf)` zwraca `{ version, asOf, parameters, tolerance, contributions, day(date) }`; `reserveModel(snapshot)` zwraca model zapamiętany dla danego obiektu migawki i dnia. `readinessForecast` (v1) usunięto wraz z panelem odniesienia; typy i metody repozytorium dla `readinessReferences` zostały, aby stare dane dało się czytać, eksportować i importować.
