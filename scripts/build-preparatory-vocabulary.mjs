import { promises as fs } from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, 'content-imports', 'preparatory');
const OUTPUT = path.join(ROOT, 'src', 'data', 'preparatory-vocabulary.json');
const ASSET_ROOT = path.join(ROOT, 'public', 'assets', 'preparatory-vocabulary');
function decodeHtml(value = '') { return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim(); }
function slug(value) { return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'word'; }
async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}
function readBalanced(source, start) {
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === '[') depth += 1;
    else if (c === ']' && --depth === 0) return source.slice(start, i + 1);
  }
  return '';
}
function parseVocabArray(source) {
  const marker = 'const vocabData =';
  const at = source.indexOf(marker);
  if (at < 0) return [];
  const start = source.indexOf('[', at + marker.length);
  if (start < 0) return [];
  try { return JSON.parse(readBalanced(source, start)); } catch { return []; }
}
function parseStaticCards(source) {
  const cards = [];
  const re = /class="vocab-card"[^>]*>\s*<strong>\s*\d+\.\s*([^<]+)<\/strong>\s*<br\s*\/?>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = re.exec(source))) {
    const word = decodeHtml(match[1]);
    const detail = decodeHtml(match[2].replace(/<[^>]+>/g, ' ').replace(/[📅🕒🔄🎒🎯⚽📋🔍🏆💪🧠⛰️📈🚀]/gu, '').replace(/\s+/g, ' '));
    if (word) cards.push({ word, pos: '', arabic: '', def: detail, example: '', svg: '' });
  }
  return cards;
}
function parseCombinedUnits(source) {
  const out = {};
  const start = source.indexOf('const unitsData =');
  if (start < 0) return out;
  const body = source.slice(source.indexOf('{', start));
  const unitStarts = [...body.matchAll(/^\s{6}(\d):\s*{\s*title:/gm)];
  for (let i = 0; i < unitStarts.length; i += 1) {
    const unitNo = Number(unitStarts[i][1]);
    const block = body.slice(unitStarts[i].index, unitStarts[i + 1]?.index ?? body.length);
    const items = [];
    const re = /{\s*["']?w["']?\s*:\s*"([^"]+)",\s*["']?pos["']?\s*:\s*"([^"]*)",\s*["']?ar["']?\s*:\s*"([^"]*)",\s*["']?def["']?\s*:\s*"([^"]*)",\s*["']?ex["']?\s*:\s*"([^"]*)",\s*["']?icon["']?\s*:\s*[\x60]([\s\S]*?)[\x60]\s*}/g;
    let m;
    while ((m = re.exec(block))) items.push({ word: m[1], pos: m[2], arabic: m[3], def: m[4], example: m[5], svg: m[6] });
    if (items.length) out[unitNo] = items;
  }
  return out;
}
function identify(file) {
  const name = path.basename(file);
  let m = name.match(/^Prep_(1|2|3)_New_Hello_Unit_(\d+)/);
  if (m) return { grade: Number(m[1]), path: 'general', unit: Number(m[2]) };
  m = name.match(/^Prep_(1|2|3)_New_Hello_Plus_Unit_(\d+)/);
  if (m) return { grade: Number(m[1]), path: 'advanced', unit: Number(m[2]) };
  if (/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum/.test(name)) return { grade: 3, path: 'general', combined: true };
  return null;
}
function safeSvg(svg = '') {
  if (!svg.includes('<svg') || /<script|foreignObject|javascript:/i.test(svg)) return '';
  return svg.includes('xmlns=') ? svg : svg.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
}
async function findOpenverseImage(word) {
  const params = new URLSearchParams({
    q: word,
    page_size: '5',
    license_type: 'commercial',
    extension: 'jpg,jpeg,png,webp'
  });
  const endpoint = 'https://api.openverse.org/v1/images/?' + params.toString();
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(endpoint, { headers: { 'User-Agent': 'EngliMenshEgypt/1.0 (educational vocabulary image sourcing)' } });
    if (response.status !== 429 && response.status !== 503) break;
    const retryAfter = Number(response.headers.get('retry-after') || 0);
    await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 1500 * (attempt + 1))));
  }
  if (!response?.ok) throw new Error('Openverse search HTTP ' + response?.status);
  const json = await response.json();
  const item = (json.results || []).find((result) => result.thumbnail && result.url && result.mature !== true);
  if (!item) return null;
  const image = await fetch(item.thumbnail, { headers: { 'User-Agent': 'EngliMenshEgypt/1.0' } });
  if (!image.ok) return null;
  const bytes = Buffer.from(await image.arrayBuffer());
  if (bytes.length < 3000 || bytes.length > 1500000) return null;
  const extension = ['jpg', 'jpeg', 'png', 'webp'].includes((item.filetype || '').toLowerCase()) ? item.filetype.toLowerCase() : 'jpg';
  const file = slug(word) + '.' + extension;
  await fs.mkdir(ASSET_ROOT, { recursive: true });
  await fs.writeFile(path.join(ASSET_ROOT, file), bytes);
  return {
    image: '/assets/preparatory-vocabulary/' + file,
    imageSource: 'Openverse',
    attribution: decodeHtml(item.attribution || (item.title || 'Image') + ' by ' + (item.creator || 'Unknown creator')),
    creator: decodeHtml(item.creator || ''),
    license: decodeHtml((item.license || 'CC') + (item.license_version ? ' ' + item.license_version : '')),
    licenseUrl: item.license_url || '',
    sourceUrl: item.foreign_landing_url || item.detail_url || item.url
  };
}
async function mapLimit(items, limit, worker) {
  let cursor = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (cursor < items.length) { const index = cursor++; await worker(items[index], index); }
  }));
}
const files = await walk(SOURCE_ROOT);
const registry = {};
const pendingImages = new Map();
for (const file of files) {
  const id = identify(file);
  if (!id) continue;
  const source = await fs.readFile(file, 'utf8');
  if (id.combined) {
    const units = parseCombinedUnits(source);
    for (const [unit, words] of Object.entries(units)) registry['3:general:' + unit] = { words };
    continue;
  }
  let words = parseVocabArray(source);
  if (!words.length && id.path === 'general' && id.grade === 2) words = parseStaticCards(source);
  if (!words.length) continue;
  registry[id.grade + ':' + id.path + ':' + id.unit] = { words: words.map((item) => ({
    word: decodeHtml(item.word || item.w || ''), pos: decodeHtml(item.pos || ''), arabic: decodeHtml(item.arabic || item.ar || ''),
    definition: decodeHtml(item.def || ''), example: decodeHtml(item.example || item.ex || ''), svg: safeSvg(item.svg || item.icon || '')
  })).filter((item) => item.word) };
}
for (const unit of Object.values(registry)) for (const item of unit.words) if (!item.svg && !pendingImages.has(item.word.toLowerCase())) pendingImages.set(item.word.toLowerCase(), item.word);
const imageWords = [...pendingImages.values()];
let downloaded = 0, missing = 0;
await mapLimit(imageWords, 1, async (word, index) => {
  try { if (index > 0) await new Promise((resolve) => setTimeout(resolve, 1100));
    const result = await findOpenverseImage(word); pendingImages.set(word.toLowerCase(), result); if (result) downloaded += 1; else missing += 1; }
  catch (error) { pendingImages.set(word.toLowerCase(), null); missing += 1; console.warn('Image lookup failed for', word, error.message); }
});
for (const unit of Object.values(registry)) unit.words = unit.words.map((item) => {
  if (item.svg) return { ...item, imageType: 'svg-illustration' };
  const found = pendingImages.get(item.word.toLowerCase());
  return { ...item, ...(found || {}), imageType: found ? 'photo' : 'missing' };
});
await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, JSON.stringify({
  schemaVersion: 1, source: 'Owner-supplied preparatory HTML; original source files remain unchanged.',
  imageCredits: 'Openly licensed Openverse image attribution and license are included on each photo record.',
  units: registry,
  imageReport: { units: Object.keys(registry).length, words: Object.values(registry).reduce((sum, unit) => sum + unit.words.length, 0), commonsImagesDownloaded: downloaded, imagesMissing: missing }
}, null, 2) + '\n');
console.log('Preparatory vocabulary built:', Object.keys(registry).length, 'units;', imageWords.length, 'Openverse lookups;', downloaded, 'photos;', missing, 'without a photo.');
