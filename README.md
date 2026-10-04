# Trainleaf

Planer ultimate frisbee z interfejsem PL/EN. Trener zarządza planami, a zawodnicy mają osobne konta i dostęp do własnego profilu.

Nazwa produktu to **Trainleaf**. Dla zgodności istniejących instalacji pozostają dotychczasowe identyfikatory techniczne: zmienne `FIELDWORK_*`, klucze języka i sesji, identyfikatory danych, adres wdrożenia oraz nazwy zarządzanych zakładek Sheets `FW …`. Dotychczasowe dane, format CSV i historyczne informacje o pochodzeniu ćwiczeń pozostają zgodne; pobierane pliki CSV mają nazwę `Trainleaf-<profil>-<data>.csv`. Zmiana nazwy nie wymaga migracji danych ani zmiany konfiguracji Google Apps Script.

## Android i przyszły iOS — lokalny etap 1

Decyzja z **2026-10-03**: bieżące wdrażanie i testy skupiają się na Androidzie; architektura ma uwzględniać również iOS. Osobny klient `mobile/` korzysta z Reacta i Capacitor, ze wspólnym modelem danych oraz adapterami urządzenia. Nie zmienia sposobu logowania ani przechowywania danych dotychczasowego panelu webowego. Szczegóły, ograniczenia i instrukcja budowania są w [dokumentacji Androida](docs/android-development.md).

W tym etapie działają lokalny profil bez konta, wybór kilku sportów, zmienialne preferencje modułów oraz zapis, edycja i historia treningów. Planowanie i nauka mają na razie zapis preferencji; ich pełne widoki oraz współpraca z trenerem pozostają kolejnymi etapami. Android ma adapter natywnego SQLite; podgląd przeglądarkowy zapisuje ten sam schemat SQL przez sql.js w IndexedDB. Żaden z tych przepływów nie wysyła treningów do serwera. Nie ma jeszcze APK ani testu na urządzeniu — brakuje JDK i Android SDK.

```sh
npm run mobile:dev
npm run mobile:typecheck
npm run mobile:test
npm run mobile:test:e2e
npm run android:sync
```

`mobile:test:e2e` buduje klienta i testuje go w lokalnym Chrome (można wybrać przeglądarkę przez `PLAYWRIGHT_CHANNEL`). Test trwałości zamyka cały proces przeglądarki, otwiera ten sam profil bez sieci, odczytuje trening, edytuje go i ponownie uruchamia klienta. Nie korzysta z osobistego profilu Chrome. Testy danych korzystają z rzeczywistego pliku SQLite, obejmują migracje, konflikty rewizji, błędy transakcji oraz kopie zapasowe. Te testy nie zastępują wymuszonego zatrzymania i restartu aplikacji na Androidzie.

Repozytorium danych ma wersjonowany format kopii i atomowe przywracanie, ale interfejs wyboru/zapisu plików będzie dodany osobno. Historia i kopie są lokalne; automatyczne kopie Androida są wyłączone. Przed używaniem aplikacji jako jedynego dziennika trzeba wdrożyć i sprawdzić eksport na urządzeniu.

## Funkcje

- Widok dzisiaj, kalendarz dnia/tygodnia/miesiąca, zawody, wyjazdy i własne wydarzenia.
- Plan i rzeczywiste wykonanie treningu, rozgrzewka / część główna / zakończenie, szablony i kopiowanie tygodnia. Domyślna rozgrzewka dla profilu.
- Baza ćwiczeń z polskimi i angielskimi nazwami, wskazówkami, wariantami, filmami i źródłami. Rzuty pochodzą z dostarczonego planu rzutowego.
- Osobne dawki liczbowe i opisowe zalecenia: serie, powtórzenia, ciężar, dystans, czas, tempo, przerwa i wysiłek. Migawka ćwiczenia w treningu zachowuje treść z chwili dodania.
- Zmęczenie 0–10, czas wykonania × RPE, analiza objętości osobno dla każdej jednostki i obrotowa mapa mięśni 3D z tabelą. Udziały mięśni są edytowalnymi szacunkami do planowania; kolory nie określają ryzyka urazu ani bezpiecznych progów.
- Makrocykle, mezocykle i mikrocykle z hierarchią oraz baza wiedzy ze źródłami.
- Osobny Google Sheets dla profilu, synchronizacja automatyczna lub ręczna, eksport CSV.

