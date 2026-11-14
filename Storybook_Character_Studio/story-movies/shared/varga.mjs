// ムービー用の三頭魔竜ヴァルガの部品。Studioの作画コード（prototypes/varuga-8dir/character.mjs）の頭・開口頭・胴の
// 8方向シートから、指定した方向のセル（128px四方）を取り出す。形や色は変えない（色の CSS 変数を原本のパレットの値に
// 置き換えるだけ）。首・翼の色は rig-profile.mjs の値（ゲームの3Dでは首・翼・尾を立体で付けるので、ムービーでは描く）。
// 配色は Studio の試作色（確定配色ではない）。Studioで直したら、使うムービーを生成し直す。
import { DIRECTIONS } from '../../prototypes/shared/sheet-format.mjs';
import { VARUGA_PALETTE, buildVarugaHeadSheet, buildVarugaBodySheet, buildVarugaOpenHeadSheet } from '../../prototypes/varuga-8dir/character.mjs';
import { VARUGA_PROFILE } from '../../prototypes/varuga-8dir/rig-profile.mjs';

const hex = v => `#${v.toString(16).padStart(6, '0')}`;
const resolve = svg => svg.replace(/var\(--([A-Za-z]+)\)/g, (_, name) => {
  if (!Object.hasOwn(VARUGA_PALETTE, name)) throw new Error(`varga: unknown palette color ${name}`);
  return VARUGA_PALETTE[name];
});

// シートの svg（<svg>＋<defs>＋セルごとの <g transform="translate(x y)">）を、先頭の定義とセルに分ける。
// 開口頭のシートは口のセルを後ろに足しているので、同じセルの位置にある組を順につなぐ。
function split(svg) {
  const marks = DIRECTIONS.map((_, i) => `<g transform="translate(${i % 4 * 128} ${Math.floor(i / 4) * 128})">`);
  const at = [];
  marks.forEach((m, i) => { let p = svg.indexOf(m); while (p >= 0) { at.push([p, i, m]); p = svg.indexOf(m, p + 1); } });
  at.sort((a, b) => a[0] - b[0]);
  const end = svg.lastIndexOf('</svg>');
  const cells = DIRECTIONS.map(() => '');
  at.forEach(([p, i, m], k) => {
    const body = svg.slice(p + m.length, k + 1 < at.length ? at[k + 1][0] : end);
    cells[i] += `<g>${body}`;
  });
  return { defs: resolve(svg.slice(svg.indexOf('>') + 1, at[0][0]).trim()), cells: cells.map(resolve) };
}

/** directions: 書き出す方向の名前（DIRECTIONS）。返り値は JSON にできる部品。 */
export function vargaParts(directions = ['front', 'front_left', 'front_right']) {
  const head = split(buildVarugaHeadSheet()), open = split(buildVarugaOpenHeadSheet()), body = split(buildVarugaBodySheet());
  const pick = sheet => Object.fromEntries(directions.map(d => {
    const i = DIRECTIONS.indexOf(d);
    if (i < 0) throw new Error(`unknown direction: ${d}`);
    return [d, sheet.cells[i]];
  }));
  const w = VARUGA_PROFILE.wings;
  return {
    name: VARUGA_PROFILE.name, source: 'prototypes/varuga-8dir/character.mjs', cell: 128, palette: { ...VARUGA_PALETTE },
    defs: { head: head.defs, open: open.defs, body: body.defs },
    head: pick(head), open: pick(open), body: pick(body),
    rig: {
      bodyScale: VARUGA_PROFILE.bodyScale, headScale: VARUGA_PROFILE.headScale, heads: VARUGA_PROFILE.heads,
      neck: hex(VARUGA_PROFILE.neckColor), membrane: hex(w.membraneColor), bone: hex(w.boneColor),
    },
  };
}

export const vargaPartsJson = directions => JSON.stringify(vargaParts(directions), null, 1) + '\n';
