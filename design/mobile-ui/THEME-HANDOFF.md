# Trainleaf · motyw jasny, ciemny i systemowy

Stan: 2026-10-04. Zmiana dotyczy wyłącznie prototypu `design/mobile-ui/`. Produkcyjny Android i APK wymagają osobnej integracji. Lokalizacja jest wstrzymana i pozostaje u właściciela tłumaczeń; nie dodano częściowego mechanizmu i18n.

Podgląd: http://127.0.0.1:4186/?demo=six-months&v=iteration3-theme. Przycisk księżyca w nagłówku otwiera **Wygląd**. Ten sam wybór jest w Ustawieniach. Domyślnie zaznaczony jest **Systemowy**, więc podgląd może otworzyć się w jasnej palecie, jeśli takie jest ustawienie urządzenia. Dane sześciomiesięcznej demonstracji oraz ich klucze pozostają bez zmian.

## Zachowanie i integracja

- Dostępne wartości: `light` → Jasny, `dark` → Ciemny, `system` → Systemowy. Nieznana lub brakująca wartość oznacza Systemowy.
- Osobny klucz `trainleaf-appearance-v1` zapisuje wyłącznie preferencję wyglądu. Jest wspólny dla wariantów prototypu na tym origin, także `&qa=1`. Nie jest częścią stanu treningów ani eksportu danych.
- `appearance-bootstrap.js` jest klasycznym, blokującym skryptem w `<head>`, **przed arkuszami CSS i modułami aplikacji**. Odczytuje tylko preferencję wyglądu, ustawia `data-theme`, `data-theme-preference`, `color-scheme`, tło dokumentu i `meta[name=theme-color]`. Odczyt nie zapisuje domyślnej wartości.
- `matchMedia('(prefers-color-scheme: dark)')` jest obserwowane na żywo. Zmiana systemowa działa wyłącznie w trybie Systemowy. Starszy interfejs `addListener` jest obsługiwany; brak API daje jasny motyw systemowy, ale jawny Ciemny nadal działa.
- Niedostępny magazyn nie blokuje aplikacji: wybór działa w bieżącej sesji, a opis informuje o braku trwałego zapisu. Zmiana preferencji w innej karcie synchronizuje się przez zdarzenie `storage`.
- `window.TrainleafAppearance` udostępnia `getPreference`, `getResolvedTheme`, `setPreference`, `refreshControls` i `storageKey`. `setPreference` zwraca powodzenie zapisu. Zdarzenie `trainleaf:themechange` ma `detail: { preference, resolved }`.
- Wybór motywu nie wywołuje `render()`, zapisu treningów ani przejścia na inną stronę. Aktualizuje kolory i oba selektory. Nie zastępuje otwartego formularza.
- Przycisk nagłówka i dialog są w statycznym HTML, poza `#app`. Działają przed profilem i niezależnie od inicjalizacji dziennika. Statyczny ekran błędu startu również oferuje Wygląd. Obsługa błędu zasobu jest zarejestrowana z `capture: true`; nie czyści danych.
- Dialog korzysta z natywnego `showModal()`; po zdarzeniu `close` przywraca fokus do istniejącego przycisku otwierającego. Faktyczne działanie Escape, pułapki fokusu i klawiatury wymaga kontroli w przeglądarce/Androidzie.

Kolejność: dotychczasowe arkusze do `iteration3.css`, potem `appearance-ui.css`, na końcu `theme.css`. `appearance-ui.css` zawiera wyłącznie układ nowego wyboru wyglądu. `theme.css` zmienia kolory, obrysy i cienie; nie przebudowuje układu, typografii ani geometrii rysunkowych liści.

`ui-core.js` wystawia kolory sześciu typów przez zmienne CSS z dotychczasowymi jasnymi wartościami zapasowymi. Dzięki temu istniejące style inline kafelków i kalendarza aktualizują się bez ponownego renderowania. Identyfikatory typów, obliczenia i etykiety nie zmieniły się.

## Paleta

Źródłem nadrzędnym jest `theme.css`. Obrys `--line` służy spokojnym podziałom dekoracyjnym; granice pól i istotnych kontrolek używają jaśniejszego `--line-strong`.

| Token | Jasny | Ciemny |
|---|---|---|
| `--page` | `#E9EDE3` | `#101A15` |
| `--paper` | `#F7F8F2` | `#17231C` |
| `--ink` | `#203B2C` | `#E4EBDE` |
| `--muted` | `#58685D` | `#AFBDAA` |
| `--accent` | `#2F6048` | `#A2C78E` |
| `--focus` | `#58754A` | `#C1DEA7` |
| `--line` | `#D7DED1` | `#3A4C3D` |
| `--sage` | `#DCE8CC` | `#2C402C` |
| `--sand` | `#F0E1BE` | `#433922` |
| `--blue` | `#E6EDE2` | `#263C38` |
| `--leaf` | `#C9D7B7` | `#9ABD7E` |

