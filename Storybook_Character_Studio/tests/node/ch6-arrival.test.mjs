// ダーマ再興編の始まり「始まりの場所」（story-movies/ch6-arrival/・M10）の生成物の検査。
// ブラウザーでの再生は npm.cmd run test:movie -- ch6-arrival。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castParts, castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch6-arrival/cast.mjs';
import { removedEnding } from './removed-endings.mjs';

const movies = fileURLToPath(new URL('../../story-movies/', import.meta.url));
const dir = path.join(movies, 'ch6-arrival');
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const templates = text => [...text.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const scenes = templates(html);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const sceneCaptions = [...storyText.matchAll(/captions: \[([\s\S]*?)\]/g)].map(m => [...m[1].matchAll(/text: '([^']+)'/g)].map(c => c[1]));
const source = file => readFile(path.join(repo, file), 'utf8');

test('character parts are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch6-arrival で書き出し直す');
  const parts = castParts(CAST);
  assert.deepEqual(Object.keys(parts.characters).sort(), ['gonta', 'hero2', 'mina', 'watari']);
  for (const [id, c] of Object.entries(parts.characters)) assert.deepEqual(Object.keys(c.views).sort(), ['back', 'front'], id);
});

test('captions of scenes 1-2 are existing lines; the new ones of scenes 3-4 are recorded in the plan', async () => {
  const prologue = await source('Storybook_Character_Studio/story-movies/prologue/src/build.py');
  const ch3 = await removedEnding('第3章の結末');
  const ch5 = await removedEnding('第5章の結末');
  assert.deepEqual(sceneCaptions.map(c => c.length), [3, 2, 2, 2, 0]);
  const [journey, dawn, island, ruins] = sceneCaptions;
  // ① プロローグ、第3章の結末文、第5章の結末文（額の絵と同じ順）
  assert.ok(prologue.includes(`text: '${journey[0]}'`), journey[0]);
  assert.ok(ch3.includes(journey[1]), journey[1]);
  assert.ok(ch5.includes(journey[2]), journey[2]);
  // ② M7の字幕と同じ第5章の結末文の2行（夜の海の続き）
  for (const c of dawn) assert.ok(ch5.includes(c), c);
  // ③・④ 新しく書いた字幕は、計画資料の M10 の試作の記録にある
  const plan = await source('docs/story/planned/chapter6-7-movies.md');
  const m10 = plan.slice(plan.indexOf('### M10'), plan.indexOf('### M11'));
  for (const c of [...island, ...ruins]) assert.ok(m10.includes(`「${c}」`), `chapter6-7-movies.md の M10: ${c}`);
  assert.ok(html.includes('<h1 class="title-main">ダーマ再興編</h1>') && html.includes('第6章　よみがえるダーマ神殿'));
  assert.equal(scenes.length, 5);
});

test('the memory frames reuse the prologue, M4 and M7 scenes', () => {
  assert.ok(scenes[0].includes('s1-pa-shota'), 'prologue scene 4');
  assert.ok(scenes[0].includes('s1-mb-') && scenes[0].includes('s1-mc-'), 'M4 scene 1 and M7 scene 1');
  // プロローグ第4場面は前半だけ（後半への切り替えを止める）
  assert.ok(scenes[0].includes('.s1-pa-shotb{display:none}') && scenes[0].includes('.is-active .s1-fa .s1-pa-shota{animation:none}'));
});

test('the ruin has the platform of the prologue temple and the shape of the M7 shadow, with only two columns standing', async () => {
  const m7 = await readFile(path.join(movies, 'ch5-return/index.html'), 'utf8');
  const platform = 'M270,592 L1330,592 L1330,566 L1300,566 L1300,542 L1270,542 L1270,516 L330,516 L330,542 L300,542 L300,566 L270,566Z';
  assert.ok(templates(m7)[3].includes(platform), 'M7 scene 4 draws the same ruin');
  assert.ok(scenes[3].includes('id="s4-ruin"') && scenes[3].includes(platform), 'scene 4: the same platform');
  for (const i of [2, 4]) assert.ok(scenes[i].includes(platform), `scene ${i + 1}: the ruin on the mountainside`);
  // 柱頭まで残るのは2本だけ（柱頭の外形 "L{c+34},298" を数える）
  const capitals = [...scenes[3].matchAll(/M(\d+),298 L(\d+),298/g)].map(m => (Number(m[1]) + Number(m[2])) / 2);
  assert.deepEqual(capitals, [695, 905]);
});

test('Suzuha, Varga and the rebuilt temple are kept for the game and later movies', () => {
  // 場面の絵と字幕に出さない（終了パネルの説明文は、ゲームで続く導入会話としてスズハの名を書いている）
  const shown = scenes.join('') + storyText;
  for (const kept of ['スズハ', 'ヴァルガ', 'suzuha', 'varuga', 'ガーゴイル', 'gargoyle', '大屋根']) assert.ok(!shown.includes(kept), kept);
  const parts = castParts(CAST);
  const hair = (id, direction) => parts.characters[id].views[direction].head.match(/<path d="([^"]+)"/)[1];
  for (const id of ['hero2', 'mina', 'gonta', 'watari']) {
    assert.ok(scenes[1].includes(hair(id, 'front')), `scene 2: ${id} on the ship`);
    assert.ok(scenes[2].includes(hair(id, 'back')), `scene 3: ${id} at the bow`);
  }
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch6-arrival-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch6-arrival で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
