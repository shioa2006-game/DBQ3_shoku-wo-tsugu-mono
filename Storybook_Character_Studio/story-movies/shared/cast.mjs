// ムービー用の人物部品。Studioの作画コード（prototypes/<id>-8dir/character.mjs）から、ゲームの8方向シートと同じ
// 128px四方のセル座標で、方向ごとの頭（髪・顔）と胴（首・服・小物）のSVGを取り出す。形や色は変えない
// （色の CSS 変数 var(--hair) などを原本のパレットの値に置き換えるだけ）。
//
// あわせて、ムービー側（shared/figures.py）が手足を付けるための情報を添える。
//   - limbs: 手足の色。ゲームの3Dリグの色（第1～3章の src/entities/player.js・villagers.js、第4～5章の住民は
//     第4～5章の src/entities/villagers.js と同じ値。第6～7章の住民はゲームがまだないので、Studioの rig-profile.mjs の値）。
//   - anchors: 胴・頭の画像（output/*_torso_layer_8dir.png・*_head_layer_8dir.png）から測った位置
//     （胴の上端・肩の高さと左右・裾の高さと左右、頭の上下左右）。作画を変えて画像を書き出し直すと、ここも変わる。
// 全員が同じセル座標なので、ゲームと同じ背丈・頭の大きさの比で並べられる。
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as hero2 from '../../prototypes/hero2-8dir/character.mjs';
import * as mina from '../../prototypes/mina-8dir/character.mjs';
import * as pino from '../../prototypes/pino-8dir/character.mjs';
import * as inaho from '../../prototypes/inaho-8dir/character.mjs';
import * as gonta from '../../prototypes/gonta-8dir/character.mjs';
import * as jinbei from '../../prototypes/jinbei-8dir/character.mjs';
import * as watari from '../../prototypes/watari-8dir/character.mjs';
import * as belk from '../../prototypes/belk-8dir/character.mjs';
import * as roku from '../../prototypes/roku-8dir/character.mjs';
import * as kaya from '../../prototypes/kaya-8dir/character.mjs';
import * as nagi from '../../prototypes/nagi-8dir/character.mjs';
import * as yomogi from '../../prototypes/yomogi-8dir/character.mjs';
import * as sumi from '../../prototypes/sumi-8dir/character.mjs';
import * as teru from '../../prototypes/teru-8dir/character.mjs';
import * as suzuha from '../../prototypes/suzuha-8dir/character.mjs';
import * as asagi from '../../prototypes/asagi-8dir/character.mjs';
import * as ganzou from '../../prototypes/ganzou-8dir/character.mjs';
import { DIRECTIONS } from '../../prototypes/shared/sheet-format.mjs';

export const CELL = 128;

