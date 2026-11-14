// 三頭魔竜の襲来「三つ首の影」（story-movies/ch7-three-heads/・M12）の生成物の検査。
// ブラウザーでの再生は npm.cmd run test:movie -- ch7-three-heads。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castPartsJson } from '../../story-movies/shared/cast.mjs';
import { vargaParts, vargaPartsJson } from '../../story-movies/shared/varga.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST, VARGA } from '../../story-movies/ch7-three-heads/cast.mjs';

const movies = fileURLToPath(new URL('../../story-movies/', import.meta.url));
const dir = path.join(movies, 'ch7-three-heads');
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const templates = text => [...text.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const scenes = templates(html);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const sceneCaptions = [...storyText.matchAll(/captions: \[([\s\S]*?)\]/g)].map(m => [...m[1].matchAll(/text: '([^']+)'/g)].map(c => c[1]));

test('Varga parts are exported unchanged from the Studio authoring code; no person appears', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/varga.json'), 'utf8'), vargaPartsJson(VARGA), 'npm.cmd run build:movie -- ch7-three-heads で書き出し直す');
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST));
  assert.deepEqual(CAST, {});
  // 首・翼の色は rig-profile.mjs の値
  const profile = await readFile(path.join(repo, 'Storybook_Character_Studio/prototypes/varuga-8dir/rig-profile.mjs'), 'utf8');
  const { rig } = vargaParts(VARGA);
  assert.ok(profile.includes(`neckColor: 0x${rig.neck.slice(1)}`) && profile.includes(`membraneColor: 0x${rig.membrane.slice(1)}`)
    && profile.includes(`boneColor: 0x${rig.bone.slice(1)}`));
});

test('Varga names himself and tells he burned Dharma; the new lines are recorded in the plan', async () => {
  assert.deepEqual(sceneCaptions.map(c => c.length), [0, 1, 1]);
  const name = sceneCaptions[2][0];
  assert.ok(name.includes('ヴァルガ') && name.includes('ダーマを焼いた'), name);
  const plan = await readFile(path.join(repo, 'docs/story/planned/chapter6-7-movies.md'), 'utf8');
  const m12 = plan.slice(plan.indexOf('### M12'), plan.indexOf('### M13'));
  for (const c of sceneCaptions.flat()) assert.ok(m12.includes(`「${c}」`), `chapter6-7-movies.md の M12: ${c}`);
  // 名前の表示（タイトルの位置）と、名乗りの場面での停止
  assert.ok(html.includes('<p class="title-sub">三頭魔竜</p>') && html.includes('<h1 class="title-main">ヴァルガ</h1>'));
  assert.match(storyText, /id: 'name'[\s\S]*cues: \[\{ at: \d+, action: 'title', stop: true \}\]/);
  assert.equal(scenes.length, 3);
});

test('the three heads come from the Studio sheets: open mouths over the roof, closed when he names himself', () => {
  const parts = vargaParts(VARGA);
  const sig = svg => svg.match(/<path d="([^"]{40,})"/)[1];
  // 開口頭のシートは、通常の頭に口と歯（hornLight の色）を重ねたもの。歯の線で見分ける
  const teeth = svg => [...svg.matchAll(/<path d="(M[^"]+)" fill="#faf1de"/g)].map(m => m[1]);
  for (const d of VARGA) {
    assert.ok(scenes[1].includes(sig(parts.head[d])) && scenes[2].includes(sig(parts.head[d])), `head ${d}`);
    for (const t of teeth(parts.open[d])) {
      assert.ok(scenes[1].includes(t), `scene 2: open mouth ${d}`);
      assert.ok(!scenes[2].includes(t), `scene 3: closed mouth ${d}`);
    }
    assert.ok(teeth(parts.open[d]).length >= 1, `open head ${d} has teeth`);
  }
  assert.ok(scenes[1].includes(sig(parts.body.front)) && scenes[0].includes(sig(parts.body.front)), 'the body');
  assert.ok(scenes[1].includes('s2-t-roofclip'), 'scene 2: the rebuilt roof below');
  // ガーゴイルは描かない（ボス戦に加わるかはゲームで決める）
  const shown = scenes.join('') + storyText;
  for (const kept of ['ガーゴイル', 'gargoyle']) assert.ok(!shown.includes(kept), kept);
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch7-three-heads-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch7-three-heads で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
