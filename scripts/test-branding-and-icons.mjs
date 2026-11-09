import fs from 'node:fs';
import assert from 'node:assert/strict';

const main = fs.readFileSync('./src/main.js', 'utf8');
const css = fs.readFileSync('./src/style.css', 'utf8');
const store = fs.readFileSync('./src/lib/student-profile-store.mjs', 'utf8');
const index = fs.readFileSync('./index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('./public/manifest.webmanifest', 'utf8'));
const iconBuilder = fs.readFileSync('./scripts/prepare-app-icons.py', 'utf8');

assert.ok(fs.existsSync('./public/assets/teacher-portrait.jpeg'), 'teacher portrait asset must exist');
assert.ok(main.includes('app-splash-teacher') && main.includes('/assets/teacher-portrait.jpeg'), 'startup screen must show the supplied teacher portrait');
assert.ok(main.includes('app-splash-brand') && main.includes('EngliMensh-Egypt'), 'startup screen must show the application identity');
assert.ok(main.includes('>Cream</option>') && main.includes('>Blue</option>') && main.includes('>Green</option>') && main.includes('>Purple</option>'), 'all four approved theme names must be visible');
assert.ok(store.includes("new Set(['classic', 'ocean', 'forest', 'lavender'])"), 'existing persisted theme IDs must remain backward compatible');
assert.ok(css.includes(':root[data-theme="classic"]') && css.includes(':root[data-theme="ocean"]') && css.includes(':root[data-theme="forest"]') && css.includes(':root[data-theme="lavender"]'), 'all four themes must have active CSS palettes');
assert.ok(css.includes('.app-splash') && css.includes('.app-splash.is-hidden'), 'startup screen must have visible and exit states');
assert.ok(index.includes('/icons/englimensh-icon-192.png'), 'HTML entry point must reference generated app icon');
assert.ok(manifest.icons.some((icon) => icon.src.includes('englimensh-icon-192.png')), 'PWA manifest must reference the generated 192px icon');
assert.ok(manifest.icons.some((icon) => icon.src.includes('englimensh-icon-512.png')), 'PWA manifest must reference the generated 512px icon');
assert.ok(iconBuilder.includes('1ca26e40-e568-42ff-84fa-c83369991f31'), 'icon generator must use the exact user-selected artwork');
assert.ok(iconBuilder.includes('mipmap-anydpi-v26') && iconBuilder.includes('ic_launcher_foreground.png'), 'icon generator must create Android adaptive icon assets');
assert.ok(iconBuilder.includes('ic_launcher_round.png'), 'icon generator must create round Android launcher icons');
console.log('Branding checks passed: splash, teacher portrait, four approved themes, PWA and Android icon source.');
