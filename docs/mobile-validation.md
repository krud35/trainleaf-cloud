# Trainleaf 0.3.0 — weryfikacja 2026-10-04

## Wyniki

- **96/96 testów danych i obliczeń PASS**: prawdziwe pliki SQLite, migracje, rollback, rewizje/epoki, starsze kopie, recovery, lokalne daty, cele, jawne role mięśni i prototyp rezerwy w planie.
- **18/18 testów Chrome PASS** w jednym końcowym przebiegu (2 minuty) na niezmienianym build3: `index-D5010sTK.js`, `index-DJNBtkn1.css`. Testy uruchomiono bezpośrednio przez Playwright, bez kolejnego budowania klienta.
- **TypeScript PASS**, lint całego `mobile/src` i konfiguracji Vite bez błędów i ostrzeżeń. Po jedynej zmianie build3 (brak pomiaru minut pokazuje „—”, nie zero) ponownie PASS typecheck i lint zmienionego pliku.
- **QA interfejsu PASS** na build3: 15 zrzutów, szerokości 320/360/1280 px i tekst 200%, bez przepełnienia dokumentu i błędów JavaScript. Dzisiaj, Inne, tydzień/miesiąc/sezon, mapa 3D front/back, szczegóły mięśnia i pomoc rezerwy. Kalendarz przewija dni lokalnie; duże dialogi mają własne przewijanie. Testy Postępów/Samopoczucia dodatkowo sprawdzają 360 px i tekst 200%.
- **Android BUILD SUCCESSFUL**: końcowy build3, 1 min 24 s, 217 zadań. Raport podpisu i zgodności wszystkich plików klienta: `outputs/trainleaf-0.3.0-verification.json`.

Podpis APK **PASS**, certyfikat identyczny z 0.2.0. Wszystkie **13 plików klienta** wewnątrz APK ma takie same SHA-256 jak końcowy przetestowany `dist-mobile`. Pakiet `com.frisbeeprep.app`, wersja 0.3.0 / kod 3, 14 405 358 bajtów, minimum API 24 i target 36. SHA-256: `04051985F0D3E98C959B5D12A7F8D715B1F99E50FBB667DEA8C67458AD408B88`.

## Zakres regresji

Pełny przepływ tworzy profil dwóch sportów, własne ćwiczenie/notatkę, szablon, okres, plan i wykonanie z innymi parametrami. Obejmuje ankietę, samopoczucie, cel, eksport JSON/CSV i przywrócenie kopii. Zmiana katalogu nie narusza historycznych migawek. Nowy proces Chrome otwiera aplikację i surowy szkic offline; dwa okna nie nadpisują konkurencyjnych zapisów, a błąd trwałego zapisu zachowuje formularz.

Regresje iteracji 2 zachowują RIR, superserie bez podwójnego liczenia, kopiowanie przez granicę roku, null/zero, mentalne zero, zapisany load v1 i osobne czas × RPE. W 0.3.0 poprawiono dopasowanie publicznego cache do modułów pobieranych z nagłówkiem Origin; po restarcie offline aplikacja uruchamia się z pełnego lokalnego pakietu. Reguła dotyczy wyłącznie listy publicznych plików klienta.

Iteracja 3 sprawdza kontekst tydzień/miesiąc/sezon i zmianę roku, wydarzenia/wyjazdy, rodzaje sesji, szczegóły przed edycją i oddzielne planowane/wykonane wartości. Rezerwa zachowuje stałe odniesienie S podczas przesunięcia sesji; niepełna historia pozostaje nieznana. Mapa uwzględnia rozpoznane ćwiczenia oporowe i jawne role, odróżnia cel nieustawiony, zero i przekroczenie własnego celu. Brak pomiaru nie staje się zerem. Testy potwierdzają umowę programu, nie walidację fizjologiczną.

Postępy/Samopoczucie mają testy obliczeń i kontrolowanego repozytorium interfejsu: null/zero, przyszłość, równe zakresy porównania, pory i kompletność odpowiedzi, cele snu/check-inów, detail→edit, błąd zapisu, udany commit z nieudanym odświeżeniem, konflikt/epoka, guard odrzucania i powrót z zachowanym kontekstem. Testy komponentów nie są testem natywnego SQLite.

