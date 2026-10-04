// Loads TypeScript sources for node scripts and tests (same transpile approach as tests/mobile-data.test.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
export const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const modules = new Map();
function resolve(base) {
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), base]) if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  throw new Error(`Cannot resolve ${base}`);
}
export function loadTs(file) {
  const absolute = resolve(path.resolve(root, file).replace(/\.tsx?$/, ''));
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const compiledModule = { exports: {} };
  modules.set(absolute, compiledModule);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? name.endsWith('.css') ? {} : loadTs(path.relative(root, path.resolve(path.dirname(absolute), name)))
    : require(name);
  new Function('require', 'module', 'exports', js)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
