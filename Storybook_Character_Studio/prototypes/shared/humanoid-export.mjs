// 第4～5章の人型の書き出し。頭・胴・比較用合成のSVGを画像にし、合成シートの正規化量を
// 頭と胴にも同じだけ当てる（頭だけを正規化すると、髪の下端が胴の裾の基準へずれて接続が崩れる）。
// --preview-game を付けると、game-targets.mjs に書いたゲームへ画像・原画・リグ設定を写す。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { DIRECTIONS, LABELS } from './sheet-format.mjs';
import { CHARACTERS, referenceUrl, runtimeRigProfile, writeToGames } from './game-targets.mjs';
import { launchBrowser } from '../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { normalize } from '../../../dqb3-tsugumono-ch4-5/tools/normalize_sheet.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch4-5/package.json', import.meta.url));
const { PNG } = require('pngjs');

// studioOnly: デザイン検討中の案。game-targets.mjs に載せず、出力はStudio内だけに置く。
export async function exportHumanoid({ id, name, role, build, reference, summary, rigColors, rigTuning, studioOnly = false }) {
  const character = studioOnly ? { id, folder: `${id}-8dir`, targets: [] } : CHARACTERS.find(c => c.id === id);
  if (!character) throw Error(`${id} is not listed in game-targets.mjs`);
  const previewGame = process.argv.includes('--preview-game');
  const unknown = process.argv.slice(2).filter(arg => arg !== '--preview-game');
  if (unknown.length) throw Error(`Unknown arguments: ${unknown.join(', ')}`);
  if (previewGame && !character.targets.length) throw Error(`${id} is a Studio-only design and has no target game`);
  const here = file => new URL(`../${character.folder}/${file}`, import.meta.url);
  await mkdir(here('output/'), { recursive: true });
  const svg = build();
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
    const raw = await rasterize(svg);
    const { out, report } = normalize(PNG.sync.read(raw));
    const normalized = PNG.sync.write(out);
    const files = { [`${id}_code_body_8dir`]: { raw, png: normalized } };
    const layers = {};
    for (const part of ['head', 'torso']) {
      const partSvg = build({ part });
      const partRaw = await rasterize(partSvg), source = PNG.sync.read(partRaw);
      const target = new PNG({ width: 512, height: 256 });
      for (const { row, col, dx, dy } of report) {
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
          const si = ((row * 128 + y) * 512 + col * 128 + x) * 4;
          if (source.data[si + 3] <= 24) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= 128 || ny < 0 || ny >= 128) throw Error(`${part}: normalization clips artwork`);
          source.data.copy(target.data, ((row * 128 + ny) * 512 + col * 128 + nx) * 4, si, si + 4);
        }
      }
      const fileName = `${id}_code_${part}_layer_8dir`;
      layers[part] = `${fileName}.png`;
      await writeFile(here(`output/${fileName}.svg`), partSvg);
      files[fileName] = { raw: partRaw, png: PNG.sync.write(target) };
    }
    for (const [fileName, { raw: src, png }] of Object.entries(files)) {
      await writeFile(here(`output/${fileName}.src.png`), src);
      await writeFile(here(`output/${fileName}.png`), png);
    }
    await writeFile(here(`output/${id}-code.svg`), svg);

    // 比較画像: 元画像とコード生成を同じ2倍で上下に並べる。
    const ref = await readFile(referenceUrl(reference));
    const uri = bytes => `data:image/png;base64,${bytes.toString('base64')}`;
    const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="660" viewBox="0 0 1080 660">
      <rect width="1080" height="660" fill="#eee9df"/>
      <text x="28" y="38" font-family="sans-serif" font-size="22" font-weight="700" fill="#203344">${id.toUpperCase()} / ${role} / 8 DIRECTIONS</text>
      <text x="28" y="62" font-family="sans-serif" font-size="14" fill="#60717b">${summary}</text>
      ${[ref, normalized].map((bytes, i) => `<g transform="translate(28 ${84 + i * 288})"><rect width="1024" height="276" fill="#d8e1df"/><text x="10" y="18" font-family="sans-serif" font-size="13" fill="#203344">${i ? 'CODE' : 'REFERENCE'}</text><image href="${uri(bytes)}" x="0" y="20" width="1024" height="256" style="image-rendering:pixelated"/></g>`).join('')}
    </svg>`;
    await writeFile(here('output/comparison.png'), await rasterize(board));
    await writeFile(here('output/manifest.json'), JSON.stringify({
      id, name, role, version: 1, status: 'prototype',
      source: '../character.mjs', reference: `references/${reference}`,
      format: 'game-humanoid-bust', cellSize: 128, columns: 4, rows: 2, directions: DIRECTIONS, labels: LABELS,
      anchor: { centerU: .494, bottomFromTop: .945 }, normalization: report,
      output: `${id}_code_body_8dir.png`, runtime: 'HumanoidRig with separate headSheetUrl/bodySheetUrl; limbs and equipment supplied by the game',
      runtimeSheets: { headSheetUrl: layers.head, bodySheetUrl: layers.torso },
      rigColors, rigTuning, rigProfile: '../rig-profile.mjs', targets: character.targets,
    }, null, 2) + '\n');
    if (previewGame) {
      for (const [fileName, { raw: src, png }] of Object.entries(files)) {
        await writeToGames(character, `assets/${character.dir}/${fileName}.png`, png);
        await writeToGames(character, `art_src/${fileName}.src.png`, src);
      }
      await writeToGames(character, `src/content/rig-profiles/${id}.mjs`, runtimeRigProfile(character, await readFile(here('rig-profile.mjs'), 'utf8')));
    }
    console.log(`${name} exported to Studio${previewGame ? ` and ${character.targets.join(', ')}` : ''}.`);
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
}
