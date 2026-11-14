import { buildSuzuhaSheet, suzuhaMarkup } from '../../prototypes/suzuha-8dir/character.mjs';
import { buildGanzouSheet, ganzouMarkup } from '../../prototypes/ganzou-8dir/character.mjs';
// 第4～5章の新しい人型（段階2）: 原本コードから出力が再現できること、頭と胴の担当が分かれていること、
// ゲームのリグが切り出す範囲（頭・胴のUV窓、下端121px）に収まっていることを確かめる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildBelkSheet } from '../../prototypes/belk-8dir/character.mjs';
import { buildRokuSheet } from '../../prototypes/roku-8dir/character.mjs';
import { buildKayaSheet } from '../../prototypes/kaya-8dir/character.mjs';
import { buildNagiSheet } from '../../prototypes/nagi-8dir/character.mjs';
import { buildYomogiSheet } from '../../prototypes/yomogi-8dir/character.mjs';
import { buildSumiSheet } from '../../prototypes/sumi-8dir/character.mjs';
import { buildTeruSheet } from '../../prototypes/teru-8dir/character.mjs';
// 主人公の新デザイン案（Studioのみ）も同じ頭・胴分離方式なので、同じ条件で確かめる。
import { buildHero2Sheet } from '../../prototypes/hero2-8dir/character.mjs';
import { buildAsagiSheet, asagiMarkup } from '../../prototypes/asagi-8dir/character.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch4-5/package.json', import.meta.url));
const { PNG } = require('pngjs');
// Drawn with the tunic on the art centre (exported with keepDrawnX); see prototypes/hero2-8dir/README.md.
const DRAWN_X = new Set(['ganzou', 'hero2', 'asagi']);
const BUILDERS = { suzuha: buildSuzuhaSheet, ganzou: buildGanzouSheet, belk: buildBelkSheet, roku: buildRokuSheet, kaya: buildKayaSheet, nagi: buildNagiSheet, yomogi: buildYomogiSheet, sumi: buildSumiSheet, teru: buildTeruSheet, hero2: buildHero2Sheet, asagi: buildAsagiSheet };
const output = (id, file) => new URL(`../../prototypes/${id}-8dir/output/${file}`, import.meta.url);
const png = async (id, file) => PNG.sync.read(await readFile(output(id, file)));
const alpha = (image, cell, x, y) => image.data[((Math.floor(cell / 4) * 128 + y) * 512 + (cell % 4) * 128 + x) * 4 + 3];

