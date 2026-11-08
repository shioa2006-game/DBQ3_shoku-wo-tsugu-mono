// 第2章の結び「収穫祭の夜」（story-movies/ch2-harvest/）の生成物の検査。ブラウザーでの再生は npm.cmd run test:movie -- ch2-harvest。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castParts, castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch2-harvest/cast.mjs';

const dir = fileURLToPath(new URL('../../story-movies/ch2-harvest/', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const scenes = [...html.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const captions = [...storyText.matchAll(/text: '([^']+)'/g)].map(m => m[1]);

test('character parts are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch2-harvest で書き出し直す');
  assert.deepEqual(Object.keys(castParts(CAST).characters).sort(), ['gonta', 'hero2', 'inaho', 'jinbei', 'mina', 'pino']);
});

test('captions are taken from the victory talk of chapter 2, in order, without new lines', async () => {
  const chapter2 = await readFile(fileURLToPath(new URL('../../../dqb3-tsugumono-ch1-3/src/content/chapter2.js', import.meta.url)), 'utf8');
  const talk = chapter2.match(/paddyDefenseWin: \[([\s\S]*?)\n {4}\],/)[1];
  const lines = [...talk.matchAll(/D\((\w+|"[^"]*"), "「([^」]+)」"\)/g)].map(m => ({ who: m[1], text: m[2] }));
  const speaker = { 0: '"ジンベエ"', 1: '"イナホ"', 2: 'BOOK', 3: 'BOOK' };
  assert.equal(captions.length, 5);
  for (const [i, who] of Object.entries(speaker))
    assert.ok(lines.some(l => l.who === who && l.text.includes(captions[i].replace(/。$/, ''))), `${captions[i]} (${who})`);
  // 書の台詞の中では、二冊の書 → 潮の匂い → 職をつぐ旅 の順
  const book = lines.find(l => l.who === 'BOOK' && l.text.includes('二冊の書')).text;
  const at = s => book.indexOf(s);
  assert.ok(at(captions[2].replace(/。$/, '')) < at(captions[3]) && at(captions[3]) < at('職をつぐ旅は、まだ続く'));
  // 結びは「職をつぐ旅は、まだ続くのじゃ！」の言い回しを分けたもの（M1の「ここから続いていく」とは別）
  assert.equal(captions[4], '職をつぐ旅は、まだ続く。');
  assert.ok(html.includes('<h1 class="title-main">第2章・完</h1>') && html.includes('荒れた田の村'));
  assert.equal(scenes.length, 5);
});

test('the feast, the two books, and what is kept for chapter 3', () => {
  const parts = castParts(CAST);
  const hair = (id, direction) => parts.characters[id].views[direction].head.match(/<path d="([^"]+)"/)[1];
  for (const id of ['hero2', 'mina', 'inaho', 'gonta', 'jinbei', 'pino']) assert.ok(scenes[1].includes(hair(id, 'front')), `scene 2: ${id}`);
  assert.ok(scenes[2].includes(hair('hero2', 'back')), 'scene 3: Shion\'s back');
  assert.ok(scenes[2].includes('id="s3-farmer-cover"') && scenes[2].includes('id="s3-cook-cover"'), 'scene 3: the two books');
  // ワタリの名前・クラーケンは出さない（第3章の導入と戦闘に取っておく）
  for (const kept of ['ワタリ', 'クラーケン', 'watari']) assert.ok(!html.includes(kept), kept);
  assert.ok(scenes[3].includes('class="s4-shadow"'), 'scene 4: the shadow in the sea, only at the flash');
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch2-harvest-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch2-harvest で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
