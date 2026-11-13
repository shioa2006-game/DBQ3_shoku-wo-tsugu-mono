import { writeFile } from 'node:fs/promises';
import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildAsagiSheet, ASAGI_LAYOUT, LABELS } from './character.mjs';
import { buildRokuSheet } from '../roku-8dir/character.mjs';
import { ASAGI_RIG_PROFILE, ASAGI_RIG_COLORS } from './rig-profile.mjs';

const uri = bytes => `data:image/png;base64,${bytes.toString('base64')}`;
// 画像全体の縮小だけではセルの余白へ隣の毛先が入る。先に元セルを切り出す。
// 静止比較・3D比較の両方で、倍率・原点・クリップを同じものにする。
function referenceCell(reference, i, x = 0, y = 0, zoom = 1) {
  const { referenceCell: cell, referenceScale: scale, center, referenceWidth, referenceHeight } = ASAGI_LAYOUT;
  const size = cell * scale;
  return `<svg x="${x + (center - size / 2) * zoom}" y="${y + 4 * zoom}" width="${size * zoom}" height="${size * zoom}" viewBox="${i % 4 * cell} ${Math.floor(i / 4) * cell} ${cell} ${cell}" overflow="hidden"><image href="${uri(reference)}" width="${referenceWidth}" height="${referenceHeight}"/></svg>`;
}
// 設定画のセルを同じ倍率で並べる。顔や髪の外接枠ごとに拡大して差を隠さない。
function comparison({ reference }) {
  const k = 2, cw = 128 * k, gap = 16, pair = cw * 2 + gap, top = 80, rowH = cw + 42;
  const width = 32 + pair * 4, height = top + rowH * 2;
  const vector = `data:image/svg+xml;base64,${Buffer.from(buildAsagiSheet({ cellSize: 512 })).toString('base64')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#eee9df"/>
    <text x="24" y="34" font-family="sans-serif" font-size="24" font-weight="700" fill="#203344">アサギ / 8方向SVG・試作04（左右の耳の後ろへ髪を追加）</text>
    <text x="24" y="60" font-family="sans-serif" font-size="16" fill="#60717b">左：承認済みの元画像v2　右：SVGから生成。同じ倍率で輪郭・目・鼻・眼鏡・腰を比較。</text>
    ${LABELS.map((label, i) => {
      const x = 16 + (i % 4) * pair, y = top + Math.floor(i / 4) * rowH;
      // 設定画は描画時の共通倍率(.27)にそろえ、裾基準を121pxへ。方向ごとの拡大はしない。
      return `<rect x="${x}" y="${y}" width="${pair - gap}" height="${cw}" rx="10" fill="#dce4df"/>
        ${referenceCell(reference, i, x, y, k)}
        <svg x="${x + cw}" y="${y}" width="${cw}" height="${cw}" viewBox="${i % 4 * 128} ${Math.floor(i / 4) * 128} 128 128"><image href="${vector}" width="512" height="256"/></svg>
        <text x="${x + 10}" y="${y + cw + 25}" font-family="sans-serif" font-size="16" fill="#203344">${label}　元画像 ／ SVG</text>`;
    }).join('')}</svg>`;
}
// 3D比較の左側で使う参照画。各セルを共通倍率で縮小し、方向ごとの拡大や変形はしない。
function referenceSheet(reference) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256">${LABELS.map((_, i) =>
    referenceCell(reference, i, i % 4 * 128, Math.floor(i / 4) * 128)).join('')}</svg>`;
}
function profileComparison({ reference }) {
  const vectorUri = svg => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const sheets = [vectorUri(referenceSheet(reference)), vectorUri(buildAsagiSheet({ cellSize: 512 }))];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1104" height="294"><rect width="100%" height="100%" fill="#eee9df"/>
    <text x="24" y="30" font-family="sans-serif" font-size="22" font-weight="700" fill="#203344">耳の後ろの髪 / 左右の同倍率比較</text>
    ${[2, 6].flatMap((cell, direction) => sheets.map((sheet, side) => {
      const x = 16 + (direction * 2 + side) * 272;
      return `<text x="${x + 8}" y="56" font-family="sans-serif" font-size="16" fill="#203344">${LABELS[cell]}：${side ? '修正後SVG' : '元画像v2'}</text>
        <rect x="${x}" y="64" width="256" height="224" rx="8" fill="#dce4df"/>
        <svg x="${x}" y="64" width="256" height="224" viewBox="${cell % 4 * 128 + 16} ${Math.floor(cell / 4) * 128} 96 84"><image href="${sheet}" width="512" height="256"/></svg>`;
    })).join('')}</svg>`;
}
function layersBoard({ normalized, layers }) {
  const rows = [['頭：髪・顔・耳・眼鏡', layers.head], ['胴：首・襟・服・ベルト・道具入れ', layers.torso], ['合成（比較用）', normalized]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1072" height="1740"><rect width="100%" height="100%" fill="#eee9df"/>${rows.map(([label, bytes], i) =>
    `<text x="24" y="${35 + i * 578}" font-family="sans-serif" font-size="21" fill="#203344">${label}</text><rect x="24" y="${48 + i * 578}" width="1024" height="512" fill="#dce4df"/><image href="${uri(bytes)}" x="24" y="${48 + i * 578}" width="1024" height="512"/>`).join('')}</svg>`;
}
function noseStyleComparison() {
  const rows = [['参考：ロク', buildRokuSheet], ['調整後：アサギ', buildAsagiSheet]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="500"><rect width="100%" height="100%" fill="#eee9df"/>
    <text x="24" y="32" font-family="sans-serif" font-size="23" font-weight="700" fill="#203344">鼻の描き方の比較（同倍率）</text>
    ${LABELS.slice(0, 3).map((label, i) => `<text x="${170 + i * 296}" y="65" font-family="sans-serif" font-size="18" fill="#203344">${label}</text>`).join('')}
    ${rows.map(([label, build], row) => {
      const vector = `data:image/svg+xml;base64,${Buffer.from(build({ cellSize: 512 })).toString('base64')}`;
      const y = 80 + row * 208;
      return `<text x="24" y="${y + 95}" font-family="sans-serif" font-size="18" fill="#203344">${label}</text>`
        + [0, 1, 2].map(i => `<rect x="${160 + i * 296}" y="${y}" width="280" height="180" rx="8" fill="#dce4df"/>
          <svg x="${160 + i * 296}" y="${y}" width="280" height="180" viewBox="${i * 128 + 22} 30 84 54"><image href="${vector}" width="512" height="256"/></svg>`).join('');
    }).join('')}</svg>`;
}
await exportHumanoid({
  id: 'asagi', name: 'アサギ', role: '大工見習い', build: buildAsagiSheet,
  reference: 'asagi-8dir-v2.png', studioOnly: true, keepDrawnX: true, version: 4,
  summary: '細い目、面長の輪郭、鼻筋と鼻先、黒縁眼鏡と波打つ髪。浅葱色の作業着と左腰の道具入れ。',
  rigColors: ASAGI_RIG_COLORS, rigTuning: ASAGI_RIG_PROFILE,
  boards: data => ({ 'comparison.png': comparison(data), 'profile-comparison.png': profileComparison(data), 'nose-style-comparison.png': noseStyleComparison(), 'layers.png': layersBoard(data), 'preview.png': buildAsagiSheet({ cellSize: 384 }), 'reference-normalized.png': referenceSheet(data.reference) }),
});
// 拡大して形を確認できる高解像度SVGも、同じ作画原本から書き出す。
await writeFile(new URL('./output/asagi-detail.svg', import.meta.url), buildAsagiSheet({ cellSize: 512 }));
