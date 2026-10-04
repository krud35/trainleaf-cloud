# Trainleaf — ćwiczenia i superserie

Zakres: działający prototyp w `exercise-editor.js` + `exercise-editor.css`. Dane są demonstracyjne. Pliki produkcyjne Androida pozostają własnością czatu Android.

## Integracja prototypu

- `prepareExercise(catalogItem)` zwraca głęboką kopię z nowym `id`, pustymi `sets`, `quantity`, `rir`, `tempo`, `pace`, `rest` oraz sekcją `main`, jeżeli katalog jej nie podaje. Usuwa `groupId`, `kg` i `load`: katalog nie jest zaleceniem dawek. **Nie wywoływać dla odtwarzanych szkiców ani historii** — ich wartości mają zostać zachowane.
- `renderExerciseEditor(draft)` zwraca HTML; uzupełnia brakujące identyfikatory/sekcje w istniejących ćwiczeniach. Wczytać osobny CSS po głównym CSS. Moduł importuje `esc`, `icon`, `helpButton` z `ui-core.js`.
- `handleExerciseClick(button, draft)` wywołać przed ogólnym listenerem kliknięć. Wynik `{handled, changed, focusSelector?}`. Gdy `handled`, nie uruchamiać starego handlera; gdy `changed`, zapisać szkic, ponownie wyrenderować i przenieść fokus do `focusSelector`, o ile element istnieje. `changed` obejmuje również zmianę lokalnego stanu wyboru.
- `handleExerciseInput(input, draft)` wywołać przed ogólnym listenerem `input`. `true` oznacza obsłużenie; zapisać szkic bez ponownego renderowania. Native select emituje `input`. Checkboxy wyboru i select dodawania do grupy przechwytujemy, aby ich wartości nie stały się przypadkowymi polami treningu.
- Przyciski pomocy korzystają z globalnego handlera `helpButton(topic)`: `rir`, `strength-tempo`, `running-pace`, `rest`, `superset`. Nie są przechwytywane przez edytor. Pomoc ma działać dotykiem, Enter/Spacją i z czytnikiem.
- Dodawanie z katalogu/szablonu pozostaje po stronie aplikacji: `draft.exercises.push(prepareExercise(item))`.

## Dane i znaczenie pól

`draft.exercises`: płaska, uporządkowana tablica z `id`, `name`, `kind`, `modality?`, `unit`, `section`, `sets`, `quantity`, `rir`, `tempo`, `pace`, `rest`, `notes`, opcjonalnie `groupId`. Kolejność członków grupy wynika z tej tablicy.

`draft.groups`: `{id, section, rounds, transitionRest, roundRest}`. W grupie obowiązują `rounds`; pojedyncze `sets` nie są dodatkowym mnożnikiem. Przejście po ćwiczeniu innym niż ostatnie używa `transitionRest`; po ostatnim obowiązuje wyłącznie `roundRest`. Sekcja grupy synchronizuje sekcje członków.

Puste pole to brak wartości, `0` jest poprawne dla RIR/odpoczynku. RIR to nowe pole; nigdy nie zapisujemy go do `kg`. Obecne `kg`, także zero, pozostaje w zapisanych ćwiczeniach i jest widoczne jako „Zapisany ciężar”, bez edycji w tym prototypie. Android zachowuje własne istniejące dane wykonania i ciężarów.

Sekcje: `warmup` = Rozgrzewka; `main` = Część główna; `cooldown` = Cooldown.

Tempo zależy od **ćwiczenia**: `modality: strength` lub rodzaj Siła/Siłowy/Trening siłowy → `tempo`; `modality: running` lub rozpoznana nazwa/rodzaj biegowy → `pace`, min/km. Podana `modality` jest nadrzędna. Rower nie otrzymuje min/km. W integracji produkcyjnej preferować jawne `modality`; heurystyka nazwy służy zgodności ze starym katalogiem demonstracyjnym.

## Superserie: działające interakcje

