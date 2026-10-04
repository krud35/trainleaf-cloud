# Trainleaf 0.2.0 — weryfikacja 2026-10-03

## Wyniki

- **65/65 testów danych i obliczeń PASS**: prawdziwe pliki SQLite, migracje i rollback, stare kopie, rewizje/epoki, recovery, daty i strefy czasowe, RIR, superserie, mięśnie i wersjonowany load.
- **7/7 testów Chrome PASS w jednym końcowym przebiegu (1,3 min)**: pięć wcześniejszych regresji oraz dwa scenariusze nowej iteracji. Końcowy klient: `index-BSeHfGXf.js`, `index-YLTKiXa3.css`. Podczas tego przebiegu nie przebudowywano zasobów.
- **TypeScript PASS**, lint całego `mobile/src` bez błędów i ostrzeżeń.
- **QA interfejsu PASS**: 1280, 360 i 320 px, tekst 200%, brak przepełnienia całego dokumentu, fokus nad dolną nawigacją, lokalne przewijanie siedmiu dni, edytor i pomoc RIR. Rysowane liście zachowują treść przy większym tekście.
- **Dotyk i suwaki PASS**: jawne zero pozostaje zerem; nietknięte i wyczyszczone pytanie pozostaje bez odpowiedzi. Zweryfikowano dane wyeksportowane po zapisie i ponownym otwarciu.

**Android BUILD SUCCESSFUL; podpis APK PASS.** Certyfikat jest identyczny z wersją 0.1.0. Wszystkie 10 plików klienta wewnątrz APK ma takie same SHA-256 jak końcowy, przetestowany `dist-mobile`. Pakiet ma 14 101 112 bajtów, wersję 0.2.0 / kod 2, minimum API 24 i target 36. SHA-256: `66C184A27EE9B568D8B2ED660C605251AE4679235340D63127E3521181E9B19B`. Pełny raport: `outputs/trainleaf-0.2.0-verification.json`.

## Sprawdzone przepływy

Pełny scenariusz tworzy profil dwóch sportów, własne ćwiczenie i notatkę, szablon oraz okres. Przechodzi od planu do wykonania z innymi parametrami, ankiety, samopoczucia i celu. Zmiana katalogu i szablonu nie narusza historii. Po zamknięciu całego procesu Chrome nowy proces uruchamia aplikację offline, zachowując dane. Usunięcie sportu z preferencji nie usuwa historii. Test pobiera JSON/CSV, celowo zmienia wpis i odtwarza wcześniejszy stan po podglądzie i potwierdzeniu.

Pozostałe regresje obejmują częściowy szkic po restarcie offline, niezależne zapisy z dwóch kart, konflikt starego formularza oraz błąd zapisu IndexedDB imitujący brak miejsca.

Nowe scenariusze sprawdzają trzy ćwiczenia w superserii, kolejność rund z różną liczbą serii, RIR, sumę sześciu planowanych serii bez podwójnego liczenia, kopię przez granicę roku oraz zachowanie importowanego wykonania z przyszłą datą poza historią wykonanych treningów. Ankieta rozróżnia 0/null, daje wynik Trainleaf 13,0 dla 40 minut treningu siłowego i obu ocen 0, zachowuje mentalne 0 bez fizycznych ocen oraz oddzielne czas × RPE.

Testy domenowe obejmują migrację v4→v5 z zachowaniem starego sportu, null rodzaju i dawnych kilogramów, import v1/v2→v3, przywracanie szkiców, generowanie nowych identyfikatorów kopii i grup, alfabet superserii powyżej 26 pozycji, granice okresów, lokalne daty Warszawy/Los Angeles/Kiritimati i zmianę czasu. Zapisany load sprawdzany jest według własnych zachowanych parametrów; błędne wejścia/wyniki są odrzucane. Edycja notatki nie przelicza dawnej wartości.

W przeglądzie naprawiono także rozszerzanie strony przez ukryty napis „Dzisiaj” przy dużym tekście, epokę ankiety po zapisaniu konfliktowego szkicu jako nowego treningu oraz przekazywanie epoki przy edycji/usuwaniu celów i okresów.

## Artefakty

- Nowe APK: `outputs/trainleaf-0.2.0-debug.apk`; bieżący skrót: `outputs/trainleaf-debug.apk`.
- Zachowane poprzednie APK: `outputs/trainleaf-0.1.0-debug.apk`.
- Raport pakietu: `outputs/trainleaf-0.2.0-verification.json`.
- Zrzuty i wynik QA: `test-results/uiqa-4176/`; końcowe regresje: `test-results/mobile/`.
- Audytowalna kopia źródeł: `outputs/trainleaf-0.2.0-audit/AUDIT-MANIFEST.json` i `outputs/trainleaf-0.2.0-sources.zip`.
- Zakres i wzór wskaźnika: `docs/mobile-iteration-2.md`. Wyniki poprzedniej wersji: `docs/mobile-validation-0.1.0.md`.

## Granice potwierdzenia

Użytkownik potwierdził instalację i uruchomienie 0.1.0 na telefonie. Nie jest to test trwałości SQLite po zatrzymaniu procesu/restartach ani systemowego importu/eksportu. Przy końcowym sprawdzeniu ADB pokazywał jedynie niedostępny transport `emulator-5562` w stanie offline. Wersji 0.2.0 nie uruchomiono na dostępnym fizycznym urządzeniu/emulatorze. Natywne próby restartu, aktualizacji z zachowaniem danych i udostępnienia pliku pozostają do przeprowadzenia na telefonie.

Pakiet debug służy do instalacji testowej. Identyfikator aplikacji i klucz podpisu pozostają zgodne z 0.1.0; aktualizacja nie wymaga odinstalowania aplikacji. iOS i wydanie sklepowe są osobnymi etapami.

Vite ostrzega o fragmencie klienta większym niż 500 KB; Gradle o flatDir i wersji opisów SDK. Nie są to błędy kompilacji. Katalog i wszystkie pliki klienta są zawarte w lokalnym pakiecie.
