import type { CSSProperties } from 'react';
import { Activity, Brain, CircleHelp, Dumbbell, Target, UsersRound, type LucideIcon } from 'lucide-react';
import type { TrainingType } from '../../data/domain';
import './training-type.css';
import { currentTranslator } from '../../i18n';
import { trainingTypeLabel } from '../../i18n/labels';

function RunningIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m9 7 5 2 2 5h4M5 12l4-5 4-2m0 4-3 5-5 4m5-4 4 4v3"/><circle cx="16" cy="3" r="1.5"/></svg>;
}
type Style = { background: string; color: string; Icon: LucideIcon | typeof RunningIcon };
type Presentation = Style & { name: string; shortName: string };
const types: Record<TrainingType, Style> = {
  strength: { background: '#F1DFD2', color: '#674333', Icon: Dumbbell },
  running: { background: '#DDEBD9', color: '#35583D', Icon: RunningIcon },
  endurance: { background: '#DCEBF0', color: '#345C68', Icon: Activity },
  technical: { background: '#F1E8CB', color: '#665027', Icon: Target },
  team: { background: '#E8E2F1', color: '#51476F', Icon: UsersRound },
  mental: { background: '#F0DFE9', color: '#6B445A', Icon: Brain },
};
const unknown: Style = { background: '#E9EDE6', color: '#4D5D51', Icon: CircleHelp };

/** Colours and icon are fixed; the names follow the current language. */
export function trainingTypePresentation(type?: TrainingType | null): Presentation {
  const style = type ? types[type] ?? unknown : unknown, known = type && types[type] ? type : null, i18n = currentTranslator();
  return { ...style, name: trainingTypeLabel(i18n, known), shortName: trainingTypeLabel(i18n, known, true) };
}
export function trainingTypeStyle(type?: TrainingType | null): CSSProperties {
  const presentation = trainingTypePresentation(type);
  return { '--training-bg': presentation.background, '--training-ink': presentation.color } as CSSProperties;
}
export function TrainingTypeIcon({ type, size = 20 }: { type?: TrainingType | null; size?: number }) {
  const { Icon } = trainingTypePresentation(type);
  return <Icon size={size} aria-hidden="true" focusable="false" />;
}
export function TrainingTypeBadge({ type, compact = false }: { type?: TrainingType | null; compact?: boolean }) {
  const presentation = trainingTypePresentation(type);
  return <span className="training-type-badge" style={trainingTypeStyle(type)}><TrainingTypeIcon type={type}/><span>{compact ? presentation.shortName : presentation.name}</span></span>;
}
