import { useState } from 'react';
import type { Exercise, Section, Superset } from '../data/domain';
import { normalizeSupersets, supersetLabel, supersetRounds } from '../data/supersets';
import { Help } from './TrainingFields';
import { useI18n } from '../i18n';
import { exerciseName } from '../i18n/factory';

type Member = { id: string; supersetId?: string | null; exercise: Exercise; planned: { sets: number | string | null } };
type Plan<T extends Member> = { sections: Record<Section, T[]>; supersets: Superset[] };
const names: readonly Section[] = ['warmup', 'main', 'cooldown'];

export function itemLabel<T extends Member>(plan: Plan<T>, section: Section, item: T): string {
  const items = plan.sections[section];
  let number = 0; const seen = new Set<string>();
  for (const current of items) {
    if (!current.supersetId || !seen.has(current.supersetId)) number++;
    if (current.supersetId) seen.add(current.supersetId);
    if (current.id === item.id) return current.supersetId ? supersetLabel(number, items.filter(other => other.supersetId === current.supersetId).findIndex(other => other.id === item.id)) : String(number);
  }
  return '';
}

export function reorderPlanItem<T extends Member>(plan: Plan<T>, section: Section, id: string, offset: number): Plan<T> {
  const blocks: T[][] = [];
  for (const item of plan.sections[section]) {
    const previous = blocks.at(-1);
    if (item.supersetId && previous?.[0].supersetId === item.supersetId) previous.push(item);
    else blocks.push([item]);
  }
  const index = blocks.findIndex(block => block.some(item => item.id === id));
  if (index < 0 || !blocks[index + offset]) return plan;
  [blocks[index], blocks[index + offset]] = [blocks[index + offset], blocks[index]];
  return { ...plan, sections: { ...plan.sections, [section]: blocks.flat() } };
}

