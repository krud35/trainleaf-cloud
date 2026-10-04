import { currentTranslator } from '../i18n';
import { scaleLabels } from '../i18n/labels';

const ranges = { sleepQuality: [1, 5], fatigue: [0, 10], soreness: [0, 10], energy: [1, 5], stress: [0, 10], mood: [1, 5], focus: [1, 5], recovery: [1, 5] } as const;
export type FeelingMetric = keyof typeof ranges;
/** Descriptions of each point of a wellbeing scale in the current language. */
export function feelingLabels(metric: string): string[] | undefined {
  const range = ranges[metric as FeelingMetric];
  return range ? scaleLabels(currentTranslator(), metric, range[0], range[1]) : undefined;
}
export const postFatigueLabels = () => scaleLabels(currentTranslator(), 'postFatigue', 0, 10);
export const satisfactionLabels = () => scaleLabels(currentTranslator(), 'satisfaction', 0, 10);