1. „+ Superseria” uruchamia wybór niezgrupowanych ćwiczeń przy użyciu natywnych checkboxów. „Połącz zaznaczone” aktywne od dwóch wyborów. Grupa nie ma limitu członków; oznaczenia `1a`, `1b`, `1c`… po `z` przechodzą w `aa`.
2. Grupa trafia na pozycję pierwszego wybranego ćwiczenia. Wewnętrzna kolejność zachowuje kolejność treningu. Rundy są odziedziczone tylko wtedy, gdy wszystkie ćwiczenia miały tę samą liczbę serii; przy różnicach pole rund pozostaje puste. Nie wybieramy arbitralnej dawki.
3. „Dodaj ćwiczenie do tej grupy” wybiera istniejące niezgrupowane ćwiczenie i przenosi je na koniec grupy. Aby przenieść między grupami: „Wyjmij z grupy”, następnie dodaj do docelowej.
4. „W górę / W dół” zmienia kolejność członków. Skrajne przyciski są disabled. Działają bez przeciągania.
5. „Wyjmij z grupy” przenosi ćwiczenie za grupę. „Rozgrupuj ćwiczenia” rozłącza wszystkich. Liczba rund staje się liczbą serii, odpoczynek indywidualny jest pusty i wymaga ustalenia — dwóch zasad odpoczynku grupy nie zamieniamy bez pytania na jedną.
6. Usunięcie lub wyjęcie pozostawiające jednego członka automatycznie rozgrupowuje ostatnie ćwiczenie. Nie zostawiamy jednoelementowej superserii.
7. Przy 3+ członkach dodatkowa etykieta „Grupa / obwód” wyjaśnia strukturę, zachowując rozpoznawalną nazwę funkcji Superseria.

## Czytelność i dostępność

Wszystkie pola mają jawne etykiety i stabilne ID; przyciski są typu `button`. Długie nazwy zawijają się. Przy trybie 200% pola stają się jednokolumnowe, bez zmniejszania tekstu. Strzałki mają pełne dostępne nazwy z nazwą ćwiczenia. Checkboxy, przyciski i selecty pozostają natywne; pola liczbowe mają ograniczenia i klawiaturę numeryczną. Zmiany kolejności mają status tekstowy i zwracają fokus do przeniesionego ćwiczenia.

Rysunkowe liście w Dzisiaj pozostają nietknięte; ćwiczenia mają płaskie papierowe powierzchnie i szałwiowe oznaczenia kolejności. Puste liczby nie zawierają sugerowanych dawek.

## Stan weryfikacji

Test składni JavaScript i testy zachowania modułu zakończyły się poprawnie: puste dawki katalogu; zachowanie historycznych kg (także zero); tempo zależne od ćwiczenia; grupa 27 członków i oznaczenie `1aa`; różne serie → puste rundy; zmiana rund; kolejność; RIR 0; wyjęcie/dodanie/rozgrupowanie; automatyczne rozgrupowanie jednego członka. Testy nie modyfikowały danych przeglądarki.

Dodatkowo Chrome 360 px, skala tekstu 100% i tryb 200%: długa polska nazwa, grupa trzech ćwiczeń, otwarte szczegóły wszystkich ćwiczeń; brak wychodzenia poza ekran i wszystkie pola z jawnymi etykietami. To kontrola izolowanego komponentu z głównymi stylami aplikacji.

Zintegrowany prototyp: `node design/mobile-ui/check-iteration-editor.mjs` zakończony poprawnie. Osobny kontekst Chrome (nie karta użytkownika) sprawdza rzeczywiste dodawanie z katalogu, trzy ćwiczenia w grupie, pełną edycję grupy, zapis/reload, wykonanie planu i zachowanie oryginalnego planu, ankietę po sesji, zero oraz pominięcie pojedynczego pytania, zapis/reload ocen, pominięcie pustej ankiety aktywności bez planu i nienaruszony historyczny ciężar. Pomoc RIR/tempo/przerwa/superseria/tempo biegu/RPE otwiera się klawiaturą lub kliknięciem; Escape zamyka ją i oddaje fokus do przycisku.

Raport: `qa/iteration-editor-results.json`. Zrzuty 360 px i 200%: `qa/iteration-editor-360.png`, `qa/iteration-editor-200.png`, `qa/iteration-survey-360.png`, `qa/iteration-survey-200.png`. Brak wychodzenia elementów poza ekran; brak wyjątków JavaScript. Pełne zrzuty edytora celowo mają otwarte wszystkie szczegóły, dlatego są wysokie.
