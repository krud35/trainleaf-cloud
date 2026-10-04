# Mobilny UI — propozycja 02

2026-10-03. Osobny prototyp; brak zmian w produkcyjnym kliencie i zależnościach. Wszystkie wpisy są przykładowe. Nazwa Fieldwork pozostaje robocza.

## Uruchomienie

Z katalogu ultimate-planner: `node design/mobile-ui/serve.mjs`, następnie http://127.0.0.1:4186. Bez instalowania zależności. Prototyp używa osobnego klucza localStorage `fieldwork-ui-demo-v1`; nie czyta SQLite ani danych webu. Bez zewnętrznych fontów, API i obrazów.

## Co wynika z decyzji użytkownika

- Przejrzystość, funkcjonalność, łatwe wpisy i notatki; wiele sportów; Android pierwszy, iOS później.
- Lokalny profil bez obowiązkowego konta; podstawowe funkcje darmowe; obecny zakres indywidualny.
- Brak zgody na konkretną estetykę papierowego notatnika ani nową nazwę.

## Propozycje do oceny, nie zaakceptowane decyzje

Cztery zakładki: Dziennik (dziś, historia, szkic, samopoczucie), Plan (dzień/tydzień i okresy), Baza (ćwiczenia i szablony), Postępy (wykonanie, regularność, cel). Ustawienia i eksport w nagłówku. Ciepła biel, grafitowy tekst, stonowany błękit dla planu i działań, delikatna oliwka dla okresów. Nagłówki Georgia, treść systemową czcionką Segoe UI. Status zawsze opisany tekstem. Bez ozdobnych animacji i sportowych rankingów.

Obecny mobile/src/App.tsx ma czytelny lokalny profil, prosty formularz i historię. Ograniczenia UX: brak szkiców przy zmianie widoku, niewdrożone widoki planowania i nauki, brak ćwiczeń w sesji; zbiorcze liczniki zajmują miejsce przed najważniejszymi wpisami. Propozycja przenosi na początek zapis i plan dnia, pozostawiając liczby w Postępach.

## Scenariusz przeglądu

1. Dziennik → Zapisz trening → wpisz nazwę/notatkę → Zostaw szkic → Dokończ. Odświeżenie zachowuje szkic.
2. Ćwiczenie → szukaj „goblet” → szczegóły → Dodaj → zmień serie i ciężar → Zapisz.
3. Plan → wybierz dzień → Zaplanuj sesję. Otwórz zaplanowaną pozycję → Zapisz wykonanie. Kopia planu pozostaje w przykładowym obiekcie; docelowy widok porównania opisano niżej.
4. Plan → okres → zmień cel i daty. Postępy → zmień własny cel.
5. Baza → Szablony → użyj całego treningu lub sekcji. Dziennik → Samopoczucie.
6. Ustawienia → sporty lub eksport CSV/JSON. Eksport faktycznie pobiera dane demonstracyjne.
7. Pasek prototypu: pusty dziennik, błąd zapisu, brak miejsca, stan bez internetu, tekst 200%. Symulacja błędu nie usuwa formularza; po zmianie na zwykły zapis można ponowić.

## Mapowanie i prace wdrożeniowe

| Obszar | Istniejący model | Potrzebne wdrożenie |
|---|---|---|
| Profil i sporty | mobile/src/data/domain.ts Profile, sportIds, modules | Zmiana prezentacji; wyłączenie modułu nigdy nie usuwa historii. Dostęp do starszych sportów w historii i edycji. |
| Trening prosty | mobile Workout: title/date/sportId/durationMinutes/rpe/notes | Nowy szkic przechowywany osobno, trwały zapis przed potwierdzeniem. Obecny model wymaga czasu; prototyp proponuje opcjonalny czas. To wymaga jawnej zmiany schematu i migracji, nie zamiany braku na zero. |
| Plan i wykonanie | web lib/domain.ts Workout.status, duration/actualMinutes, sections, Item.planned/actual | Przeniesienie do mobilnej warstwy danych. Zachować migawki ćwiczeń. Ekran wykonania: plan tylko do odczytu + osobne rzeczywiste wartości, bez domyślnego oznaczania całego planu jako wykonanego. Prototyp zachowuje plan, ale nie pokazuje pełnej tabeli porównawczej. |
| Ćwiczenia | web Exercise, Dose, ExerciseNote | Offline katalog i migracje; jednostka zależna od ćwiczenia; serie, ilość, kg; rozwijane tempo, przerwa, wysiłek i zalecenia. Nie utożsamiać kategorii ćwiczenia ze sportem. Własne ćwiczenie w prototypie istnieje tylko do przeładowania; produkcja wymaga trwałego repozytorium. |
| Sekcje | web warmup/main/cooldown | Mobilny edytor trzech sekcji, przenoszenie ćwiczeń przyciskami, bez obowiązku przeciągania. Prototyp ma płaską listę i opis dojścia do sekcji. |
| Szablony | web Template.section i items | Model obsługuje pojedynczą sekcję. Cały trening wymaga nowego agregatu 3 sekcji. Lista → nowy/edytuj → nazwa + sekcje → zapisz; zastosowanie tworzy niezależne migawki, nigdy nie zmienia dawnych treningów. W prototypie aktywne zastosowanie, tworzenie/edycja pozostają specyfikacją. |
| Okresy | web Period.name/start/end/phase/goal/level/parentId | Osobna lokalna tabela i walidacja hierarchii. Podstawowy formularz bez terminologii periodyzacji. Treningi w zakresie dat wyliczane, nie są trwałym powiązaniem; jawny periodId byłby rozszerzeniem. |
| Samopoczucie | lib/wellness.ts: morning/daytime/evening, slotQuestions, answers | Te same zakresy i pytania. Brak odpowiedzi pomijany, zero zachowane. Jeden wpis na dzień i porę; edycja zamiast duplikatu, historia 7/28 dni. Prototyp demonstruje formularz i ostatni wpis, nie całą historię. |
| Postępy | web summarize/summarizeSets i wykonane sesje | Agregacja tylko completed, osobno plan. Braki jako „—”, nie zero. Jednostek nie sumować razem. Prosty własny cel wymaga nowej obsługi. Prototyp wykresu pokazuje dostępne próbki, nie sztuczny trend. |
| Eksport | mobile backupSchema v1 i repozytorium; web exportRows | Natywny wybór miejsca/udostępnienie, CSV zabezpieczony przed formułami, wersjonowany JSON. JSON prototypu celowo oznaczony jako niezgodny z kopią Android. |

