# Trainleaf — prototyp UI i przekazanie do Androida

**Dodano wybór Jasny / Ciemny / Systemowy** (domyślnie Systemowy). Otwórz Wygląd przez ikonę księżyca w nagłówku lub Ustawienia. [Przekazanie motywu, paleta i zakres weryfikacji](THEME-HANDOFF.md). Testy logiki i wybranych kontrastów przeszły; końcowa kontrola wzrokowa jest niewykonana z powodu błędu narzędzia przeglądarki. Tłumaczenia pozostają wstrzymane.

**Aktualna wersja: iteracja 3 po feedbacku APK (4.10.2026).** Otwórz http://127.0.0.1:4186/?demo=six-months&v=iteration3. Przekazanie komponentów, zachowań i QA wraz z jawnymi różnicami względem Androida: [HANDOFF-ITERATION-3.md](HANDOFF-ITERATION-3.md). Dla produkcyjnych danych i obliczeń nadrzędny jest [kontrakt Androida](../../docs/mobile-iteration-3-contract.md), a nie model prototypu. Opis poniżej zachowuje kontekst wcześniejszej iteracji 04; przy różnicach w opisie podglądu obowiązuje nowe przekazanie. Dane nowej demonstracji zapisują się osobno pod `trainleaf-six-month-demo-iteration3-v1`.

Stan: zintegrowany prototyp iteracji po teście APK, 2026-10-03. Wszystkie zmiany w tym czacie dotyczą wyłącznie `design/mobile-ui/`. Właścicielem produkcyjnych danych, klienta Android i APK pozostaje czat Android. UI nie implementuje recovery/conflict trenera ani zmian produkcyjnego `app/planner.tsx`.

Uruchomienie z katalogu `ultimate-planner`: `node design/mobile-ui/serve.mjs`. Podgląd: http://127.0.0.1:4186/?v=iteration04. Po zmianie listy modułów serwer trzeba uruchomić ponownie. Wszystkie przykłady są demonstracyjne, a „dzisiaj” w podglądzie to **3 października 2026**. W aplikacji użyć lokalnej daty urządzenia.

## Podgląd z sześcioma miesiącami danych

Otwórz **http://127.0.0.1:4186/?demo=six-months**. Ten wariant pokazuje fikcyjną historię od **4 kwietnia do 4 października 2026**, z przykładowymi treningami, check-inami, ocenami po sesjach, ćwiczeniami i okresami. Dzisiejszy check-in pozostaje do uzupełnienia, obok ukończonej sesji i planu na dziś. Są też zaległe plany i sesje na następny tydzień.

Generator `demo-history.js` jest deterministyczny. Ten wariant korzysta wyłącznie z osobnego klucza `trainleaf-six-month-demo-v1`; wcześniejsze dane pod `fieldwork-ui-demo-v1` pozostają dostępne w zwykłym podglądzie. Zmiany w demonstracyjnej historii zapisują się lokalnie po użyciu formularzy. Nie importować tego generatora do produkcyjnej bazy.

Początkowy zestaw: **139 ukończonych treningów, 207 check-inów, 10 okresów**, sześć zaległych planów, jeden plan na dziś i sześć na przyszły tydzień. Wśród ukończonych sesji 17 zawiera superserie, 127 ma zapisany load, a 12 pokazuje brak pełnych danych do jego wyliczenia.

W **Postępach** domyślnie widać sześć miesięcy, z przełącznikiem tygodnia/miesiąca i miesięcznym zestawieniem ukończonych sesji. Historia treningów i samopoczucia mają filtr miesiąca oraz wyświetlają po 20 wpisów. **Plan** pozwala przejść bezpośrednio do wybranej daty. Liczniki, czas, RPE i load korzystają z tego samego zakresu; pomijają plany i przyszłe wykonania. Widok ankiet pokazuje cztery najnowsze sesje w zakresie. Zapisane snapshoty load nie są przeliczane podczas przeglądania.

## Co jest gotowe

- Nawigacja **Dzisiaj / Plan / Postępy / Inne**, działające przejścia i zachowanie szkicu.
- Pełne rysunkowe liście check-inu, celu i okresów, z zachowanym zaakceptowanym, środkowanym układem tekstu check-inu.
- Siedem kolumn tygodnia, szczegóły dnia, rozwinięcie tygodnia na Dzisiaj, rozróżnienie planu/wykonania/niewykonanego planu.
- Profile wielu sportów z grupami, wyszukiwaniem i własnymi dyscyplinami; konfigurowalne skróty Inne bez usuwania danych.
- Sześć rodzajów treningów, paleta i symbole; dyscyplina pozostaje oddzielnym polem.
- Automatyczne okresy według daty, wszystkie dopasowania i zagnieżdżenia; blokada przyszłego wykonania; oddzielne widoki historii i szkicu.
- RIR, tempo zależne od ćwiczenia, przerwy i superserie dowolnej liczby ćwiczeń. Dostępna dotykiem i klawiaturą pomoc.
- Oddzielna ankieta po ukończeniu planu i niezaplanowanej aktywności, opcjonalne skale 0–10, zachowanie zera i braku odpowiedzi.
- **Zatwierdzony Trainleaf load v1** w ankiecie, zapisanej sesji i Postępach, obok osobnego czas × session RPE. Snapshot z wersją, parametrami i surowymi wejściami.

