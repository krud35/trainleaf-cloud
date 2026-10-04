import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';

const read = name => fs.readFileSync(new URL(name, import.meta.url), 'utf8');
const html = read('./index.html');
const files = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1]);
assert.equal(files.at(-1), 'theme.css', 'Theme overrides must follow component styles');
const sheets = files.map(file => postcss.parse(read(file), {from:file}));
const theme = sheets.at(-1);
const palettes = {light:{}, dark:{}};
for (const sheet of sheets) sheet.walkRules(rule => {
  if (rule.selector === ':root') rule.walkDecls(/^--/, decl => {
    palettes.light[decl.prop] = decl.value;
    palettes.dark[decl.prop] = decl.value;
  });
  if (rule.selector === ':root[data-theme=dark]') rule.walkDecls(/^--/, decl => {
    palettes.dark[decl.prop] = decl.value;
  });
});
const resolve = (value, mode='dark') => {
  const token = value.match(/^var\((--[\w-]+)(?:,([^)]*))?\)$/);
  return token ? resolve(palettes[mode][token[1]] ?? token[2], mode) : value;
};
function rgb(value) {
  const hex = value.replace(/^#/, '');
  assert.match(hex, /^(?:[\da-f]{3}|[\da-f]{6})$/i, `Opaque hex color expected: ${value}`);
  const full = hex.length === 3 ? [...hex].map(c => c+c).join('') : hex;
  return [0,2,4].map(i => parseInt(full.slice(i,i+2),16));
}
function luminance(color) {
  const [r,g,b] = rgb(color).map(x => x/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
}
function ratio(a,b) {
  const values = [luminance(a),luminance(b)].sort((x,y) => y-x);
  return (values[0]+.05)/(values[1]+.05);
}
function blend(foreground,background,alpha) {
  const fg=rgb(foreground),bg=rgb(background);
  return '#'+fg.map((channel,i) => Math.round(channel*alpha+bg[i]*(1-alpha)).toString(16).padStart(2,'0')).join('');
}
function ruleValue(selector,property) {
  let value;
  theme.walkRules(rule => {
    if (rule.selector === selector) rule.walkDecls(property,decl => {value=decl.value});
  });
  assert.ok(value, `Missing ${property} in ${selector}`);
  return resolve(value);
}
const results=[];
function check(label,foreground,background,minimum=4.5,mode='dark') {
  const value = ratio(resolve(foreground,mode),resolve(background,mode));
  results.push({label,ratio:Number(value.toFixed(2)),minimum});
  assert.ok(value >= minimum, `${label}: ${value.toFixed(2)}:1 is below ${minimum}:1`);
}
for (const mode of ['light','dark']) {
  for (const text of ['ink','muted']) {
    const surfaces = mode === 'light' ? ['page','paper'] : ['page','paper','surface','surface-raised','surface-hover','surface-soft','form'];
    for (const surface of surfaces) check(`${mode} ${text}/${surface}`,`var(--${text})`,`var(--${surface})`,4.5,mode);
  }
  for (const type of ['strength','running','endurance','technique','team','mental']) {
    check(`${mode} ${type}`,`var(--type-${type}-ink)`,`var(--type-${type}-paper)`,4.5,mode);
    if(mode === 'dark')check(`${type} secondary text`,'var(--muted)',`var(--type-${type}-paper)`);
  }
}
for (const [foreground,background] of [['on-accent','accent-fill'],['warm-ink','warm-paper'],['error-ink','error-paper']]) {
  check(`${foreground}/${background}`,`var(--${foreground})`,`var(--${background})`);
}
for (const surface of ['paper','surface','surface-raised','surface-hover','form']) {
  for (const token of ['focus','line-strong','chart']) check(`${token}/${surface}`,`var(--${token})`,`var(--${surface})`,3);
}
check('slider boundary/answered','var(--line-strong)','#253923',3);
check('chart fill/track','var(--chart)','var(--track)',3);
check('insight secondary text','var(--muted)','#2A3C26');
check('selected calendar secondary text','var(--muted)','#30432B');

const leafRules = [
  {selector:'[data-theme=dark] .checkin-card',textSelector:'[data-theme=dark] :is(.checkin-intro .eyebrow,.checkin-optional,.checkin-card p)',hover:false},
  {selector:'[data-theme=dark] :is(.checkin-card,.context-feature,.period-card)',textSelector:'[data-theme=dark] :is(.checkin-card,.context-feature,.period-card)',hover:true},
  {selector:'[data-theme=dark] :is(.goal-feature,.goal-card)',textSelector:'[data-theme=dark] :is(.goal-feature,.goal-card)',hover:true}
];
const hoverFill=ruleValue('[data-theme=dark] :is(.context-feature,.period-card):hover .leaf-blade','fill');
const hoverFraction=Number(hoverFill.match(/var\(--leaf-wash\) (\d+)%/)?.[1])/100;
assert.ok(hoverFraction>0 && hoverFraction<1);
for (const {selector,textSelector,hover} of leafRules) {
  const blade=ruleValue(selector,'--blade'),wash=ruleValue(selector,'--leaf-wash'),ink=ruleValue(textSelector,'color');
  check(`leaf ${selector}`,ink,blade);
  // The SVG wash is translucent; inspect the lighter paint behind the copy too.
  check(`leaf wash ${selector}`,ink,blend(wash,blade,.16));
  if(hover) check(`leaf hover+wash ${selector}`,ink,blend(wash,blend(wash,blade,hoverFraction),.16));
}
for(const [label,textSelector,leafSelector] of [
  ['period secondary','[data-theme=dark] :is(.period-card:not(.goal-card) .eyebrow,.period-card:not(.goal-card) p,.period-card .period-dates)','[data-theme=dark] :is(.checkin-card,.context-feature,.period-card)'],
  ['goal dates','[data-theme=dark] .goal-card .period-dates','[data-theme=dark] :is(.goal-feature,.goal-card)']
]) {
  const wash=ruleValue(leafSelector,'--leaf-wash'),blade=ruleValue(leafSelector,'--blade');
  check(label,ruleValue(textSelector,'color'),blend(wash,blend(wash,blade,hoverFraction),.16));
}
check('empty state',ruleValue('[data-theme=dark] .empty p','color'),'var(--surface)');
check('goal description',ruleValue('[data-theme=dark] .goal-card>p','color'),ruleValue('[data-theme=dark] :is(.goal-feature,.goal-card)','--blade'));
assert.ok(!/filter\s*:\s*invert\(/i.test(theme.toString()), 'Use explicit palette, not global inversion');
console.log(`PASS: ${files.length} stylesheets parse; ${results.length} palette pairs meet their text/control thresholds.`);
console.log(`Minimum checked text ratio: ${Math.min(...results.filter(x=>x.minimum===4.5).map(x=>x.ratio))}:1. Minimum checked control/chart ratio: ${Math.min(...results.filter(x=>x.minimum===3).map(x=>x.ratio))}:1.`);
console.log('This checks source colors, including selected leaf overlays. It does not verify browser cascade, every composite, native controls, or visual layout.');
