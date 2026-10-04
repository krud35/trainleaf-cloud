import type { LocalSnapshot } from '../../data/domain';
import { reserveModel, type ReserveLevel } from '../../data/reserve';
import { dateLabel } from '../../ui/common';
import './readiness.css';
import { useI18n } from '../../i18n';

/** Shape of one bar. Length and text carry the meaning; colour and hatching only repeat it. */
export function ReserveTrack({ reserve, level, lower }: { reserve: number; level: ReserveLevel; lower?: boolean }) {
  return <span className={`reserve-track reserve-${level} ${lower ? 'reserve-lower' : ''}`} aria-hidden="true"><span style={{ width: `${Math.round(Math.min(1, Math.max(0, reserve)) * 100)}%` }}/></span>;
}
/** Estimated reserve of one calendar day, including the sessions of that day (plan-reserve-v2). */
export function ReserveBar({ snapshot, day }: { snapshot: LocalSnapshot; day: string }) {
  const { t } = useI18n();
  const result = reserveModel(snapshot).day(day), lower = result.confidence === 'lower';
  const level = t(`reserve.level_${result.level}`);
  return <div className="reserve-day" role="img" data-reserve={result.reserve.toFixed(3)} data-level={result.level} data-confidence={result.confidence}
    aria-label={t(lower ? 'reserve.barLabelLower' : 'reserve.barLabel', { date: dateLabel(day), level })}>
    <ReserveTrack reserve={result.reserve} level={result.level} lower={lower}/>
    <small className="reserve-caption" aria-hidden="true">{t(lower ? 'reserve.captionLower' : 'reserve.caption', { level })}</small>
  </div>;
}
