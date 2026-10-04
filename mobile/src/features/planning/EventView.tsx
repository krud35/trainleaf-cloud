import type { LocalEvent } from '../../data/domain';
import { dateLabel } from '../../ui/common';
import { useI18n } from '../../i18n';
export function EventCard({ event, onOpen }: { event: LocalEvent; onOpen?: (event: LocalEvent) => void }) {
  const { t } = useI18n();
  const content = <><span className="planning-event-type">{t(`eventKind.${event.kind}`)}</span><strong>{event.title}</strong><span>{dateLabel(event.start)}{event.end !== event.start ? ` – ${dateLabel(event.end)}` : ''}{event.time ? ` · ${event.time}` : ''}</span>{event.location && <small>{event.location}</small>}</>;
  return onOpen ? <button className="planning-event-card" onClick={() => onOpen(event)}>{content}</button> : <div className="planning-event-card">{content}</div>;
}
export function EventView({ event, onClose, onEdit }: { event: LocalEvent; onClose: () => void; onEdit: () => void }) {
  const { t } = useI18n();
  return <section className="stack planning-event-detail"><button className="back" onClick={onClose}>{t('planning.backToPlan')}</button><p className="eyebrow">{t(`eventKind.${event.kind}`)}</p><h1>{event.title}</h1><div className="card stack"><p>{dateLabel(event.start)} – {dateLabel(event.end)}{event.time ? ` · ${event.time}` : ''}</p>{event.location && <p>{t('planning.locationValue', { location: event.location })}</p>}{event.availability && <p>{t(`planning.eventAvailability_${event.availability}`)}</p>}{event.notes && <p className="preserve-lines">{event.notes}</p>}<p className="field-hint">{t('planning.eventsHint')}</p><button className="secondary" onClick={onEdit}>{t('planning.editEvent')}</button></div></section>;
}
