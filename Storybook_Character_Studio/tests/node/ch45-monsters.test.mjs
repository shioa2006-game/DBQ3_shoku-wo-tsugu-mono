// 第4～5章の新しいモンスター（段階3）: 原本コードから出力が再現できること、A・Bが8方向そろって
// 互いに違うこと、正規化で欠けず、各セルの中心と下端（121px）がそろっていることを確かめる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildWillOWispSheet } from '../../prototypes/will-o-wisp-8dir/character.mjs';
import { buildArmoredScorpionSheet } from '../../prototypes/armored-scorpion-8dir/character.mjs';
import { buildVolcanoLizardSheet } from '../../prototypes/volcano-lizard-8dir/character.mjs';
import { buildFlightSheet, buildGroundSheet } from '../../prototypes/gargoyle-8dir/character.mjs';
import { buildCrabSheet } from '../../prototypes/small-rock-crab-8dir/character.mjs';
import { buildGromHeadSheet, buildGromBodySheet } from '../../prototypes/grom-8dir/character.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch4-5/package.json', import.meta.url));
const { PNG } = require('pngjs');
const MONSTERS = {
  will_o_wisp: ['will-o-wisp-8dir', buildWillOWispSheet],
  armored_scorpion: ['armored-scorpion-8dir', buildArmoredScorpionSheet],
  gargoyle_flight: ['gargoyle-8dir', buildFlightSheet],
  gargoyle_ground: ['gargoyle-8dir', buildGroundSheet],
  small_rock_crab: ['small-rock-crab-8dir', buildCrabSheet],
  volcano_lizard: ['volcano-lizard-8dir', buildVolcanoLizardSheet],
};
const output = (folder, file) => new URL(`../../prototypes/${folder}/output/${file}`, import.meta.url);

test('monster SVGs reproduce exactly from their authoring code', async () => {
  for (const [id, [folder, build]] of Object.entries(MONSTERS)) {
    for (const frame of ['a', 'b']) assert.equal(build({ frame }), await readFile(output(folder, `${id}_code_idle_${frame}_8dir.svg`), 'utf8'), `${id} ${frame}`);
    assert.throws(() => build({ frame: 'c' }), /Unknown frame/);
  }
});

test('monster sheets keep every pixel, a fixed bottom and a centred body in all 16 cells', async () => {
  for (const [id, [folder]] of Object.entries(MONSTERS)) {
    const sheets = {};
    for (const frame of ['a', 'b']) {
      const png = PNG.sync.read(await readFile(output(folder, `${id}_code_idle_${frame}_8dir.png`)));
      const raw = PNG.sync.read(await readFile(output(folder, `${id}_code_idle_${frame}_8dir.src.png`)));
      assert.deepEqual([png.width, png.height], [512, 256]);
      const solid = p => { let n = 0; for (let i = 3; i < p.data.length; i += 4) if (p.data[i] > 24) n++; return n; };
      assert.equal(solid(png), solid(raw), `${id} ${frame}: normalization loses no pixels`);
      // The raw art must stay inside its own cell: a pixel on a cell edge means it spills into the neighbour.
      for (let cell = 0; cell < 8; cell++) for (let k = 0; k < 128; k++) for (const [x, y] of [[k, 0], [k, 127], [0, k], [127, k]]) {
        assert.ok(raw.data[((Math.floor(cell / 4) * 128 + y) * 512 + (cell % 4) * 128 + x) * 4 + 3] <= 24, `${id} ${frame} cell ${cell}: art touches the cell edge at ${x},${y}`);
      }
      for (let cell = 0; cell < 8; cell++) {
        let x0 = 128, x1 = -1, y1 = -1;
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
          if (png.data[((Math.floor(cell / 4) * 128 + y) * 512 + (cell % 4) * 128 + x) * 4 + 3] <= 24) continue;
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }
        assert.equal(y1, 121, `${id} ${frame} cell ${cell}: bottom at 121px`);
        assert.ok(Math.abs((x0 + x1) / 2 - 63) <= 1, `${id} ${frame} cell ${cell}: centred`);
      }
      sheets[frame] = png;
    }
    assert.notDeepEqual(sheets.a.data, sheets.b.data, `${id}: poses A and B differ`);
  }
});

// 竜グロム（段階4）: 頭・胴の2枚。同じく再現・欠け・セルの縁・中心と下端を確かめる。
test('Grom head and body sheets reproduce, stay in their cells and share the ground line', async () => {
  for (const [part, build] of [['head', buildGromHeadSheet], ['body', buildGromBodySheet]]) {
    const file = name => output('grom-8dir', `grom_code_${part}_8dir${name}`);
    assert.equal(build(), await readFile(file('.svg'), 'utf8'), `grom ${part} svg`);
    const png = PNG.sync.read(await readFile(file('.png'))), raw = PNG.sync.read(await readFile(file('.src.png')));
    const solid = p => { let n = 0; for (let i = 3; i < p.data.length; i += 4) if (p.data[i] > 24) n++; return n; };
    assert.equal(solid(png), solid(raw), `grom ${part}: no pixels lost`);
    for (let cell = 0; cell < 8; cell++) {
      const at = (img, x, y) => img.data[((Math.floor(cell / 4) * 128 + y) * 512 + (cell % 4) * 128 + x) * 4 + 3];
      for (let k = 0; k < 128; k++) for (const [x, y] of [[k, 0], [k, 127], [0, k], [127, k]]) assert.ok(at(raw, x, y) <= 24, `grom ${part} cell ${cell}: touches the edge at ${x},${y}`);
      let x0 = 128, x1 = -1, y1 = -1;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (at(png, x, y) > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      assert.equal(y1, 121, `grom ${part} cell ${cell}: bottom at 121px`);
      assert.ok(Math.abs((x0 + x1) / 2 - 63) <= 1, `grom ${part} cell ${cell}: centred`);
    }
  }
});
