# Trainleaf 0.3.0 — odpowiedzi na etap 1 audytu

Stan 2026-10-04. Etap 1 dotyczył kodu podczas integracji. Poniżej stan wydania; końcowy manifest i APK są wejściem do osobnego etapu 2. Ten dokument nie zastępuje niezależnego audytu.

| Uwaga | Rozwiązanie / dowód | Granica |
| --- | --- | --- |
| K1 — Android Wstecz | `platform/useAndroidBack.ts`, `@capacitor/app`: najpierw dialog, potem zapis szkicu/guard formularza, powrót lokalny, Dzisiaj i minimalizacja. | Kompilacja; brak próby na urządzeniu. |
| K2–K4 — formularz i pory samopoczucia | App podpina `registerExitGuard`, oddzielne powroty Today i trendów; Today wybiera wpis z bieżącej lokalnej pory, aktualizowanej przy granicy pory. | Regresje komponentów i integracja klienta; brak native. |
| K5–K6 — mapa/rezerwa | Jawne role ćwiczeń, własne cele, plan/wykonanie, mapa front/back z listą; S jest zapisanym snapshotem, przesunięcie sesji pokazuje porównanie. | Prototyp bez fizjologicznych procentów. |
| K7 — starsze ważone shares | Legacy obliczenie zachowano dla zgodności wcześniejszych analiz. Nowa mapa używa osobnych ról, nie normalizacji shares. | Nie zmieniamy historii. |
| K8 — wydarzenia Today | Kliknięcie otwiera Plan z wybraną datą i wydarzeniem. | Scenariusz planowania. |
| K9 — błąd odświeżenia po commicie | Formularze wydarzeń, okresów, celów mięśni i odniesienia rozróżniają commit/refresh i blokują ponowny zapis zakończonej operacji. | Błąd zapisu zachowuje wartości. |
| K10 — rok sezonu | Zmiana dnia synchronizuje rok, także w wejściach Today i po przesunięciu. | Regresja przejścia przez rok. |
| K11 — zaokrąglenie snu | Wynik poniżej celu ma najwyżej 99%; 100% wymaga rzeczywistego spełnienia. | Brak automatycznej normy snu. |
| K12 — migracja i fixture | Schemat 7 naprawia pełną i częściową 6. Przenośny fixture wydania 0.2.0 obejmuje starą bazę i kopię v3 wraz z pochodzeniem. | Brak dokładnego fixture źródeł 0.1.0; nie deklarujemy go. |
| K13 — rozgałęzianie celu mięśnia | Rewizja zastąpionej definicji jest odrzucana także przy świeżej technicznej rewizji; nadpisanie tygodnia jest jawne. | Test domenowy. |
| K14 — harness w źródłach | Harness jest izolowany i sprzątany. Kolektor odmawia zamrożenia przy obecności `.qa-v3-*`. | Snapshot po zakończeniu testów. |

## Decyzje i ograniczenia D1–D10

1. Parametry rezerwy i objętości są roboczym kontraktem prototypu wybranym przez zespół 2026-10-04 w ramach zleconego researchu i wdrożenia. Nie są osobno zatwierdzonymi przez użytkownika ani zwalidowanymi fizjologicznie normami. Dotychczasowy load v1 pozostaje bez zmian.
2. Wykonany trening fizyczny bez zapisanego rzeczywistego load pozostaje nieznany; nie podstawiamy planu. Przeszły niewykonany plan również jest nieznany. Mentalny wykonany trening ma fizyczne zero w prognozie bez dopisywania migawki do historii.
3. Potwierdzenie kompletności zakresu historii dodaje tylko puste dni jako odpoczynek; nie zeruje istniejących niekompletnych sesji. Można też potwierdzić pojedynczy dzień.
4. O uwzględnieniu w objętości decyduje klasyfikacja ćwiczenia oporowego, nie rodzaj całej sesji. Przysiad w sesji drużynowej może się liczyć; bieganie i minuty nie stają się seriami.
5. Wewnętrzny identyfikator rezerwy pozostaje `readiness-v1`; nazwa widoczna to „Rezerwa w planie”.
6. S jest jawnym dodatnim odniesieniem zapisanym z pochodzeniem. Nie przelicza się automatycznie przy przesuwaniu sesji.
7. Cel okresu częściowo nachodzącego na tydzień zachowuje pełną wartość tygodniową, bez proraty. Najwyższa jawna definicja/nadpisanie zastępuje wcześniejszą, nie dodaje się do niej.
8. Dokładna wersja zainstalowana na telefonie jest nieznana. Uruchomienie i screeny nie dowodzą natywnej migracji, trwałości ani udostępnienia.
9. Uszkodzony wiersz blokuje normalne otwarcie i daje surowy eksport ratunkowy; nie ma automatycznej kwarantanny ani cichego pomijania.
10. Nowy zapis celu dni jest ograniczony do 7 dla tygodnia lub liczby dni zakresu. Odczyt/import nie odrzuca dawnych celów wyłącznie na podstawie tej nowej reguły.

Końcowe wyniki i ograniczenia: `mobile-validation.md`. Źródła badań i rozdzielenie konwencji od dowodów: `mobile-iteration-3-methods.md`.
