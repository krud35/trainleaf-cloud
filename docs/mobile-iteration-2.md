# Trainleaf 0.2.0 — zakres aktualizacji

Aktualizacja zachowuje identyfikator `com.frisbeeprep.app`, bazę lokalną i podpis debug wcześniejszej wersji. Kod wersji Androida wynosi 2. Stary pakiet pozostaje jako `outputs/trainleaf-0.1.0-debug.apk`. Nowe APK można instalować jako aktualizację, bez odinstalowywania poprzedniego.

## Interfejs i trening

- Nawigacja: Dzisiaj, Plan, Postępy, Inne. Dzisiaj pokazuje sesje, samopoczucie, cele, wszystkie aktualne okresy oraz tydzień. Karty kontekstu mają rysowany liść dopasowany do wysokości treści. Treningi pozostają prostokątnymi kartami.
- Inne zawiera konfigurowalne skróty do historii, ćwiczeń, szablonów, samopoczucia, celów, okresów i eksportu. Ukrycie skrótu nie usuwa danych. Informacja o lokalności pozostaje w ustawieniach i komunikatach operacji plikowych.
- Poszerzono sporty w grupach, zachowując stare identyfikatory. Rodzaj treningu jest odrębnym polem: siłowy, biegowy, wydolnościowy, techniczny, drużynowy, mentalny. Wcześniejsze sesje bez rodzaju mają wartość nieustaloną. Przy kilku sportach nowy formularz wymaga jawnego wyboru sportu.
- Wykonania nie można zapisać z przyszłą datą kalendarzową urządzenia. Szkic i plan mogą mieć przyszłą datę. Import nie usuwa wcześniejszych wpisów z taką datą; są pokazane do korekty i wyłączone z historii wykonań oraz statystyk wykonania.
- Okresy wynikają z daty sesji, z uwzględnieniem granic, hierarchii i niezależnych nakładających się okresów. Historyczne powiązanie okresu nie blokuje zmiany dat.
- Plan ćwiczenia używa RIR; wykonanie zachowuje ciężar. Starsze kilogramy nie są przeliczane na RIR ani usuwane. Brak serii, powtórzeń i RIR jest odróżniony od liczby zero.
- Pomoc wyjaśnia RIR, tempo i odpoczynek. Tempo zależy najpierw od ćwiczenia; bieganie, wiosłowanie i rower zachowują właściwe jednostki. Nazwa ostatniej sekcji to Cooldown.
- Mobilny katalog i fabryczne szablony nie narzucają dawek ani zaleceń z przykładowych planów. Technika, mięśnie, źródła, notatki użytkownika i historyczne migawki pozostają zachowane.
- Superserie obsługują dowolną liczbę ćwiczeń w limitach sekcji, kolejność 1a/1b/1c/…/1aa, różną liczbę serii, osobne przerwy między ćwiczeniami i po rundzie, przenoszenie, rozgrupowanie, szkice, szablony i kopie z nowymi identyfikatorami.
- Plan tygodnia ma siedem dni, oznaczenia rodzaju i statusu, godziny i pełną listę wybranego dnia. Przy dużym tekście przewija się sam pasek dni. Podgląd mięśni liczy pozycję raz i używa wyłącznie planowanych serii oraz udziałów mięśni z migawki ćwiczenia. Pomija sesje nieplanowane i pominięte; wykonany plan nadal się liczy.

## Ankieta i wskaźniki

Opcjonalna ankieta po treningu zapisuje zmęczenie wydolnościowe, mięśniowe, satysfakcję i notatkę. Suwaki nie zapisują domyślnej odpowiedzi bez dotknięcia. Brak pozostaje `null`, jawne zero jest odpowiedzią. Ankietę można pominąć i uzupełnić z historii. Jest oddzielna od samopoczucia i RPE całej sesji.

Własny wskaźnik **Trainleaf v1**:

`czas wykonania w minutach × waga rodzaju × (0,5 + zmęczenie wydolnościowe / 10) × (0,5 + zmęczenie mięśniowe / 10)`

| Rodzaj | Waga |
| --- | ---: |
| Siłowy | 1,3 |
| Biegowy | 1,05 |
| Wydolnościowy | 0,8 |
| Techniczny, w tym rzutowy | 0,6 |
| Drużynowy | 1 |
| Mentalny | 0 |

To parametry ustalone przez użytkownika, bez twierdzenia o walidacji naukowej. Mentalny pozostaje w statystykach czasu i regularności, lecz nie nalicza tego obciążenia i nie wymaga ankiety fizycznej. W pozostałych rodzajach brak czasu lub jednej oceny oznacza brak wyniku. Satysfakcja nie wpływa na wzór. Wynik dotyczy tylko wykonań do dzisiaj. Klasyczne czas × RPE pozostaje osobną miarą.

Każdy obliczony wynik przechowuje wersję algorytmu, surowe wejścia, pełne parametry i pełną precyzję wyniku. Wyświetlanie zaokrągla do jednego miejsca. Edycja notatek nie przelicza historii; zmiana wejść wykonuje nowe obliczenie. Odczyt kopii i bazy sprawdza zgodność zapisanego wyniku z zapisanymi parametrami.

## Dane i źródła

Schemat SQLite 4 → 5 migruje atomowo. Kopia v3 odczytuje również v1/v2. Nowe pola trafiają do szkiców, kopii i CSV. Zachowane są kontrola rewizji i epoki, atomowe zużycie szkicu podczas zapisu i ratunkowy eksport surowych danych.

Definicja RIR opiera się na [Zourdos i wsp., 2016](https://pubmed.ncbi.nlm.nih.gov/26049792/), z zaznaczeniem, że jest oszacowaniem. Wycofany artykuł PMID 33337690 nie jest używany. Konwencja tempa: [NASM, tempo training](https://www.nasm.org/resource-center/blog/training/tempo-training-using-lifting-tempo-to-drive-adaption). Źródła te nie potwierdzają własnych wag wskaźnika Trainleaf.

Wyniki końcowych sprawdzeń i ograniczenia testu urządzenia są w `mobile-validation.md`.
