// 竜の書き出し。頭・胴の8方向シート（各1ポーズ）を、モンスターと同じ規則（セルごとに中心 u=.494、
// 下端121px）で正規化する。--preview-game を付けると、game-targets.mjs に書いたゲームへ画像・原画を写す。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { DIRECTIONS, LABELS } from './sheet-format.mjs';
import { CHARACTERS, gameUrl, writeToGames } from './game-targets.mjs';
import { normalizeCells } from './monster-export.mjs';
import { launchBrowser } from '../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch4-5/package.json', import.meta.url));
const { PNG } = require('pngjs');

export async function exportDragon({ id, name, role, sheets, summary, runtime }) {
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
    const parts = [];
    for (const [part, { build, reference }] of Object.entries(sheets)) {
      const svg = build(), raw = await rasterize(svg), source = PNG.sync.read(raw);
      const { out, report } = normalizeCells(source);
      if (solid(source) !== solid(out)) throw Error(`${name} ${part}: normalization clipped artwork (${report.map(r => `${r.row * 4 + r.col}:${r.bbox}`).join(' ')})`);
      const fileName = `${id}_code_${part}_8dir`, png = PNG.sync.write(out);
      await writeFile(here(`output/${fileName}.svg`), svg);
      await writeFile(here(`output/${fileName}.src.png`), raw);
      await writeFile(here(`output/${fileName}.png`), png);
      if (previewGame) {
        await writeToGames(character, `assets/${character.dir}/${fileName}.png`, png);
        await writeToGames(character, `art_src/${fileName}.src.png`, raw);
      }
      parts.push({ part, output: `${fileName}.png`, normalization: report, png, reference: await readFile(gameUrl('ch4-5', reference)) });
    }
    const uri = bytes => `data:image/png;base64,${bytes.toString('base64')}`;
    const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1200" viewBox="0 0 1080 1200"><rect width="1080" height="1200" fill="#eee9df"/>
      <text x="28" y="38" font-family="sans-serif" font-size="22" font-weight="700" fill="#203344">${id.toUpperCase()} / ${role} / 8 DIRECTIONS · HEAD + BODY</text>
      <text x="28" y="62" font-family="sans-serif" font-size="14" fill="#60717b">${summary}</text>
      ${parts.flatMap((p, row) => [p.reference, p.png].map((bytes, col) => `<g transform="translate(28 ${84 + (row * 2 + col) * 276})"><rect width="1024" height="268" fill="#d8e1df"/><text x="10" y="16" font-family="sans-serif" font-size="13" fill="#203344">${col ? 'CODE' : 'REFERENCE'} / ${p.part.toUpperCase()}</text><image href="${uri(bytes)}" x="0" y="12" width="1024" height="256" style="image-rendering:pixelated"/></g>`)).join('')}
    </svg>`;
    await writeFile(here('output/comparison.png'), await rasterize(board));
    await writeFile(here('output/manifest.json'), JSON.stringify({
      id, name, role, version: 1, status: 'prototype', source: '../character.mjs', format: 'game-dragon-billboards',
      cellSize: 128, columns: 4, rows: 2, directions: DIRECTIONS, labels: LABELS, anchor: { centerU: .494, bottomFromTop: .945 },
      parts: parts.map(({ png, reference, ...p }) => p), runtime: { class: 'DragonRig (MonsterSprite head/body, 3D neck, wings and tail)', ...runtime },
      references: Object.values(sheets).map(s => `dqb3-tsugumono-ch4-5/${s.reference}`), targets: character.targets,
    }, null, 2) + '\n');
    console.log(`${name} exported to Studio${previewGame ? ` and ${character.targets.join(', ')}` : ''}.`);
  } finally { await browser.close(); }
}
