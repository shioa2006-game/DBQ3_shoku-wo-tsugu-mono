// 第1章の結び「小さな社」（story-movies/ch1-shrine/）の生成物の検査。ブラウザーでの再生は npm.cmd run test:movie -- ch1-shrine。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castParts, castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch1-shrine/cast.mjs';

const dir = fileURLToPath(new URL('../../story-movies/ch1-shrine/', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const scenes = [...html.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const captions = [...storyText.matchAll(/text: '([^']+)'/g)].map(m => m[1]);

test('character parts are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch1-shrine で書き出し直す');
  assert.deepEqual(Object.keys(castParts(CAST).characters).sort(), ['gonta', 'jinbei', 'mina', 'pino']);
});

test('captions are the chapter 1 lines of the current chapter end, in order, without the lines the prologue tells', async () => {
  const ui = await readFile(fileURLToPath(new URL('../../../dqb3-tsugumono-ch1-3/src/ui/ui.js', import.meta.url)), 'utf8');
  const ending = [...ui.match(/playEnding\(cb, opts = \{\}\) \{[\s\S]*?: `([\s\S]*?)`;/)[1].matchAll(/<p>([^<]+)<\/p>/g)].map(m => m[1]).filter(l => l !== '&nbsp;');
  // 今の章末の文の、第1章の行（ジパングで槌を取ってから文字が戻るまで）と、最後の行（前後の線を外す）
  const from = ending.findIndex(l => l.includes('ジパングで槌を取った'));
  const to = ending.findIndex(l => l.includes('文字が戻った'));
  assert.ok(from > 0 && to > from);
  assert.deepEqual(captions, [...ending.slice(from, to + 1), ending.at(-1).replace(/^―\s*|\s*―$/g, '')]);
  // プロローグ（M0）が語る出来事は字幕にしない
  for (const told of ['ゾーマ', '魔物', 'ダーマ', '焼かれ', '勇者']) assert.ok(!captions.some(c => c.includes(told)), told);
  assert.ok(html.includes('<h1 class="title-main">第1章・完</h1>') && html.includes('漂着の浜'));
  assert.equal(scenes.length, 3);
});

test('the altar holds the book of jobs and the revived farmer\'s book; the four look up at the shrine', () => {
  // 書の表紙（shared/books.py の色）が祭壇の場面にある
  assert.ok(scenes[0].includes('id="s1-job-cover"') && scenes[0].includes('id="s1-farmer-cover"'));
  assert.ok(scenes[0].includes('#2f6b48') && scenes[0].includes('#a37c40'), 'cover colors of the two books');
  const parts = castParts(CAST);
  for (const id of ['mina', 'pino', 'gonta', 'jinbei']) {
    const hair = parts.characters[id].views.back.head.match(/<path d="([^"]+)"/)[1];
    assert.ok(scenes[1].includes(hair), `scene 2: ${id}`);
  }
  // 第1章で建てたものだけ：食堂・灯台・船はない
  for (const later of ['のれん', 'lighthouse', 'sh-hull']) assert.ok(!html.includes(later), later);
});

test('ids carry the scene prefix so two scenes can cross-fade', () => {
  for (const [i, svg] of scenes.entries()) {
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    for (const id of ids) assert.ok(id.startsWith(`s${i + 1}-`), `scene ${i + 1}: ${id}`);
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(m[1]), `scene ${i + 1}: url(#${m[1]}) is defined`);
    for (const m of svg.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(m[1].startsWith(`s${i + 1}-`), `scene ${i + 1}: @keyframes ${m[1]}`);
  }
});

test('building again from the sources gives the same page', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch1-shrine-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch1-shrine で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
