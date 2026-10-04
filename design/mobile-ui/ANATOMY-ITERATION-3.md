# Anatomy module, iteration 3

The prototype has a real offline WebGL scene, an original full-body surface model, front/back selection, drag rotation, camera lighting, volumetric muscle contours and raycast picking. The figure is a stylized anatomical schematic, not a scanned person or a medically validated anatomy dataset. Muscle shapes are custom outlined and subdivided surfaces; they are not oval markers on a silhouette. One group can have multiple anatomically shaped subdivisions: e.g. abdominal segments, quadriceps subdivisions and the two calf heads.

## Integration

```js
import {renderAnatomy, mountAnatomy, muscleGroups} from './anatomy-ui.js';
const props = {workouts, periods, day, today, targets};
app.innerHTML = renderAnatomy(props);
const dispose = mountAnatomy(app, props);
// Before replacing the containing HTML:
dispose();
```

`mountAnatomy` returns disposal synchronously. Its lazy imports test disposal before creating a WebGL context. Disposal removes observers and pointer/dialog handlers, disposes all owned geometry/materials and the renderer, loses the context and removes the canvas. No animation loop or continuous GPU rendering runs; the scene redraws only on interaction/resize.

The component owns the Plan/Wykonanie switch and front/back selection. The caller owns persistent target/role editing. Include `anatomy-ui.css` after the general styles.

Serve these exact files locally:

- `anatomy-ui.js`
- `anatomy-ui.css`
- `anatomy/geometry.js`
- `anatomy/vendor/three.module.js`
- `anatomy/vendor/three.core.js`

No runtime internet dependency, CDN, texture fetch or external model download is used. The application retains its normal SVG + HTML view when WebGL cannot initialize or its context is lost. The SVG uses the same original muscle contours and shaded surface filter. All data and actions are also available through the native HTML muscle list.

## Data contract

This section describes prototype adapters. Production follows [mobile-iteration-3-contract.md](../../docs/mobile-iteration-3-contract.md): `strength` is the type of a recognized resistance exercise, not the workout's training type; stored planned/actual sets remain separate, without a rounds fallback or multiplier. A period target applies at its full weekly value to an overlapping partial week, without prorating, and keeps its date range/provenance visible. Preserve production definition revisions and week overrides. See [HANDOFF-ITERATION-3.md](HANDOFF-ITERATION-3.md#doprecyzowania-mapy-i-celów) for the integration differences; the prototype shapes and data helpers are not a replacement domain model.

Exports: `renderAnatomy`, `mountAnatomy`, `muscleGroups`, `anatomyCoverage`, `normalizeMuscleRoles`, `workingSets`.

Group IDs are `chest`, `deltoids`, `biceps`, `triceps`, `abs`, `obliques`, `lats`, `traps`, `glutes`, `quads`, `hamstrings`, `calves`.

Each strength exercise must have explicit roles:

```js
muscleRoles: {direct: ['quads', 'glutes'], indirect: ['abs']}
```

Existing broad labels such as Nogi/Plecy/Ramiona, previous percentage shares, exercise names, minutes, training type, RIR and kilograms do not create muscle roles. Unsupported role IDs do not count. A direct role takes precedence if the same group is also listed indirectly.

Working sets are a positive integer `exercise.sets`; when absent on a grouped member, use its matching `workout.groups[].rounds`. Never multiply member sets by rounds. `section: 'warmup'` is excluded. Other recognized resistance exercises count; if a cooldown is intended as nonworking, classify it as mobility rather than strength. Strength is explicit `modality: 'strength'`, or the existing `kind: 'Siła'` when modality is absent.

The estimate is direct sets + 0.5 × indirect sets. This operational estimate is not a physiological load measurement. RIR and kilograms are shown only as context. Running, technique, team activity and other modalities remain outside the resistance-set total, with an explanatory count in the data note.

`anatomyCoverage` returns per-group `completedSets`, `plannedSets`, the separate contributing exercise arrays `completed` and `planned`, per-channel unknown/has-data flags, target, current-mode status/ratio/color, week dates, missing records, activity exposures and matching periods.