Nie jest to APK ani działająca synchronizacja z trenerem. Import kopii nie został dodany do tej iteracji; eksport JSON jest oznaczony `ui-prototype-only` i nie jest kopią kompatybilną z produkcyjnym Androidem.

## Pliki do bezpośredniej integracji

| Pliki | Odpowiedzialność |
|---|---|
| `leaf-ui.js`, `style.css` | Zaakceptowana geometria SVG, rysunek i układ liści oraz bazowy system wizualny |
| `ui-core.js`, `iteration.css` | Paleta sześciu typów, ikony, badge, teksty pomocy i dostępny dialog, style nowych przepływów |
| `week-ui.js`, `week-ui.css` | Tydzień, szczegóły dnia, podgląd oznaczeń mięśni w planie |
| `exercise-editor.js`, `exercise-editor.css` | Edytor ćwiczeń, RIR, kontekstowe tempo, superserie |
| `profile-ui.js`, `profile-ui.css` | Inne, widoczność skrótów i sporty w profilu |
| `feeling-ui.js` | Wspólny komponent suwaka: brak odpowiedzi, zero, podpisy, pominięcie |
| `load-model.js` | Czyste obliczenie, snapshot, format prezentacji i agregacja zapisanych wyników |
| `app.js` | Nawigacja, stany formularzy, przejścia i zapis prototypu; wzorzec interakcji, nie produkcyjne repozytorium danych |
| `data.js` | Wyłącznie przykładowe dane i metadane katalogu; nie importować jako zalecenia ani dane użytkownika |

Dodatkowe szczegóły: [tydzień](WEEK-HANDOFF.md), [ćwiczenia i superserie](EXERCISE-HANDOFF.md), [profile i Inne](PROFILE-HANDOFF.md), [load v1](LOAD-HANDOFF.md).

Android powinien przenieść komponenty i kontrakty do własnego klienta, podpinając istniejące repozytorium danych. Nie nadpisywać plików prototypu podczas integracji. Zachować identyfikatory istniejących rekordów, historyczne ciężary oraz surowe oceny. Nie kopiować demonstracyjnych migracji/nawigacji `app.js` jako mechanizmu migracji produkcyjnej bazy.

## Wygląd i nawigacja

Tło `#F7F8F2`, tekst `#1F2D26`, tekst pomocniczy `#58685D`, główne działanie `#2F6048`, fokus `#58754A`. Nagłówki korzystają z szeryfowego kroju, formularze z systemowego sans. Litery i przyciski pozostają czytelne przy 200%. Normalnie nawigacja ma cztery kolumny; przy 200% dwie kolumny, żeby nazwy zakładek nie rozpadały się na litery.

Liście są rzeczywistymi rysunkami SVG: asymetryczna blaszka, ostry czubek, ogonek, środkowa i boczne żyłki. Wypełnienia: check-in `#E3EDCE`, cel `#F3E2BC`, okres `#E7F0D3`. Treść to osobny HTML, SVG ma `aria-hidden` i nie odbiera kliknięć. `ResizeObserver` dopasowuje rysunek do treści, zachowując szeroki obszar dla tekstu. Nie zastępować liści prostokątami z zaokrąglonymi rogami. Nie obracać tekstu. Treningi pozostają prostokątnymi kafelkami.

Check-in: nagłówek, opis i kompaktowy przycisk wyśrodkowane optycznie w szerokiej części liścia; główna akcja ma minimum 48 px wysokości. Cel jest lustrzanym liściem; okres jasnozielony. Zapisany check-in zwija się do potwierdzenia. Wczorajszy wpis nie zastępuje dzisiejszego.

Inne zawiera katalog, szablony, historię, samopoczucie, eksport i ustawienia. Ukrycie skrótu usuwa wyłącznie skrót z sekcji „Na skróty”; wszystkie narzędzia pozostają dostępne w rozwijanej liście. Ustawienia i Dostosuj są zawsze dostępne. Katalog jest dostępny z edytora. Informacja o lokalnym zapisie jest w ustawieniach/eksporcie, a oznaczenie danych demonstracyjnych w pasku prototypu.