test('Ganzou and Suzuha retain editable layers and anatomical left-hip accessories', async () => {
  for (const [id, build, markup] of [['ganzou', buildGanzouSheet, ganzouMarkup], ['suzuha', buildSuzuhaSheet, suzuhaMarkup]]) {
    const svg = build();
    assert.doesNotMatch(svg, /<image\b|<foreignObject\b|data:image\//, `${id}: ラスターを埋め込まず作画`);
    const ids = Array.from(svg.matchAll(/\bid="([^"]+)"/g), m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${id}: 方向間でクリップIDが重複しない`);
    assert.doesNotMatch(build({ part: 'head' }), /data-part="torso"|data-accessory=/);
    assert.doesNotMatch(build({ part: 'torso' }), /data-part="head"|clip-path="url\(#(?:ganzou|suzuha)-locks/);
    for (const direction of ['right', 'back_right', 'back']) assert.doesNotMatch(markup(direction), /data-accessory="left-hip-/, `${id} ${direction}: 奥に隠れる小物を反対側へ反転しない`);
    for (const direction of ['front', 'front_left', 'left', 'front_right']) assert.match(markup(direction), /data-accessory="left-hip-/, `${id} ${direction}: 左腰の小物が見える`);
    assert.throws(() => markup('unknown'), /Unknown direction/);
    const manifest = JSON.parse(await readFile(output(id, 'manifest.json'), 'utf8'));
    assert.deepEqual(manifest.targets, ['ch6-7'], `${id}: 第6～7章へ書き出す`);
  }
});

test('humanoid SVGs reproduce exactly from their authoring code', async () => {
  for (const [id, build] of Object.entries(BUILDERS)) {
    assert.equal(build(), await readFile(output(id, `${id}-code.svg`), 'utf8'), `${id} combined`);
    for (const part of ['head', 'torso']) assert.equal(build({ part }), await readFile(output(id, `${id}_code_${part}_layer_8dir.svg`), 'utf8'), `${id} ${part}`);
    assert.throws(() => build({ part: 'unknown' }), /Unknown part/);
  }
});

test('Asagi is editable vector art, with unique clipping IDs and a left-hip pouch', () => {
  const svg = buildAsagiSheet();
  assert.doesNotMatch(svg, /<image\b|<foreignObject\b|data:image\//, '画像を埋め込んだSVGではない');
  const ids = Array.from(svg.matchAll(/\bid="([^"]+)"/g), m => m[1]);
  assert.equal(new Set(ids).size, ids.length, '向きごとのクリップIDが重複しない');
  assert.doesNotMatch(buildAsagiSheet({ part: 'head' }), /data-part="(?:torso|buckle|left-hip-pouch)"/);
  assert.doesNotMatch(buildAsagiSheet({ part: 'torso' }), /data-part="(?:face|eye|nose|glasses|hair-front|hair-back)"/);
  for (const direction of ['right', 'back_right']) {
    assert.doesNotMatch(asagiMarkup(direction), /data-part="left-hip-pouch"/, `${direction}: 奥の腰の道具入れは見えない`);
  }
  for (const direction of ['front', 'front_left', 'left', 'back_left', 'back', 'front_right']) assert.match(asagiMarkup(direction), /data-part="left-hip-pouch"/, `${direction}: 左腰の道具入れが見える`);
});

test('head layers own no clothing and torso layers own no face or hair', async () => {
  for (const id of Object.keys(BUILDERS)) {
    const head = await png(id, `${id}_code_head_layer_8dir.png`), torso = await png(id, `${id}_code_torso_layer_8dir.png`);
    for (const image of [head, torso]) assert.deepEqual([image.width, image.height], [512, 256]);
    for (let cell = 0; cell < 8; cell++) {
      for (let y = 80; y < 128; y++) for (let x = 0; x < 128; x++) assert.equal(alpha(head, cell, x, y), 0, `${id}: head contains no clothing (${cell} ${x},${y})`);
      for (let y = 0; y < 57; y++) for (let x = 0; x < 128; x++) assert.equal(alpha(torso, cell, x, y), 0, `${id}: torso contains no face/hair (${cell} ${x},${y})`);
      assert.ok(alpha(torso, cell, 63, 80) > 24, `${id}: collar belongs to torso in direction ${cell}`);
    }
    // The double-collar regression from Mina: no neck or collar pixels on the head's lower edge.
    for (const cell of [0, 1, 2, 6, 7]) for (let y = 77; y <= 79; y++) for (let x = 54; x <= 65; x++) assert.equal(alpha(head, cell, x, y), 0, `${id}: no collar on head (${cell} ${x},${y})`);
  }
});

test('composite sheets stay inside the rig windows with a fixed bottom', async () => {
  for (const id of Object.keys(BUILDERS)) {
    const sheet = await png(id, `${id}_code_body_8dir.png`);
    for (let cell = 0; cell < 8; cell++) {
      let top = 128, bottom = -1, minX = 128, maxX = -1;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        if (alpha(sheet, cell, x, y) <= 24) continue;
        top = Math.min(top, y); bottom = Math.max(bottom, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        if (y < 70) assert.ok(x >= 19 && x <= 107, `${id}: head clipped in direction ${cell} at ${x},${y}`);
        if (y > 78) assert.ok(x >= 31 && x <= 95, `${id}: torso clipped in direction ${cell} at ${x},${y}`);
      }
      assert.ok(top >= 5 && bottom === 121, `${id}: vertical anchoring in direction ${cell} (${top}..${bottom})`);
      if (DRAWN_X.has(id)) {
        // Anchored on the tunic: the hem (the only art on the bottom row) is centred on u = .494,
        // even where the back hair and the book make the whole figure lopsided.
        let x0 = 128, x1 = -1;
        for (let x = 0; x < 128; x++) if (alpha(sheet, cell, x, 121) > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
        const hem = (x0 + x1 + 1) / 2;
        assert.ok(Math.abs(hem - 128 * .494) <= 1.5, `${id}: tunic centred in direction ${cell} (${hem})`);
      } else {
        const center = (minX + maxX) / 2 / 128;
        assert.ok(center >= .46 && center <= .53, `${id}: centred in direction ${cell} (${center})`);
      }
    }
  }
});
