# Mobilna wersja indywidualna — zakres i stan

Aktualizacja: 2026-10-04, Trainleaf 0.3.0 (`versionCode=3`, `appId=com.frisbeeprep.app`). Wszystkie poniższe funkcje należą do bieżącego zakresu. Android jest platformą budowania i testów; wspólna domena i adaptery pozostawiają drogę do iOS. Nazwa produktu: **Trainleaf**. Bez konta online, automatycznej chmury, telemetrii, synchronizacji trenera, płatności, AI i kursów.

## Stan końcowy implementacji

Wszystkie dwanaście pozycji z poniższej mapy ma implementację mobilną: profil, bogaty dziennik i szkice, offline, własne ćwiczenia/notatki, plan, okresy, katalog, szablony, samopoczucie, wykresy, cele oraz JSON/CSV i przywracanie. Przepływ od własnego ćwiczenia do wykonania, celu, ponownego otwarcia offline i odtworzenia kopii przeszedł test Chrome. Baza ma schemat 7 i kopię v4 z odczytem v1/v2/v3. Migracje 1–5 pozostają zgodne z 0.2.0, migracja 6 jest zamrożona, a 7 uzupełnia pełny i wcześniejszy częściowy wariant 6 bez resetu danych. Zachowano ratunkowy eksport uszkodzonych danych oraz zakres 0.2.0: rodzaje treningu, RIR, superserie, ankietę i wersjonowany wskaźnik Trainleaf. Szczegóły poprzedniego zakresu: [mobile-iteration-2.md](mobile-iteration-2.md).

W 0.3.0 dodano Plan tygodnia/miesiąca/sezonu, wydarzenia i wyjazdy, prototyp „Rezerwa w planie” z migawką odniesienia S i oznaczeniem niekompletności (bez fizjologicznych procentów gotowości), mapę 3D objętości siłowej z własnymi celami i jawnymi rolami serii oraz osobnymi widokami planu/wykonania. Cele obejmują także aktywne dni, dni check-in i średni sen. Nowe ekrany postępów i samopoczucia pokazują szczegóły przed edycją; formularze chronią niezapisane zmiany, a Android Back obsługuje `@capacitor/app@8.1.2`. [Kontrakt danych](mobile-iteration-3-contract.md) i [zasady prototypu](mobile-iteration-3-methods.md) opisują obliczenia i granice ich interpretacji.

Tabela poniżej zachowuje **mapę początkowych luk**, a nie listę niewykonanych zadań. Szczegóły gotowego klienta: `android-development.md`; aktualne wyniki i ograniczenia: `mobile-validation.md`. Pozostała weryfikacja natywna na fizycznym telefonie/emulatorze oraz późniejszy projekt iOS. Podgląd wizualny i web pozostają w zakresach osobnych czatów.

## Mapa obecnej aplikacji i luki

| Zakres | Istnieje w webie | Stan mobilny na początku rozszerzenia | Potrzebna praca |
| --- | --- | --- | --- |
| Profil i sporty | `lib/domain.ts` — profil jednego sportowego planera | Kilka sportów, ustawienia modułów, profil lokalny | Zachować historię po zmianie preferencji; dostęp do wyłączonych modułów przez ustawienia |
| Dziennik | `Workout`, `Item`, `Dose`, `makeItem`, `sections` w `lib/domain.ts`; edytor w `app/forms.tsx` | Prosty zapis i edycja bez ćwiczeń | Plan/wykonanie, opcjonalne pomiary, kopiowanie, usuwanie z ochroną, trwałe szkice |
| Offline | Web wymaga API | React + pakiet Capacitor + SQLite; podgląd SQL.js/IndexedDB | Każda nowa encja i czynność lokalna, katalog w pakiecie |
| Własne ćwiczenia i notatki | `Exercise`, `ExerciseNote`, `ExerciseForm` | Brak | CRUD i archiwizacja, notatki, niezależne migawki ćwiczeń w sesji |
| Plan sesji | `copyWeek`, `newWorkout`, kalendarz `app/planner.tsx` | Brak | Lista dni/tygodni, przełożenie sesji, kopie, wykonanie tej samej sesji |
| Okresy | `Period`, walidacja relacji, `lib/period-presets.ts` — 16 presetów | Brak | Lokalne okresy, opcjonalna hierarchia, cele/opis i powiązania treningów |
| Katalog | `lib/seed.ts`, `catalog.ts`, `catalog-v4.ts`, `exercise-types.ts`, `research-content.ts` | Brak | Lokalny katalog, wyszukiwanie/filtry, szczegóły i dodawanie do sesji |
| Szablony | `Template` i trzy domyślne szablony sekcji | Brak | Sekcje i całe treningi; edycja, duplikowanie i niezależne zastosowanie |
| Samopoczucie | `lib/wellness.ts`, `Wellness`, `app/wellbeing.tsx` | Brak | Te same skale i pory dnia, lokalne zapisy/edycja/historia |
| Wykresy | `summarize`, `summarizeSets`, `valueOf`, czas × RPE | Tylko łączna liczba i czas | Tygodnie, wykonanie planu, trend samopoczucia, filtry i jednostki |
| Regularność i cele | Brak odrębnego modelu liczbowych celów | Brak | Cele tygodniowe/na zakres dat, liczba lub czas, wybrany sport, postęp tylko wykonanych sesji |
| Eksport i przywracanie | `sheetSafe`, `exportRows`, eksport CSV | JSON v1 profilu i prostych treningów; repozytorium bez interfejsu plików | Pełny JSON nowych encji, migracja v1, walidowany podgląd i jawne zastąpienie; CSV i adapter plików Android/iOS |

