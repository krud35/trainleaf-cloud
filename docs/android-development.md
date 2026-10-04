# Trainleaf — lokalna aplikacja Android

Stan: 2026-10-04, Trainleaf 0.3.0 (`versionCode=3`, `appId=com.frisbeeprep.app`). Produkcyjny klient znajduje się w `mobile/`, projekt natywny w `android/`. Android jest pierwszą platformą. Wspólne komponenty React, model danych i adaptery uwzględniają przyszły iOS; projektu iOS jeszcze nie utworzono i nie sprawdzono go na urządzeniu Apple.

## Narzędzia na tym komputerze

Zainstalowane i sprawdzone podczas kompilacji:

- Android Studio Rabbit 1, 2026.2.1.8: `C:/Users/marod/AppData/Local/Programs/Android Studio`. Skrót w menu Start. Podpis instalacji Google sprawdzony; archiwum zweryfikowane SHA-256.
- Temurin JDK 21.0.12.1+1: `C:/Users/marod/AppData/Local/Programs/Java/temurin-21`. Dołączony do Studio JBR 25.0.3 służy edytorowi; Gradle 8.14.3 korzysta z osobnego JDK 21.
- Android SDK: `C:/Users/marod/Android/Sdk`. Command-line Tools 22.0, platforma Android 36, Build Tools 35.0.0 i 36.0.0, Platform Tools 37.0.1.
- Node.js 24.19.0 i lokalne zależności z `package-lock.json`.

`JAVA_HOME`, `ANDROID_HOME` oraz wpisy PATH ustawiono dla użytkownika. Nowy terminal odczyta je po ponownym otwarciu. SDK umieszczono poza AppData, aby uniknąć wirtualizacji MSIX.

Lokalne, ignorowane przez Git ustawienia projektu:

- `android/local.properties`: `sdk.dir=C:/Users/marod/Android/Sdk`.
- `android/.gradle/config.properties`: `java.home=C:/Users/marod/AppData/Local/Programs/Java/temurin-21`.
- `android/.idea/gradle.xml`: `gradleJvm=#GRADLE_LOCAL_JAVA_HOME`.

