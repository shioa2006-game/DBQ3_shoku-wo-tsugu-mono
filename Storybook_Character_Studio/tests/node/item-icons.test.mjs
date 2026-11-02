import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { ICONS, PALETTE, OUTLINE, renderIcon } from '../../prototypes/item-icons/icons.mjs';
import { PixelIcon } from '../../prototypes/item-icons/pixel.mjs';
import { CH1_3_ITEMS } from '../../prototypes/item-icons/catalog.mjs';
import { buildAtlas, gameManifest } from '../../prototypes/item-icons/export.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch1-3/package.json', import.meta.url));
const { PNG } = require('pngjs');
const here = (p) => new URL(`../../prototypes/item-icons/${p}`, import.meta.url);

test('item catalog matches the CH1-3 game item ids and order', async () => {
  const source = await readFile(new URL('../../../dqb3-tsugumono-ch1-3/src/game/items.js', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export const ITEMS'), source.indexOf('export const RECIPES'));
  const ids = [...body.matchAll(/^\s+(\w+): \{ name: "([^"]+)"/gm)].map((m) => [m[1], m[2]]);
  assert.deepEqual(CH1_3_ITEMS.map((item) => [item.id, item.name]), ids);
});

test('every drawn icon is a catalog item and renders inside its outline margin', () => {
  const outline = [1, 3, 5].map((i) => parseInt(OUTLINE.slice(i, i + 2), 16));
  for (const id of Object.keys(ICONS)) {
    assert.ok(CH1_3_ITEMS.some((item) => item.id === id), `${id} is in the catalog`);
    const icon = renderIcon(id);
    let opaque = 0, edge = 0;
    for (let i = 0; i < icon.data.length; i += 4) {
      if (!icon.data[i + 3]) continue;
      opaque += 1;
      if (icon.data[i] === outline[0] && icon.data[i + 1] === outline[1] && icon.data[i + 2] === outline[2]) edge += 1;
    }
    assert.ok(opaque > 40, `${id} has a visible drawing (${opaque}px)`);
    assert.ok(edge > 12, `${id} has an outline (${edge}px)`);
  }
});

test('pixel helpers reject bad art instead of silently clipping', () => {
  const ic = new PixelIcon();
  assert.throws(() => ic.px(16, 0, PALETTE.w), /out of icon/);
  assert.throws(() => ic.grid(['?'], PALETTE), /Unknown palette key/);
  assert.throws(() => ic.px(1, 1, 'brown'), /Invalid color/);
  ic.px(0, 5, PALETTE.w);
  assert.throws(() => ic.outline(OUTLINE), /touches the icon edge/);
});

test('exported atlas and manifest are up to date with the source', async () => {
  const { png, manifest } = buildAtlas();
  const saved = PNG.sync.read(await readFile(here('output/item_icons_16.png')));
  assert.equal(saved.width, png.width);
  assert.equal(saved.height, png.height);
  assert.ok(Buffer.from(saved.data).equals(Buffer.from(png.data)), 'atlas pixels match; run npm.cmd run export:items');
  assert.deepEqual(JSON.parse(await readFile(here('output/manifest.json'), 'utf8')), manifest);
  assert.deepEqual(Object.keys(manifest.cells), CH1_3_ITEMS.filter((item) => ICONS[item.id]).map((item) => item.id));
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /prototypes\/item-icons\/output\/preview\.png/);
});

test('CH1-3 game uses the same atlas and cell positions as the Studio output', async () => {
  const game = (p) => new URL(`../../../dqb3-tsugumono-ch1-3/assets/items/${p}`, import.meta.url);
  const { manifest } = buildAtlas();
  assert.ok((await readFile(game('item_icons_16.png'))).equals(await readFile(here('output/item_icons_16.png'))), 'run npm.cmd run export:items -- --preview-game');
  assert.deepEqual(JSON.parse(await readFile(game('item_icons_16.json'), 'utf8')), gameManifest(manifest));
});