// name: 表示名 / markup・sheet: 作画コードの関数 / limbs: ゲームの3Dリグの手足の色
export const CAST = Object.freeze({
  hero2: { name: 'シオン', module: hero2, markup: hero2.hero2Markup, sheet: hero2.buildHero2Sheet,
    limbs: { sleeve: '#293d75', hand: '#f3c9a4', pants: '#3b2a22', boot: '#8a5428' } },
  mina: { name: 'ミナ', module: mina, markup: mina.minaMarkup, sheet: mina.buildMinaSheet,
    limbs: { sleeve: '#2f6f6d', hand: '#eec39a', pants: '#8a5a33', boot: '#5a3a24' } },
  pino: { name: 'ピノ', module: pino, markup: pino.pinoMarkup, sheet: pino.buildPinoSheet,
    limbs: { sleeve: '#9c3b22', hand: '#e6b285', pants: '#6b5233', boot: '#40301d' } },
  inaho: { name: 'イナホ', module: inaho, markup: inaho.inahoMarkup, sheet: inaho.buildInahoSheet,
    limbs: { sleeve: '#f2e6d0', hand: '#eec39a', pants: '#8a4a2a', boot: '#5a3a24' } },
  gonta: { name: 'ゴンタ', module: gonta, markup: gonta.gontaMarkup, sheet: gonta.buildGontaSheet,
    limbs: { sleeve: '#55703c', hand: '#d9a878', pants: '#6b5233', boot: '#4a3320' } },
  jinbei: { name: 'ジンベエ', module: jinbei, markup: jinbei.jinbeiMarkup, sheet: jinbei.buildJinbeiSheet,
    limbs: { sleeve: '#4a6440', hand: '#cfa070', pants: '#57503f', boot: '#3a2f26' } },
  watari: { name: 'ワタリ', module: watari, markup: watari.watariMarkup, sheet: watari.buildWatariSheet,
    limbs: { sleeve: '#24506b', hand: '#caa079', pants: '#2f2a24', boot: '#38302a' } },
  // 第4～5章の住民（手足の色は第4～5章の villagers.js）
  belk: { name: 'ベルク', module: belk, markup: belk.belkMarkup, sheet: belk.buildBelkSheet,
    limbs: { sleeve: '#6b3a26', hand: '#c98f66', pants: '#4a4440', boot: '#2e2a26' } },
  roku: { name: 'ロク', module: roku, markup: roku.rokuMarkup, sheet: roku.buildRokuSheet,
    limbs: { sleeve: '#5c5a52', hand: '#d0a074', pants: '#4f4436', boot: '#332b20' } },
  kaya: { name: 'カヤ', module: kaya, markup: kaya.kayaMarkup, sheet: kaya.buildKayaSheet,
    limbs: { sleeve: '#4d6d98', hand: '#eec39a', pants: '#6b5233', boot: '#4a3320' } },
  nagi: { name: 'ナギ', module: nagi, markup: nagi.nagiMarkup, sheet: nagi.buildNagiSheet,
    limbs: { sleeve: '#f2ecdc', hand: '#eec39a', pants: '#a03024', boot: '#3a2f26' } },
  yomogi: { name: 'ヨモギ', module: yomogi, markup: yomogi.yomogiMarkup, sheet: yomogi.buildYomogiSheet,
    limbs: { sleeve: '#6a7a4a', hand: '#d8b08a', pants: '#57503f', boot: '#3a2f26' } },
  sumi: { name: 'スミ', module: sumi, markup: sumi.sumiMarkup, sheet: sumi.buildSumiSheet,
    limbs: { sleeve: '#4b5c6e', hand: '#d8b08a', pants: '#57503f', boot: '#3a2f26' } },
  teru: { name: 'テル', module: teru, markup: teru.teruMarkup, sheet: teru.buildTeruSheet,
    limbs: { sleeve: '#6b6b3a', hand: '#eec39a', pants: '#4f4436', boot: '#332b20' } },
  // 第6～7章の住民（手足の色は各人の rig-profile.mjs）
  suzuha: { name: 'スズハ', module: suzuha, markup: suzuha.suzuhaMarkup, sheet: suzuha.buildSuzuhaSheet,
    limbs: { sleeve: '#8e656c', hand: '#f5c796', pants: '#514b42', boot: '#624633' } },
  asagi: { name: 'アサギ', module: asagi, markup: asagi.asagiMarkup, sheet: asagi.buildAsagiSheet,
    limbs: { sleeve: '#536d70', hand: '#f4c99d', pants: '#4c4337', boot: '#614733' } },
  ganzou: { name: 'ガンゾウ', module: ganzou, markup: ganzou.ganzouMarkup, sheet: ganzou.buildGanzouSheet,
    limbs: { sleeve: '#50504f', hand: '#efb16c', pants: '#514b42', boot: '#624633' } },
});

