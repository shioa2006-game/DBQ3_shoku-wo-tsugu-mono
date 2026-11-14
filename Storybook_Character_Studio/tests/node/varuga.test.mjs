import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { VARUGA_PROFILE } from '../../prototypes/varuga-8dir/rig-profile.mjs';
import { MOTIONS, sampleMotion } from '../../prototypes/varuga-8dir/motion.mjs';
import { buildVarugaOpenHeadSheet } from '../../prototypes/varuga-8dir/character.mjs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../dqb3-tsugumono-ch4-5/package.json', import.meta.url));
const { PNG } = require('pngjs');

test('ヴァルガの生成設定は三頭の原本と一致し、ゲームへの未登録の書き出しを拒否する', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../prototypes/varuga-8dir/output/manifest.json', import.meta.url), 'utf8'));
  for (const [key, value] of Object.entries(VARUGA_PROFILE)) assert.deepEqual(manifest.runtime[key], value, key);
  assert.equal(manifest.runtime.heads.length, 3);
  assert.ok(VARUGA_PROFILE.heads[1].forward > 0, '中央の頭は胴より前へ出す');
  assert.deepEqual(manifest.targets, []);
  assert.deepEqual(manifest.runtime.motions, MOTIONS);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../../prototypes/varuga-8dir/export.mjs', import.meta.url)), '--preview-game'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ゲームへの移植先は未登録/);
});

test('着地から地上待機へつながり、三頭の攻撃は予兆・攻撃・復帰を経る', () => {
  assert.equal(sampleMotion('landing', 0).grounded, 0);
  assert.equal(sampleMotion('landing', 1.6).grounded, 1);
  const landed = sampleMotion('landing', MOTIONS.landing.duration), idle = sampleMotion('ground', 0);
  assert.equal(landed.compression, idle.compression);
  assert.deepEqual(landed.heads, idle.heads);
  for (const [i, time] of [[0, .72], [1, 1.77], [2, 2.82]]) {
    const heads = sampleMotion('bite', time).heads;
    assert.ok(heads[i].forward > 1.5 && heads[i].mouth, '頭ごとに突進する');
    assert.ok(heads.every((h, j) => j === i || h.forward < .5), '三頭が一斉に突き出さない');
  }
  for (const mode of ['flame', 'air_flame']) {
    assert.ok(sampleMotion(mode, .6).heads.every(h => h.flame === 'telegraph'));
    assert.ok(sampleMotion(mode, 1.7).heads.every(h => h.flame === 'fire' && h.mouth));
    assert.deepEqual(sampleMotion(mode, MOTIONS[mode].duration).heads, idle.heads);
  }
  assert.equal(sampleMotion('air_flame', 1.7).grounded, 0);
  assert.throws(() => sampleMotion('unknown', 0), /Unknown motion/);
});

test('開口シートは再生成でき、頭の8方向の中心と下端を維持する', async () => {
  const output = file => new URL(`../../prototypes/varuga-8dir/output/${file}`, import.meta.url);
  assert.equal(buildVarugaOpenHeadSheet(), await readFile(output('varuga_code_head_open_8dir.svg'), 'utf8'));
  const open = PNG.sync.read(await readFile(output('varuga_code_head_open_8dir.png')));
  const closed = PNG.sync.read(await readFile(output('varuga_code_head_8dir.png')));
  assert.deepEqual([open.width, open.height], [512, 256]);
  for (let cell = 0; cell < 8; cell++) {
    const bounds = img => {
      let x0 = 128, x1 = -1, y0 = 128, y1 = -1;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        if (img.data[((Math.floor(cell / 4) * 128 + y) * 512 + cell % 4 * 128 + x) * 4 + 3] <= 24) continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      return [x0, x1, y0, y1];
    };
    assert.deepEqual(bounds(open), bounds(closed), `cell ${cell}: 開閉時の位置が変わらない`);
  }
  assert.notDeepEqual(open.data, closed.data);
});
