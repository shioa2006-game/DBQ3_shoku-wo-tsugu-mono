// 第6章の結び「大屋根の灯」（story-movies/ch6-roof-light/・M11）の生成物の検査。
// ブラウザーでの再生は npm.cmd run test:movie -- ch6-roof-light。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castParts, castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch6-roof-light/cast.mjs';

const movies = fileURLToPath(new URL('../../story-movies/', import.meta.url));
const dir = path.join(movies, 'ch6-roof-light');
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const templates = text => [...text.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const scenes = templates(html);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const sceneCaptions = [...storyText.matchAll(/captions: \[([\s\S]*?)\]/g)].map(m => [...m[1].matchAll(/text: '([^']+)'/g)].map(c => c[1]));
const platform = 'M270,592 L1330,592 L1330,566 L1300,566 L1300,542 L1270,542 L1270,516 L330,516 L330,542 L300,542 L300,566 L270,566Z';

test('character parts are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch6-roof-light で書き出し直す');
  const parts = castParts(CAST);
  assert.deepEqual(Object.keys(parts.characters).sort(), ['asagi', 'ganzou', 'gonta', 'hero2', 'mina', 'pino', 'suzuha', 'watari']);
  // 第6～7章の三人の手足の色は、各人の rig-profile.mjs と同じ
  for (const id of ['suzuha', 'asagi', 'ganzou']) {
    const profile = await readFile(path.join(repo, `Storybook_Character_Studio/prototypes/${id}-8dir/rig-profile.mjs`), 'utf8');
    for (const [key, color] of Object.entries(parts.characters[id].limbs))
      assert.ok(profile.includes(`${key}: 0x${color.slice(1)}`), `${id} ${key}`);
  }
});

test('the new captions are recorded in the plan; the title is the chapter 6 end', async () => {
  assert.deepEqual(sceneCaptions.map(c => c.length), [2, 1, 1, 1, 0]);
  const plan = await readFile(path.join(repo, 'docs/story/planned/chapter6-7-movies.md'), 'utf8');
  const m11 = plan.slice(plan.indexOf('### M11'), plan.indexOf('### M12'));
  for (const c of sceneCaptions.flat()) assert.ok(m11.includes(`「${c}」`), `chapter6-7-movies.md の M11: ${c}`);
  assert.ok(html.includes('<h1 class="title-main">第6章・完</h1>') && html.includes('よみがえるダーマ神殿') && html.includes('ダーマ再興編'));
  assert.equal(scenes.length, 5);
});

test('the rebuilt temple stands on the platform of the ruin, with the entrance in the middle', () => {
  for (const i of [1, 2, 4]) {
    assert.ok(scenes[i].includes(platform), `scene ${i + 1}: the platform of the prologue temple and the ruin`);
    assert.ok(scenes[i].includes('M736,516 L736,410 A64,64 0 0 1 864,410'), `scene ${i + 1}: the entrance at the 4th column`);
  }
  // ①：要石を据えた祭壇（紋章）と、アサギの印を刻んだ選択の柱
  assert.ok(scenes[0].includes('class="s1-keyglow"') && scenes[0].includes('class="s1-mark"'));
});

test('the feast has the eight, and the shadow has three heads; Varga and the gargoyles are not named', () => {
  const parts = castParts(CAST);
  const hair = id => parts.characters[id].views.front.head.match(/<path d="([^"]+)"/)[1];
  for (const id of Object.keys(CAST)) assert.ok(scenes[1].includes(hair(id)), `scene 2: ${id}`);
  // 三つ首の影：角のある頭の形が三つ（props11.varga_shadow）
  assert.equal(scenes[3].split('M30,-12 L-8,-16 L-34,-6').length - 1, 3, 'three heads');
  const shown = scenes.join('') + storyText;
  for (const kept of ['ヴァルガ', 'ガーゴイル', 'varuga', 'gargoyle']) assert.ok(!shown.includes(kept), kept);
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch6-roof-light-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch6-roof-light で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
