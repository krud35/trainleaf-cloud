# Calendar iteration 3

Prototype only: `design/mobile-ui`. No production mobile components, data or editor forms changed.

## Integration

Load `week-ui.css` and `planning-ui.css` after the base styles. Import `renderPlanning` from `planning-ui.js`. It includes the Plan heading and is the complete planning screen.

```js
renderPlanning({
  workouts, periods, events, day, today,
  mode: 'week', // week | month | season
  filters: {search: '', trainingType: ''},
  selectedSeasonId: null,
  energy
});
renderWeek({workouts, events, selectedDay: today, today, compact: true,
  showDayDetail: false, energy}); // Dzisiaj: no second selected-day section
```

`weekDates(day)` remains a seven-element Monday-to-Sunday ISO-date array using UTC arithmetic. `renderMusclePlan` remains available. `renderWeek` defaults to compact true and showDayDetail false. `showNavigation:false` retains the date heading and contextual `?`.

The planning week explicitly enables selected-day details. Sessions open directly from colored tiles; each includes type silhouette, title, time and a state mark. Full titles are available in accessible button names, detail rows and collapsed calendar lists. No visible legend or instruction paragraph precedes the calendar.

## Parent action contract

| Action | Parent behavior |
| --- | --- |
| `data-plan-mode=week/month/season` | Set calendar mode, rerender |
| `data-week-shift=-1/1` | Move selected date seven days |
| `data-month-shift=-1/1` | Move selected month; clamp selected day to target month |
| `data-week-date=YYYY-MM-DD` | Select day; Today may navigate to Plan |
| `data-plan-day=YYYY-MM-DD` | Select date and show its week |
| `data-plan-week=YYYY-MM-DD` | Select date and show its week |
| `data-plan-season=period-id` | Select root period and show season |
| `data-week-session=session-id` | Open existing session detail |
| `data-plan` | Open existing new-session editor with selected day |
| `data-event-new` / `data-event-edit=event-id` | Open parent's event editor |
| `data-period-new` / `data-period=period-id` | Open existing period editor |
| `data-energy-reference` / `data-energy-settings` | Open reference/setup in parent |
| `data-help=week-legend/energy-calendar` | Existing global `bindHelp` dialog |

Collapsed filter controls have names `plan-search`, `plan-trainingtype`, `plan-date`. Parent owns values and restores focus after rerenders. Search applies to session titles; training type uses canonical type IDs. Date input navigates. Filters never alter stored records or synthetic history. No editor form is duplicated by either module.

`week-ui.js` registers `helpTexts['week-legend']` and `helpTexts['energy-calendar']` on import; existing `bindHelp` supplies native dialog, Escape and focus return. Parent may replace the energy topic with the final research-contract copy.

## Data and energy

Periods use `{id,name,start,end,parentId}`. Root periods become season choices; descendant periods form timeline rows. Selecting a timeline period or week opens the week; breadcrumbs return to season or week. Events use `{id,title|name,start,end}` with `startDate/endDate` or one-day `date` aliases. Missing/invalid event dates are excluded. One-day events are ochre with a diamond; multiday events use striped ochre and boundary strokes, repeated across occupied dates. Events remain separate from workout records.

Energy is a day-keyed object supplied by the separate model:

```js
{
  __referenceRequired: true,
  '2026-10-04': {
    state: 'unknown', // unknown | low-confidence | forecast
    label: 'Ustaw odniesienie', detail: '',
    value: null, // normalized reserve 0..1, displayed only as a bar
    lower: null, upper: null // unused scenario bounds, never a confidence band
  }
}
```

Product label: **Rezerwa w planie**. Tooltip: **Początek dnia · symulacja**. `low-confidence` defaults to **Niepełne dane**, not a claim of statistical certainty. Unknown values never become zero. Missing reference gives a neutral bar and one setup action per calendar; missing history/load gets hatching. No energy value or percentage is printed. This component infers nothing from sessions and adds no event multiplier.

## Verification

- Module imports and render assertions passed for week/month/season, including malicious markup and very long Polish titles.
- UTC week arithmetic checked around the March 2026 daylight-saving boundary.
- Chromium layout checks passed at 360 px, default and 200% text (`.large`), using preserved six-month demonstration data plus one-day/multiday events. No page-level horizontal overflow; large calendars scroll inside their labeled regions.
- All fallback lists and compact filters expanded during layout checks; long titles wrap in full rows without page overflow.
- `renderWeek` default output contains no selected-day detail section, keeping Dzisiaj's existing session list unique.

The component exposes actions; parent integration still owns persistence, focus restoration, editors and forecast research validation.
