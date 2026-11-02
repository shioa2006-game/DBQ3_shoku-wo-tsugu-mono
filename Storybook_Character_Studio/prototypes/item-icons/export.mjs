// アイテムアイコンをPNGへ書き出す。ブラウザ不要（ドット絵を直接PNGにする）。
//   output/item_icons_16.png   ゲームへ渡すアトラス（16pxセル、作画済みだけ）
//   output/manifest.json       id → セル位置、未作画の一覧
//   output/preview.png         確認用（全アイテムを4倍、作画済みは実寸2倍も）
import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { ICONS, renderIcon } from './icons.mjs';
import { ICON_SIZE } from './pixel.mjs';
import { CH1_3_ITEMS } from './catalog.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch1-3/package.json', import.meta.url));
const { PNG } = require('pngjs');
const here = (p) => new URL(p, import.meta.url);
const game = (p) => new URL(`../../../dqb3-tsugumono-ch1-3/${p}`, import.meta.url);

export const ATLAS_COLUMNS = 8;

export function buildAtlas() {
  const drawn = CH1_3_ITEMS.filter((item) => ICONS[item.id]);
  const unknown = Object.keys(ICONS).filter((id) => !CH1_3_ITEMS.some((item) => item.id === id));
  if (unknown.length) throw Error(`Icons without a catalog entry: ${unknown.join(', ')}`);
  const rows = Math.max(1, Math.ceil(drawn.length / ATLAS_COLUMNS));
  const png = new PNG({ width: ATLAS_COLUMNS * ICON_SIZE, height: rows * ICON_SIZE });
  png.data.fill(0);
  const cells = {};
  drawn.forEach((item, i) => {
    const col = i % ATLAS_COLUMNS, row = Math.floor(i / ATLAS_COLUMNS);
    blit(png, renderIcon(item.id), col * ICON_SIZE, row * ICON_SIZE, 1);
    cells[item.id] = [col, row];
  });
  return {
    png,
    manifest: {
      id: 'item-icons',
      version: 1,
      status: 'prototype',
      source: '../icons.mjs',
      chapter: 'ch1-3',
      image: 'item_icons_16.png',
      cellSize: ICON_SIZE,
      columns: ATLAS_COLUMNS,
      rows,
      outline: true,
      display: { scale: 2, imageRendering: 'pixelated', note: '16px icons are shown at 32px in the 36px slot; keep integer scaling' },
      cells,
      pending: CH1_3_ITEMS.filter((item) => !ICONS[item.id]).map((item) => item.id),
    },
  };
}

function blit(png, icon, ox, oy, scale) {
  for (let y = 0; y < ICON_SIZE; y += 1) {
    for (let x = 0; x < ICON_SIZE; x += 1) {
      const i = (y * ICON_SIZE + x) * 4;
      if (!icon.data[i + 3]) continue;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const j = ((oy + y * scale + sy) * png.width + ox + x * scale + sx) * 4;
          png.data.set(icon.data.subarray(i, i + 4), j);
        }
      }
    }
  }
}

function fill(png, x, y, w, h, [r, g, b]) {
  for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) png.data.set([r, g, b, 255], (j * png.width + i) * 4);
}

// 確認用: 上段は全50件を4倍（未作画は空き枠）、下段は作画済みを本編のスロット・草地の上に実寸2倍で。
function buildPreview() {
  const cols = 10, cell = 76, pad = 12;
  const gridRows = Math.ceil(CH1_3_ITEMS.length / cols);
  const drawn = CH1_3_ITEMS.filter((item) => ICONS[item.id]);
  const small = 40, smallRows = Math.ceil(drawn.length / 16);
  const width = pad * 2 + cols * cell, height = pad * 3 + gridRows * cell + smallRows * small * 2;
  const png = new PNG({ width, height });
  fill(png, 0, 0, width, height, [0xef, 0xee, 0xe6]);
  CH1_3_ITEMS.forEach((item, i) => {
    const x = pad + (i % cols) * cell, y = pad + Math.floor(i / cols) * cell;
    fill(png, x + 2, y + 2, cell - 4, cell - 4, ICONS[item.id] ? [0x16, 0x1c, 0x30] : [0xc9, 0xcd, 0xc8]);
    if (ICONS[item.id]) blit(png, renderIcon(item.id), x + 6, y + 6, 4);
  });
  const top = pad * 2 + gridRows * cell;
  for (const [band, bg] of [[0, [0x16, 0x1c, 0x30]], [1, [0x5f, 0xa5, 0x3f]]]) {
    drawn.forEach((item, i) => {
      const x = pad + (i % 16) * small, y = top + band * smallRows * small + Math.floor(i / 16) * small;
      fill(png, x, y, small, small, bg);
      blit(png, renderIcon(item.id), x + 4, y + 4, 2);
    });
  }
  return png;
}

// ゲームが読む位置情報。ゲームで使わない制作用の項目は省く。
export function gameManifest(manifest) {
  const { version, image, cellSize, columns, rows, cells } = manifest;
  return { source: 'Storybook_Character_Studio/prototypes/item-icons/icons.mjs', version, image, cellSize, columns, rows, cells };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const toGame = process.argv.includes('--preview-game');
  if (process.argv.slice(2).some((a) => a !== '--preview-game')) throw Error('Unknown argument');
  await mkdir(here('output/'), { recursive: true });
  const { png, manifest } = buildAtlas();
  const bytes = PNG.sync.write(png);
  await writeFile(here('output/item_icons_16.png'), bytes);
  await writeFile(here('output/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(here('output/preview.png'), PNG.sync.write(buildPreview()));
  if (toGame) {
    // 16pxの完成画像なので正規化はなく、art_src/ を経ずに読込用の assets/items/ へ置く。
    await mkdir(game('assets/items/'), { recursive: true });
    await writeFile(game('assets/items/item_icons_16.png'), bytes);
    await writeFile(game('assets/items/item_icons_16.json'), JSON.stringify(gameManifest(manifest), null, 2) + '\n');
  }
  console.log(`Item icons exported: ${Object.keys(manifest.cells).length} drawn / ${CH1_3_ITEMS.length} items; ${toGame ? 'copied to dqb3-tsugumono-ch1-3/assets/items/' : 'game assets unchanged'}.`);
}
