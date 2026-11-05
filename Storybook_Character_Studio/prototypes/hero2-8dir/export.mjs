import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildHero2Sheet, HERO2_LAYOUT, LABELS } from './character.mjs';
import { HERO2_RIG_PROFILE } from './rig-profile.mjs';

// 主人公シオンの新デザイン案・試作02。本編へは書き出さない（採用はユーザーが判断する）。
// 胴の中心を u=.494 に描いているので、横方向は描いた位置のまま（keepDrawnX）。大きな後ろ髪や背中の本で
// 外接枠の中心がずれても、3Dの腕・脚が胴の下に付く。
const uri = bytes => `data:image/png;base64,${bytes.toString('base64')}`;
const REF_CELL = 1774 / 4;   // 設定画の1セル
const REF_SCALE = .5;        // 比較画像での設定画の倍率
// 生成画像を設定画と同じ大きさで並べる倍率（設定画1px = セルの K px）。
const GEN_SCALE = REF_SCALE / HERO2_LAYOUT.scale;

function comparison({ reference, normalized }) {
  const rs = REF_CELL * REF_SCALE, gs = 128 * GEN_SCALE, pair = rs + gs + 18, top = 92, rowH = rs + 34;
  const width = Math.ceil(24 + pair * 4 + 8), height = Math.ceil(top + rowH * 2 + 10);
  let cells = '';
  for (let i = 0; i < 8; i++) {
    const col = i % 4, row = Math.floor(i / 4), x = 24 + col * pair, y = top + row * rowH;
    cells += `<rect x="${x - 6}" y="${y - 6}" width="${pair - 8}" height="${rs + 30}" rx="10" fill="#dfe6e1"/>`
      + `<svg x="${x}" y="${y}" width="${rs}" height="${rs}" viewBox="${col * REF_CELL} ${row * REF_CELL} ${REF_CELL} ${REF_CELL}"><image href="${uri(reference)}" width="1774" height="887"/></svg>`
      + `<svg x="${x + rs + 4}" y="${y + 6 - 6.5 * GEN_SCALE + 12 * REF_SCALE}" width="${gs}" height="${gs}" viewBox="${col * 128} ${row * 128} 128 128"><image href="${uri(normalized)}" width="512" height="256"/></svg>`
      + `<text x="${x + 4}" y="${y + rs + 18}" font-family="sans-serif" font-size="15" fill="#203344">${LABELS[i]}　左：設定画　右：コード生成（同じ大きさ）</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#eee9df"/>
    <text x="24" y="40" font-family="sans-serif" font-size="24" font-weight="700" fill="#203344">HERO2 / シオン新デザイン案 試作02 / 8方向</text>
    <text x="24" y="68" font-family="sans-serif" font-size="15" fill="#60717b">設定画 references/hero-redesign-8dir-v2.png（${REF_SCALE}倍）と、正規化後の128pxセル（${GEN_SCALE.toFixed(2)}倍）を同じ大きさで比較。生成画像は頭・胴だけで、腕・脚はゲームの3Dリグが描く。</text>
    ${cells}</svg>`;
}

function layersBoard({ normalized, layers }) {
  const s = 1.75, w = 512 * s, h = 256 * s, gap = 54;
  const rows = [['頭（hero2_code_head_layer_8dir.png）髪・顔・耳', layers.head], ['胴（hero2_code_torso_layer_8dir.png）首・襟・肩掛け・服・ベルト・小物入れ・ホルダー・職業の書', layers.torso], ['比較用の合成（hero2_code_body_8dir.png）', normalized]];
  const height = 30 + rows.length * (h + gap);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 48}" height="${height}" viewBox="0 0 ${w + 48} ${height}">
    <defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e9ece6"/><rect width="8" height="8" fill="#d9ddd6"/><rect x="8" y="8" width="8" height="8" fill="#d9ddd6"/></pattern></defs>
    <rect width="${w + 48}" height="${height}" fill="#f4f1ea"/>
    ${rows.map(([label, bytes], i) => `<text x="24" y="${42 + i * (h + gap)}" font-family="sans-serif" font-size="16" fill="#203344">${label}</text>
      <rect x="24" y="${52 + i * (h + gap)}" width="${w}" height="${h}" fill="url(#checker)"/>
      ${[1, 2, 3].map(c => `<line x1="${24 + c * 128 * s}" y1="${52 + i * (h + gap)}" x2="${24 + c * 128 * s}" y2="${52 + i * (h + gap) + h}" stroke="#b8c2bd" stroke-width="1"/>`).join('')}
      <line x1="24" y1="${52 + i * (h + gap) + h / 2}" x2="${24 + w}" y2="${52 + i * (h + gap) + h / 2}" stroke="#b8c2bd" stroke-width="1"/>
      <image href="${uri(bytes)}" x="24" y="${52 + i * (h + gap)}" width="${w}" height="${h}"/>`).join('')}
  </svg>`;
}

await exportHumanoid({
  id: 'hero2', name: '主人公シオン（新デザイン案）', role: 'HERO REDESIGN 02', build: buildHero2Sheet, studioOnly: true,
  reference: 'hero-redesign-8dir-v2.png', keepDrawnX: true,
  summary: '8-direction design sheet: fluffy golden hair, blue eyes, cream capelet, navy tunic, left-hip pouch, the Book of Jobs in a small back holder',
  rigColors: { sleeve: 0x2c3b7e, hand: 0xf3c9a4, pants: 0x3b2a22, boot: 0x8a5428, headBack: 0xe1a432, bodyBack: 0x2c3b7e },
  rigTuning: HERO2_RIG_PROFILE,
  boards: data => ({ 'comparison.png': comparison(data), 'layers.png': layersBoard(data) }),
});
