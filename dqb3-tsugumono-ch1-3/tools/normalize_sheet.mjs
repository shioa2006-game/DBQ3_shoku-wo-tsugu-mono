// 8方向スプライトシート(4列×2行)の框組みを正規化するツール。
//
// 背景: リグ(src/entities/rig.js)は「各セルの中央(u≈0.494)にキャラ絵が
// 縦の基準帯(下端≈0.945)で描かれている」ことを前提に、セルごとに固定窓で
// 頭・胴を切り出す。手描きのシートで絵がセル中央からずれて描かれていると、
// 頭が胴からずれる・帽子が切れる・隣セルにはみ出す等の描画くずれが起きる。
//
// このツールは各セルのキャラ絵(不透明クラスタ)を検出し、
//   - 水平: 絵の中心をセル中央(u=0.494)へ
//   - 垂直: 絵の下端を基準帯下端(v=0.945)へ
// 平行移動(ロスレス)して再配置し、規約どおりのシートを出力する。
// 絵そのもの(色・形・大きさ)は変えないので、原画の再作成は不要。
//
//   node tools/normalize_sheet.mjs <in.png> <out.png>
//
// 検査だけしたい場合は tests/sheets.test.mjs（CIでも自動実行）。

import { readFileSync, writeFileSync } from "node:fs";
import pngjs from "pngjs";

const { PNG } = pngjs;

const ALPHA = 24; // これ未満は背景(透明)扱い
const TARGET_CENTER_U = 0.494; // rig の ART_CENTER と一致
const TARGET_BOTTOM_V = 0.945; // 基準帯下端(=121/128)。他の住民シートと揃える

// 1行(高さ ch)の中で、不透明ピクセルが縦に1つでもある列の連続塊を返す。
export function findClusters(png, row, ch) {
  const { width, data } = png;
  const on = new Array(width).fill(false);
  for (let x = 0; x < width; x += 1) {
    for (let y = row * ch; y < (row + 1) * ch; y += 1) {
      if (data[((y * width) + x) * 4 + 3] > ALPHA) { on[x] = true; break; }
    }
  }
  const clusters = [];
  let start = -1;
  for (let x = 0; x <= width; x += 1) {
    if (x < width && on[x]) { if (start < 0) start = x; }
    else if (start >= 0) { clusters.push([start, x - 1]); start = -1; }
  }
  return clusters;
}

// クラスタ(x0..x1)内の絵のバウンディングボックス(x/yとも)を測る。
function bbox(png, row, ch, x0, x1) {
  const { width, data } = png;
  let bx0 = x1, bx1 = x0, by0 = (row + 1) * ch, by1 = row * ch;
  for (let y = row * ch; y < (row + 1) * ch; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (data[((y * width) + x) * 4 + 3] > ALPHA) {
        if (x < bx0) bx0 = x; if (x > bx1) bx1 = x;
        if (y < by0) by0 = y; if (y > by1) by1 = y;
      }
    }
  }
  return { bx0, bx1, by0, by1 };
}

export function normalize(srcPng) {
  const { width, height } = srcPng;
  const cw = width / 4, ch = height / 2;
  const out = new PNG({ width, height, fill: true }); // 透明で初期化
  const report = [];
  for (let row = 0; row < 2; row += 1) {
    const clusters = findClusters(srcPng, row, ch);
    if (clusters.length !== 4) {
      throw new Error(`row${row}: 絵のクラスタが4つでない(${clusters.length})。手描きの間隔が不規則すぎる可能性`);
    }
    clusters.forEach(([x0, x1], col) => {
      const { bx0, bx1, by0, by1 } = bbox(srcPng, row, ch, x0, x1);
      const targetCenter = Math.round(col * cw + cw * TARGET_CENTER_U);
      const targetBottom = Math.round(row * ch + ch * TARGET_BOTTOM_V);
      const dx = targetCenter - Math.round((bx0 + bx1) / 2);
      const dy = targetBottom - by1;
      // セルの矩形内に収まる範囲だけコピー(はみ出しは捨てる=起こらない想定)。
      const cellX0 = col * cw, cellX1 = (col + 1) * cw - 1;
      const cellY0 = row * ch, cellY1 = (row + 1) * ch - 1;
      for (let y = by0; y <= by1; y += 1) {
        for (let x = bx0; x <= bx1; x += 1) {
          const si = ((y * width) + x) * 4;
          if (srcPng.data[si + 3] <= ALPHA) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < cellX0 || nx > cellX1 || ny < cellY0 || ny > cellY1) continue;
          const di = ((ny * width) + nx) * 4;
          out.data[di] = srcPng.data[si];
          out.data[di + 1] = srcPng.data[si + 1];
          out.data[di + 2] = srcPng.data[si + 2];
          out.data[di + 3] = srcPng.data[si + 3];
        }
      }
      report.push({ row, col, dx, dy, before: ((bx0 + bx1) / 2 / cw - col).toFixed(3), after: (targetCenter / cw - col).toFixed(3) });
    });
  }
  return { out, report };
}

// CLI
const [, , inFile, outFile] = process.argv;
if (inFile && outFile) {
  const src = PNG.sync.read(readFileSync(inFile));
  const { out, report } = normalize(src);
  writeFileSync(outFile, PNG.sync.write(out));
  console.log(`normalized ${inFile} -> ${outFile}`);
  for (const r of report) {
    console.log(`  cell(row${r.row},col${r.col}) 移動 dx=${r.dx} dy=${r.dy}  中心u ${r.before}→${r.after}`);
  }
}
