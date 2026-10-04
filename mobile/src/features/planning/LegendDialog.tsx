import { TRAINING_TYPES } from '../../data/domain';
import { RESERVE_MODEL_VERSION } from '../../data/reserve';
import { TrainingTypeBadge } from '../shared/TrainingTypeBadge';
import { ReserveTrack } from '../readiness/ReserveBar';
import { PlanningDialog } from './PlanningDialog';
import { useI18n } from '../../i18n';

export function LegendDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return <PlanningDialog title={t('calendar.legend')} onClose={onClose}><p>{t('planning.legendIntro')}</p><ul className="planning-legend">{TRAINING_TYPES.map(type => <li key={type.id}><TrainingTypeBadge type={type.id} /></li>)}<li><TrainingTypeBadge type={null} /></li></ul><p><strong>○</strong> — {t('planning.legendPlanned')} · <strong>✓</strong> — {t('planning.legendCompleted')} · <strong>–</strong> — {t('planning.legendSkipped')} · <strong>?</strong> — {t('planning.legendFuture')}.</p><p>{t('planning.legendPastPlan')}</p><p>{t('planning.legendEvents')}</p>
    <section className="reserve-legend" aria-labelledby="reserve-legend-title"><h3 id="reserve-legend-title">{t('reserve.legendTitle')}</h3>
      <p>{t('reserve.legendLength')}</p>
      <ul className="reserve-samples">
        <li><ReserveTrack reserve={0.9} level="high"/><span>{t('reserve.sampleHigh')}</span></li>
        <li><ReserveTrack reserve={0.4} level="medium"/><span>{t('reserve.sampleMedium')}</span></li>
        <li><ReserveTrack reserve={0.15} level="low"/><span>{t('reserve.sampleLow')}</span></li>
        <li><ReserveTrack reserve={0.7} level="high" lower/><span>{t('reserve.sampleLower')}</span></li>
      </ul>
      <p>{t('reserve.legendColours')}</p><p>{t('reserve.legendSessions')}</p><p>{t('reserve.legendAdapts')}</p><p>{t('reserve.legendApprox')}</p>
      <details><summary>{t('reserve.detailsSummary')}</summary><p>{t('reserve.details1')}</p><p>{t('reserve.details2')}</p><p>{t('reserve.details3')}</p><p>{t('reserve.details4')}</p><p>{t('reserve.details5', { version: RESERVE_MODEL_VERSION })}</p></details>
    </section>
  </PlanningDialog>;
}
