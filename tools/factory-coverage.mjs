// Reports factory catalog coverage (exercise names, notes, cues, variants, templates, period presets).
import { loadTs } from './load-ts.mjs';
const { factoryCoverage } = loadTs('mobile/src/i18n/factory/index.ts');
const coverage = factoryCoverage();
for (const entry of coverage) console.log(entry.language, `${entry.translated}/${entry.total}`, entry.missing.slice(0, 12).join(' '));
process.exitCode = coverage.some(entry => entry.missing.length) ? 1 : 0;