## Mapa rodzajów treningu

| `trainingType` | Etykieta / skrót | Ikona | Tekst | Tło | Waga load v1 |
|---|---|---|---|---|---:|
| `strength` | Siłowy / Siła | hantle | #674333 | #F1DFD2 | 1,3 |
| `running` | Biegowy / Bieg | biegacz | #35583D | #DDEBD9 | 1,05 |
| `endurance` | Wydolnościowy / Wydol. | puls | #345C68 | #DCEBF0 | 0,8 |
| `technique` | Techniczny / Techn. | cel | #665027 | #F1E8CB | 0,6 |
| `team` | Drużynowy / Druż. | osoby | #51476F | #E8E2F1 | 1 |
| `mental` | Mentalny / Mental. | głowa | #6B445A | #F0DFE9 | 0 |

W produkcyjnym modelu identyfikator `technical` odpowiada tu `technique`; model load akceptuje oba. „Rzutowy” jest przykładem technicznego, nie siódmą kategorią. Kolor nigdy nie jest jedynym oznaczeniem: zawsze występują tekst i ikona. `sport` to osobna dyscyplina, np. Ultimate frisbee lub kolarstwo. Typ ćwiczenia/modality jest jeszcze innym polem; bieganie w sesji siłowej nadal może mieć min/km, rower nie dostaje tej jednostki.

## Tydzień, okres i historia

Tydzień zawsze poniedziałek–niedziela. Mini-kafelek pokazuje typ/ikonę, skrócony tytuł i godzinę, jeśli wpisana; dostępna nazwa zawiera całą treść. Pod siatką pełne nazwy sesji wybranego dnia, a także opcjonalna czytelna lista tygodnia. Przy 200% wszystkie siedem kolumn pozostaje w poziomo przewijanym, nazwanym obszarze — przewija się siatka, nie strona. Fokus pozostaje przy wybranym dniu po zmianie.

Podgląd mięśni liczy unikalne oznaczenia `exercises[].muscles` na zaplanowaną sesję tygodnia. Oznacza źródło „tylko zaplanowane” i wyłączenie ukończonych; nie przelicza wykonania na plan. Paski to liczba sesji, nie objętość, zalecana dawka ani bilans zdrowotny. Osobno pokazuje plany bez oznaczeń i stan bez zaplanowanych sesji.

Edytor wylicza wszystkie okresy, dla których `start <= workout.date <= end`. Zmiana daty odświeża podsumowanie bez selecta i bez tracenia formularza. Zagnieżdżony okres ma opis „W ramach…”. Nakładanie nie powoduje arbitralnego wybrania jednej pozycji. Brak dopasowania: „Brak okresu treningowego”.

Przyszła data: zapis planu działa; ukończenie jest zablokowane w UI i w zapisie, z wyjaśnieniem. Dodawany jako wykonany trening z przyszłą datą można zamienić w plan. Historia dzieli wykonane sesje (dziś/przeszłość), niewykonane plany z przeszłości, bieżące/przyszłe plany i szkic. Ukończenie planu zachowuje pierwotny plan jako `planned`, a czas wykonania i RPE trzeba uzupełnić osobno.

## Ćwiczenia i pomoc

Nowe ćwiczenie z katalogu ma puste serie, ilość, RIR, tempo i przerwy. Metadane/opis/własna notatka zostają; nie ma wbudowanych sugerowanych dawek. RIR jest nowym polem. `kg` w istniejącym zapisie pozostaje zachowane i widoczne jako wcześniejszy ciężar — nigdy nie zmienia znaczenia na RIR.

Sekcje: `warmup` → Rozgrzewka, `main` → Część główna, `cooldown` → Cooldown. Superseria może zawierać dowolną liczbę ćwiczeń 1a, 1b, 1c… W każdym obwodzie po jednej serii każdego ćwiczenia; liczba rund grupy jest nadrzędna wobec serii członków. Osobno `transitionRest` (między ćwiczeniami) i `roundRest` (po rundzie); nie sumować obu po ostatnim ćwiczeniu. Szczegóły dodawania, przenoszenia, wyjmowania i rozgrupowania są w EXERCISE-HANDOFF.

Przycisk „?” otwiera nazwany dialog dotykiem, Enter/Spacją; Escape zamyka, fokus wraca na przycisk. Treści są w `helpTexts` w `ui-core.js`: RIR, RPE, tempo siłowe, tempo biegu, przerwa, superseria, load. Nie wymaga hover. Tooltip RIR traktuje zapas jako oszacowanie. Tempo siłowe opisuje fazy ekscentryczna → pauza → koncentryczna; ruch w dół jest przykładem przysiadu, nie definicją dla wszystkich ćwiczeń.