export function SupersetControls<T extends Member>({ plan, section, readOnly = false, allowedSections = ['warmup', 'main', 'cooldown'], onChange }: { plan: Plan<T>; section: Section; readOnly?: boolean; allowedSections?: Section[]; onChange: (value: Plan<T>) => void }) {
  const { t, language } = useI18n();
  const name = (exercise: Exercise) => exerciseName(exercise, language);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const groups = plan.supersets.filter(group => group.section === section);
  const available = plan.sections[section].filter(item => !item.supersetId);
  const update = (value: Plan<T>) => onChange(normalizeSupersets(value));
  function choose(target: string) { setSelecting(target); setSelected([]); }
  function addMembers() {
    if (!selecting || selecting === 'new' && selected.length < 2 || !selected.length) return;
    const id = selecting === 'new' ? crypto.randomUUID() : selecting;
    const items = [...plan.sections[section]];
    const members = [...items.filter(item => item.supersetId === id), ...selected.map(itemId => items.find(item => item.id === itemId)!).filter(Boolean)].map(item => ({ ...item, supersetId: id }));
    const anchor = items.findIndex(item => selecting === 'new' ? selected.includes(item.id) : item.supersetId === id);
    const insertAt = items.slice(0, anchor).filter(item => item.supersetId !== id && !selected.includes(item.id)).length;
    const rest = items.filter(item => item.supersetId !== id && !selected.includes(item.id));
    rest.splice(insertAt, 0, ...members);
    update({ sections: { ...plan.sections, [section]: rest }, supersets: selecting === 'new' ? [...plan.supersets, { id, section, transitionRest: '', roundRest: '' }] : plan.supersets });
    setSelecting(null); setSelected([]);
  }
  function moveGroup(id: string, to: Section) {
    const members = plan.sections[section].filter(item => item.supersetId === id);
    update({ sections: { ...plan.sections, [section]: plan.sections[section].filter(item => item.supersetId !== id), [to]: [...plan.sections[to], ...members] }, supersets: plan.supersets.map(group => group.id === id ? { ...group, section: to } : group) });
  }
  return <div className="training-supersets">{groups.map(group => {
    const members = plan.sections[section].filter(item => item.supersetId === group.id);
    const roundItems = members.map(item => ({ id: item.id, planned: { sets: item.planned.sets === null || item.planned.sets === '' ? null : Number(item.planned.sets) } }));
    const validSets = roundItems.every(item => item.planned.sets === null || Number.isInteger(item.planned.sets) && item.planned.sets > 0 && item.planned.sets <= 100);
    const rounds = validSets ? supersetRounds(roundItems) : [];
    return <div className="training-superset" key={group.id}><h3>{t('training.superset', { label: itemLabel(plan, section, members[0])?.replace(/[a-z]+$/, '') })}</h3><p className="field-hint">{t('training.supersetHint')}</p>
      <ol className="training-superset-members">{members.map((item, index) => <li key={item.id}><span><strong>{itemLabel(plan, section, item)}</strong> · {name(item.exercise)}</span>{!readOnly && <><button type="button" disabled={index === 0} aria-label={t('training.moveEarlier', { name: name(item.exercise) })} onClick={() => { const next = [...plan.sections[section]]; const current = next.findIndex(other => other.id === item.id); const previous = next.findIndex(other => other.id === members[index - 1].id); [next[current], next[previous]] = [next[previous], next[current]]; update({ ...plan, sections: { ...plan.sections, [section]: next } }); }}>↑</button><button type="button" disabled={index === members.length - 1} aria-label={t('training.moveLater', { name: name(item.exercise) })} onClick={() => { const next = [...plan.sections[section]]; const current = next.findIndex(other => other.id === item.id); const later = next.findIndex(other => other.id === members[index + 1].id); [next[current], next[later]] = [next[later], next[current]]; update({ ...plan, sections: { ...plan.sections, [section]: next } }); }}>↓</button><button type="button" aria-label={t('training.excludeNamed', { name: name(item.exercise) })} onClick={() => { const rest = plan.sections[section].filter(other => other.id !== item.id); const last = rest.reduce((previous, other, position) => other.supersetId === group.id ? position : previous, -1); rest.splice(last + 1, 0, { ...item, supersetId: null }); update({ ...plan, sections: { ...plan.sections, [section]: rest } }); }}>{t('training.exclude')}</button></>}</li>)}</ol>
      <div className="we-grid"><div className="field"><span>{t('training.transitionRest')} <Help label={t('training.transitionRest')}>{t('training.transitionRestHelp')}</Help></span><input aria-label={t('training.transitionRestFor', { label: itemLabel(plan, section, members[0]) })} maxLength={100} readOnly={readOnly} value={group.transitionRest} onChange={event => update({ ...plan, supersets: plan.supersets.map(other => other.id === group.id ? { ...other, transitionRest: event.target.value } : other) })} /></div><div className="field"><span>{t('training.roundRest')} <Help label={t('training.roundRest')}>{t('training.roundRestHelp')}</Help></span><input aria-label={t('training.roundRestFor', { label: itemLabel(plan, section, members[0]) })} maxLength={100} readOnly={readOnly} value={group.roundRest} onChange={event => update({ ...plan, supersets: plan.supersets.map(other => other.id === group.id ? { ...other, roundRest: event.target.value } : other) })} /></div></div>
      {rounds.length > 0 ? <details><summary>{t('training.roundsPreview')}</summary><ol className="training-rounds">{rounds.map((round, index) => <li key={index}>{t('training.round', { number: index + 1, order: round.map(item => itemLabel(plan, section, members.find(member => member.id === item.id)!)).join(' → ') })}</li>)}</ol>{members.some(item => item.planned.sets === null || item.planned.sets === '') && <p className="field-hint">{t('training.roundsMissingSets')}</p>}</details> : <p className="field-hint">{t('training.roundsNeedSets')}</p>}
      {!readOnly && <div className="we-actions"><button type="button" disabled={plan.sections[section][0]?.supersetId === group.id} onClick={() => update(reorderPlanItem(plan, section, members[0].id, -1))}>{t('training.supersetUp')}</button><button type="button" disabled={plan.sections[section].at(-1)?.supersetId === group.id} onClick={() => update(reorderPlanItem(plan, section, members[0].id, 1))}>{t('training.supersetDown')}</button><button type="button" disabled={!available.length} onClick={() => choose(group.id)}>{t('training.addMore')}</button><label className="field">{t('training.moveSuperset')}<select value={section} onChange={event => moveGroup(group.id, event.target.value as Section)}>{names.filter(key => allowedSections.includes(key)).map(key => <option value={key} key={key}>{t(`section.${key}`)}</option>)}</select></label><button type="button" onClick={() => update({ sections: { ...plan.sections, [section]: plan.sections[section].map(item => item.supersetId === group.id ? { ...item, supersetId: null } : item) }, supersets: plan.supersets.filter(other => other.id !== group.id) })}>{t('training.ungroup')}</button><button type="button" className="we-danger" onClick={() => update({ sections: { ...plan.sections, [section]: plan.sections[section].filter(item => item.supersetId !== group.id) }, supersets: plan.supersets.filter(other => other.id !== group.id) })}>{t('training.deleteSuperset')}</button></div>}
    </div>;
  })}{!readOnly && <><button type="button" disabled={available.length < 2} onClick={() => choose('new')}>{t('training.createSuperset')}</button>{available.length < 2 && <p className="field-hint">{t('training.needTwo')}</p>}</>}
    {!readOnly && selecting && <div className="training-superset-picker"><h3>{t(selecting === 'new' ? 'training.pickTwo' : 'training.pickMore')}</h3><p className="field-hint">{t('training.pickHint')}</p>{available.map(item => <label className="choice" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><span>{selected.includes(item.id) && `${selected.indexOf(item.id) + 1}. `}{name(item.exercise)}</span></label>)}<div className="we-actions"><button type="button" disabled={selecting === 'new' ? selected.length < 2 : !selected.length} onClick={addMembers}>{t('training.saveSuperset')}</button><button type="button" onClick={() => setSelecting(null)}>{t('training.cancel')}</button></div></div>}
  </div>;
}
