import { ZodError, type ZodTypeAny } from 'zod';
import { stateSchema, type State } from './domain';
import { upgradeState } from './seed';

// Read-time recovery of a coach document that no longer passes stateSchema.
// Invalid or conflicting records are set aside (quarantined) instead of failing the
// whole planner. Nothing here writes to D1: the quarantine and a raw backup are
// persisted atomically with the next document write (see lib/state-store.ts).

/** A validation finding without data values: collection/record path plus a rule code. */
export type Issue = { path: string; code: string };
export type QuarantineEntry = {
  collection: string; key: string; recordId: string | null; profileId: string | null;
  issues: Issue[]; resolution: 'removed' | 'field_cleared'; raw: string;
};
export type Recovery =
  | { health: 'ok'; state: State }
  | { health: 'degraded'; state: State; entries: QuarantineEntry[]; blockedProfiles: string[] }
  | { health: 'corrupt'; issues: Issue[] };

export const STATE_REPAIR_MESSAGE = 'Dane planu wymagają naprawy przez trenera.';
/** The stored document cannot be turned into a valid state automatically. */
export class StateError extends Error {
  readonly code = 'state_corrupt';
  constructor(public issues: Issue[], public revision: number) { super(STATE_REPAIR_MESSAGE); }
}

// Paths contain schema keys and array indexes only; anything else is masked so that a
// key or value from stored data can never reach logs or responses.
const segment = (p: PropertyKey) => typeof p === 'number' ? String(p) : typeof p === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(p) ? p : '?';
export const issuePath = (path: PropertyKey[]) => path.map(segment).join('.');
/** Never uses issue.message: zod messages can contain unrecognized key names or values. */
export const zodIssues = (error: ZodError, prefix: PropertyKey[] = []): Issue[] => error.issues.slice(0, 20).map(i => ({ path: issuePath([...prefix, ...i.path]), code: i.code }));