## Stany i szczegóły interakcji

- Zapis: bezczynny → zapisywanie (blokada powtórzenia) → potwierdzony zapis → historia. Błąd pozostawia treść i umożliwia ponowienie. Brak miejsca nie może pokazać potwierdzenia trwałego szkicu; dać możliwość skopiowania tekstu/eksportu awaryjnego. Prototyp symuluje błędy zapisu, nie rzeczywisty błąd SQLite.
- Szkic: osobny od historii, automatycznie utrwalany po zmianie; powrót/gest systemowy zostawia szkic. Porzucenie wymaga osobnego działania z potwierdzeniem. Produkcja musi rozstrzygnąć wiele szkiców i otwarcie innej sesji przy istniejącym szkicu; prototyp ma jeden slot szkicu.
- Edycja: konflikt revision zachowuje lokalną treść i pokazuje wersję zapisaną do porównania; nie używać odświeżenia, które usuwa wpisane wartości.
- Offline jest normalnym stanem. Bez stałych alertów i wskaźników synchronizacji. Tylko przy filmie komunikat o internecie. Pasek scenariuszy służy ocenie, nie jest częścią produktu. Serwer prototypu nie ma service workera; odświeżenie po jego wyłączeniu nie jest testem offline Androida.
- Puste stany: jedno wyjaśnienie i działanie. Pusty plan dopuszcza odpoczynek, brak danych na wykresie nie ocenia użytkownika. Symulowany pusty dziennik nie kasuje próbek.
- Przywracanie: wybór → walidacja formatu/wersji/rozmiaru → podgląd profilu, zakresu dat, liczby wpisów → ostrzeżenie „Zastąpi wszystkie dane na tym urządzeniu” → możliwość eksportu obecnych → potwierdź/anuluj → atomowa transakcja. Nie wdrożono importu w prototypie.
- Obszary dotyku min. 48 px, widoczny fokus, opisane pola. Dolna nawigacja uwzględnia safe-area. Formularz przewija się z klawiaturą; przyciski zapisu w treści. Na Androidzie uwzględnić także zmienne Capacitor safe-area i testować resize klawiatury, TalkBack, gest Wstecz oraz ustawienia czcionki systemowej.
- W produkcji ukrycie modułu zmniejsza nawigację, ale nie blokuje eksportu ani dostępu do zachowanej historii. W prototypie wszystkie zakładki pozostają widoczne dla przeglądu.

## Weryfikacja

`node design/mobile-ui/check.mjs` używa istniejącego Playwright/Chrome. Raport i obrazy w qa/. Test obejmuje szerokość 360 px, tekst 200%, szkic po odświeżeniu, wyszukiwanie/dodanie ćwiczenia, brak miejsca i ponowienie zapisu. Nie zastępuje testu urządzenia, klawiatury ani czytnika ekranu. To prototyp interakcji, nie produkcyjna implementacja repozytorium.


## Iteracja 02 — spokojniej, z większą dbałością o układ

Użytkownik odrzucił pierwszą wersję jako zbyt podstawową i szablonową. Wybrana preferencja: „Spokojny i dopracowany — subtelne kolory, precyzyjny układ”. To zgoda na kierunek, nie akceptacja każdej decyzji wizualnej.

