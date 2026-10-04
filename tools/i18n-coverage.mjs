// Reports dictionary coverage for the four languages without any fallback.
// Usage: node tools/i18n-coverage.mjs [--json out.json]
import fs from 'node:fs';
import { loadTs } from './load-ts.mjs';
const { coverageIssues } = loadTs('mobile/src/i18n/core.ts');
const { namespaces } = loadTs('mobile/src/i18n/messages/index.ts');
const { LANGUAGES } = loadTs('mobile/src/i18n/locale.ts');
const issues = coverageIssues(namespaces);
const keys = Object.entries(namespaces).flatMap(([name, namespace]) => Object.keys(namespace.en).map(key => `${name}.${key}`));
const perLanguage = Object.fromEntries(LANGUAGES.map(language => {
  const missing = new Set(issues.filter(issue => issue.language === language).map(issue => issue.key));
  return [language, { keys: keys.length, complete: keys.length - missing.size, issues: issues.filter(issue => issue.language === language).length }];
}));
// Texts identical to English are listed for review; many are legitimate (units, proper names).
const sameAsEnglish = Object.fromEntries(LANGUAGES.filter(language => language !== 'en').map(language => [language,
  Object.entries(namespaces).flatMap(([name, namespace]) => Object.entries(namespace.en)
    .filter(([key, message]) => JSON.stringify(namespace[language][key]) === JSON.stringify(message) && /[A-Za-z]{4,}/.test(JSON.stringify(message)))
    .map(([key]) => `${name}.${key}`))]));
const report = { namespaces: Object.keys(namespaces).length, keys: keys.length, perLanguage, issues, sameAsEnglish };
const out = process.argv.indexOf('--json');
if (out > 0) fs.writeFileSync(process.argv[out + 1], JSON.stringify(report, null, 1));
console.log(JSON.stringify({ namespaces: report.namespaces, keys: report.keys, perLanguage, issues: issues.slice(0, 40), sameAsEnglish: Object.fromEntries(Object.entries(sameAsEnglish).map(([language, list]) => [language, list.length])) }, null, 1));
process.exitCode = issues.length ? 1 : 0;
