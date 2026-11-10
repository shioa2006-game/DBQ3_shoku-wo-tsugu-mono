import { writeFile } from 'node:fs/promises';
import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildAsagiSheet, ASAGI_LAYOUT, LABELS } from './character.mjs';
import { ASAGI_RIG_PROFILE, ASAGI_RIG_COLORS } from './rig-profile.mjs';

const uri = bytes => `data:image/png;base64,${bytes.toString('base64')}`;
// 設定画のセルを同じ倍率で並べる。顔や髪の外接枠ごとに拡大して差を隠さない。
function comparison({ reference }) {
  const cell = ASAGI_LAYOUT.referenceCell, scale = ASAGI_LAYOUT.referenceScale;
  const k = 2, cw = 128 * k, gap = 16, pair = cw * 2 + gap, top = 80, rowH = cw + 42;
  const width = 32 + pair * 4, height = top + rowH * 2;
  const vector = `data:image/svg+xml;base64,${Buffer.from(buildAsagiSheet({ cellSize: 512 })).toString('base64')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#eee9df"/>
    <text x="24" y="34" font-family="sans-serif" font-size="24" font-weight="700" fill="#203344">アサギ / 8方向SVG・試作01</text>
    <text x="24" y="60" font-family="sans-serif" font-size="16" fill="#60717b">左：承認済みの元画像v2　右：SVGから生成。同じ倍率で輪郭・目・鼻・眼鏡・腰を比較。</text>
    ${LABELS.map((label, i) => {
      const x = 16 + (i % 4) * pair, y = top + Math.floor(i / 4) * rowH;
      // 設定画は描画時の共通倍率(.27)にそろえ、裾基準を121pxへ。方向ごとの拡大はしない。
      const refW = cell * scale * k;
      return `<rect x="${x}" y="${y}" width="${pair - gap}" height="${cw}" rx="10" fill="#dce4df"/>
        <svg x="${x + (cw - refW) / 2}" y="${y + 4}" width="${refW}" height="${refW}" viewBox="${i % 4 * cell} ${Math.floor(i / 4) * cell} ${cell} ${cell}"><image href="${uri(reference)}" width="1774" height="887"/></svg>
        <svg x="${x + cw}" y="${y}" width="${cw}" height="${cw}" viewBox="${i % 4 * 128} ${Math.floor(i / 4) * 128} 128 128"><image href="${vector}" width="512" height="256"/></svg>
        <text x="${x + 10}" y="${y + cw + 25}" font-family="sans-serif" font-size="16" fill="#203344">${label}　元画像 ／ SVG</text>`;
    }).join('')}</svg>`;
}
// 3D比較の左側で使う参照画。元画像全体を共通倍率で縮小し、方向ごとの拡大や変形はしない。
function referenceSheet(reference) {
  const { referenceCell: cell, referenceScale: k, center } = ASAGI_LAYOUT;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256">${LABELS.map((_, i) =>
    `<svg x="${i % 4 * 128}" y="${Math.floor(i / 4) * 128}" width="128" height="128" viewBox="0 0 128 128"><image href="${uri(reference)}" x="${center - cell * k / 2 - i % 4 * cell * k}" y="${4 - Math.floor(i / 4) * cell * k}" width="${1774 * k}" height="${887 * k}"/></svg>`).join('')}</svg>`;
}
function layersBoard({ normalized, layers }) {
  const rows = [['頭：髪・顔・耳・眼鏡', layers.head], ['胴：首・襟・服・ベルト・道具入れ', layers.torso], ['合成（比較用）', normalized]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1072" height="1740"><rect width="100%" height="100%" fill="#eee9df"/>${rows.map(([label, bytes], i) =>
    `<text x="24" y="${35 + i * 578}" font-family="sans-serif" font-size="21" fill="#203344">${label}</text><rect x="24" y="${48 + i * 578}" width="1024" height="512" fill="#dce4df"/><image href="${uri(bytes)}" x="24" y="${48 + i * 578}" width="1024" height="512"/>`).join('')}</svg>`;
}
await exportHumanoid({
  id: 'asagi', name: 'アサギ', role: '大工見習い', build: buildAsagiSheet,
  reference: 'asagi-8dir-v2.png', studioOnly: true, keepDrawnX: true,
  summary: '細い目、面長の輪郭、鼻筋と鼻先、黒縁眼鏡と波打つ髪。浅葱色の作業着と左腰の道具入れ。',
  rigColors: ASAGI_RIG_COLORS, rigTuning: ASAGI_RIG_PROFILE,
  boards: data => ({ 'comparison.png': comparison(data), 'layers.png': layersBoard(data), 'preview.png': buildAsagiSheet({ cellSize: 384 }), 'reference-normalized.png': referenceSheet(data.reference) }),
});
// 拡大して形を確認できる高解像度SVGも、同じ作画原本から書き出す。
await writeFile(new URL('./output/asagi-detail.svg', import.meta.url), buildAsagiSheet({ cellSize: 512 }));
