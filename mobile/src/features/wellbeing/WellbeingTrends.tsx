import { useState } from 'react';
import type { Wellness } from '../../data/domain';
import { addDays, today } from '../../data/analytics';
import { dateLabel } from '../../ui/common';
import { Help } from '../../ui/TrainingFields';
import { slotQuestions, wellnessQuestions, wellnessSlots, type WellnessMetric, type WellnessSlot } from '../../../../lib/wellness';
import { useI18n } from '../../i18n';
import { previousWellbeingTrend, wellbeingTrend } from './trends';
import { insightPeriod, insightRanges, type InsightRange } from '../progress/summary';
import '../../ui/wellness.css';

export type WellbeingTrendsProps = { records: Wellness[]; end?: string; initialDays?: 7 | 28; onNewEntry?: () => void };
export function WellbeingTrends({ records, end = today(), initialDays = 28, onNewEntry }: WellbeingTrendsProps) {
  const i18n = useI18n(), { t } = i18n;
  const number = (n: number) => i18n.n(n, 2);
  const label = (id: WellnessMetric) => t(`wellnessQuestion.label_${id}`);
  const answer = (value: number) => metric === 'sleepHours' ? t('wellbeing.hours', { value: number(value) }) : t('wellbeing.scaleValue', { value: number(value), max: wellnessQuestions[metric].max });
  const [range, setRange] = useState<InsightRange>(initialDays === 7 ? 'week' : 'month');
  const [slot, setSlot] = useState<WellnessSlot>('morning');
  const [metric, setMetric] = useState<WellnessMetric>('sleepHours');
  const { start, end: through, days, previousStart, previousEnd } = insightPeriod(end, range);
  const question = wellnessQuestions[metric];
  const trend = wellbeingTrend(records, slot, metric, start, through);
  const previous = previousWellbeingTrend(records, slot, metric, start, through);
  const unit = metric === 'sleepHours' ? ' h' : ` / ${question.max}`;
  const difference = (value: number) => `${value > 0 ? '+' : ''}${number(value)}`;
  const x = (date: string) => 14 + (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000 / Math.max(1, days - 1) * 268;
  const y = (value: number) => 112 - (value - question.min) / (question.max - question.min) * 92;
  return <section className="wbt-trends" aria-label={t('wellbeing.trends')}>
    <p className="wbt-intro">{t('wellbeing.trendsIntro')}</p>
    <div className="wbt-controls"><label className="field">{t('wellbeing.slot')}<select aria-label={t('wellbeing.trendSlot')} value={slot} onChange={event => { const next = event.target.value as WellnessSlot; setSlot(next); setMetric(slotQuestions[next][0]); }}>{wellnessSlots.map(value => <option key={value} value={value}>{t(`wellnessSlot.${value}`)}</option>)}</select></label><label className="field">{t('wellbeing.observation')}<select value={metric} onChange={event => setMetric(event.target.value as WellnessMetric)}>{slotQuestions[slot].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label></div>
    <div className="wbt-range" role="group" aria-label={t('wellbeing.trendRange')}>{insightRanges.map(item => <button key={item.id} type="button" aria-pressed={range === item.id} onClick={() => setRange(item.id)}>{t(`wellbeing.range_${item.id}`)}</button>)}</div>
    <p className="wbt-period">{dateLabel(start)} – {dateLabel(through)}</p>
    <article className="wbt-metric" key={`${slot}-${metric}`}><h2 className="eyebrow">{t('wellbeing.metricHeading', { slot: t(`wellnessSlot.${slot}`), label: label(metric) })}</h2>
      {trend.points.length ? <><svg className="wbt-chart" viewBox="0 0 300 132" role="img" aria-label={t('wellbeing.chartLabel', { label: label(metric), slot: t(`wellnessSlot.${slot}`), values: trend.points.map(p => t('wellbeing.chartPoint', { date: dateLabel(p.date), value: answer(p.value) })).join('; ') })}>
        {[question.min, (question.max + question.min) / 2, question.max].map(value => <g key={value}><line x1="14" x2="282" y1={y(value)} y2={y(value)} stroke="currentColor" opacity=".18" strokeDasharray="2 4"/><text x="0" y={y(value) - 5}>{value}</text></g>)}
        {trend.points.map((point, index) => { const before = trend.points[index - 1]; return <g key={point.id}>{before && addDays(before.date, 1) === point.date && <line x1={x(before.date)} y1={y(before.value)} x2={x(point.date)} y2={y(point.value)} stroke="currentColor" strokeWidth="2"/>}<circle cx={x(point.date)} cy={y(point.value)} r="3.5" fill="currentColor"/></g>; })}
      </svg><div className="wbt-chart-ends"><span>{dateLabel(start)}</span><span>{dateLabel(through)}</span></div></> : <div className="wbt-empty"><h3>{t('wellbeing.noAnswersTitle')}</h3><p>{t('wellbeing.noAnswersText', { slot: t(`wellnessSlot.${slot}`) })}</p>{onNewEntry && <button type="button" onClick={onNewEntry}>{t('wellbeing.newCheckin')}</button>}</div>}
      <div className="wbt-summary"><div><span>{t('wellbeing.average')}</span><strong>{trend.average === null ? '—' : number(trend.average)}{trend.average !== null && <small>{unit}</small>}</strong></div><div><span>{t('wellbeing.completeness')} <Help label={t('wellbeing.completenessHelpLabel')}>{t('wellbeing.completenessHelp', { days, entryDays: trend.entryDays })}</Help></span><strong>{trend.answeredDays}<small> {t('wellbeing.ofDays', { count: trend.days })}</small></strong></div></div>
      <p className="wbt-scale">{t(`wellnessQuestion.ends_${metric}`)}</p><p className="wbt-completeness">{t('wellbeing.gapsHint')}</p>
    </article>
    <p className="wbt-comparison">{previous.average === null || trend.average === null ? t('wellbeing.noComparison') : metric === 'sleepHours' ? t('wellbeing.comparisonHours', { count: days, average: number(previous.average), answered: previous.answeredDays, total: previous.days, difference: difference(trend.average - previous.average) }) : t('wellbeing.comparisonPoints', { count: days, average: number(previous.average), max: question.max, answered: previous.answeredDays, total: previous.days, difference: difference(trend.average - previous.average) })} <Help label={t('wellbeing.comparisonHelpLabel')}>{t('wellbeing.comparisonHelp', { start: dateLabel(previousStart), end: dateLabel(previousEnd) })}</Help></p>
    {trend.points.length > 0 && <details className="wbt-answer-details"><summary>{t('wellbeing.answers', { label: label(metric) })}</summary><ul className="wbt-values">{trend.points.map(p => <li key={p.id}><time dateTime={p.date}>{dateLabel(p.date)}</time><strong>{number(p.value)}{unit}</strong></li>)}</ul></details>}
  </section>;
}
