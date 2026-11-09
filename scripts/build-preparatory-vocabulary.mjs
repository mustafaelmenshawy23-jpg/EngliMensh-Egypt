import { promises as fs } from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, 'content-imports', 'preparatory');
const OUTPUT = path.join(ROOT, 'src', 'data', 'preparatory-vocabulary.json');
const PREP2_REVIEW_LAYER = path.join(ROOT, 'src', 'data', 'prep2-new-hello-reviewed-layer.json');
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
function parseJsString(source, start) {
  const quote = source[start];
  let value = '';
  for (let i = start + 1; i < source.length; i += 1) {
    const c = source[i];
    if (c === quote) return { value, next: i + 1 };
    if (c === '\\' && i + 1 < source.length) {
      const next = source[++i];
      value += next === 'n' ? '\n' : next === 'r' ? '\r' : next === 't' ? '\t' : next;
    } else value += c;
  }
  return { value, next: source.length };
}
function parseJsVocabArray(source, start) {
  const items = [];
  let i = start + 1;
  const skip = () => { while (i < source.length && /[\s,]/.test(source[i])) i += 1; };
  while (i < source.length) {
    skip();
    if (source[i] === ']') break;
    if (source[i] !== '{') { i += 1; continue; }
    i += 1;
    const item = {};
    while (i < source.length) {
      skip();
      if (source[i] === '}') { i += 1; break; }
      let key = '';
      if (source[i] === "'" || source[i] === '"' || source[i] === '\x60') {
        const parsed = parseJsString(source, i); key = parsed.value; i = parsed.next;
      } else {
        const match = source.slice(i).match(/^([A-Za-z_$][\w$]*)/);
        if (!match) { i += 1; continue; }
        key = match[1]; i += key.length;
      }
      skip();
      if (source[i] !== ':') { i += 1; continue; }
      i += 1; skip();
      if (source[i] === "'" || source[i] === '"' || source[i] === '\x60') {
        const parsed = parseJsString(source, i); item[key] = parsed.value; i = parsed.next;
      } else {
        while (i < source.length && source[i] !== ',' && source[i] !== '}') i += 1;
      }
    }
    if (item.word || item.w) items.push(item);
  }
  return items;
}
function parseVocabArray(source) {
  const marker = 'const vocabData =';
  const at = source.indexOf(marker);
  if (at < 0) return [];
  const start = source.indexOf('[', at + marker.length);
  if (start < 0) return [];
  try { return JSON.parse(readBalanced(source, start)); }
  catch { return parseJsVocabArray(source, start); }
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
  const unitStarts = [...body.matchAll(/^[ \t]{6}(\d):\s*{\s*title:/gm)];
  for (let i = 0; i < unitStarts.length; i += 1) {
    const unitNo = Number(unitStarts[i][1]);
    const block = body.slice(unitStarts[i].index, unitStarts[i + 1]?.index ?? body.length);
    const items = [];
    const re = /{\s*["']?w["']?\s*:\s*"([^"]+)",\s*["']?pos["']?\s*:\s*"([^"]*)",\s*["']?ar["']?\s*:\s*"([^"]*)",\s*["']?def["']?\s*:\s*"([^"]*)",\s*["']?ex["']?\s*:\s*"([^"]*)",\s*["']?icon["']?\s*:\s*[\x60]([\s\S]*?)[\x60]\s*}/g;
    let m;
    while ((m = re.exec(block))) items.push({ word: m[1], pos: m[2], arabic: m[3], def: m[4], example: m[5], svg: m[6] });
    if (!items.length) {
      const generated = block.match(/vocab:\s*generateUnitVocab\(\s*"[^"]*"\s*,\s*\[([\s\S]*?)\]\s*\)/);
      if (generated) {
        const words = [...generated[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
        for (const word of words) items.push({ word, pos: '', arabic: '', def: '', example: '', svg: '' });
      }
    }
    if (items.length) out[unitNo] = items;
  }
  return out;
}
function prepareOfflineLessonCopy(source) {
  // Preserve original files. Generated copies use system font fallbacks and
  // describe speechSynthesis accurately as device TTS, not recorded audio.
  return source
    .replace(/<link\b(?=[^>]*href=["']https?:\/\/fonts\.(?:googleapis|gstatic)\.com)[^>]*>\s*/gi, '')
    .replace(/Listen to the authentic passage read with native English pronunciation\./gi, "Listen to the passage using your device's available English text-to-speech voice.")
    .replace(/▶ Play Listening Audio/g, '▶ Play listening script')
    .replace(/▶ Play Audio/g, '▶ Play read-aloud');
}

async function buildSectionViewers(files) {
  const outputDir = path.join(ROOT, 'public', 'preparatory-viewers');
  await fs.mkdir(outputDir, { recursive: true });
  const enhancementSource = await fs.readFile(path.join(ROOT, 'scripts', 'prep2-interactive-enhancement.js'), 'utf8');
  const reviewLayer = JSON.parse(await fs.readFile(PREP2_REVIEW_LAYER, 'utf8'));
  const grammarGuides = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'data', 'prep2-new-hello-grammar-guides.json'), 'utf8'));
  const enhancement = '<script>window.__PREP2_REVIEW_LAYER__=' + JSON.stringify(reviewLayer).replace(/</g, '\\u003c') + ';window.__PREP2_GRAMMAR_GUIDES__=' + JSON.stringify(grammarGuides).replace(/</g, '\\u003c') + ';</script>\n<script>\n' + enhancementSource + '\n</script>';
  for (const file of files) {
    const originalSource = await fs.readFile(file, 'utf8');
    const source = prepareOfflineLessonCopy(originalSource);
    const lessonMatch = path.basename(file).match(/^Prep_(1|2|3)_New_Hello(_Plus)?_Unit_(\d+)(?:_Complete)?\.html$/i);
    const isPrep1General = Boolean(lessonMatch && lessonMatch[1] === '1' && !lessonMatch[2]);
    const lessonGrade = Number(lessonMatch?.[1] || 0);
    const lessonPath = lessonMatch?.[2] ? 'advanced' : 'general';
    const lessonUnitNumber = Number(lessonMatch?.[3] || 0);
    const hasLegacyAssessment = Boolean(lessonMatch && /function\s+handleQuizAnswer/.test(source) && /const\s+examData\s*=/.test(source) && /const\s+answered\s*=/.test(source));
    const isPrep3Combined = path.basename(file) === 'Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html';
    const prep1Route = hasLegacyAssessment ? `<script>
(() => {
  const moduleTabs = {
    vocabulary: 'vocab',
    vocabulary_questions: 'vocab-quiz',
    grammar: 'grammar',
    grammar_questions: 'grammar-quiz',
    reading: 'reading',
    listening: 'listening',
    comprehensive_test: 'exam'
  };
  function applyViewerRoute() {
    const route = window.location.hash.match(/^#([a-z_]+):([1-6])$/i);
    if (!route) return;
    const tab = moduleTabs[route[1].toLowerCase()];
    if (tab && typeof window.switchTab === 'function') window.switchTab(tab);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyViewerRoute, { once: true });
  } else {
    applyViewerRoute();
  }
  window.addEventListener('hashchange', applyViewerRoute);
})();
</script>\n` : '';
    const prep1AssessmentBridge = hasLegacyAssessment ? `<script>
(() => {
  const original = window.handleQuizAnswer;
  if (typeof original !== 'function' || window.__ENGLIMENSH_CERTIFICATE_BRIDGE__) return;
  window.__ENGLIMENSH_CERTIFICATE_BRIDGE__ = true;
  window.handleQuizAnswer = function(prefix, questionIndex, chosenIndex, correctIndex) {
    const result = original.apply(this, arguments);
    if (prefix === 'exam' && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'englimensh:prep-assessment-progress',
          grade: ${lessonGrade},
          path: '${lessonPath}',
          unitNumber: ${lessonUnitNumber},
          total: examData.length,
          attempted: answered.exam.size,
          correct: scores.exam
        }, '*');
      } catch (error) { console.warn('Assessment progress could not be reported to the student profile.', error); }
    }
    return result;
  };
})();
</script>\n` : '';
    const prep3AssessmentBridge = isPrep3Combined ? `<script>
(() => {
  const route = window.location.hash.match(/^#comprehensive_test:([1-6])$/i);
  if (route && typeof window.selectUnit === 'function' && typeof window.switchSubTab === 'function') {
    const unitNumber = Number(route[1]);
    window.selectUnit(unitNumber);
    window.switchSubTab('exam');
  }
  const original = window.checkAnswer;
  if (typeof original !== 'function' || window.__ENGLIMENSH_PREP3_CERTIFICATE_BRIDGE__) return;
  window.__ENGLIMENSH_PREP3_CERTIFICATE_BRIDGE__ = true;
  window.checkAnswer = function(quizType, questionIndex, chosenIndex, correctIndex, explanation) {
    const result = original.apply(this, arguments);
    if (quizType === 'exam' && window.parent !== window) {
      try {
        const prefix = String(currentUnit) + '-exam-';
        const attempted = [...answeredQuestions].filter((key) => key.startsWith(prefix)).length;
        const total = unitsData[currentUnit].exam.length;
        if (total > 0 && attempted === total) {
          window.parent.postMessage({
            type: 'englimensh:prep-assessment-progress',
            grade: 3,
            path: 'general',
            unitNumber: currentUnit,
            total,
            attempted,
            correct: userScores.exam
          }, '*');
        }
      } catch (error) { console.warn('Prep 3 assessment progress could not be reported.', error); }
    }
    return result;
  };
})();
</script>\n` : '';
    const marker = /<\/body>/i;
    const injected = prep1Route + prep1AssessmentBridge + prep3AssessmentBridge + enhancement;
    const output = marker.test(source) ? source.replace(marker, injected + '\n</body>') : source + injected;
    await fs.writeFile(path.join(outputDir, path.basename(file)), output);
  }
  console.log('Built section-aware lesson viewer copies:', files.length);
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
  if (/<text\b/i.test(svg) && !/<(path|polygon|rect|ellipse|image)\b/i.test(svg)) return '';
  return svg.includes('xmlns=') ? svg : svg.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
}
async function findOpenverseImage(word) {
  const params = new URLSearchParams({
    q: word + ' photograph',
    page_size: '3',
    license_type: 'commercial',
    extension: 'jpg,jpeg,png,webp'
  });
  const endpoint = 'https://api.openverse.org/v1/images/?' + params.toString();
  let response;
  // Openverse can return 429/5xx during bursts. Keep retries short and bounded.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(endpoint, {
      headers: { 'User-Agent': 'EngliMenshEgypt/1.0 (educational vocabulary image sourcing)' },
      signal: AbortSignal.timeout(9000)
    });
    if (response.ok || (response.status !== 429 && response.status < 500)) break;
    if (attempt === 0) {
      const retryAfter = Number(response.headers.get('retry-after') || 0);
      await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(retryAfter * 1000, 1800), 4000)));
    }
  }
  if (!response?.ok) throw new Error('Openverse search HTTP ' + response?.status);
  const json = await response.json();
  const item = (json.results || []).find((result) => result.thumbnail && result.url && result.mature !== true);
  if (!item) return null;
  const image = await fetch(item.thumbnail, {
    headers: { 'User-Agent': 'EngliMenshEgypt/1.0' },
    signal: AbortSignal.timeout(10000)
  });
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
async function findWikimediaImage(word) {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: 'filetype:bitmap ' + word,
    gsrnamespace: '6', gsrwhat: 'title', gsrlimit: '5',
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '420', format: 'json'
  });
  const response = await fetch('https://commons.wikimedia.org/w/api.php?' + params.toString(), {
    headers: { 'User-Agent': 'EngliMenshEgypt/1.0 (educational vocabulary image sourcing)' },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Wikimedia Commons HTTP ' + response.status);
  const json = await response.json();
  const pages = Object.values(json.query?.pages || {});
  const page = pages.find((entry) => entry.imageinfo?.[0]?.thumburl && !/logo|icon|diagram/i.test(entry.title || ''));
  if (!page) return null;
  const info = page.imageinfo[0];
  const image = await fetch(info.thumburl, { signal: AbortSignal.timeout(8000) });
  if (!image.ok) return null;
  const bytes = Buffer.from(await image.arrayBuffer());
  if (bytes.length < 3000 || bytes.length > 1500000) return null;
  const extension = (info.thumburl.match(/\.(jpe?g|png|webp)(?:[?#]|$)/i)?.[1] || 'jpg').toLowerCase();
  const file = slug(word) + '.' + extension;
  await fs.mkdir(ASSET_ROOT, { recursive: true });
  await fs.writeFile(path.join(ASSET_ROOT, file), bytes);
  const meta = info.extmetadata || {};
  const plain = (key) => decodeHtml(String(meta[key]?.value || '').replace(/<[^>]+>/g, ' '));
  return {
    image: '/assets/preparatory-vocabulary/' + file,
    imageSource: 'Wikimedia Commons',
    attribution: plain('Artist') || page.title,
    creator: plain('Artist'),
    license: plain('LicenseShortName') || 'See source license',
    licenseUrl: meta.LicenseUrl?.value || '',
    sourceUrl: info.descriptionurl || info.url
  };
}
async function mapLimit(items, limit, worker) {
  let cursor = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (cursor < items.length) { const index = cursor++; await worker(items[index], index); }
  }));
}
const prep2ReviewLayer = JSON.parse(await fs.readFile(PREP2_REVIEW_LAYER, 'utf8'));
const files = await walk(SOURCE_ROOT);
await buildSectionViewers(files);
const registry = {};
const pendingImages = new Map();
for (const file of files) {
  const id = identify(file);
  if (!id) continue;
  const source = await fs.readFile(file, 'utf8');
  if (id.combined) {
    const units = parseCombinedUnits(source);
    for (const [unit, words] of Object.entries(units)) { registry['3:general:' + unit] = { words }; console.log('Parsed combined unit:', unit, words.length, 'words'); }
    continue;
  }
  let words = parseVocabArray(source);
  if (!words.length && id.path === 'general' && id.grade === 2) words = parseStaticCards(source);
  if (!words.length) { console.warn('No vocabulary parsed from source:', path.basename(file)); continue; }
  console.log('Parsed vocabulary:', path.basename(file), words.length, 'words');
  const unitWords = words.map((item) => ({
    word: decodeHtml(item.word || item.w || ''), pos: decodeHtml(item.pos || ''), arabic: decodeHtml(item.arabic || item.ar || ''),
    definition: decodeHtml(item.def || ''), example: decodeHtml(item.example || item.ex || ''), svg: safeSvg(item.svg || item.icon || '')
  })).filter((item) => item.word);
  if (id.grade === 2 && id.path === 'general') {
    const reviewed = prep2ReviewLayer.units?.[String(id.unit)];
    const translations = reviewed?.vocabularyArabic || {};
    const definitionFixes = reviewed?.definitionFixes || {};
    for (const item of unitWords) {
      if (definitionFixes[item.word]) item.definition = definitionFixes[item.word];
      const key = item.word.toLowerCase();
      const translation = Object.entries(translations).find(([word]) => word.toLowerCase() === key)?.[1];
      if (!item.arabic && translation) item.arabic = translation;
      if (!item.arabic) item.translationStatus = 'missing';
      else item.translationStatus = 'draft-needs-source-review';
    }
    const duplicates = new Set((reviewed?.knownDuplicateHeadwords || []).map((word) => word.toLowerCase()));
    for (const item of unitWords) if (duplicates.has(item.word.toLowerCase())) item.sourceReviewFlag = 'duplicate-headword-in-source';
  }
  registry[id.grade + ':' + id.path + ':' + id.unit] = { words: unitWords, ...(id.grade === 2 && id.path === 'general' ? { reviewStatus: prep2ReviewLayer.status } : {}) };
}
const expectedUnitKeys = [];
for (const grade of [1, 2, 3]) for (const pathway of ['general', 'advanced']) for (let unit = 1; unit <= 6; unit += 1) expectedUnitKeys.push(grade + ':' + pathway + ':' + unit);
const missingUnitKeys = expectedUnitKeys.filter((key) => !registry[key]);
if (missingUnitKeys.length) throw new Error('Preparatory vocabulary extraction is incomplete. Missing unit keys: ' + missingUnitKeys.join(', '));
for (const unit of Object.values(registry)) for (const item of unit.words) if (!pendingImages.has(item.word.toLowerCase())) pendingImages.set(item.word.toLowerCase(), item.word);
const imageWords = [...pendingImages.values()];
let downloaded = 0, missing = 0, openverseDownloaded = 0, wikimediaDownloaded = 0;
// Keep normal builds deterministic and offline. Image discovery is an optional
// enrichment step; it must never hold up curriculum extraction or APK builds.
if (process.env.FETCH_PREPARATORY_IMAGES !== '1') {
  for (const word of imageWords) pendingImages.set(word.toLowerCase(), null);
  missing = imageWords.length;
  console.log('Skipped external image lookups. Set FETCH_PREPARATORY_IMAGES=1 to run the optional image-enrichment pass.');
} else await mapLimit(imageWords, 1, async (word) => {
  let result = null;
  let openverseError = null;
  try {
    result = await findOpenverseImage(word);
  } catch (error) {
    openverseError = error;
    console.warn('Openverse unavailable for', word, '- trying Wikimedia Commons:', error.message);
  }
  // A valid "no results" response is also a miss: always try the fallback
  // provider before marking a vocabulary word as having no photograph.
  if (!result) {
    try {
      result = await findWikimediaImage(word);
    } catch (wikimediaError) {
      console.warn(
        'Image lookup failed for', word,
        'Openverse:', openverseError?.message || 'no suitable result',
        '| Wikimedia:', wikimediaError.message
      );
    }
  }
  pendingImages.set(word.toLowerCase(), result);
  if (result) downloaded += 1; else missing += 1;
});
for (const unit of Object.values(registry)) unit.words = unit.words.map((item) => {
  if (item.svg) return { ...item, imageType: 'svg-illustration' };
  const found = pendingImages.get(item.word.toLowerCase());
  return { ...item, ...(found || {}), imageType: found ? 'photo' : item.svg ? 'svg-illustration' : 'missing' };
});
await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, JSON.stringify({
  schemaVersion: 1, source: 'Owner-supplied preparatory HTML; original source files remain unchanged.',
  imageCredits: 'Openly licensed Openverse image attribution and license are included on each photo record.',
  units: registry,
  imageReport: { units: Object.keys(registry).length, words: Object.values(registry).reduce((sum, unit) => sum + unit.words.length, 0), photosDownloaded: downloaded, openversePhotosDownloaded: openverseDownloaded, wikimediaPhotosDownloaded: wikimediaDownloaded, imagesMissing: missing }
}, null, 2) + '\n');
console.log('Preparatory vocabulary built:', Object.keys(registry).length, 'units;', imageWords.length, 'photo lookups;', downloaded, 'photos (' + openverseDownloaded + ' Openverse, ' + wikimediaDownloaded + ' Wikimedia);', missing, 'without a photo.');
