import { useEffect, useRef } from 'react';
import type { Wellness } from '../../data/domain';
import { dateLabel } from '../../ui/common';
import { slotQuestions, wellnessQuestions } from '../../../../lib/wellness';
import { useI18n } from '../../i18n';
import '../../ui/wellness.css';

export type WellnessEntryDetailProps = { entry: Wellness; onEdit: () => void; onClose: () => void };
export function WellnessEntryDetail({ entry, onEdit, onClose }: WellnessEntryDetailProps) {
  const i18n = useI18n(), { t } = i18n;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [entry.id]);
  return <section className="wellbeing-view ed-detail" aria-label={t('entry.wellnessDetails')}><button type="button" className="back" onClick={onClose}>{t('entry.backToWellbeing')}</button><h1 tabIndex={-1} ref={heading}>{t('entry.yourCheckin')}</h1><p>{dateLabel(entry.date)} · {t(`wellnessSlot.${entry.slot}`)}</p><dl className="ed-facts ed-wellness-facts">{slotQuestions[entry.slot].map(metric => <div key={metric}><dt>{t(`wellnessQuestion.label_${metric}`)}</dt><dd>{entry.answers[metric] == null ? t('entry.noAnswer') : metric === 'sleepHours' ? t('entry.hoursValue', { value: i18n.n(entry.answers[metric]!, 2) }) : t('entry.scaleValue', { value: entry.answers[metric]!, max: wellnessQuestions[metric].max })}</dd></div>)}</dl>{entry.notes && <section className="ed-notebook"><h2>{t('entry.yourNote')}</h2><p className="ed-notes">{entry.notes}</p></section>}<button type="button" className="primary" onClick={onEdit}>{t('entry.editEntry')}</button></section>;
}
