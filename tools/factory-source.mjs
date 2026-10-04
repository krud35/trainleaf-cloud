// Prints factory exercise texts for translators: node tools/factory-source.mjs <from> <to>
// A cue or variant text shared by several exercises is listed once, under the first exercise that uses it.
import { loadTs } from './load-ts.mjs';
const { initialState } = loadTs('lib/seed.ts');
const exercises = initialState().exercises;
const [from = 0, to = exercises.length] = process.argv.slice(2).map(Number);
const seen = { cues: new Set(), variants: new Set() };
exercises.forEach((exercise, index) => {
  const lines = [`## ${exercise.id} | ${exercise.name} | ${exercise.nameEn ?? ''}`];
  for (const field of ['cues', 'variants']) {
    const text = exercise[field];
    if (!text || seen[field].has(text)) continue;
    seen[field].add(text);
    lines.push(`${field[0]}: ${exercise[`${field}En`] ?? text}`);
  }
  if (index >= from && index < to) console.log(lines.join('\n'));
});