async function sha256Hex(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

type Def = { typeName?: string; schema?: ZodTypeAny; innerType?: ZodTypeAny; type?: ZodTypeAny; maxLength?: { value: number } | null; shape?: () => Record<string, ZodTypeAny> };
const def = (schema: ZodTypeAny) => schema._def as Def;
// Collections are derived from stateSchema itself, so new collections and limits stay in sync.
const objectSchema = def(stateSchema).schema!;
const shape = def(objectSchema).shape!();
const collections: Record<string, { element: ZodTypeAny; max?: number; optional: boolean }> = {};
for (const [key, field] of Object.entries(shape)) {
  const optional = def(field).typeName === 'ZodDefault';
  const inner = optional ? def(field).innerType! : field;
  if (def(inner).typeName === 'ZodArray') collections[key] = { element: def(inner).type!, max: def(inner).maxLength?.value, optional };
}
if (!collections.profiles || !collections.workouts) throw Error('Unexpected state schema shape');
const scalarSchema = (objectSchema as unknown as { omit(mask: Record<string, true>): ZodTypeAny }).omit(Object.fromEntries(Object.keys(collections).map(k => [k, true])));

type Kept = { index: number; raw: unknown; value: Record<string, unknown> };
type Pending = { collection: string; index: number; raw: unknown; issues: Issue[]; resolution: QuarantineEntry['resolution'] };
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const idOf = (v: unknown, field = 'id') => isObject(v) && typeof v[field] === 'string' && /^[\w-]{1,100}$/.test(v[field] as string) ? v[field] as string : null;

export async function recoverState(raw: unknown): Promise<Recovery> {
  try { return { health: 'ok', state: upgradeState(raw) }; } catch { /* fall through to per-record recovery */ }
  if (!isObject(raw)) return { health: 'corrupt', issues: [{ path: '', code: 'invalid_type' }] };
  const scalars = scalarSchema.safeParse(raw);
  if (!scalars.success) return { health: 'corrupt', issues: zodIssues(scalars.error) };
  const kept: Record<string, Kept[]> = {}, pending: Pending[] = [];
  for (const [key, spec] of Object.entries(collections)) {
    const value = raw[key];
    kept[key] = [];
    if (value === undefined && spec.optional) continue;
    if (!Array.isArray(value)) return { health: 'corrupt', issues: [{ path: key, code: 'invalid_type' }] };
    value.forEach((item, index) => {
      const parsed = spec.element.safeParse(item);
      if (parsed.success) kept[key].push({ index, raw: item, value: parsed.data });
      else pending.push({ collection: key, index, raw: item, issues: zodIssues(parsed.error, [key, index]), resolution: 'removed' });
    });
    if (spec.max !== undefined) for (const extra of kept[key].splice(spec.max)) pending.push({ collection: key, index: extra.index, raw: extra.raw, issues: [{ path: `${key}.${extra.index}`, code: 'too_many_records' }], resolution: 'removed' });
  }
  const setAside = (collection: string, rule: (item: Kept, list: Kept[]) => string | null) => {
    const list = kept[collection], verdicts = list.map(item => rule(item, list));
    kept[collection] = list.filter((item, i) => {
      if (!verdicts[i]) return true;
      pending.push({ collection, index: item.index, raw: item.raw, issues: [{ path: `${collection}.${item.index}`, code: verdicts[i]! }], resolution: 'removed' });
      return false;
    });
    return verdicts.some(Boolean);
  };
  // Conflicting copies all go to quarantine: the recovery never guesses which copy is authoritative.
  const unique = (collection: string, keyOf: (v: Record<string, unknown>) => string, code: string) => {
    const counts = new Map<string, number>();
    for (const item of kept[collection]) counts.set(keyOf(item.value), (counts.get(keyOf(item.value)) || 0) + 1);
    return setAside(collection, item => counts.get(keyOf(item.value))! > 1 ? code : null);
  };
  for (let changed = true, rounds = 0; changed && rounds < 20; rounds++) {
    changed = false;
    for (const collection of Object.keys(kept)) {
      const quarantinedIds = new Set(pending.filter(p => p.collection === collection).map(p => idOf(p.raw)).filter(Boolean));
      changed = setAside(collection, item => quarantinedIds.has(item.value.id as string) ? 'duplicate_id' : null) || changed;
      changed = unique(collection, v => String(v.id), 'duplicate_id') || changed;
    }
    // Fail closed: records of a missing or quarantined profile are never re-attached elsewhere.
    const profiles = new Set(kept.profiles.map(p => p.value.id)), blocked = new Set(pending.filter(p => p.collection === 'profiles').map(p => idOf(p.raw)));
    for (const collection of Object.keys(kept)) if (collection !== 'profiles') changed = setAside(collection, item => typeof item.value.profileId !== 'string' || profiles.has(item.value.profileId) ? null : blocked.has(item.value.profileId) ? 'profile_quarantined' : 'unknown_profile') || changed;
    changed = unique('wellness', v => `${v.profileId}:${v.date}:${v.slot}`, 'duplicate_wellness_slot') || changed;
    changed = unique('fatigue', v => `${v.profileId}:${v.date}`, 'duplicate_fatigue_day') || changed;
    changed = unique('exerciseNotes', v => `${v.profileId}:${v.exerciseId}`, 'duplicate_exercise_note') || changed;
    changed = setAside('periods', (item, list) => {
      const x = item.value as State['periods'][number];
      if (!x.parentId) return null;
      const parent = list.find(p => p.value.id === x.parentId)?.value as State['periods'][number] | undefined;
      const expected = x.level === 'micro' ? 'meso' : x.level === 'meso' ? 'macro' : null;
      return !parent || parent.profileId !== x.profileId || parent.level !== expected || x.start < parent.start || x.end > parent.end ? 'period_hierarchy' : null;
    }) || changed;
    changed = setAside('workouts', item => {
      const w = item.value as State['workouts'][number], items = Object.values(w.sections).flat();
      return new Set(items.map(i => i.id)).size !== items.length ? 'duplicate_item_id' : w.status === 'completed' && !items.some(i => i.actual) ? 'completed_without_actual' : null;
    }) || changed;
  }
  // A dangling default warm-up is cleared rather than blocking the athlete; the original profile is kept in quarantine.
  const warmups = new Set(kept.templates.filter(t => t.value.section === 'warmup').map(t => t.value.id));
  for (const profile of kept.profiles) if (profile.value.warmupId && !warmups.has(profile.value.warmupId)) {
    pending.push({ collection: 'profiles', index: profile.index, raw: profile.raw, issues: [{ path: `profiles.${profile.index}.warmupId`, code: 'unknown_warmup' }], resolution: 'field_cleared' });
    profile.value = { ...profile.value, warmupId: '' };
  }
  const summary = pending.flatMap(p => p.issues).slice(0, 20);
  if (!kept.profiles.length) return { health: 'corrupt', issues: [{ path: 'profiles', code: 'no_valid_profiles' }, ...summary] };
  let state: State;
  try { state = upgradeState({ ...scalars.data, ...Object.fromEntries(Object.entries(kept).map(([key, list]) => [key, list.map(x => x.value)])) }); }
  catch (error) { return { health: 'corrupt', issues: error instanceof ZodError ? zodIssues(error) : [{ path: '', code: 'upgrade_failed' }] }; }
  const occurrences = new Map<string, number>(), entries: QuarantineEntry[] = [];
  for (const p of pending) {
    const rawJson = JSON.stringify(p.raw) ?? 'null', hash = await sha256Hex(rawJson), n = occurrences.get(p.collection + hash) || 0;
    occurrences.set(p.collection + hash, n + 1);
    // Content-addressed key: re-reading the same document yields the same keys (idempotent inserts).
    entries.push({ collection: p.collection, key: `${hash}:${n}`, recordId: idOf(p.raw), profileId: p.collection === 'profiles' ? idOf(p.raw) : idOf(p.raw, 'profileId'), issues: p.issues, resolution: p.resolution, raw: rawJson });
  }
  const blockedProfiles = [...new Set(entries.filter(e => e.collection === 'profiles' && e.resolution === 'removed' && e.profileId).map(e => e.profileId!))];
  return { health: 'degraded', state, entries, blockedProfiles };
}

/** Logs rule codes and paths only — never values, notes, keys from data, or zod messages. */
export function logRecovery(revision: number, recovery: Recovery) {
  if (recovery.health === 'ok') return;
  const issues = recovery.health === 'corrupt' ? recovery.issues : recovery.entries.flatMap(e => e.issues);
  console.error(`Fieldwork state ${recovery.health} at revision ${revision}: ${[...new Set(issues.map(i => `${i.path || '(root)'} ${i.code}`))].slice(0, 40).join('; ')}`);
}