Źródła definicji: [Zourdos i wsp. 2016, PMID 26049792](https://pubmed.ncbi.nlm.nih.gov/26049792/), [Helms i wsp., omówienie RIR](https://pubmed.ncbi.nlm.nih.gov/27531969/), [NASM — zapis tempa](https://www.nasm.org/resource-center/blog/training/tempo-training-using-lifting-tempo-to-drive-adaption). Nie korzystamy z wycofanego PMID 33337690. Źródła nie są uzasadnieniem własnych wag load.

## Ankieta i zapis load

Po „Dalej · po treningu” otwiera się „Po treningu”. Każda ocena jest opcjonalna:

| Pole | Etykieta | Zapis |
|---|---|---|
| `postSession.aerobic` | Zmęczenie oddechowe / tlenowe | liczba 0–10 albo null |
| `postSession.muscular` | Zmęczenie mięśniowe / siłowe | liczba 0–10 albo null |
| `postSession.satisfaction` | Przyjemność / satysfakcja | liczba 0–10 albo null |
| `postSession.notes` | Notatka | tekst |
| `rpe` | Wysiłek całej sesji | osobna ocena 0–10 albo brak |

Środkowe położenie suwaka nie jest odpowiedzią. Wybranie zera zapisuje 0. Pomiń przy pytaniu przywraca null. Pominięcie pustej ankiety zapisuje trzy null; jeśli część ocen jest już wypełniona, można zapisać je bez odpowiadania na resztę. Oceny dnia pozostają w `wellnessEntries`, nie w ankiecie sesji.

Zatwierdzony wzór: **wykonane minuty × waga rodzaju × (0,5 + aerobic/10) × (0,5 + muscular/10)**. Satysfakcja i RPE są poza wzorem. Dla 60 min i 5/5: siłowy 78; biegowy 63; wydolnościowy 48; techniczny 36; drużynowy 60; mentalny 0. Mentalny nie wymaga fizycznych ocen do zera i zostaje w statystykach czasu/regularności. Pozostałe niekompletne, nierozpoznane lub przyszłe/planowane sesje nie dają fałszywego zera.

`loadSnapshot` zachowuje status, value, reason, algorithm=`trainleaf-load-v1`, parameters i inputs. Obliczenie ma pełną precyzję, prezentacja jedno miejsce po przecinku. Odczyt lub zmiana wag nie przelicza historii. W prototypie zapis tytułu/notatki przy niezmienionych wejściach zachowuje poprzedni snapshot; świadoma zmiana typu/czasu/ocen tworzy nowy przy zapisie. Android powinien zachować tę zasadę i ewentualny audyt edycji. Brak dawnego snapshotu nie jest uzupełniany podczas przeglądania historii.

Postępy sumują zapisane wyniki wyłącznie ukończonych sesji okresu i pokazują kompletność. Czas × session RPE ma osobny blok i własną kompletność. Load nie ma progów bezpieczeństwa, oceny zdrowia ani twierdzenia o naukowej walidacji wag.

## Kontrole

Przy działającym serwerze:

- `node design/mobile-ui/check-iteration-nav.mjs` — nawigacja, tydzień, moduły, profil, okresy, przyszłe daty.
- `node design/mobile-ui/check-iteration-editor.mjs` — edytor, superserie, pomoc, ankieta, zero/null, zapis i odczyt.
- `node design/mobile-ui/check-load.mjs` — 13 grup testów czystego modelu load.
- `node design/mobile-ui/check-iteration-load.mjs` — zapis i prezentacja load, zachowanie snapshotów, braki, mentalny i ponawianie zapisu.
- `node design/mobile-ui/check-sliders.mjs` — wszystkie podpisy samopoczucia, klawiatura, pominięcie i zero.
- `node design/mobile-ui/check-trainleaf.mjs` — reprezentatywne widoki, długi tekst i kontrast, z uwzględnieniem powierzchni SVG.

Raporty i zrzuty są w `qa/`. Sprawdzone 360 px, tekst 200%, długie nazwy oraz pomoc dotykiem/klawiaturą. Obliczony kontrast kontrolowanych tekstów wynosi co najmniej 4,7:1; to kontrola wybranych widoków, nie pełny audyt dostępności. Stare `check.mjs` i `check-today.mjs` dotyczą poprzedniej wersji nawigacji; aktualną regresją są skrypty `check-iteration-*`.

Natywna integracja wymaga sprawdzenia TalkBack, klawiatury Android, systemowego Wstecz, safe-area i plików eksportu. Tego prototyp nie potwierdza. Nawigacja przyklejona do dołu może znajdować się w środku zrzutu całej długiej strony; w oknie pozostaje na dole.
