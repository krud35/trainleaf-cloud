# Trainleaf 0.3.0 — zasady prototypu planowania

Roboczy kontrakt prototypu wybrany przez zespół 2026-10-04 w ramach zleconego researchu i wdrożenia. Parametry nie zostały osobno zatwierdzone przez użytkownika ani zwalidowane fizjologicznie. Ten dokument rozdziela wyniki badań od przyjętych konwencji produktu. Żadna funkcja nie diagnozuje gotowości, regeneracji ani ryzyka urazu. Zapisany load v1 pozostaje niezmieniony.

## Co wynika z badań

[Badanie 22 rugbystów](https://pubmed.ncbi.nlm.nih.gov/39758184/) opisuje opóźnione i zróżnicowane związki obciążenia z samopoczuciem w trzytygodniowej serii. Nie waliduje wskaźnika Trainleaf ani przelicznika na procent energii. Regeneracja zależy od protokołu oraz osoby; materiały odniesienia: [przegląd](https://pubmed.ncbi.nlm.nih.gov/30067591/), [konsensus](https://pubmed.ncbi.nlm.nih.gov/29345524/), [różnice planowanej i odczuwanej intensywności](https://pubmed.ncbi.nlm.nih.gov/24235774/).

[Meta-regresja Pelland i wsp.](https://link.springer.com/article/10.1007/s40279-025-02344-w) rozróżnia serie bezpośrednie i pośrednie. Model z wagą 0,5 dla pośrednich uzyskał największe względne wsparcie w analizie. Jest to przybliżenie do opisu treningu oporowego, nie biologiczny pomiar pojedynczego mięśnia. Materiały uzupełniające: [ACSM 2026](https://pubmed.ncbi.nlm.nih.gov/41843416/), [IUSCA](https://journal.iusca.org/index.php/Journal/article/download/81/140), [bliskość upadku](https://link.springer.com/article/10.1007/s40279-024-02069-2), [częstotliwość w sporcie](https://link.springer.com/article/10.1007/s40279-021-01460-7), [ogólne obciążenie](https://bjsm.bmj.com/content/50/17/1030.abstract).

Nie ma zwalidowanego przelicznika własnego Trainleaf load na fizjologiczną gotowość. Nie ma jednej obowiązkowej tygodniowej liczby serii dla wszystkich mięśni, sportów, okresów i osób.

## Robocze założenia produktu: Rezerwa w planie v1

> **Zastąpione w 0.4.1.** Poniższy opis (pasek „na początek dnia”, ręczny punkt odniesienia, potwierdzanie pustych dni, status „Niepełne dane”) dotyczy wersji 0.3.0–0.4.0. Obowiązujący model `plan-reserve-v2` opisuje `docs/mobile-forecast-v2.md`. Zapisane rekordy odniesienia `readiness-v1` pozostają w bazie i w kopiach, ale nie są już używane.

- Pasek opisuje **początek dnia**. Dzisiejsze sesje wpływają dopiero na kolejne dni. Dni są lokalnymi datami kalendarzowymi, także przy zmianie tygodnia, miesiąca i roku.
- Dzienny load jest sumą sesji; każda występuje raz. Wykonanie zastępuje plan. Podstawą wykonanego treningu fizycznego jest zapisany rzeczywisty load; brak wyniku pozostaje nieznany. W MVP nie zastępujemy go dawnym planem. Przeszły plan bez wykonania pozostaje nieznany. Mentalny trening zachowuje fizyczne zero bez dopisywania historycznej migawki.
- Plan korzysta z planowanego czasu i osobnych oczekiwanych ocen wydolnościowych oraz mięśniowych, nigdy z fikcyjnej przyszłej ankiety. Parametry i źródło szacunku są wersjonowane. Mentalny load ma zero zgodnie z istniejącym load v1.
- Pozostałość obciążenia R[d,h] = suma L[i] × 2^(-(d-i)/h) z poprzednich 21 dni, i < d. h=2 dni jest wariantem środkowym, h=1 oraz h=3 wariantami porównawczymi. Wszystkie półczasy są heurystyką produktu, a nie normami regeneracji ani przedziałem ufności.
- Użytkownik jawnie potwierdza punkt odniesienia S > 0: kompletnie zapisany typowy tydzień albo własny przykładowy plan. Zapisujemy snapshot wartości i źródła. Przesunięcie sesji nie zmienia S automatycznie.
- B[d,h] = S/(S+R[d,h]) steruje długością paska bez liczbowych procentów gotowości. To konwencja interfejsu do porównania scenariuszy.
- Bez odniesienia wyświetlamy „Ustaw punkt odniesienia”. Niepełna historia jest oznaczona kreskowaniem. Pusta data historyczna nie dowodzi odpoczynku; można jawnie potwierdzić pojedynczy dzień albo kompletność całego zakresu historii. Potwierdzenie zeruje tylko puste dni, nie niekompletne sesje. Pusty przyszły dzień oznacza wyłącznie brak zaplanowanego load.
- Dwie sesje sumują się bez dodatkowej kary. Sen, samopoczucie i wyjazdy nie otrzymują arbitralnych mnożników. Ostatni rzeczywisty check-in jest osobnym kontekstem z datą.

## Robocze założenia produktu: Obciążenie w tym tygodniu

Podpis mapy: **Objętość treningu siłowego**. Mapa nie opisuje pełnego fizjologicznego obciążenia mięśni.

- Robocze serie rozpoznanych ćwiczeń oporowych: bezpośrednie + 0,5 × pośrednie. Role są jawne i edytowalne, nie pochodzą z normalizacji istniejących `exercise.shares`. Rozgrzewka nie wchodzi do serii roboczych. RIR oraz ciężar pozostają kontekstem bez dodatkowego mnożnika.
- Plan pokazuje zapisane planowane serie, również pierwotny plan już ukończonej sesji. Wykonanie pokazuje rzeczywiste serie. Nie sumujemy trybów, nie dopisujemy niezaplanowanej aktywności do oryginalnego planu. Każdy członek superserii liczy się raz, bez ponownego mnożenia przez rundy.
- Brak ról albo serii to niekompletne dane, nie zero. Bieganie, technika i boisko pozostają osobnym kontekstem; minut nie przeliczamy na serie. Nie diagnozujemy asymetrii stron bez danych stronnych.
- Cele są własne i edytowalne; zawierają jednostkę, daty i pochodzenie. Cel okresu można jawnie nadpisać dla tygodnia. Brak celu jest neutralny, cel zero oznacza grupę poza celem. Zmiana późniejszego okresu nie przelicza po cichu dawnych celów.
- Kolor czerwony → pomarańczowy → żółty → zielony oznacza pokrycie własnego celu 0–100%, nie ryzyko ani zdrowie. Powyżej celu kolor jest ograniczony, ale liczba i opis „Powyżej celu” pozostają. Niepełne dane są szare/kreskowane. Dostępna lista przekazuje liczby również bez kolorów.
- Nie ma automatycznego celu 10 serii. Użytkownik wybiera wartości i jednostkę. Celem nie jest uzyskanie równego koloru każdej grupy.

## Granice walidacji i warunki wydania

Testy sprawdzają poprawność programu względem powyższego kontraktu; nie stanowią walidacji fizjologicznej. Wymagane przypadki obejmują granice dat, wcześniejszą niedzielę, dwie sesje, zastępowanie planu wykonaniem, mental=0, brak danych/odniesienia, stałe S przy zmianie harmonogramu, cele null/zero/ponad cel, role pośrednie, superserie i brak serii siłowych z biegania. Testy w przeglądarce oraz build APK nie zastępują testu trwałości SQLite i aktualizacji na urządzeniu Android.

Insets: Capacitor 8.5.2 `SystemBars` przekazuje insets do WebView >=140 z `viewport-fit=cover`; przy starszym WebView stosuje padding natywny i przekazuje CSS zero. Aplikacja korzysta z maksimum `env(safe-area-inset-top)` i zmiennej Capacitor, nie z sumy. W 0.3.0 zmniejszono wyłącznie dodatkowe odstępy nagłówka/treści (24→8, 8→4, 20→8 px; minimum marki 44→32 px). Ostateczne zachowanie na telefonie wymaga osobnego potwierdzenia.


