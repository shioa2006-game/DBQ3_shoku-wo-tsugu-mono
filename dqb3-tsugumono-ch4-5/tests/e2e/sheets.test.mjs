// 8方向スプライトシートの框組み検査（ブラウザ不要・高速）。
// リグは「各セル中央(u≈0.494)にキャラ絵が描かれている」前提で固定窓を切り出す
// ため、絵がセル中央からずれた・境界をはみ出したシートを入れると描画がくずれる
// （イナホの頭ずれ事例）。将来 Codex や新キャラで規約外シートが入っても、この
// テストが PR の時点で赤くして気づけるようにする。崩れたら tools/normalize_sheet.mjs。
//
// 対象は各キャラが実際に読み込む `*_body_8dir.png`（原画 `*.src.png` は除外）。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngjs from "pngjs";

const { PNG } = pngjs;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ALPHA = 24;
const EDGE_MARGIN = 0.02; // 絵がセル左右端(この余白)に触れていたら「はみ出し」
// 中心ズレの扱いは置き場所で分ける:
// - assets/humanoids/ … normalize_sheet.mjs の出力を置く規約のディレクトリなので、
//   中心ズレ＝正規化し忘れ(生画像の直置き)として **FAIL**。既存の健全なシートは
//   全セル 0.488〜0.508 に収まる。ワタリの生画像は 0.344〜0.559 と方向ごとに
//   ドリフトしており、警告どまりだったため CI を素通りして描画が崩れた（再発防止）。
// - assets/ 直下(主人公) … 中心 0.33〜0.61 でもセル内に収まり描画は崩れない実績が
//   あるため、従来どおり警告のみ。
const CENTER_MIN = 0.44;
const CENTER_MAX = 0.56;
const STRICT_CENTER_MIN = 0.46;
const STRICT_CENTER_MAX = 0.53;

let failures = 0;
let warnings = 0;
function expect(cond, msg) {
  if (cond) { console.log(`  ok - ${msg}`); }
  else { console.log(`  NG - ${msg}`); failures += 1; }
}
function warn(cond, msg) {
  if (!cond) { console.log(`  warn - ${msg}`); warnings += 1; }
}

// セル境界を整数で厳密に区切る(高解像度シートはセル幅が非整数になり得る)。
function cellArt(png, col, row) {
  const { width: W, height: H, data } = png;
  const ox0 = Math.round((col * W) / 4), ox1 = Math.round(((col + 1) * W) / 4) - 1;
  const oy0 = Math.round((row * H) / 2), oy1 = Math.round(((row + 1) * H) / 2) - 1;
  const cw = ox1 - ox0 + 1, chp = oy1 - oy0 + 1;
  let x0 = ox1, x1 = ox0, y0 = oy1, y1 = oy0, cnt = 0;
  for (let y = oy0; y <= oy1; y += 1) {
    for (let x = ox0; x <= ox1; x += 1) {
      if (data[((y * W) + x) * 4 + 3] > ALPHA) {
        cnt += 1;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (cnt === 0) return null;
  return { u0: (x0 - ox0) / cw, u1: (x1 - ox0 + 1) / cw, center: ((x0 + x1) / 2 - ox0) / cw, v0: (y0 - oy0) / chp, v1: (y1 - oy0 + 1) / chp };
}

const DIRS = ["front", "front_left", "left", "back_left", "back", "back_right", "right", "front_right"];

function checkSheet(file, strictCenter) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const name = path.basename(file);
  for (let i = 0; i < 8; i += 1) {
    const art = cellArt(png, i % 4, (i / 4) | 0);
    const tag = `${name} ${DIRS[i]}`;
    if (!art) { expect(false, `${tag}: セルに絵がある`); continue; }
    // ハード要件: 絵がセル境界をはみ出さない(はみ出すと固定窓が誤ピクセルを拾い描画が崩れる)。
    expect(art.u0 >= EDGE_MARGIN && art.u1 <= 1 - EDGE_MARGIN, `${tag}: 絵がセル境界をはみ出さない (u[${art.u0.toFixed(2)},${art.u1.toFixed(2)}])`);
    expect(art.v0 >= 0 && art.v1 <= 0.99, `${tag}: 縦がセル内に収まる (v[${art.v0.toFixed(2)},${art.v1.toFixed(2)}])`);
    if (strictCenter) {
      // humanoids/ は正規化済みが規約: 中心ズレ＝正規化し忘れなので FAIL。
      expect(
        art.center >= STRICT_CENTER_MIN && art.center <= STRICT_CENTER_MAX,
        `${tag}: 中心がセル中央にある=正規化済み (u=${art.center.toFixed(3)}) — 原画を art_src/ に置き tools/normalize_sheet.mjs で生成する`,
      );
    } else {
      // 品質警告: 中心がセル中央から外れている(崩れはしないが framing がずれる)。
      warn(art.center >= CENTER_MIN && art.center <= CENTER_MAX, `${tag}: 絵の中心がセル中央から外れている (u=${art.center.toFixed(3)}) — 気になれば tools/normalize_sheet.mjs`);
    }
  }
}

const dirs = [
  { dir: path.join(ROOT, "assets"), strict: false },
  { dir: path.join(ROOT, "assets", "humanoids"), strict: true },
];
const files = [];
for (const { dir, strict } of dirs) {
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith("_body_8dir.png") && !f.endsWith(".src.png")) files.push({ file: path.join(dir, f), strict });
  }
}
files.sort((a, b) => a.file.localeCompare(b.file));
console.log(`sheets: ${files.length} 枚を検査（humanoids/ は中心ズレもFAIL）`);
for (const { file, strict } of files) checkSheet(file, strict);

if (failures === 0) console.log(`sheets.test: PASS${warnings ? ` (中心ズレ警告 ${warnings} 件)` : ""}`);
else { console.log(`sheets.test: FAIL (${failures} 件)`); process.exit(1); }
