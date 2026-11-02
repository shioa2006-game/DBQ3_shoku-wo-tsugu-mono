import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildHeroSheet, DIRECTIONS, LABELS } from './character.mjs';
import { ADVENTURER_RIG_PROFILE } from './rig-profile.mjs';
// Reuse the game's installed Chromium renderer and PNG tooling. No download.
import { launchBrowser } from '../../../dqb3-tsugumono-ch1-3/tests/helpers.mjs';
import { normalize } from '../../../dqb3-tsugumono-ch1-3/tools/normalize_sheet.mjs';

const require = createRequire(new URL('../../../dqb3-tsugumono-ch1-3/package.json', import.meta.url));
const { PNG } = require('pngjs');
const here = name => new URL(name, import.meta.url);
const game = name => new URL(`../../../dqb3-tsugumono-ch1-3/${name}`, import.meta.url);
const output = here('output/');
const previewGame = process.argv.includes('--preview-game');
const unknown = process.argv.slice(2).filter(arg => arg !== '--preview-game');
if (unknown.length) throw Error(`Unknown arguments: ${unknown.join(', ')}`);
await mkdir(output, { recursive: true });
const svg = buildHeroSheet();
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  // SVG is rendered to a transparent Canvas, never captured from a UI screenshot.
  const rasterize = async source => {
    const data = await page.evaluate(async svgText => {
      const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
      try {
        const img = new Image(); img.src = url; await img.decode();
        const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      } finally { URL.revokeObjectURL(url); }
    }, source);
    return Buffer.from(data, 'base64');
  };
  const raw = await rasterize(svg);
  const { out, report } = normalize(PNG.sync.read(raw));
  const normalized = PNG.sync.write(out);
  await writeFile(here('output/adventurer-code.svg'), svg);
  await writeFile(here('output/adventurer_code_body_8dir.src.png'), raw);
  if (previewGame) {
    await writeFile(game('prototypes/adventurer/rig-profile.mjs'), await readFile(here('rig-profile.mjs')));
    await writeFile(game('art_src/adventurer_code_body_8dir.src.png'), raw);
    await writeFile(game('assets/humanoids/adventurer_code_body_8dir.png'), normalized);
  }
  await writeFile(here('output/adventurer_code_body_8dir.png'), normalized);
  const original = await readFile(game('assets/adventurer_boy_body_8dir.png'));
  const uri = b => `data:image/png;base64,${b.toString('base64')}`;
  const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="920" viewBox="0 0 1200 920">
    <rect width="1200" height="920" rx="24" fill="#eee9df"/>
    <text x="48" y="55" font-family="sans-serif" font-size="27" font-weight="700" fill="#203344">ADVENTURER / 8-DIRECTION CODE PROTOTYPE</text>
    <text x="48" y="86" font-family="sans-serif" font-size="16" fill="#60717b">Blue cap · brass goggles · golden hair · red scarf</text>
    <rect x="40" y="112" width="550" height="322" rx="16" fill="#d8e1df"/><rect x="610" y="112" width="550" height="322" rx="16" fill="#d8e1df"/>
    <text x="64" y="145" font-family="sans-serif" font-size="18" fill="#203344">REFERENCE</text><text x="634" y="145" font-family="sans-serif" font-size="18" fill="#203344">GENERATED / 512 × 256</text>
    <image href="${uri(original)}" x="59" y="162" width="512" height="256"/><image href="${uri(normalized)}" x="629" y="162" width="512" height="256"/>
    <text x="48" y="478" font-family="sans-serif" font-size="18" fill="#203344">GENERATED / ENLARGED</text>
    <image href="${uri(normalized)}" x="200" y="502" width="800" height="400"/>
  </svg>`;
  await writeFile(here('output/comparison.png'), await rasterize(board));
  await writeFile(here('output/manifest.json'), JSON.stringify({
    version: 7, source: '../character.mjs', format: 'game-humanoid-bust',
    cellSize: 128, columns: 4, rows: 2, directions: DIRECTIONS, labels: LABELS,
    anchor: { centerU: .494, bottomFromTop: .945 },
    normalization: report,
    rigTuning: ADVENTURER_RIG_PROFILE, rigProfile: '../rig-profile.mjs',
    runtime: 'Existing HumanoidRig; 3D limbs and equipment are not baked into the PNG',
  }, null, 2) + '\n');
  console.log(`Adventurer exported to Studio${previewGame ? ' and isolated game preview' : ''}.`);
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
