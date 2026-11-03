// 第4～5章のモンスターの書き出し。全身のA・B 2ポーズを8方向シートにし、公式の正規化で中心と
// 下端（121px）をそろえる（正規化の規則は公式ツールと同じで、セルごとに測る）。--preview-game を付けると、game-targets.mjs に書いたゲームへ画像・原画を写す。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { DIRECTIONS, LABELS } from './sheet-format.mjs';
import { CHARACTERS, gameUrl, writeToGames } from './game-targets.mjs';
import { launchBrowser } from '../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch4-5/package.json', import.meta.url));
const { PNG } = require('pngjs');

// 左右対称の5方向を描き、右側の3方向は反転する。frame は 'a' | 'b'。
export function monsterSheet({ cellSize = 128, palette = {}, frame = 'a' } = {}, defaults, defs, draw) {
  if (!Number.isInteger(cellSize) || cellSize < 128 || cellSize > 1024) throw Error('cellSize must be an integer from 128 to 1024');
  if (!['a', 'b'].includes(frame)) throw Error(`Unknown frame: ${frame}`);
  const colors = { ...defaults, ...palette };
  for (const color of Object.values(colors)) if (!/^#[0-9a-f]{6}$/i.test(color)) throw Error('Invalid palette color');
  const cells = DIRECTIONS.map((d, i) => {
    const mirror = i > 4, view = mirror ? 8 - i : i;
    return `<g transform="translate(${i % 4 * 128} ${Math.floor(i / 4) * 128})"><g ${mirror ? 'transform="translate(126 0) scale(-1 1)"' : ''}>${draw(view, frame)}</g></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize * 4}" height="${cellSize * 2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k, v]) => `--${k}:${v}`).join(';')}">${defs}${cells}</svg>`;
}

// The official normalizer finds the 4 cells of a row by empty columns, which fails when a monster
// throws off detached pieces (embers). Studio art never crosses its 128px cell, so measure each
// cell's own bounding box and apply the same rule: centre at u=.494, bottom at v=.945 (121px).
function normalizeCells(src) {
  const out = new PNG({ width: src.width, height: src.height }), report = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
    let x0 = 128, x1 = -1, y0 = 128, y1 = -1;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      if (src.data[((row * 128 + y) * src.width + col * 128 + x) * 4 + 3] <= 24) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const dx = Math.round(128 * .494) - Math.round((x0 + x1) / 2), dy = Math.round(128 * .945) - y1;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const si = ((row * 128 + y) * src.width + col * 128 + x) * 4;
      if (src.data[si + 3] <= 24) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx > 127 || ny < 0 || ny > 127) continue;
      src.data.copy(out.data, ((row * 128 + ny) * src.width + col * 128 + nx) * 4, si, si + 4);
    }
    report.push({ row, col, dx, dy, bbox: `${x0}-${x1}/${y0}-${y1}`, before: ((x0 + x1) / 2 / 128).toFixed(3), after: (Math.round(128 * .494) / 128).toFixed(3) });
  }
  return { out, report };
}

export async function exportMonster({ id, name, role, build, references, summary, runtime }) {
  const character = CHARACTERS.find(c => c.id === id);
  if (!character) throw Error(`${id} is not listed in game-targets.mjs`);
  const previewGame = process.argv.includes('--preview-game');
  const unknown = process.argv.slice(2).filter(arg => arg !== '--preview-game');
  if (unknown.length) throw Error(`Unknown arguments: ${unknown.join(', ')}`);
  const here = file => new URL(`../${character.folder}/${file}`, import.meta.url);
  await mkdir(here('output/'), { recursive: true });
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const rasterize = async source => Buffer.from(await page.evaluate(async svg => {
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      try {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      } finally { URL.revokeObjectURL(url); }
    }, source), 'base64');
    const solid = p => { let n = 0; for (let i = 3; i < p.data.length; i += 4) if (p.data[i] > 24) n++; return n; };
    const frames = [];
    for (const frame of ['a', 'b']) {
      const svg = build({ frame }), raw = await rasterize(svg), source = PNG.sync.read(raw);
      const { out, report } = normalizeCells(source);
      if (solid(source) !== solid(out)) throw Error(`${name} ${frame}: normalization clipped artwork (${report.map(r => `${r.row * 4 + r.col}:${r.bbox}`).join(' ')})`);
      const fileName = `${id}_code_idle_${frame}_8dir`, png = PNG.sync.write(out);
      await writeFile(here(`output/${fileName}.svg`), svg);
      await writeFile(here(`output/${fileName}.src.png`), raw);
      await writeFile(here(`output/${fileName}.png`), png);
      if (previewGame) {
        await writeToGames(character, `assets/${character.dir}/${fileName}.png`, png);
        await writeToGames(character, `art_src/${fileName}.src.png`, raw);
      }
      frames.push({ frame, output: `${fileName}.png`, normalization: report, png, reference: await readFile(gameUrl('ch4-5', references[frame])) });
    }
    const uri = bytes => `data:image/png;base64,${bytes.toString('base64')}`;
    const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1200" viewBox="0 0 1080 1200"><rect width="1080" height="1200" fill="#eee9df"/>
      <text x="28" y="38" font-family="sans-serif" font-size="22" font-weight="700" fill="#203344">${id.toUpperCase()} / ${role} / 8 DIRECTIONS × A·B</text>
      <text x="28" y="62" font-family="sans-serif" font-size="14" fill="#60717b">${summary}</text>
      ${frames.flatMap((f, row) => [f.reference, f.png].map((bytes, col) => `<g transform="translate(28 ${84 + (row * 2 + col) * 276})"><rect width="1024" height="268" fill="#d8e1df"/><text x="10" y="16" font-family="sans-serif" font-size="13" fill="#203344">${col ? 'CODE' : 'REFERENCE'} / ${f.frame.toUpperCase()}</text><image href="${uri(bytes)}" x="0" y="12" width="1024" height="256" style="image-rendering:pixelated"/></g>`)).join('')}
    </svg>`;
    await writeFile(here('output/comparison.png'), await rasterize(board));
    await writeFile(here('output/manifest.json'), JSON.stringify({
      id, name, role, version: 1, status: 'prototype', source: '../character.mjs', format: 'game-monster-billboard',
      cellSize: 128, columns: 4, rows: 2, directions: DIRECTIONS, labels: LABELS, anchor: { centerU: .494, bottomFromTop: .945 },
      frames: frames.map(({ png, reference, ...f }) => f), runtime: { class: 'MonsterSprite', interval: .38, uv: { uMin: .02, uMax: .98, vMin: .02, vMax: .98 }, ...runtime },
      references: Object.values(references).map(p => `dqb3-tsugumono-ch4-5/${p}`), targets: character.targets,
    }, null, 2) + '\n');
    console.log(`${name} exported to Studio${previewGame ? ` and ${character.targets.join(', ')}` : ''}.`);
  } finally { await browser.close(); }
}
