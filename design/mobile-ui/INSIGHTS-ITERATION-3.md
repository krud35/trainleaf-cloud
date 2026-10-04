# Iteration 3 insights handoff

New files: `insights-ui.js`, `insights-ui.css`, `check-iteration-insights.mjs`. Load the CSS after the existing styles. No app.js edits or production mobile changes.

## Render APIs

- `renderProgressView({workouts, wellness, goals, goal, today, range})` returns progress HTML. `wellness` is the deduplicated wellness entry array, `goal` remains the existing personal text string, `goals` is the new measurable goal array. `today` is required ISO date. Range defaults to `week`; values are `week`, `month`, `six-months`.
- `renderWellnessTrends({entries, today, slot, metric, range})` returns trend-first HTML and a recent history of 30 entries. Slot defaults to `Rano`. Metric is an exact Polish question label, e.g. `Sen (godziny)` or `Zmęczenie`; invalid metrics fall back to the slot's first question. Changing slot should reset metric to that first question. Range defaults to `week`.
- `renderWellnessDetail({entry})` returns read-only detail with an explicit edit action. Missing entry produces a recoverable back action.
- `renderGoalsView({goals, workouts, entries, today})` returns intro/new action and measurable goal summaries. Existing personal text goal stays separate in progress and the original `goal` editor.

## Actions root integrates

| Action | Meaning |
| --- | --- |
| `data-progress-range=week/month/six-months` | Set progress range and re-render. |
| `data-go=wellnessTrends/goals/history/goal/progress/wellnessHistory` | Navigate. |
| `name=wellness-trend-slot` | Select exact slot string: `Rano`, `W ciągu dnia`, `Wieczorem`. |
| `name=wellness-trend-metric` | Select exact Polish metric label. |
| `data-wellness-range=week/month/six-months` | Set wellness range and re-render. |
| `data-wellness-entry=YYYY-MM-DD\|slot` | Find exact date and slot, navigate to read-only detail. |
| `data-edit-wellness=YYYY-MM-DD\|slot` | Explicitly open check-in editor with exact original date and slot. |
| `data-checkin` | Create a new check-in intentionally. |
| `data-edit=workout-id` | Existing workout detail/edit behavior from last four ratings. |
| `data-edit-goal=goal-id` | Open measurable goal editor. |
| `data-new-goal` | Open blank measurable goal editor. |

`wellnessSlots`, `wellnessMetrics` and `goalTypes` are exported for controls. Wellness metric objects expose `{name,max,unit}`.

## Measurable goal schema

```js
{id:'goal-id', title:'Mój tytuł', type:'count', target:3, period:'week'}
{id:'dated-goal', title:'Własny okres', type:'minutes', target:180,
 period:{start:'2026-10-01',end:'2026-10-31'}}
```

Canonical types match `docs/mobile-iteration-3-contract.md`: `count`, `minutes`, `activeDays`, `checkinDays`, `sleepAverageHours`. `goal.metric` or prototype `goal.type` is accepted. Older prototype aliases `sessions`, `checkins`, `sleep` resolve to the corresponding canonical metric. Target must be a positive user-entered number; session/day goals require integers and sleep may be fractional up to 24. The form owns validation and save/cancel semantics. Default period is the current Monday–Sunday week; a valid explicit `{start,end}` chooses a custom period. Future dates are omitted from observations. No medical thresholds or default sleep target are supplied.

`sleepAverageHours` maps production morning `answers.sleepHours` to prototype morning `answer-Sen (godziny)` only. Completeness uses observations / elapsed calendar days through `min(end,today)`, never future days; on Sunday a current week denominator is 7. Missing sleep produces null actual/percent/met, recorded zero is a valid measurement. Check-in targets count distinct dates regardless of the number of slots. Minutes sum recorded durations and explain partial completeness; no measured duration retains actual 0 with `hasData:false`, `met:null` and the UI displays `—`.

Pure `goalFacts(goal,{workouts,entries,today})` returns prototype aliases `value/progress` plus canonical `actual/percent/met/hasData/observedDays/expectedDays`. Per the current team contract in `docs/mobile-iteration-3-contract.md`, sleep percentage is an integer capped at 99 whenever actual is below target; 100 means the target is met, with no bonus for excess. This is a product display rule from the current contract, not a user-approved health threshold. Other percentages may exceed 100 while the visual bar caps its fill. Observed days are distinct relevant record dates. Prototype has one profile and no per-goal sport selector; profile and sport identity filtering remain production concerns and are not represented as silently equivalent prototype fields.

Sleep actual and target use up to two decimal places in the visible summary and accessible progress text. An unmet target also has an explicit “poniżej celu” statement so even a closer value rounded to the same displayed number cannot imply achievement. The raw average and `met` comparison keep their precision. Six mornings of 8 h and one of 7.75 h give actual 7.9642857… h, displayed 7.96 / 8 h, 99 and `met:false`. Missing sleep still displays `—` without a progress bar or unmet claim; explicit 0 remains a measurement.

## Display rules

Progress starts with accomplished sessions, distinct active days, recorded minutes and regularity. Regularity is the share of elapsed calendar days in the chosen range with at least one completed session; explicit denominator appears beneath it. Week/month ranges start Monday/first of current month and end today. Six months subtracts six calendar months with clamped day and ends today. Completed future sessions and all planned sessions are excluded.

Activity bars count sessions in consecutive 7-day groups beginning at the range start. Factual observations include the largest type count and average recorded duration. These describe the entries and make no causal claims. Trainleaf load and time×RPE appear further down inside a closed `<details>`. Load is read exclusively through `loadSummary` on stored snapshots; no render recomputes or migrates load. The last four post-session ratings in the selected range retain actual zero and mark null/empty as `—`.

Wellness compares a single metric at a single exact slot. SVG points represent recorded answers; missing calendar days break connecting lines. Mean and completeness come from actual answers. Recent entry rows sort by date descending then evening/day/morning; every row opens exact date+slot detail before explicit edit. All slots stay distinct.

Warm cream goal/analysis sections alternate with sage accomplishment/trend surfaces and unboxed editorial rows. Decorative botanical SVGs are hidden from assistive technologies; chart SVGs expose meaningful summaries and history retains readable values. Controls wrap; 360px and `.large` layout overrides support narrow/large-text views.

## Verification

Run `node check-iteration-insights.mjs`. It verifies range calendar boundaries, future/planned exclusions, distinct active days, missing vs zero, exact slots, duplicate check-ins, morning-only sleep, elapsed observation denominators, unique check-in dates, custom goal periods, stored snapshot immutability, latest four ratings, read-only/edit action separation and escaping. Sleep boundary cases cover 7.9642857… / 8 h and 7.999 / 8 h remaining unmet at 99, exact and exceeded target staying 100, visible and accessible labels, and missing versus zero. Other metrics retain percentages above 100. Root integration owns browser QA at 360px and 200% text.
