// 正式デザインの主人公シオン（Studioの hero2）から、ムービー用に頭・胴のSVG部品を取り出す。
//
// 作画の原本は prototypes/hero2-8dir/character.mjs（ゲームの8方向シートと同じコード）。ここでは
// その原本を読み込むだけで、形や色は変えない。設定画のセル座標（443.5px四方）のまま、8方向それぞれの
// 頭（髪・顔・耳）と胴（首・襟・服・ベスト・ベルト・小物入れ・ホルダー・職業の書）を書き出す。
// 右向きの3方向は、ゲームと同じく左向きを胴の中心で反転した形にしてある。
// 色は CSS 変数（var(--hair) など）を原本のパレットの値に置き換える。ムービー側（src/shion.py）が
// 夜・夜明けの色調へ変換し、手足と表情を加えて場面に置く。
import { hero2Local, HERO2_LAYOUT } from '../../../prototypes/hero2-8dir/character.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

export const SOURCE = 'prototypes/hero2-8dir/character.mjs';

function resolveColors(svg, palette) {
  return svg.replace(/var\(--([A-Za-z]+)\)/g, (_, name) => {
    if (!Object.hasOwn(palette, name)) throw new Error(`Unknown palette color: ${name}`);
    return palette[name];
  });
}

export function shionParts() {
  const { palette, defs, tunicCenter } = HERO2_LAYOUT;
  const views = {};
  DIRECTIONS.forEach((direction, index) => {
    const mirror = index > 4, view = mirror ? 8 - index : index, center = tunicCenter[view];
    const part = name => {
      const svg = resolveColors(hero2Local(view, { mirror, part: name }), palette);
      // 右向きは胴の中心（center）で左右反転する（ゲームのシートと同じ向き）。
      return mirror ? `<g transform="translate(${center * 2} 0) scale(-1 1)">${svg}</g>` : svg;
    };
    views[direction] = { view, mirror, center, head: part('head'), torso: part('torso') };
  });
  return { source: SOURCE, cell: 443.5, palette: { ...palette }, defs: resolveColors(defs, palette), views };
}

export const shionPartsJson = () => JSON.stringify(shionParts(), null, 1) + '\n';
