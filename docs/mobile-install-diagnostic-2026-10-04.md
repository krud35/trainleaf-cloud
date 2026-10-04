# Trainleaf 0.3.0 — diagnoza instalacji 2026-10-04

Użytkownik zgłosił brak zmiany wersji po aktualizacji, a następnie znikające okno instalatora i brak aplikacji po usunięciu starej wersji. Telefon: realme 9 Pro 5G (RMX3472), Android 13.

## Stan potwierdzony na telefonie

Po połączeniu przez USB system nie miał zainstalowanego pakietu `com.frisbeeprep.app`. Plik `Download/trainleaf-0.3.0-debug.apk` był kompletny i miał dokładnie SHA-256 wydanego APK: `04051985F0D3E98C959B5D12A7F8D715B1F99E50FBB667DEA8C67458AD408B88`.

Plik `Download/trainleaf-debug.apk` zawierał natomiast starą wersję 0.1.0 (SHA-256 `CD003036B09F985E9390692F80C10FF39EA79F19125A2B194F89F7D7C12C7689`). To możliwe źródło pomyłki przy wcześniejszym wyborze pliku; nie jest dowodem przyczyny znikania instalatora podczas próby z wersjonowanym APK. Pliku użytkownika nie usunięto ani nie nadpisano.

Bezpośrednia instalacja zweryfikowanego APK przez ADB zakończyła się `Success`. Android potwierdził wersję 0.3.0 / kod 3, `installed=true`, `hidden=false`, `suspended=false` oraz aktywność startową `com.frisbeeprep.app.MainActivity` dla MAIN/LAUNCHER. Uruchomienie zwróciło `Status: ok` (1602 ms).

Odczyt interfejsu rzeczywistego WebView potwierdził platformę Android, lokalny adres `https://localhost/`, moduł `index-D5010sTK.js` i ekran „Jak trenujesz?”. Ekran błędu otwierania dziennika nie był widoczny. Nie tworzono testowego profilu ani wpisów na telefonie użytkownika. Aplikacja pozostała uruchomiona do konfiguracji.

Dokładna przyczyna zamykania ręcznego instalatora Realme nie została ustalona. Problem braku zainstalowanej aplikacji rozwiązano bezpośrednią instalacją tego samego, niezmienionego APK; nie zmieniano zabezpieczeń instalatora ani kodu aplikacji.

## Niezależna próba na emulatorze

Zainstalowano oficjalny Android Emulator i obraz Google APIs Android 13 x86_64. Użyto nowego, odizolowanego urządzenia `Trainleaf_Install_API33` wyłącznie z syntetycznymi danymi.

- Instalacja 0.2.0: PASS; utworzenie lokalnego profilu i potwierdzenie wersji w UI: PASS.
- Aktualizacja tego samego pakietu do 0.3.0: PASS; profil zachowany, nowy numer wersji widoczny.
- Usunięcie wyłącznie testowej instalacji na emulatorze i ponowna instalacja 0.3.0: PASS; ekran pierwszej konfiguracji widoczny, nowy profil zapisany.
- Force-stop i ponowne otwarcie 0.3.0 na emulatorze: PASS; testowy profil zachowany.

Pierwszy start świeżego emulatora miał opóźnienie i komunikat ANR procesu System UI; po uruchomieniu systemu oraz zmniejszeniu rozdzielczości powyższe próby przeszły. Nie przypisano tego komunikatu do aplikacji Trainleaf. Skrypty diagnostyczne zamykają wszystkie własne połączenia do urządzeń, aby nie pozostawiać procesów po sprawdzeniu.

## Dowody i ograniczenia

Odczyt telefonu: `test-results/android-install-0.3.0/realme-ui.json`. Zrzuty emulatora: `seed-old.png`, `upgrade-new.png`, `fresh-new.png`, `restart-new.png` w tym samym katalogu. Skrypty: `outputs/native-install-ui-check.mjs`, `outputs/inspect-trainleaf-phone.mjs`.

To uzupełnienie walidacji wykonane po zamrożeniu wydania; historycznego APK, ZIP źródeł i manifestu audytu nie zmieniano. Na fizycznym telefonie potwierdzono instalację i start wersji 0.3.0. Nie przeprowadzono tam aktualizacji zachowującej dawne dane (poprzednia instalacja została już usunięta przez użytkownika), pełnego restartu telefonu ani systemowego eksportu/importu. Próby emulatora nie zastępują tych pozostałych testów urządzenia.
