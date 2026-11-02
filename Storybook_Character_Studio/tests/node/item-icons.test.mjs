import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { ICONS, PALETTE, OUTLINE, renderIcon } from '../../prototypes/item-icons/icons.mjs';
import { PixelIcon } from '../../prototypes/item-icons/pixel.mjs';
import { CH1_3_ITEMS, ALL_ITEMS, GAMES } from '../../prototypes/item-icons/catalog.mjs';
import { buildAtlas, gameManifest, ATLAS_COLUMNS } from '../../prototypes/item-icons/export.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch1-3/package.json', import.meta.url));
const { PNG } = require('pngjs');
const here = (p) => new URL(`../../prototypes/item-icons/${p}`, import.meta.url);

test('item catalogs match each game item ids and order', async () => {
  for (const { folder, items } of Object.values(GAMES)) {
    const source = await readFile(new URL(`../../../${folder}/src/game/items.js`, import.meta.url), 'utf8');
    const body = source.slice(source.indexOf('export const ITEMS'), source.indexOf('export const RECIPES'));
    const ids = [...body.matchAll(/^\s+(\w+): \{ name: "([^"]+)"/gm)].map((m) => [m[1], m[2]]);
    assert.deepEqual(items.map((item) => [item.id, item.name]), ids, folder);
  }
  assert.equal(new Set(ALL_ITEMS.map((item) => item.id)).size, ALL_ITEMS.length, 'atlas order has no duplicate ids');
});

test('every drawn icon is a catalog item and renders inside its outline margin', () => {
  const outline = [1, 3, 5].map((i) => parseInt(OUTLINE.slice(i, i + 2), 16));
  for (const id of Object.keys(ICONS)) {
    assert.ok(ALL_ITEMS.some((item) => item.id === id), `${id} is in the catalog`);
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
  assert.deepEqual(Object.keys(manifest.cells), ALL_ITEMS.filter((item) => ICONS[item.id]).map((item) => item.id));
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /prototypes\/item-icons\/output\/preview\.png/);
});

test('CH1-3 cells keep their positions when later chapters are added', () => {
  const { manifest } = buildAtlas();
  CH1_3_ITEMS.forEach((item, i) => {
    if (manifest.cells[item.id]) assert.deepEqual(manifest.cells[item.id], [i % ATLAS_COLUMNS, Math.floor(i / ATLAS_COLUMNS)], item.id);
  });
});

test('each game uses the same atlas and its own cell positions from the Studio output', async () => {
  const { manifest } = buildAtlas();
  const atlas = await readFile(here('output/item_icons_16.png'));
  for (const [key, { folder, items }] of Object.entries(GAMES)) {
    const game = (p) => new URL(`../../../${folder}/assets/items/${p}`, import.meta.url);
    assert.ok((await readFile(game('item_icons_16.png'))).equals(atlas), `${folder}: run npm.cmd run export:items -- --preview-game`);
    const saved = JSON.parse(await readFile(game('item_icons_16.json'), 'utf8'));
    assert.deepEqual(saved, gameManifest(manifest, key), folder);
    assert.deepEqual(Object.keys(saved.cells).sort(), items.filter((item) => ICONS[item.id]).map((item) => item.id).sort(), folder);
  }
});
