import { availability, eventKind, exerciseCategory, exerciseType, metric, muscle, section, shortcut, sport, sportGroup, trainingType, workoutStatus } from './domain';
import { editor } from './editor';
import { errors } from './errors';
import { wellbeing } from './insights';
import { dose, entry, files, history, session, survey, today } from './journal';
import { library } from './library';
import { forecast, muscleMap } from './plan-tools';
import { calendar, planning } from './planning';
import { progress } from './progress';
import { quiz, reserve } from './reserve';
import { app, more, settings } from './shell';
import { training } from './training';
import { scale, wellnessQuestion, wellnessSlot } from './wellness-scales';

/** All interface dictionaries. A key is addressed as `<namespace>.<key>`. */
export const namespaces = {
  app, settings, more, today, history, session, dose, entry, survey, files, calendar, planning, wellbeing, progress, forecast, muscleMap, training, editor, library, errors,
  reserve, quiz,
  sport, sportGroup, trainingType, muscle, section, metric, exerciseCategory, exerciseType, workoutStatus, eventKind, availability, shortcut, wellnessSlot, wellnessQuestion, scale,
};