- Nagłówki i daty w kroju szeryfowym; pola, wyniki i działania prostym krojem bezszeryfowym.
- Plan dnia ma własny układ z dyscypliną, czasem, notatką i działaniem. Historia jest listą z datami na lewym marginesie, bez powtarzalnych ramek.
- Baza ma wiersze z ikonami typów ćwiczeń; plan kalendarz tygodnia i odrębny moduł okresu; postępy dwa podstawowe wyniki i dyskretny wykres.
- Nawigacja z ikonami i etykietami, aktywne miejsce oznaczone tłem. Kontrolki prototypu schowane pod „Opcje podglądu”.
- Nie dodano grafik stockowych, faktury papieru ani nowej nazwy. Poza podstawowym sprzężeniem przy najechaniu brak animacji.
- Archiwum źródeł pierwszego wyglądu w archive-v1/; aktualne pliki w katalogu głównym mobile-ui/.

Po zmianie powtórzono kontrolę 360 px / tekst 200%, szkicu po przeładowaniu, dodania ćwiczenia, błędu i ponowienia zapisu. Testy nie zastępują sprawdzenia na Androidzie. Stan danych i format eksportu pozostają demonstracyjne.

## Zmiana ekranu startowego — Dzisiaj

Na prośbę użytkownika pierwsza zakładka i nagłówek to teraz **Dzisiaj**. Kolejność: niezrobiony check-in → treningi z dzisiejszą datą (zaplanowane i ukończone) → dyskretny cel i aktywny okres → wejście do historii.

Check-in to istniejący formularz samopoczucia. Dowolny zapis z dzisiejszą datą wystarcza do zwinięcia wyróżnionego panelu w małe potwierdzenie z wejściem do edycji. Wpisy z innych dni nie zwijają panelu. Dodatkowy wpis o innej porze dnia pozostaje opcjonalny. W prototypie utrwalane są wpisy według daty i pory; w produkcji należy wykorzystać istniejący model Wellness. Obecny okres musi obejmować dzisiejszą datę; przyszły lub zakończony nie jest prezentowany jako bieżący. Cel i okres otwarte z Dzisiaj wracają do tego ekranu po edycji.

Dla spójności przykładowych danych „dzisiaj” w prototypie to stale 2026-10-03. W produkcji lokalna data urządzenia, niezależna od daty przeglądanej w kalendarzu. Test check-today.mjs obejmuje brak/wczorajszy/dzisiejszy check-in, zachowanie po przeładowaniu, zero jako odpowiedź, obydwa statusy treningu, granice okresu, dostęp do historii i tekst 200%.

## Cele, okresy i opisowe suwaki

Cel ma morelowy panel z ikoną tarczy, okres lawendowy panel z fazą i datami. Pozostają pod check-inem i sesjami na dziś. Nie pokazujemy wyliczonego postępu dla celu tekstowego.

Oceny samopoczucia mają natywne suwaki: jakość snu, energia, nastrój, koncentracja i odpoczynek 1–5; zmęczenie, bolesność i stres 0–10. Każdy krok ma osobny, potoczny podpis dopasowany do pytania. Krańce skali pokazują także jednoznaczne znaczenie. Godziny snu pozostają polem liczbowym z krokiem 0,25 h, ponieważ to czas, a nie ocena.

Domyślnie odpowiedź jest pusta (—), mimo technicznego położenia uchwytu suwaka. Dotknięcie, przesunięcie lub klawisz wybiera wartość; Pomiń przywraca brak odpowiedzi. Zero jest pełnoprawnym wynikiem. Podpis opisuje wyłącznie odczucie użytkownika — nie określa gotowości ani zaleceń treningowych. Czytnik ekranu otrzymuje wartość i podpis przez aria-valuetext. Model nadal zapisuje liczbę, a nie tekst prezentacyjny.

Weryfikacja check-sliders.mjs: każdy krok wszystkich skal, unikalność podpisów, klawiatura, pomijanie, brak automatycznych odpowiedzi, zapis/odczyt zera i układ 360 px przy 200% tekstu. Zrzuty: qa/goal-period.png i qa/checkin-sliders.png.

Podpisy skal zostały przeredagowane na prośbę użytkownika w bardziej obrazowy język zawodnika: zapas paliwa i ciężar nóg (zmęczenie), silnik i przyspieszenie (energia), szum trybun i pogoda (stres), rytm gry (koncentracja), oddech i zejście z boiska (odpoczynek). Nadal każdy krok ma własny podpis, a dosłowne krańce skali określają kierunek i znaczenie oceny. Ponownie sprawdzono wszystkie wartości, zapis zera i dłuższe podpisy przy tekście 200%.

Korekta tonu: użytkownik uznał poprzednie porównania za zbyt metaforyczne. Aktualne podpisy są potoczne i bezpośrednie, np. „Trudno mi się rozkręcić”, „Mam słabszy dzień”, „Skupiam się, ale czasem odpływam”. Ta decyzja zastępuje wcześniejszy kierunek sportowych metafor. Skale i zachowanie suwaków pozostają bez zmian.
