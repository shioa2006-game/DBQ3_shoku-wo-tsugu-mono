// 第3章の結末ムービー（story-movies/ch3-departure/）の生成物の検査。ブラウザーでの再生は npm.cmd run test:movie -- ch3-departure。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castParts, castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch3-departure/cast.mjs';
import { removedEnding } from './removed-endings.mjs';

const dir = fileURLToPath(new URL('../../story-movies/ch3-departure/', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const scenes = [...html.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const captions = [...storyText.matchAll(/text: '([^']+)'/g)].map(m => m[1]);

test('character parts are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch3-departure で書き出し直す');
  const parts = castParts(CAST);
  assert.deepEqual(Object.keys(parts.characters).sort(), ['gonta', 'hero2', 'inaho', 'jinbei', 'mina', 'pino', 'watari']);
  for (const [id, c] of Object.entries(parts.characters)) {
    for (const [direction, v] of Object.entries(c.views)) {
      assert.doesNotMatch(v.head + v.torso, /var\(--/, `${id} ${direction}`);
      const a = v.anchors;
      // 肩は胴の上半分、裾は肩より下、頭は胴の上から始まる（128pxのセル）
      assert.ok(a.top < a.shoulder.y && a.shoulder.y < a.hem.y && a.hem.y <= 127 && a.head.top < a.top, `${id} ${direction} anchors`);
      assert.ok(a.shoulder.left < a.shoulder.right && a.hem.left < a.hem.right, `${id} ${direction} widths`);
    }
    assert.match(c.limbs.sleeve, /^#[0-9a-f]{6}$/);
  }
});

test('captions are the lines of the chapter 3 ending, in order, and the title is the saga end', async () => {
  // 文字の結末は2026-11-08にゲームから削除し、全文を docs/story/reference/removed-text-endings.md に残した
  const ending = await removedEnding('第3章の結末');
  // 結末文の行を順番どおりに使う（―― ジパング復興編・完 ―― はタイトルで表す）
  assert.deepEqual(captions, ending.filter(l => !l.includes('ジパング復興編・完')));
  assert.ok(html.includes('<h1 class="title-main">ジパング復興編・完</h1>'));
  assert.equal(scenes.length, 5);
  for (const old of ['ビルダーの書', '原初の書', 'ギアガ', 'ヴァルガ', '大工の書', '神官の書']) assert.ok(!html.includes(old), old);
});

test('the three who stay and the four who sail are drawn from the formal designs', () => {
  const parts = castParts(CAST);
  const hair = (id, direction) => parts.characters[id].views[direction].head.match(/<path d="([^"]+)"/)[1];
  for (const id of ['pino', 'inaho', 'jinbei']) {
    assert.ok(scenes[1].includes(hair(id, 'front')), `scene 2: ${id} front`);
    assert.ok(scenes[2].includes(hair(id, 'back')), `scene 3: ${id} back`);
  }
  for (const id of ['hero2', 'mina', 'gonta', 'watari']) assert.ok(scenes[2].includes(hair(id, 'front')), `scene 3: ${id} on the ship`);
  assert.ok(!scenes[0].includes(hair('hero2', 'front')) && !scenes[3].includes(hair('hero2', 'front')));
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch3-departure-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch3-departure で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
