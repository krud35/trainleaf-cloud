import { CalendarDays, ChevronRight, MapPin, Plane, Trophy } from 'lucide-react';
import type { LocalEvent } from '../../data/domain';
import { dateLabel } from '../../ui/common';
import { useI18n } from '../../i18n';


export function TodayEvents({ events, onOpen }: { events: LocalEvent[]; onOpen?: (event: LocalEvent) => void }) {
  const { t } = useI18n();
  if (!events.length) return null;
  return <section className="today-events" aria-label={t('session.eventsToday')}><h2>{t('session.events')}</h2><div>{events.map(event => {
    const Icon = event.kind === 'trip' ? Plane : event.kind === 'competition' ? Trophy : CalendarDays;
    const content = <><Icon className="today-event-icon" size={22} aria-hidden="true"/><span className="today-event-copy"><small>{t(`eventKind.${event.kind}`)}{event.time ? ` · ${event.time}` : ''}</small><strong>{event.title}</strong>{event.start !== event.end && <small>{dateLabel(event.start)} – {dateLabel(event.end)}</small>}{event.location && <small className="today-event-location"><MapPin size={13} aria-hidden="true"/>{event.location}</small>}{event.availability && <small>{t(`availability.${event.availability}`)}</small>}</span>{onOpen && <ChevronRight size={18} aria-hidden="true"/>}</>;
    return onOpen ? <button type="button" className="today-event-row" key={event.id} aria-label={t('session.openEvent', { title: event.title })} onClick={() => onOpen(event)}>{content}</button> : <article className="today-event-row" key={event.id}>{content}</article>;
  })}</div></section>;
}