## Migracje i trwałość

Baza ma schemat **7**, pełna kopia **v4**, z odczytem v1/v2/v3. Migracje 1–5 pozostają zgodne bajtowo z wydaniem 0.2.0. Migracja 6 jest zamrożona, a 7 naprawia pełną szóstkę i wcześniejszy wariant szóstki zawierający tylko wydarzenia. Nie ma resetu danych. Testy sprawdzają transakcyjność, idempotencję, rollback i zachowanie surowych dawnych wartości/load/revision.

`tests/support/mobile-0.2-fixture/` zawiera przenośną, syntetyczną bazę schematu 5 i kopię v3 wygenerowane przez zachowane źródła wydania 0.2.0. Pochodzenie i SHA-256 są zapisane w tym samym katalogu. Testy nie potrzebują zewnętrznego `outputs/trainleaf-0.2.0-audit`. Nie mamy analogicznego dokładnego fixture źródeł 0.1.0 i nie deklarujemy takiej weryfikacji.

Uszkodzony rekord nadal blokuje normalne otwarcie bazy i udostępnia eksport ratunkowy surowych tabel. Nie jest po cichu pomijany ani nadpisywany. Automatyczna kwarantanna pojedynczego rekordu nie należy do tego wydania.

## Artefakty i audyt

- APK i raport: `outputs/trainleaf-0.3.0-debug.apk`, `outputs/trainleaf-0.3.0-verification.json`; bieżący skrót `outputs/trainleaf-debug.apk` jest aktualizowany dopiero po końcowej weryfikacji.
- Źródła do audytu: `outputs/trainleaf-0.3.0-audit/AUDIT-MANIFEST.json` i `outputs/trainleaf-0.3.0-sources.zip`. Manifest wiąże hashe źródeł z hashem APK; nie jest dowodem niezależnie powtarzalnej kompilacji.
- Zrzuty/wynik: `test-results/uiqa-iteration3/`; regresje Chrome: `test-results/mobile/`.
- Kontrakt i pochodzenie założeń: `mobile-iteration-3-contract.md`, `mobile-iteration-3-methods.md`; odpowiedzi na etap 1 audytu: `mobile-iteration-3-audit-response.md`.
- Historyczne APK, źródła i raporty 0.1.0/0.2.0 pozostają zachowane. Wyniki starszych wersji: `mobile-validation-0.1.0.md`, `mobile-validation-0.2.0.md`.

Etap 1 audytu dotyczył pośredniego stanu kodu. Końcowy pakiet źródeł/APK służy do etapu 2; przygotowanie pakietu nie oznacza pozytywnego niezależnego audytu.

## Granice potwierdzenia

Użytkownik potwierdził uruchomienie aplikacji na telefonie i przekazał zrzuty; **dokładna zainstalowana wersja nie została ustalona**. Nie przypisujemy tej obserwacji do 0.1.0 ani 0.2.0. ADB udostępniał wyłącznie niedostępny transport `emulator-5562` w stanie offline. Nie przeprowadzono prób natywnych 0.3.0: aktualizacji z zachowaniem danych, restartu/force-stop, systemowego eksportu/importu, przycisku Android Wstecz ani insets na urządzeniu.

Obsługa Android Wstecz jest podpięta do dialogów, ochrony formularza i zapisu szkicu; projekt kompiluje się z `@capacitor/app`. Przeglądarkowe guardy są sprawdzone osobno. Test urządzenia powinien zacząć się od aktualizacji istniejącej instalacji bez odinstalowania, następnie objąć restart offline ze szkicem, kopię JSON i odtworzenie, duży tekst, klawiaturę i paski systemowe.

APK debug służy do instalacji testowej. iOS i wydanie sklepowe są osobnymi etapami. Ostrzeżenia Vite o fragmentach ponad 500 KB oraz Gradle o flatDir/wersji opisu SDK nie są błędami kompilacji. Zasoby klienta, mapa 3D i informacja licencyjna three są lokalne.