## Publiczny adres, prywatne plany

Adres strony może być publiczny: osoba niezalogowana widzi ekran logowania. Dane planera wymagają uwierzytelnienia na serwerze. Zawodnik widzi wyłącznie przypisany profil; prywatne notatki o profilu należą do trenera. Zawodnik zapisuje wykonanie, zmęczenie, swoje notatki i wydarzenia, ale nie zmienia planu trenera ani jego wydarzeń.

Dostęp trenera wymaga zmiennej środowiska serwera **`FIELDWORK_COACH_USER_ID`**, ustawionej na dokładny, stały `userId` konta ChatGPT właściciela. To identyfikator konta, nie adres e-mail. Przycisk „Zaloguj się kontem właściciela” korzysta z uwierzytelnienia ChatGPT. Brak konfiguracji blokuje dostęp; aplikacja nie nadaje roli trenera pierwszej osobie, która otworzy stronę. Wdrożenie wymaga również bazy D1 dostępnej jako binding `DB` i zastosowanych migracji z katalogu `drizzle`.

Aby założyć dostęp również dla własnego profilu zawodnika, zaloguj się jako trener, otwórz **Profile i dostęp → Login i hasło** przy swoim profilu. Tak samo nadajesz dostęp pozostałym profilom. Login ma 3–64 znaki (litery, cyfry, kropka, podkreślenie, myślnik), hasło 15–128 znaków. Przekaż osobie link i dane logowania. Hasła nie można odczytać później; zmiana hasła lub wyłączenie dostępu kończy poprzednie sesje. Sesja zawodnika trwa do 24 godzin. Konto zawodnika nie wymaga konta ChatGPT.

## Google Sheets · Apps Script v2

Konfigurację wykonuje trener w **Eksport i integracje**, po wybraniu profilu. Każda osoba potrzebuje osobnego pliku Google Sheets; aplikacja nie pozwala przypisać tego samego pliku do dwóch profili.

1. Utwórz plik, otwórz **Rozszerzenia → Apps Script** i wklej cały kod v2 z instrukcji w aplikacji.
2. W **Ustawienia projektu → Właściwości skryptu** ustaw `FIELDWORK_SHEET_ID` (fragment adresu pliku między `/d/` a `/edit`) oraz `FIELDWORK_SECRET` (losowy klucz, co najmniej 32 znaki; można wygenerować go w aplikacji).
3. Wdróż jako **Aplikacja internetowa**, wykonywana jako właściciel skryptu, dostęp **Wszyscy**. Zatwierdź uprawnienia Google. W planerze zapisz adres wdrożenia kończący się `/exec`, identyfikator pliku i ten sam klucz.
4. Przy aktualizacji starego mostka zastąp **cały kod wersją v2** i opublikuj nową wersję wdrożenia. Sam zapis w edytorze nie aktualizuje opublikowanej aplikacji. Jeśli powstaje nowy adres `/exec`, zmień go również w planerze.
5. Włącz synchronizację automatyczną albo uruchamiaj zapis ręcznie. Status pokazuje ostatni potwierdzony zapis, rewizję i błąd. Po błędzie użyj ponowienia ręcznego lub zapisz kolejną zmianę w aplikacji; automatyczne ponowienie następuje przy kolejnym zapisie, bez cyklicznego harmonogramu. Odświeżenie statusu nie uruchamia eksportu.

Eksport tworzy zakładki `FW YYYY-MM-DD` dla tygodni z danymi oraz tabelę danych. Każda zakładka tygodnia ma siedem bloków dni i osiem kolumn w układzie podobnym do dostarczonych planów. Nowe tygodnie powstają automatycznie przy synchronizacji. Treść eksportu jest obecnie po polsku. CSV zawiera płaską tabelę, a nie układ tygodniowy.

Synchronizacja jest **jednokierunkowa: aplikacja → Google Sheets**. Zarządzane zakładki są nadpisywane; zmiany i notatki wpisane bezpośrednio w nich nie wracają do aplikacji i mogą zostać zastąpione. Inne zakładki pozostają zachowane. Odłączenie zatrzymuje przyszłe zapisy i pozostawia plik na koncie Google. Błąd Google nie cofa zapisu planera. Klucz nie jest zwracany przez odczyt konfiguracji ani zapisany w kodzie źródłowym. Rzeczywiste połączenie wymaga konfiguracji i sprawdzenia na koncie Google użytkownika.

