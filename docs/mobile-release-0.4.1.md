# Trainleaf 0.4.1 — zakres wydania

Stan: 2026-10-05. `versionName 0.4.1`, `versionCode 5`, `applicationId com.frisbeeprep.app`, `DATABASE_VERSION 8`, kopia zapasowa w formacie 5. Poprzednie wydanie: 0.4.0 (`versionCode 4`, schemat 7, kopia w formacie 4).

## Co się zmieniło względem 0.4.0

- **Rezerwa w planie (`plan-reserve-v2`)** zastępuje ręczny punkt odniesienia. Pasek dnia obejmuje sesje tego dnia. Opis modelu i parametrów: [mobile-forecast-v2.md](mobile-forecast-v2.md). Parametry są roboczymi założeniami produktu, bez walidacji naukowej.
- **Quiz startowy** (6 pytań, można pominąć) po utworzeniu profilu; na istniejącym profilu pojawia się raz po aktualizacji. Zmiana odpowiedzi: Ustawienia → „Doświadczenie treningowe”.
- **Oznaczenia kalendarza** („?”) opisują nowe paski.
- **Sezon**: jeden wyśrodkowany rok między strzałkami, bez okruszków tygodnia.
- **Pory check-inów** według zegara urządzenia: rano 03:00–09:59, w ciągu dnia 10:00–17:59, wieczorem 18:00–02:59. Check-in zrobiony między 00:00 a 02:59 należy do poprzedniego dnia. Jedna reguła: `mobile/src/features/shared/localTime.ts`. Nagłówek „Dzisiaj”, sesje i plan używają dnia kalendarzowego.

## Dane i zgodność

- Migracja 8 dodaje wyłącznie tabelę `local_training_quiz`. Migracje 1–7 i istniejące wiersze pozostają bez zmian. Zapisane check-iny nie są przeklasyfikowywane.
- Rekordy `readiness-v1` (dawny punkt odniesienia) nadal są czytane, eksportowane i importowane, ale nie mają już ekranu.
- Kopie w formatach 1–4 importują się jak dotąd. **Kopia w formacie 5 nie importuje się do 0.4.0**: po aktualizacji nie ma powrotu z danymi do starszej wersji aplikacji.
- Model rezerwy bierze jeden wpis samopoczucia na dzień (rano, potem w ciągu dnia, potem wieczorem). Wpis zrobiony po północy liczy się jako wieczór poprzedniego dnia i jest porównywany z obciążeniem tamtego dnia (`tests/mobile-checkin-reserve.test.mjs`).

## Uruchamianie testów

```
node --test tests/mobile-*.test.mjs mobile/src/features/theme/theme.test.mjs
npx tsc -p mobile/tsconfig.json --noEmit
npm run mobile:build
TRAINLEAF_E2E_PORT=<port> PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port>/ npx playwright test --config mobile/playwright.config.ts
```

`full-flow.spec.ts` i `offline.spec.ts` bez `PLAYWRIGHT_BASE_URL` łączą się z portem 4174. Każdy test tworzący profil musi pominąć albo wypełnić quiz (`.training-quiz .quiz-skip`).

Wyniki wydania, sumy kontrolne APK i przebieg aktualizacji telefonu: `audit-reports/trainleaf-0.4.1/C-report.md` (poza repozytorium).
