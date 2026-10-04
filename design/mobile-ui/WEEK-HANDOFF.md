# Trainleaf — tydzień i grupy mięśniowe

Wdrożone w `week-ui.js` i `week-ui.css`. Komponenty pokazują przekazane dane; nie zapisują ich i nie modyfikują. Stan dnia oraz otwieranie sesji obsługuje aplikacja nadrzędna. Wszystkie przykłady w prototypie są demonstracyjne.

## API

```js
import {weekDates, renderWeek, renderMusclePlan} from './week-ui.js';
renderWeek({workouts, selectedDay: '2026-10-03', today: '2026-10-03'});
renderMusclePlan(workouts, '2026-10-03');
```

`weekDates(day)` zwraca siedem dat ISO od poniedziałku do niedzieli. Arytmetyka kalendarza nie zależy od zmiany czasu. `renderWeek` zawiera siatkę, legendę, rozwijaną listę tygodnia oraz pełne sesje wybranego dnia — nie dodawać drugiej identycznej listy pod komponentem. Opcja `showNavigation: false` chowa przyciski zmiany tygodnia dla rozwinięcia obecnego tygodnia na ekranie Dzisiaj; wybór dnia może kierować do pełnego Planu.

Delegowane akcje:

- `data-week-date="YYYY-MM-DD"` — wybierz dzień i odśwież widget; zachowaj kontekst tygodnia.
- `data-week-session="id"` — otwórz konkretną sesję. Nazwa dostępna zawiera pełny tytuł, rodzaj, godzinę lub brak godziny oraz stan.
- `data-week-shift="-1|1"` — zmień wybrany dzień o siedem dni.

Nie przewijać strony na samą górę przy wyborze dnia. Przy odświeżeniu zachować fokus na przycisku dnia/przesunięcia; przy dużym tekście przewinąć aktywny dzień do widocznego obszaru siatki. Identyfikatory danych są przekazywane przez `esc`.

Sesja: `id`, `date` ISO, `title`, `time` opcjonalne HH:MM, `duration` opcjonalne minuty, `status` (`planned` albo `completed`), a także pola odczytywane przez `typeOf(workout)` z `ui-core.js`. Szkice nie są sesjami na siatce. Wykonane sesje z datą przyszłą są pomijane. `typeOf` zwraca `{label, short, icon, color, background}`; należy korzystać ze wspólnej palety wszystkich sześciu rodzajów.

## Przegląd i dostępność

Siedem kolumn pozostaje zawsze ułożonych poniedziałek–niedziela. Mini-kafelek pokazuje ikonę i krótki rodzaj, skrócony tytuł, podaną godzinę oraz znak stanu. Pełne tytuły są w nazwach dostępnych oraz pod siatką, w pełnowymiarowych przyciskach sesji. Po trzech mini-kafelkach przycisk `+N` otwiera cały dzień. Nie zmniejszać tekstu poniżej 12 px przy skali standardowej.

Przy 360 px wszystkie siedem kolumn mieści się w obszarze o szerokości co najmniej 300 px. Powiększenie tekstu 200% włącza minimalną szerokość siatki 600 px w lokalnie przewijanym, opisanym regionie; strona nie przewija się poziomo. Rozwijana „Tydzień w czytelnej liście” daje alternatywę bez odczytywania wąskich kolumn i bez przesuwania siatki. Pełne nazwy zawijają się. Rzeczywiste natywne powiększenie w Androidzie należy odwzorować tym samym wzorcem, bez skalowania tekstu z powrotem w dół.

Stan jest zawsze przekazany tekstem lub znakiem oraz nazwą dostępną, niezależnie od koloru:

- `○ Plan` — plan na dziś lub przyszłość.
- `✓ Wykonany` — ukończona sesja do dzisiaj włącznie.
- `↶ Niewykonany plan` — plan z datą w przeszłości; przerywana krawędź.
- Pusty dzień — „Nie ma zapisanych sesji”. To brak wpisów, nie stwierdzenie braku aktywności.

## Grupy mięśniowe

Źródło stanowią wyłącznie `status === 'planned'` w wyświetlanym tygodniu. Każda sesja jest liczona raz dla każdej grupy z `exercises[].muscles: string[]`; powtórzenia i różnice w wielkości liter nie zwiększają licznika. Ukończone sesje ani szkice nie są doliczane. Dane grup powinny pochodzić z katalogu lub własnych oznaczeń — nie zgadywać ich na podstawie nazwy ćwiczenia.

Pasek = liczba zaplanowanych sesji obejmujących grupę / liczba wszystkich zaplanowanych sesji w tygodniu. Widoczny jest licznik `n z m sesji`. To nie objętość, obciążenie ani procent zrealizowanego celu; jedna sesja może dotyczyć wielu grup. Brak planów, plany bez oznaczeń oraz częściowy brak oznaczeń mają osobne komunikaty. Liczba sesji bez oznaczeń pozostaje widoczna, a brak oznaczeń nie jest przedstawiany jako brak treningu.

## Weryfikacja do integracji

Testy komponentu przeszły: granica roku i zmiana czasu, wykluczenie szkiców i przyszłych wykonań, oznaczenie planu przeszłego, bezpieczne wyświetlanie znaków HTML, ponad trzy sesje, deduplikacja grup w sesji oraz trzy stany braków oznaczeń. W przeglądarce przy 360 px siatka ma 320 px i siedem kolumn bez przewijania; przy tekście 200% siatka ma 600 px w regionie 320 px. W obu skalach strona zachowuje szerokość 360 px. Sprawdzone otwieranie/zamykanie listy tygodnia klawiaturą i fokus przycisku sesji. Wielkość tekstu mini-kafelków wynosi odpowiednio 12 i 24 px. Wizualnie zweryfikowane długie polskie nazwy.

Należy sprawdzić: tydzień przecinający miesiąc/rok i zmianę czasu, wybór każdego dnia, przechodzenie tygodni, otwarcie sesji klawiaturą, więcej niż trzy sesje jednego dnia, niewykonany plan, brak godziny, długie nazwy, pusty tydzień, powiększenie 200%, brak oznaczeń w części/wszystkich planach oraz brak planów. Sprawdzić także zachowanie fokusu po aktualizacji widgetu w aplikacji nadrzędnej.