Dodatkowe tokeny nocne (jasne komponenty zachowują własne dotychczasowe kolory):

| Tokeny | Wartości |
|---|---|
| `--surface`, `--surface-raised` | `#1D2B22`, `#24342A` |
| `--surface-hover`, `--surface-soft`, `--form` | `#2A3B2F`, `#1A281F`, `#122019` |
| `--accent-fill`, `--on-accent`, `--success` | `#A2C78E`, `#142A1B`, `#B1D19D` |
| `--line-strong` | `#7C936E` |
| `--warm-paper`, `--warm-ink`, `--warm-line` | `#342D21`, `#E4C99F`, `#756447` |
| `--track`, `--chart`, `--chart-strong` | `#40523B`, `#AAC893`, `#C2DCAF` |
| `--error-paper`, `--error-ink`, `--error-line` | `#3D2823`, `#F0B4A0`, `#A87360` |
| `--disabled-paper`, `--disabled-ink` | `#223027`, `#94A18E` |

Typy sesji używają `--type-{id}-ink` i `--type-{id}-paper`:

| ID | Jasny tekst / tło | Ciemny tekst / tło |
|---|---|---|
| `strength` | `#674333` / `#F1DFD2` | `#E4BA9E` / `#3A2D25` |
| `running` | `#35583D` / `#DDEBD9` | `#B1D39F` / `#283B27` |
| `endurance` | `#345C68` / `#DCEBF0` | `#A7D0D9` / `#223840` |
| `technique` | `#665027` / `#F1E8CB` | `#E1CF91` / `#3A3522` |
| `team` | `#51476F` / `#E8E2F1` | `#C9B9E5` / `#322C40` |
| `mental` | `#6B445A` / `#F0DFE9` | `#E0B4CB` / `#3D2935` |

Liście mają osobne nocne kolory SVG:

| Liść | Blaszka / kreska / rozmyte wypełnienie | Tekst |
|---|---|---|
| Check-in | `#35482D` / `#A4BF83` / `#B9D196` | tytuł `#EBF2DA`, opis `#CFDDBB` |
| Okres i kontekst | `#31432B` / `#9DB980` / `#ABC581` | `#D8E9C5`, opisy okresu `#D2E3BC` |
| Cel | `#473B27` / `#C2A773` / `#DCC18D` | `#F0D8A9`, daty `#EEDBB7` |

Hover zachowuje przezroczyste tło HTML oraz miesza blaszkę z wypełnieniem w 10%. Nie tworzy prostokąta pod liściem. Własny SVG wash ma dotychczasowe krycie 0,16. Test kontrastu uwzględnia te dwa nałożenia dla sprawdzanych tekstów.

## Mapa mięśni

| Token | Jasny | Ciemny |
|---|---|---|
| `--anatomy-unknown` | `#AEB6A8` | `#85988A` |
| `--anatomy-progress-low` | `#BC6B59` | `#D99380` |
| `--anatomy-progress-mid1` | `#C68A4E` | `#D8B077` |
| `--anatomy-progress-mid2` | `#B4AA56` | `#C5BF7C` |
| `--anatomy-progress-met` | `#41865B` | `#78B38E` |
| `--anatomy-shade-start` | `#858E80` | `#536758` |
| `--anatomy-shade-light` | `#E0E2D7` | `#AABBA6` |
| `--anatomy-shade-mid` | `#C1C8B8` | `#859B80` |
| `--anatomy-shade-end` | `#798371` | `#4E6652` |
| `--anatomy-specular` | `#FFFFFF` | `#DCE9D5` |
| `--anatomy-accessory` | `#B8BBAE` | `#85988A` |
| `--anatomy-outline` | `#6C7767` | `#B2C3A8` |

`anatomy-ui.js` aktualizuje listę, SVG, materiały i światła istniejącej sceny. `anatomy/geometry.js` udostępnia `setTheme()`. Kolor pokrycia nadal zależy od tych samych danych; motyw nie zmienia liczb ani znaczenia skali. Zmiana motywu zachowuje obrót, wybraną grupę, fokus, otwarty dialog i przełącznik Plan/Wykonanie. Przełączenie przed zakończeniem leniwego ładowania również jest uwzględniane. Demontaż usuwa listener motywu oraz zasoby Three.