// 原本のパレット。DEFAULT_PALETTE を書き出していない作画コード（スズハ・ガンゾウ）は、シートの svg の style
// （--ink:#…;--skin:#… の並び）から読む。値は同じ。
function paletteOf(id) {
  const c = CAST[id];
  if (c.module.DEFAULT_PALETTE) return c.module.DEFAULT_PALETTE;
  const style = c.sheet({ part: 'combined' }).match(/^<svg[^>]*\sstyle="([^"]+)"/)?.[1];
  if (!style) throw new Error(`${id}: no palette`);
  return Object.fromEntries([...style.matchAll(/--([A-Za-z]+):\s*(#[0-9a-fA-F]{3,8})/g)].map(m => [m[1], m[2]]));
}

function resolveColors(svg, palette, id) {
  return svg.replace(/var\(--([A-Za-z]+)\)/g, (_, name) => {
    if (!Object.hasOwn(palette, name)) throw new Error(`${id}: unknown palette color ${name}`);
    return palette[name];
  });
}

// シートの書き出し（<svg …>＋定義＋8つのセル）から、先頭の定義（グラデーション・目の切り抜きなど）だけを取り出す。
function sheetDefs(id) {
  const svg = CAST[id].sheet({ part: 'combined' });
  const start = svg.indexOf('>') + 1, end = svg.indexOf('<g transform="translate(0 0)">');
  if (start <= 0 || end < start) throw new Error(`${id}: unexpected sheet layout`);
  return svg.slice(start, end).trim();
}

// ---- PNG（8bit RGBA・インターレースなし）の不透明な範囲を測る ----
function decodePng(file) {
  const buf = readFileSync(file);
  let pos = 8, width = 0, height = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error(`${file}: only 8-bit RGBA non-interlaced PNG`);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), stride = width * 4, out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? out[y * stride + x - 4] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= 4 && y ? out[(y - 1) * stride + x - 4] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  return { width, height, alpha: (x, y) => out[(y * width + x) * 4 + 3] };
}

// セル（index）の行ごとの不透明な左右端
function rows(png, index) {
  const scale = png.width / (CELL * 4);
  if (scale !== 1) throw new Error(`layer sheets are expected at ${CELL}px cells`);
  const ox = (index % 4) * CELL, oy = Math.floor(index / 4) * CELL, out = [];
  for (let y = 0; y < CELL; y++) {
    let left = -1, right = -1;
    for (let x = 0; x < CELL; x++) if (png.alpha(ox + x, oy + y) >= 96) { if (left < 0) left = x; right = x; }
    if (left >= 0) out.push({ y, left, right, width: right - left + 1 });
  }
  return out;
}

function measure(id) {
  const dir = fileURLToPath(new URL(`../../prototypes/${id}-8dir/output/`, import.meta.url));
  const torso = decodePng(`${dir}${id}_code_torso_layer_8dir.png`), head = decodePng(`${dir}${id}_code_head_layer_8dir.png`);
  const anchors = {};
  DIRECTIONS.forEach((direction, index) => {
    const t = rows(torso, index), h = rows(head, index);
    const maxWidth = Math.max(...t.map(r => r.width));
    // 肩：上（首）から見て、胴の幅が最大幅の8割に届く高さ。左右は少し下の行の端。
    const shoulderRow = t.find(r => r.width >= maxWidth * .8);
    const at = y => t.reduce((best, r) => Math.abs(r.y - y) < Math.abs(best.y - y) ? r : best, t[0]);
    const s = at(shoulderRow.y + 3), hem = t[t.length - 1], hemRow = at(hem.y - 2);
    anchors[direction] = {
      top: t[0].y, bottom: hem.y,
      shoulder: { y: s.y, left: s.left, right: s.right },
      hem: { y: hem.y, left: hemRow.left, right: hemRow.right },
      head: { top: h[0].y, bottom: h[h.length - 1].y, left: Math.min(...h.map(r => r.left)), right: Math.max(...h.map(r => r.right)) },
    };
  });
  return anchors;
}

/**
 * request: { 人物id: [方向, …] }。返り値は JSON にできる部品（方向は DIRECTIONS の名前）。
 * 各方向の head・torso は128pxのセル座標のSVG（右向きは作画コードどおり反転済み）。
 */
export function castParts(request) {
  const out = { cell: CELL, source: 'prototypes/<id>-8dir/character.mjs', characters: {} };
  for (const [id, directions] of Object.entries(request)) {
    const c = CAST[id];
    if (!c) throw new Error(`unknown character: ${id}`);
    const palette = paletteOf(id), anchors = measure(id), views = {};
    for (const direction of directions) {
      if (!DIRECTIONS.includes(direction)) throw new Error(`unknown direction: ${direction}`);
      views[direction] = {
        head: resolveColors(c.markup(direction, 'head'), palette, id),
        torso: resolveColors(c.markup(direction, 'torso'), palette, id),
        anchors: anchors[direction],
      };
    }
    out.characters[id] = {
      name: c.name, source: `prototypes/${id}-8dir/character.mjs`, ink: palette.ink, palette: { ...palette },
      limbs: { ...c.limbs }, defs: resolveColors(sheetDefs(id), palette, id), views,
    };
  }
  return out;
}

export const castPartsJson = request => JSON.stringify(castParts(request), null, 1) + '\n';
