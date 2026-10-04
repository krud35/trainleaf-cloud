# Inne, sporty i skróty — przekazanie

Moduł składa się z `profile-ui.js` oraz stylów `profile-ui.css`. Korzysta z funkcji `esc` i `icon` eksportowanych przez `ui-core.js`. Wszystkie dekoracyjne ikony korzystają z dotychczasowych kluczy: `library`, `plan`, `journal`, `sun`, `lock`, `chevron`, `arrow`, `plus`.

## API i integracja

- `renderMore(profile)` zwraca ekran Inne. Widoczne skróty kierują przez `data-go` do `library`, `templates`, `history`, `wellness` i `export`. Dostosowanie prowadzi do `modules`, ustawienia do `settings`. Wszystkie narzędzia zawsze są dostępne także w rozwijanej liście.
- `renderProfile(profile)` zwraca formularz `id="profile"`. Wybór sportów jest wielokrotny. Powrót kieruje do `settings`.
- `renderModules(profile)` zwraca formularz `id="modules"` i powrót do `more`.
- `bindProfile(root)` należy wywołać po wstawieniu formularza sportów do dokumentu. Podłącza wyszukiwanie, liczniki i dodawanie własnych sportów. Ponowne wywołanie dla tego samego formularza nie powiela nasłuchów.
- `readProfile(form, existing)` zwraca `{profile, error}`. Przy błędzie `profile` to `null`; komunikat błędu należy pokazać bez ponownego renderowania formularza, żeby zachować niezapisane wybory. Przy powodzeniu `error` to `null`. Wynik zachowuje pozostałe pola profilu.
- `readModules(form, existing)` zwraca profil z nowym `modules`, bez zmiany innych pól. Pusta lista jest poprawna: w hubie pozostają Dostosuj, Wszystkie narzędzia i Ustawienia.
- `sportChoices` to płaska lista nazw predefiniowanych sportów. Przy budowaniu wyboru sportu w edytorze należy do niej dołączyć `profile.sports` oraz sport istniejącego treningu, jeśli brak go na liście. Nie wolno przepisywać historycznego sportu na pierwszy dostępny.

Zapis i przechodzenie między widokami pozostają w `app.js`. Moduł nie zapisuje danych i nie modyfikuje historii. Nowe pliki JS/CSS trzeba udostępnić przez lokalny serwer, zaimportować JS i podłączyć arkusz CSS.

## Zachowanie

Brak `profile.modules` oznacza pięć domyślnych skrótów. Istniejące identyfikatory tras są respektowane. Stare tablice opisowych nazw funkcji, które nie zawierają żadnego obecnego identyfikatora, otrzymują domyślny zestaw do czasu zapisu nowego wyboru.

Wyszukiwarka sportów filtruje istniejące etykiety, nie usuwa pól formularza. Zaznaczone sporty pozostają więc zaznaczone i trafiają do zapisu także wtedy, gdy wyszukiwarka ich nie pokazuje. Wyszukiwanie toleruje brak polskich znaków oraz różną wielkość liter, otwiera pasujące grupy, a po wyczyszczeniu przywraca ich poprzedni stan.

Dotychczasowe sporty spoza katalogu są pokazane jako zaznaczone własne sporty. Można dodać kilka nowych nazw, po jednej. Duplikaty z różną wielkością liter lub znakami diakrytycznymi nie tworzą kolejnych pozycji. Tekst pozostawiony w polu własnego sportu jest uwzględniony przy zapisie, nawet jeśli użytkownik nie nacisnął wcześniej „Dodaj sport”. Enter w tym polu dodaje sport, Enter w wyszukiwarce nie wysyła formularza.

Wymagany jest przynajmniej jeden sport. Nazwa nowego własnego sportu ma maksymalnie 80 znaków. Usunięcie sportu z wyboru ani ukrycie skrótu nie usuwa zapisanych danych.

## Dostępność i zakres sprawdzenia

Pola wykorzystują natywne checkboxy, etykiety, fieldset/legend oraz rozwijane details/summary. Zmiany liczby wybranych sportów i wyników są ogłaszane przez status. Sterowanie ma widoczny fokus oraz dotykowe obszary co najmniej 48 px. Style są ograniczone do `.more-hub`, `.sport-picker` i `.module-picker`; dla powiększenia 200% zachowują jedną kolumnę i zawijają tekst.

Weryfikacja integracyjna powinna objąć powrót z edycji sportów, zachowanie ukrytych zaznaczeń po wyszukaniu, dodanie dwóch własnych nazw, ponowne otwarcie zapisanych sportów, ukrycie wszystkich skrótów i dostęp do każdego narzędzia przez rozwijaną listę, także przy 360 px i powiększeniu 200%.

Sprawdzenie modułu w odizolowanym kontekście przeglądarki potwierdziło zachowanie wcześniej zaznaczonych sportów podczas wyszukiwania, wyszukiwanie „plywanie” → „Pływanie”, dodawanie wielu własnych sportów, odrzucenie duplikatu, zachowanie niewysłanego jeszcze własnego sportu przy zapisie oraz błąd przy pustym wyborze. Ukrycie wszystkich pięciu skrótów pozostawiło dostęp do ich tras oraz przycisków Dostosuj i Ustawienia. Widoki sportów, skrótów i pustego hubu nie wykazały poziomego przepełnienia przy 360 px i 200% tekstu; zrzuty znajdują się w `qa/profile-*.png`. Weryfikacja głównych przejść aplikacji i utrwalenia profilu po podłączeniu przez `app.js` jest opisana poniżej.

Po integracji uruchomiono `node design/mobile-ui/check-iteration-nav.mjs`. Wszystkie cztery scenariusze przeszły: główna nawigacja i tydzień, ukrywanie skrótów z zachowaniem danych, walidacja oraz zapis sportów bez utraty szkicu, nakładające się okresy i blokowanie wykonania w przyszłości. Raport: `qa/iteration-navigation-results.json`. Sprawdzenie profilu obejmuje również ponowne wczytanie strony i odzyskanie własnych sportów oraz szkicu treningu. Przeglądarki testowe używają odrębnych, jednorazowych kontekstów; dane podglądu użytkownika nie są zmieniane.