## Aktualizacja danych

Migracja katalogu v2 uzupełnia nowe ćwiczenia i zachowuje istniejące profile, treningi, wykonanie, notatki oraz migawki ćwiczeń. Usuwa wyłącznie rozpoznane, niezmienione domyślne rzuty i domyślny szablon rzutowy starej wersji; własne warianty pozostają. Brakujące poziomy okresów są uzupełniane jako mezocykle. Aktualizacja stanu jest przygotowywana przy odczycie, a utrwalana z następnym zapisem. Nie zmieniaj już zastosowanych plików migracji bazy.

Dostarczone skoroszyty wykorzystano do katalogu i odwzorowania układu; historyczne plany nazwanych osób nie są importowane do profili. Surowe daty niektórych arkuszy mają niejednoznaczny zapis dnia/miesiąca. Numer zakładki nie dowodzi daty filmu: dla niejednoznacznych źródeł zachowano alternatywne linki zamiast zgadywać „najnowszy” materiał. Opisy zaleceń i pochodzenia z plików mogą pozostać w oryginalnym języku po zmianie PL/EN; własne nazwy i notatki również nie są tłumaczone automatycznie.

## Uruchomienie i sprawdzenie

Node.js 22.13+ i npm:

```sh
npm ci
npm run dev
npx tsc --noEmit
node --test tests/domain.test.mjs tests/sheets.test.mjs tests/auth.test.mjs
npm run build
```

Testy domeny, eksportu i autoryzacji nie wymagają zewnętrznego Google; test autoryzacji korzysta z pamięciowej bazy SQLite. Zmiany schematu generuje `npm run db:generate`. Lokalny podgląd i produkcja mają osobne dane. Lokalna symulowana tożsamość trenera musi odpowiadać konfiguracji `FIELDWORK_COACH_USER_ID`; produkcja korzysta z tożsamości uwierzytelnionej przez platformę.

Testy integracyjne wymagają uruchomionego podglądu lokalnego pod `http://127.0.0.1:5173` i skonfigurowanego lokalnego trenera:

```sh
node tests/workflow.test.mjs
node tests/api.test.mjs
```

Uruchamiaj je tylko na lokalnych danych testowych, bez równoległych zapisów. Test workflow tworzy dane próbne i przywraca stan planera; może pozostawić wyłączone konto testowe. Test API wymaga co najmniej dwóch lokalnych profili bez połączeń Sheets i sprawdza także konflikt rewizji. Nie uruchamiaj tych testów przeciw produkcji. W przeglądarce sprawdź osobno izolację kont, zapis wykonania, odświeżenie danych, przełączenie języka, obsługę telefonu i prawdziwą synchronizację Google. Mapa 3D wymaga WebGL; przy jego braku pozostaje dostępna tabela.
# Aktualizacja katalogu i samopoczucia

Katalog v4 dodaje 37 ćwiczeń z bibliografią ACE, NASM i Catalyst Athletics oraz edytowalne cele ćwiczeń. Łączna domyślna baza zawiera 163 pozycje. Aktualizacja zachowuje dane i zmiany użytkownika; przy limicie 1000 pozycji dodaje tylko tyle nowych pozycji, ile mieści się w bazie. Mobilność i rozciąganie bez innych celów nie zwiększają liczby serii siłowych. Oryginalne starsze ćwiczenia są rozpoznawane po ID, nazwie i kategorii; zapisane sesje nie są przepisywane.

Periodyzacja udostępnia 16 opisanych celów/faz, własne nazwy oraz zarządzanie wydarzeniami. Makro-, mezo- i mikrocykl określają skalę czasu, a wybrana faza priorytet pracy.

Samopoczucie to oddzielne wpisy rano, w dzień i wieczorem, z historią 7/28 dni. Puste odpowiedzi pozostają brakami, zero jest poprawną odpowiedzią. Zawodnik zapisuje wyłącznie swój profil; trener widzi wpisy zawodnika bez edytowania ich przez formularz przeglądu. Własne wpisy lub wpisy na podstawie rozmowy trener może zapisywać w danym profilu. Nie jest wyliczany zbiorczy wskaźnik gotowości. Starsze pojedyncze pomiary zmęczenia pozostają w osobnej historii. Eksport zachowuje zgodność z mostkiem Sheets v2 (24 kolumny danych i 8 kolumn planu) i obejmuje również tygodnie z samym samopoczuciem.
