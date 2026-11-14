// 第5章の結末「帰るべき場所へ ― 火山島編・完」（story-movies/ch5-return/）の生成物の検査。ブラウザーでの再生は npm.cmd run test:movie -- ch5-return。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castParts, castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch5-return/cast.mjs';
import { removedEnding } from './removed-endings.mjs';

const movies = fileURLToPath(new URL('../../story-movies/', import.meta.url));
const dir = path.join(movies, 'ch5-return');
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const scenes = [...html.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const captions = [...storyText.matchAll(/text: '([^']+)'/g)].map(m => m[1]);

test('character parts are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch5-return で書き出し直す');
  const parts = castParts(CAST);
  assert.deepEqual(Object.keys(parts.characters).sort(), ['belk', 'gonta', 'hero2', 'kaya', 'mina', 'nagi', 'roku', 'sumi', 'teru', 'watari', 'yomogi']);
  // 第4～5章の住民の手足の色は、第4～5章のゲームの villagers.js と同じ
  const villagers = await readFile(fileURLToPath(new URL('../../../dqb3-tsugumono-ch4-5/src/entities/villagers.js', import.meta.url)), 'utf8');
  for (const id of ['belk', 'roku', 'kaya', 'nagi', 'yomogi', 'sumi', 'teru']) {
    const c = parts.characters[id], hex = v => `0x${v.slice(1)}`;
    const line = villagers.split('\n').find(l => l.includes(`sleeve: ${hex(c.limbs.sleeve)}, hand: ${hex(c.limbs.hand)}, pants: ${hex(c.limbs.pants)}, boot: ${hex(c.limbs.boot)}`));
    assert.ok(line, `${id}: limb colors match the CH4-5 villagers.js`);
    for (const v of Object.values(c.views)) assert.doesNotMatch(v.head + v.torso, /var\(--/, id);
  }
});

test('captions are the lines of the chapter 5 ending, in order, and the title is the saga end', async () => {
  // 文字の結末は2026-11-08にゲームから削除し、全文を docs/story/reference/removed-text-endings.md に残した
  const ending = await removedEnding('第5章の結末');
  assert.deepEqual(captions, ending.filter(l => !l.includes('火山島編・完')));
  assert.ok(html.includes('<h1 class="title-main">火山島編・完</h1>'));
  assert.equal(scenes.length, 4);
  // 第6～7章は未実装：ヴァルガや再建は描かない・書かない
  for (const old of ['ビルダーの書', '原初の書', 'ギアガ', 'ヴァルガ']) assert.ok(!html.includes(old), old);
});

test('the temple at the end is the ruin of the prologue temple, as in M10: no roof, two columns standing', async () => {
  const prologue = await readFile(path.join(movies, 'prologue/src/scenes_b.py'), 'utf8');
  const temple = await readFile(path.join(movies, 'shared/temple.py'), 'utf8');
  // プロローグの神殿と同じ三段の基壇と、同じ間隔の柱の並び（共通部品 shared/temple.py。M10も同じものを使う）
  for (const rect of ['x="270" y="566" width="1060" height="26"', 'x="300" y="542" width="1000" height="24"', 'x="330" y="516" width="940" height="26"'])
    assert.ok(prologue.includes(rect), `prologue platform: ${rect}`);
  assert.ok(prologue.includes('380 + 105 * i') && temple.includes('380 + 105 * i'), 'same column spacing');
  const platform = 'M270,592 L1330,592 L1330,566 L1300,566 L1300,542 L1270,542 L1270,516 L330,516 L330,542 L300,542 L300,566 L270,566Z';
  assert.ok(scenes[3].includes(platform), 'scene 4 draws the ruin on the platform');
  // 柱頭まで残るのは中央の左右の2本だけ。屋根と塔の影は描かない（M10・第6章の「屋根を失った二本の柱」と同じ）
  const capitals = [...scenes[3].matchAll(/M(\d+),298 L(\d+),298/g)].map(m => (Number(m[1]) + Number(m[2])) / 2);
  assert.deepEqual(capitals, [695, 905]);
  assert.ok(!scenes[3].includes('M735,172') && !scenes[3].includes('M296,252'), 'no tower and no roof');
});

test('the townsfolk and the four on the ship are drawn from the formal designs', () => {
  const parts = castParts(CAST);
  const hair = (id, direction) => parts.characters[id].views[direction].head.match(/<path d="([^"]+)"/)[1];
  for (const id of ['belk', 'nagi', 'yomogi', 'roku', 'kaya', 'sumi', 'teru']) assert.ok(scenes[1].includes(hair(id, 'front')), `scene 2: ${id}`);
  for (const id of ['hero2', 'mina', 'gonta', 'watari']) assert.ok(scenes[2].includes(hair(id, 'front')), `scene 3: ${id} on the ship`);
  for (const id of ['belk', 'nagi', 'kaya']) assert.ok(scenes[2].includes(hair(id, 'back')), `scene 3: ${id} seeing them off`);
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch5-return-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch5-return で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