## Granice ponownego użycia

Moduły domeny, katalogu, skal i presetów nie importują serwera. Można z nich korzystać bez zmian w webie. `app/planner.tsx` ma logikę widoków, lecz jego zapis i autoryzacja wymagają API — nie używamy go jako mobilnego kontrolera. `lib/storage.ts`, `auth.ts`, `sheets-sync.ts`, moduły konektorów oraz trasy API pozostają poza pakietem mobilnym.

Potwierdzone w aktualnym kodzie: `lib/domain.ts` w walidacji całego webowego stanu wymaga co najmniej jednego wykonanego ćwiczenia przy statusie `completed`. **Nie przenosimy tej reguły.** Mobilny trening drużyny, bieg lub mecz może być wykonany bez listy ćwiczeń i liczy się do odpowiednich statystyk. Nie zmieniamy tej reguły równolegle w webowym backendzie.

Szablon całego treningu oraz mierzalny cel są nowymi modelami; web dostarcza tylko szablony pojedynczych sekcji i opisowy cel okresu. Sport treningu pozostaje niezależny od typu ćwiczenia.

## Kolejność i weryfikacja

Narzędzia JDK, SDK i Android Studio są zainstalowane. Zakres implementacji opisany powyżej jest gotowy. Testy danych: 96 PASS; końcowy build 3: 18/18 testów Chrome PASS, kontrola 15 zrzutów PASS bez przepełnienia i błędów, Gradle BUILD SUCCESSFUL. Podpis APK, zachowanie certyfikatu 0.2.0 i zgodność wszystkich 13 zasobów klienta potwierdzono. Szczegółowe wyniki publikuje [mobile-validation.md](mobile-validation.md).

Główny scenariusz: dwa sporty → własne ćwiczenie → szablon → plan w okresie → wykonanie ze zmianą parametrów i notatką → samopoczucie → statystyki i cel → restart offline → eksport i odtworzenie. Dodatkowe sprawdzenia: szybki trening bez ćwiczeń, historia po zmianie sportów, puste dane, niezmienność migawek, daty/tygodnie, błędy zapisu i migracja starej bazy.

Testy danych, przeglądarki i urządzenia mają osobne wyniki. Użytkownik uruchomił aplikację na telefonie i przekazał zrzuty, ale dokładna zainstalowana wersja jest nieznana. Zbudowanie APK nie oznacza sprawdzenia SQLite po zatrzymaniu procesu i restarcie telefonu. Restart, aktualizacja, systemowe udostępnianie i insets 0.3.0 wymagają próby natywnej. Obecnie brak dostępnego urządzenia; wpis `emulator-5562` jest offline i nie stanowi działającego emulatora.

## Praca z projektem UI

`design/mobile-ui/` należy do osobnego czatu UI. Przeczytano jego propozycję 01: cztery wejścia do dziennika, planu, bazy i postępów, ustawienia/eksport w nagłówku, proste formularze i wyraźne szkice. Nawigacja wspiera zakres, lecz estetyka i dane demonstracyjne prototypu nie są automatycznie decyzją użytkownika. Produkcyjny klient korzysta wyłącznie z rzeczywistych lokalnych danych.

