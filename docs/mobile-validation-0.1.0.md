# Trainleaf — weryfikacja 2026-10-03

## Wyniki automatyczne

- **42/42 testy danych i obliczeń PASS** (`npm run mobile:test`): 30 prób SQLite/recovery oraz 12 prób kalendarza, celów, objętości i CSV.
- **5/5 testów Chrome PASS**: pełny przepływ indywidualny, częściowy szkic po restarcie offline, trwałość historii i ustawień po pełnym zamknięciu przeglądarki, równoległe karty z konfliktem starej edycji oraz błąd IndexedDB symulujący brak miejsca.
- **TypeScript PASS**, lint klienta mobilnego **0 błędów i 0 ostrzeżeń** po poprawieniu cyklu autosave i mapowania pól.
- **Kompilacja React/Vite PASS**, synchronizacja trzech wtyczek Android PASS. Pierwsza pełna kompilacja Androida z Filesystem/Share: **BUILD SUCCESSFUL**.
- **Końcowe APK PASS**: podpis v2, etykieta Trainleaf, minimum Android API 24, target 36. Wszystkie 10 plików klienta w APK ma identyczny SHA-256 jak końcowy `dist-mobile`. Pakiet ma 14 252 255 bajtów; jego SHA-256: `CD003036B09F985E9390692F80C10FF39EA79F19125A2B194F89F7D7C12C7689`.
- Po ujednoliceniu nazwy ponowiony główny przepływ **PASS**. Obejrzano zrzuty katalogu, edytora i dziennika 360 px oraz postępów przy tekście 200%; brak poziomego przepełnienia. Nawigacja przy dużym tekście przechodzi w układ 2×2.

Główny scenariusz tworzy dwa sporty, własne ćwiczenie i notatkę, szablon całej sesji oraz okres, zapisuje plan i faktyczne wykonanie z innymi seriami/powtórzeniami/ciężarem i notatką, dodaje samopoczucie i cel. Zmiany katalogu i szablonu nie zmieniają wcześniejszych migawek sesji. Następnie nowy proces Chrome otwiera ten sam profil offline. Test usuwa sport z preferencji, zapisuje wykonany trening bez ćwiczeń i pomiarów, pobiera JSON/CSV, celowo zmienia historię i przywraca ją po podglądzie oraz jawnym potwierdzeniu.

Test szkicu zachowuje częściową wartość `12,`, niewypełnione serie i notatkę po całkowitym restarcie Chrome bez sieci; nie tworzy ukończonego treningu i pozwala jawnie porzucić szkic.

Testy SQLite obejmują migrację dokładnego schematu v3 z obowiązkowym czasem, rollback migracji i przywracania, odtworzenie kopii v1/v2, stare tokeny edycji, zachowanie progu rewizji po usunięciach, atomowy zapis sesji/usunięcie szkicu, hierarchie okresów, daty, zmiany czasu, null/zero i niezależność migawek. Recovery zachowuje wadliwe wiersze, również tabele nieznanej wersji z nietypowymi nazwami, bez modyfikowania bazy. Błędy częściowego odczytu i limit 25 MiB są jawne.

## Pliki

- APK do testów: `outputs/trainleaf-debug.apk`.
- Końcowe dane kontroli pakietu: `outputs/apk-verification.json`.
- Zrzuty i artefakty testów: `test-results/mobile/`.
- Instrukcja środowiska i testu urządzenia: `docs/android-development.md`.

Nazwa widoczna to Trainleaf. Identyfikatory instalacji, bazy, cache i formatu kopii pozostają zgodne z wcześniejszym fundamentem. W tej pracy nie edytowano webowego backendu ani projektu `design/mobile-ui/`.

## Granice potwierdzenia

Nie podłączono telefonu ani emulatora. Nie wykonano natywnego testu SQLite po zatrzymaniu procesu/restarcie telefonu, rzeczywistego selektora importu ani systemowego przekazania eksportu. Gotowe APK i Chrome nie zastępują tych sprawdzeń. Projekt iOS i wydanie Google Play pozostają osobnymi etapami.

Gradle zgłasza ostrzeżenia dotyczące flatDir i wersji opisów SDK; kompilacja jest udana. Vite zgłasza główny fragment większy niż 500 KB (lokalny katalog wraz z interfejsem); komplet zasobów mieści się w pakiecie i przeszedł restart offline.