For completed workouts, actual data comes from the workout itself. The Plan channel reads the preserved `workout.planned` snapshot. Uncompleted plans are read once from their planned record. Actual and planned channels are never added together. Completed future records are excluded from actuals.

Missing roles can affect any group and conservatively mark that channel incomplete for all groups. Missing sets with known roles affect only their mapped groups. Partial sums show ≥; wholly unknown sums show —. A known zero is shown only after resistance data has been recorded and fully mapped for that group. No training records is not displayed as zero.

Targets are resolved by the caller for the selected week/period, with historical snapshots preserved by the caller:

```js
targets: {
  quads: {sets: 8, source: 'user', periodId: 'return', start:'2026-09-28', end:'2026-10-04'},
  glutes: 0,
  chest: null
}
```

Targets accept finite values from 0 to 100; the module does not invent defaults. Null means no goal. Zero means Poza celem and never divides by zero. Missing/partial data and missing/zero targets stay neutral. Complete known volume transitions continuously from red through orange/yellow to green at 100% of the user's own target. Above target remains green and explicitly states Powyżej celu plus the uncapped percentage. These are progress colors, not clinical risk thresholds. The human figure repeats group data on its two sides and makes no bilateral symmetry claim.

Delegated UI hooks:

- `data-muscle-target="quads" data-muscle-id="quads"`
- `data-muscle-mapping data-session-id="..." data-exercise-id="..." data-mapping-channel="completed|planned"`

The component closes its dialog before those buttons bubble to the app's handler. The caller must preserve the original when editing a planned snapshot. The mapping action should open the existing editable draft and scroll to the exercise; it must not silently rewrite saved records.

## Help and accessibility

The small labelled `?` opens a modal containing the legend, formula, limitations, sources and model provenance. The data-completeness summary remains visible outside the modal. No status depends only on color: native list buttons show values and text. Each anatomical group has an equivalent keyboard button. Native dialogs trap focus, Escape and explicit close return focus, the canvas is hidden from screen readers, and front/back are native pressed-state buttons. The full list continues working if WebGL is unavailable. The canvas permits vertical page scrolling and horizontal drag rotation.

## Provenance and licenses

- `anatomy/geometry.js`: original contour coordinates and procedural geometry authored for this Trainleaf prototype in this workspace. No third-party mesh, illustration, scan, texture, anatomical dataset or generated bitmap was imported.
- `anatomy-ui.js`, `anatomy-ui.css`: original prototype implementation.
- `anatomy/vendor/three.module.js`, `three.core.js`: copied from the already-installed Three.js 0.186.1 dependency. Three.js is MIT licensed; the complete upstream notice is preserved in `anatomy/vendor/LICENSE-three.txt`. Source: https://github.com/mrdoob/three.js . The files were copied, not modified.
- Method references were supplied by the parent task's research: Pelland et al., DOI `10.1007/s40279-025-02344-w`; ACSM PubMed `41843416`. These references inform the calculation explanation, not the synthetic body geometry or individual target selection.

## Verification

Run `node design/mobile-ui/anatomy/check-anatomy.mjs` from `ultimate-planner`. It uses existing Playwright and local Chrome, starts an isolated temporary static test server, then closes it.

Passed: direct/indirect fractions, warmup exclusion, retained original plan, no plan/actual addition, no grouped-sets multiplication, unsupported broad tags, target zero, unknown/partial volume, no goal defaults, WebGL initialization, actual raycast pick on the chest, front/back control, Plan/Wykonanie switch, per-group dialog and help, Escape focus restoration, 360px overflow check, text at 200%, disposal removing canvas, and simulated no-WebGL fallback interactions. Browser JavaScript errors: none. Screenshots are under `anatomy/qa-front.png`, `qa-back.png`, `qa-200.png`, `qa-fallback.png`.

Visual inspection confirms a coherent full human silhouette, contoured front/back muscle surfaces, perspective-independent picking and legible list fallback. Limits: simplified surface anatomy, no clinical accuracy claim, no female/male body choices, no per-limb values, and no clinical validation of the custom geometry.
