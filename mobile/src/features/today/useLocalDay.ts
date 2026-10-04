import { useEffect, useState } from 'react';
import { today } from '../../data/analytics';
import { currentCheckinDay, currentWellnessSlot } from '../shared/localTime';

function localMoment() { const date = new Date(); return { day: today(date), slot: currentWellnessSlot(date), checkinDay: currentCheckinDay(date) }; }
export function useLocalMoment() {
  const [moment, setMoment] = useState(localMoment);
  useEffect(() => {
    const check = () => { const next = localMoment(); setMoment(previous => previous.day === next.day && previous.slot === next.slot && previous.checkinDay === next.checkinDay ? previous : next); };
    const timer = window.setInterval(check, 30000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return moment;
}
export function useLocalDay() { return useLocalMoment().day; }
