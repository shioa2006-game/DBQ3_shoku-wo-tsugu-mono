// プロローグ（story-movies/prologue/）の生成物の検査。ブラウザーでの再生は npm.cmd run test:prologue。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shionParts, shionPartsJson } from '../../story-movies/prologue/src/shion_parts.mjs';
import { DIRECTIONS } from '../../prototypes/shared/sheet-format.mjs';

const dir = fileURLToPath(new URL('../../story-movies/prologue/', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const scenes = [...html.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);

test('Shion parts are exported unchanged from the hero2 authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/shion-parts.json'), 'utf8'), shionPartsJson(), 'npm.cmd run build:prologue で書き出し直す');
  const parts = shionParts();
  assert.equal(parts.source, 'prototypes/hero2-8dir/character.mjs');
  assert.deepEqual(Object.keys(parts.views), DIRECTIONS);
  for (const [direction, view] of Object.entries(parts.views)) {
    assert.doesNotMatch(view.head + view.torso, /var\(--/, direction);
    assert.match(view.head, /url\(#hairU\)/, `${direction}: the measured hair`);
    assert.match(view.torso, /url\(#vest\)/, `${direction}: the navy vest`);
  }
  // 深緑の職業の書・金の紋章・金髪・紺のベスト（原本のパレット）
  assert.deepEqual([parts.palette.book, parts.palette.gold, parts.palette.hair, parts.palette.vest], ['#365c47', '#d6aa51', '#f8b646', '#293d75']);
  assert.match(parts.views.back_right.torso, /url\(#book\)/);
});

test('prologue has five scenes with the agreed story and wording', () => {
  assert.equal(scenes.length, 5);
  for (const text of ['勇者がゾーマを倒した。', '世界には、平和が訪れるはずだった。', 'しかし、平和は長く続かなかった。', '上の世界に、再び魔物があふれ出した。',
    '職を授けるダーマ神殿も、襲われた。', '多くの職業の書が焼かれ', 'ただ一人、神殿から逃れた見習いがいた。', '少年の名は、シオン。',
    'その背には、守り抜いた一冊の職業の書があった。', 'そして、遠い島ジパングへ。', 'ここから、失われた職を取り戻す旅が始まる。', '<h1 class="title-main">職をつぐ者</h1>'])
    assert.ok(html.includes(text), text);
  // 旧設定（相棒の旧名・原初の書・大穴の名前）と、旧プロトタイプのフード姿の説明を使わない
  for (const old of ['ビルダーの書', '原初の書', 'ギアガ', 'フード', '古びた一冊', '胸に書を抱え']) assert.ok(!html.includes(old), old);
  for (const [id, action] of [['play', 'プロローグを見る'], ['skip', 'スキップ'], ['replay', 'もう一度見る']])
    assert.match(html, new RegExp(`data-action="${id}">${action}`));
});

test('scenes 4 and 5 draw Shion from the formal design parts', () => {
  const parts = shionParts();
  for (const [scene, prefix, direction] of [[4, 's4-sh-', 'front_left'], [4, 's4-sb-', 'back_left'], [5, 's5-sh-', 'back_right']]) {
    const svg = scenes[scene - 1];
    for (const id of ['hairU', 'vest', 'book', 'gold', 'skin']) assert.ok(svg.includes(`id="${prefix}${id}"`), `${scene} ${prefix}${id}`);
    // 原本の髪の輪郭（その向きの最初のパス）がそのまま入っている
    const hair = parts.views[direction].head.match(/<path d="([^"]+)" fill="url\(#hairU\)"/)[1];
    assert.ok(svg.includes(hair), `${scene} ${direction}: hair outline from hero2`);
  }
  assert.ok(!scenes.slice(0, 3).join('').includes('hairU'), 'Shion appears only from scene 4');
});

test('ids are unique across scenes, and repeated ids within the hero2 parts are identical clip paths', () => {
  const defs = new Map();
  for (const [i, svg] of scenes.entries()) {
    for (const m of svg.matchAll(/\sid="([^"]+)"/g)) {
      const prefix = m[1].match(/^s(\d)-/);
      assert.ok(prefix && Number(prefix[1]) === i + 1, `scene ${i + 1}: ${m[1]} has the scene prefix`);
    }
    for (const m of svg.matchAll(/<clipPath id="([^"]+)">([\s\S]*?)<\/clipPath>/g)) {
      if (defs.has(m[1])) assert.equal(defs.get(m[1]), m[2], m[1]);
      defs.set(m[1], m[2]);
    }
  }
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  for (const m of html.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)) assert.ok(ids.has(m[1] || m[2]), m[0]);
});

function findPython() {
  for (const [command, prefix] of [['python', []], ['py', ['-3']], ['python3', []]]) {
    const r = spawnSync(command, [...prefix, '--version'], { encoding: 'utf8', windowsHide: true });
    if (!r.error && r.status === 0) return [command, prefix];
  }
  return null;
}

test('index.html is reproduced exactly by the Python build', async t => {
  const python = findPython();
  if (!python) { t.skip('Python 3 が見つからない'); return; }
  const tmp = await mkdtemp(path.join(tmpdir(), 'prologue-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const out = path.join(tmp, 'index.html');
  const run = spawnSync(python[0], [...python[1], '-I', '-B', '-X', 'utf8', 'src/build.py', out], { cwd: dir, encoding: 'utf8', windowsHide: true });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:prologue で書き出し直す');
});