Nocne materiały: skóra `#718574`, nieznany mięsień `#85988A`, włókna `#1F3326` (0,12), zaznaczenie emissive `#B8D9A4` (0,18). Światła: niebo `#D9E5D8`, ziemia `#334B38`, ambient 1,65, główne `#E5EDDC` / 2,1, wypełniające `#8AAEA0` / 1. Fallback SVG oraz legenda używają zgodnej palety. To nie jest dowód wyglądu WebGL na fizycznym telefonie.

## Nowe teksty PL do późniejszej lokalizacji

Nie tłumaczono istniejących treści, nazw demonstracji ani opisów ćwiczeń. Nowe etykiety są zwykłymi polskimi stringami:

| Tekst | Źródło |
|---|---|
| Wygląd; Motyw; Jasny; Ciemny; Systemowy | `index.html`, `app.js` → `appearanceSettings()` |
| Zamknij ustawienia wyglądu | `index.html`, dostępna nazwa przycisku |
| Wygląd dopasowuje się do ustawienia urządzenia. | `appearance-bootstrap.js`, `index.html`, `app.js` |
| Wybrany wygląd zostaje po ponownym uruchomieniu. Systemowy nadal jest dostępny. | `appearance-bootstrap.js`, `app.js` |
| Wygląd działa w tej sesji. Przeglądarka nie pozwoliła zapisać ustawienia na następne uruchomienie. | `appearance-bootstrap.js` |
| Wczytywanie dziennika… | `index.html` |
| Nie udało się otworzyć podglądu | `index.html` |
| Twoje zapisane wpisy pozostają w przeglądarce. Spróbuj ponownie odświeżyć stronę. | `index.html` |

Przy integracji tłumaczeń etykiety w statycznym HTML i opisy w bootstrapie muszą pozostawać dostępne bez uruchomionego modułu dziennika. Wartości `light/dark/system` i klucz preferencji nie są tekstami do tłumaczenia.

## Weryfikacja i otwarte ograniczenia

Wykonano 2026-10-04:

- `node design/mobile-ui/check-appearance.mjs` — PASS. Preferencje/default/restart, obsługa zmian OS, starsze/brakujące media API, błędy magazynu, synchronizacja selektorów, callback fokusu i błędów startu. Test VM uruchamia też rzeczywiste listenery `input/change` z `app.js` i potwierdza brak wywołania renderowania/zapisu lub modyfikacji szkicu.
- `node design/mobile-ui/anatomy/check-theme.mjs` — PASS. Niezależność obliczeń pokrycia, rzeczywiste geometrie i materiały vendored Three, zachowanie obrotu/zaznaczenia, opóźniony start, aktualizacja listy/SVG/dialogu, fallback błędu WebGL i zwolnienie zasobów. Renderer i DOM są atrapami; nie jest to test wizualny WebGL.
- `node design/mobile-ui/check-theme-colors.mjs` — PASS. Parser wszystkich 11 arkuszy i 70 par kolorów. Najniższy sprawdzony kontrast tekstu: **4,73:1** (próg 4,5); kontrolek/wykresów: **3,54:1** (próg 3). To wybrane pary, nie pełny audyt dostępności ani dowód kaskady przeglądarki.
- Kontrola składni pięciu zmienionych plików runtime — PASS. Niezależny statyczny przegląd arkuszy wykrył i pomógł poprawić tło hover liści oraz konflikty selektorów.
- Serwer podglądu uruchomiony ponownie. Odczyt `/`, bootstrapu, obu nowych arkuszy i geometrii zwrócił HTTP 200.

**Nie wykonano końcowej kontroli wzrokowej w przeglądarce.** Narzędzie CUA kończyło proces Node przed połączeniem z podglądem. Nie zastępowano go inną automatyzacją przeglądarki i nie załączono starego zrzutu jako dowodu nowego motywu. Do sprawdzenia pozostają faktyczny pierwszy paint, 360 px/200%, native date/select, Escape i fokus dialogu, live formularz, SVG/WebGL oraz sezony z paskami wydarzeń. Dotychczasowe jasne zrzuty z iteracji 3 nie są QA trybu nocnego.

Integracja Androida musi osobno ustawić natywne paski systemowe i zweryfikować jasność ich ikon, safe area, zmianę motywu urządzenia, powrót z tła i start przed załadowaniem profilu. `meta theme-color` jest wskazówką dla przeglądarki; nie potwierdza działania natywnych pasków WebView. Nie wykonano testu APK ani QA tłumaczeń FR/ES.