Źródła wymagań: [Capacitor 8](https://capacitorjs.com/docs/updating/8-0), [wybór JDK w Android Studio](https://developer.android.com/build/jdks#gradle-jdk-config).

## Budowanie i podgląd

Polecenia z katalogu `ultimate-planner`:

```powershell
npm ci
npm run mobile:dev
npm run mobile:typecheck
npm run mobile:test
npm run mobile:test:e2e
npm run android:sync
./android/gradlew.bat -p android assembleDebug --no-daemon --console=plain
```

Podgląd mobilny: `http://127.0.0.1:4174`. Zbudowany klient można pokazać przez `npm run mobile:preview`. Wejście webowe Next/vinext pozostaje oddzielne. `npm run android:open` otwiera projekt Android Studio.

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Końcowa kopia do przekazania: `outputs/trainleaf-debug.apk`. To podpisana wersja debug do testów, bez konfiguracji publikacji Google Play. Pierwszy fundament przed rozszerzeniem pozostaje jako historyczne `outputs/fieldwork-foundation-debug.apk`.

`android:sync` buduje `dist-mobile`, kopiuje pliki do Androida i rejestruje wtyczki. Należy go wykonać po zmianie klienta. Pakiet ładuje lokalne zasoby i nie zawiera `server.url`.

## Nazwa i zgodność

Nazwa produktu to **Trainleaf**, dokładnie w tej pisowni. Widać ją w kliencie, metadanych i etykiecie Androida. Eksport proponuje nazwy `trainleaf-*.json` i `trainleaf-*.csv`.

Celowo zachowano `com.frisbeeprep.app`, bazę `fieldwork_local`, klucz podglądu `fieldwork-mobile-preview`, nazwę blokady i prefiks cache `fieldwork-mobile-shell-`. Zachowano format `training-companion-backup`. To identyfikatory istniejących danych i instalacji. Zmiana nazwy produktu nie migruje ich i nie utrudnia odczytu starszych kopii. Ewentualna późniejsza zmiana identyfikatora pakietu wymaga osobnego planu przeniesienia danych.

## Obecny zakres indywidualny

- Lokalny profil z grupowanymi sportami i konfigurowalnymi skrótami. Zmiana sportów zachowuje historię.
- Dziennik z planem i wykonaniem, trzema sekcjami ćwiczeń, czasem, RPE, notatkami, kopiowaniem, usuwaniem i trwałymi szkicami. Wykonany trening bez ćwiczeń i bez pomiarów jest prawidłowy.
- Katalog w pakiecie, wyszukiwanie, instrukcje, własne ćwiczenia i osobne notatki. Archiwizacja ćwiczenia nie zmienia jego migawek w historii.
- Szablony sekcji i całych treningów, tworzenie z zapisanej sesji, edycja i duplikowanie. Zastosowanie tworzy niezależne pozycje bez wykonanego obciążenia.
- Plan tygodnia, miesiąca i sezonu, kopia sesji/tygodnia, okresy z datami i opcjonalną hierarchią, wydarzenia i wyjazdy.
- „Rezerwa w planie”: prototyp porównania scenariuszy z jawną migawką odniesienia S, osobnym planowanym load i oznaczeniem braków danych; bez fizjologicznych procentów gotowości.
- Mapa 3D objętości treningu siłowego z własnymi celami i jawnymi rolami bezpośrednimi/pośrednimi; planowane i wykonane serie mają osobne widoki.
- Samopoczucie według pory dnia, edycja i historia. Brak pomiaru jest odróżniony od zera. Nowe ekrany postępów i samopoczucia oraz szczegóły rekordu przed edycją.
- Cele liczby/czasu treningów, aktywnych dni, dni check-in i średniego snu, wykonanie planu, wykresy tygodni i samopoczucia, obciążenie czas × RPE oraz objętość ćwiczeń w osobnych jednostkach.
- Ochrona wyjścia z niezapisanych formularzy i obsługa systemowego Back przez `@capacitor/app@8.1.2`.
- Pełna kopia JSON, CSV, walidowany podgląd kopii i jawne zastąpienie danych.

Nie są włączone konta online, automatyczna chmura, synchronizacja z trenerem, płatności, AI ani kursy. Linki do filmów i materiałów źródłowych wymagają internetu; sam katalog i opisy są lokalne.

## Baza i odporność na błędy

SQLite ma schemat 7. Migracje 1–5 pozostają bez zmian względem 0.2.0, a migracja 6 jest zamrożona. Migracja 7 uzupełnia brakujące elementy zarówno pełnej, jak i wcześniejszej częściowej bazy 6, bez resetu danych. Zachowuje wcześniejszy profil, dziennik i zapisane load v1; czas treningu dopuszcza null i zero. Encje są w osobnych tabelach, mają UUID, rewizje i lokalne metadane. Transakcja kończy się dopiero po potwierdzonym zapisie.

Android używa `@capacitor-community/sqlite@8.1.1`, serializowanej kolejki i `synchronous=FULL`. Podgląd używa SQLite WASM, IndexedDB i Web Locks. Nie stosuje pamięciowego fallbacku udającego trwały zapis.

Formularze przechwytują rewizję i epokę danych. Przywrócenie zwiększa epokę i nadaje świeże rewizje ponad historyczny próg. Usunięcia fizyczne zachowują ten próg. Zapis treningu i usunięcie dokładnej wersji jego szkicu są jedną transakcją. Konflikt nie nadpisuje obcej edycji; edytor może jawnie zapisać zachowaną treść jako osobny trening.

Kopia `training-companion-backup` v4 obejmuje wszystkie encje, również szkice, historię usunięć treningów, wydarzenia, odniesienia prognozy, role i cele mięśniowe. Import v1/v2/v3 jest obsługiwany. Całość jest walidowana przed atomowym zastąpieniem. Limit JSON wynosi 25 MiB UTF-8, szkicu 100 KB. CSV zabezpiecza pola przed interpretacją jako formuły arkusza; służy do analizy, a odtwarzanie pełnego stanu używa JSON.

Uszkodzony wpis nie jest automatycznie usuwany ani zastępowany pustą bazą. Ekran błędu udostępnia ratunkowy eksport surowych tabel bez walidacji domeny i migracji. Format `training-companion-recovery` jest odrębny, opisuje ewentualne braki odczytu i służy ręcznemu odzyskiwaniu. Normalny import nie przyjmuje go jako kopii.

## Pliki, offline i prywatność

Jawny eksport na Androidzie używa [Filesystem](https://capacitorjs.com/docs/apis/filesystem) w prywatnym cache oraz [Share](https://capacitorjs.com/docs/apis/share) do wyboru aplikacji docelowej. Użytkownik kończy zapis w wybranej aplikacji; samo zamknięcie systemowego okna nie dowodzi zapisania pliku. FileProvider udostępnia tylko podkatalog `exports/`, nie bazę. Wybór importu odbywa się przez systemowy selektor pliku.

Nie ma uprawnień do zdjęć, kontaktów, lokalizacji ani szerokiego dostępu do plików. Standardowe `INTERNET` pozostaje w szablonie Capacitor, lecz klient nie ma zdalnego API ani telemetrii. CSP dopuszcza własne zasoby. Biometria nie jest używana, a jej uprawnienia są usunięte z manifestu.

`allowBackup=false` oraz jawne reguły wyłączają automatyczne kopie i transfer danych Androida. [Dokumentacja kopii Androida](https://developer.android.com/identity/data/autobackup). SQLite korzysta z prywatnego katalogu aplikacji; nie dodano osobnego klucza szyfrującego. Ręczne kopie są zwykłymi plikami zawierającymi prywatne notatki.

Przeglądarkowy service worker zapisuje kompletny zbudowany klient i WASM. Nowa wersja czeka na zamknięcie kart starej wersji, aby nie mieszać plików. Android korzysta bezpośrednio z pakietu i nie rejestruje tego workera. Odinstalowanie aplikacji lub wyczyszczenie jej danych usuwa lokalną historię bez ręcznej kopii.

W przyszłym projekcie iOS trzeba osobno skonfigurować kopie systemowe i manifest prywatności Filesystem, w tym dostęp do znaczników czasu plików. Wspólny adapter nie zastępuje testu na urządzeniu Apple.

## Weryfikacja na urządzeniu — pozostały krok

Użytkownik uruchomił aplikację na telefonie i przekazał zrzuty ekranu; dokładna wersja zainstalowanego APK jest nieznana. Natywne próby wersji 0.3.0 obejmujące restart, aktualizację z zachowaniem danych, systemowe udostępnianie i insets pozostają niewykonane. Nie ma dostępnego urządzenia: wpis `emulator-5562` jest offline i nie stanowi działającego emulatora. Automatyczna weryfikacja danych i Chrome nie zastępuje tych prób.

Po podłączeniu telefonu należy:

1. Zaktualizować istniejącą instalację przez APK bez odinstalowania aplikacji; sprawdzić zachowanie danych i włączyć tryb samolotowy przed uruchomieniem nowej wersji.
2. Przejść pełny scenariusz: dwa sporty, własne ćwiczenie, szablon, plan w okresie, zmienione wykonanie, notatka, samopoczucie i cel.
3. Zostawić częściowy szkic, wymusić zatrzymanie aplikacji, otworzyć ją offline i porównać dane.
4. Zrestartować telefon i sprawdzić historię oraz szkic.
5. Zapisać JSON w systemowej aplikacji Pliki, zmienić historię i odtworzyć kopię przez selektor.
6. Sprawdzić klawiaturę, przewijanie, obrót, pasek systemowy, duży tekst i odmowę zapisu.

Wyniki automatyczne i status końcowej kompilacji są zapisane w [mobile-validation.md](mobile-validation.md). Testy danych: 96 PASS; końcowy build 3: 18/18 testów Chrome PASS, kontrola 15 zrzutów PASS bez przepełnienia i błędów, Gradle BUILD SUCCESSFUL. APK 0.3.0/code 3 zachowuje identyfikator pakietu i certyfikat 0.2.0; weryfikacja podpisu oraz zgodność wszystkich 13 zasobów klienta przeszły pomyślnie. Wersja debug nie jest wydaniem sklepowym.


Szczegółowy zakres wersji 0.2.0, ankiety i wskaźnik Trainleaf v1 opisuje [mobile-iteration-2.md](mobile-iteration-2.md). Rozszerzenia 0.3.0, migracje i kompatybilność opisuje [kontrakt iteracji 3](mobile-iteration-3-contract.md), a przyjęte konwencje i ograniczenia prototypu — [zasady planowania](mobile-iteration-3-methods.md).
