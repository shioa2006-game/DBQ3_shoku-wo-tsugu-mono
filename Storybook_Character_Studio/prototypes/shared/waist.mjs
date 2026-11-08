// 腰まで描く胴の共通部品（2026-11-08。ミナ試作06の直し方を、ほかの人型にも使えるようにしたもの）。
// ・ベルトを腰の位置（セルの100px付近。主人公と同じ高さ）に置き、その下に上着の裾を描く。
// ・胴の下端（裾）・幅・首はそのままなので、ゲームのリグ設定と脚の付け根は変わらない。
// ・腕は3Dで付くので胴に腕の線を描かず、脇は輪郭の内側の陰影で丸みを出す。
import { path } from './svg.mjs';

export const WAIST_BELT = 100;

// 胴の外形：肩（各人物の今の肩の形）→ ベルトで少し絞った腰 → 少し広がる裾。裾のいちばん下は今までどおり。
// inset・crown・bulge は肩の形（今の外形の値）、pinch はベルトでの絞り、flare は裾の広がり、hem は裾の丸み（いちばん下の
// 高さが変わると正規化で絵全体が上下するので、今のいちばん下と同じ高さになる値にする）。
export function waistOutline(l, r, { top = 78, crown = top - 6, inset = 5, bulge = 2, belt = WAIST_BELT, pinch = 1.5, flare = 1, hem = 123 } = {}) {
  const chest = top + 14;
  return `M${l + inset} ${top} Q63 ${crown} ${r - inset} ${top} Q${r + bulge} ${top + 6} ${r} ${chest} Q${r - pinch / 2} ${belt - 3} ${r - pinch} ${belt}`
    + ` L${r - pinch} ${belt + 6} Q${r + flare - 1} ${belt + 11} ${r + flare} 118 Q63 ${hem} ${l - flare} 118 Q${l - flare + 1} ${belt + 11} ${l + pinch} ${belt + 6}`
    + ` L${l + pinch} ${belt} Q${l + pinch / 2} ${belt - 3} ${l} ${chest} Q${l - bulge} ${top + 6} ${l + inset} ${top}Z`;
}

// 脇の陰影（斜めの向きは奥の側を濃く）と、ベルトの下の影。外形 d の内側に切り抜く。
// skirt=false は帯・袴などで腰が描けている人物（ベルトの下の影を付けない）。
export function waistShade(id, d, l, r, view, { color, belt = WAIST_BELT, skirt = true, opacity = .4 } = {}) {
  const [near, far] = [[7, 7], [4, 10], [3, 9], [4, 10], [7, 7]][view];
  return `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">`
    + path(`M${l - 3} 76 Q${l + near} 88 ${l + near - 1} ${belt} L${l + near - 2} 124 L${l - 3} 124Z`, color, 'none', 0, `opacity="${opacity}"`)
    + path(`M${r + 3} 76 Q${r - far} 88 ${r - far + 1} ${belt} L${r - far + 2} 124 L${r + 3} 124Z`, color, 'none', 0, `opacity="${opacity}"`)
    + (skirt ? path(`M${l} ${belt + 6} Q63 ${belt + 9} ${r} ${belt + 6} L${r} ${belt + 9} Q63 ${belt + 12} ${l} ${belt + 9}Z`, color, 'none', 0, 'opacity=".25"') : '')
    + '</g>';
}

// ベルトの帯（腰に回るので、胸像の下端だったときより反りを浅く）。高さ6、反り3。
export const waistBeltBand = (l, r, belt = WAIST_BELT) => `M${l} ${belt} Q63 ${belt + 3} ${r} ${belt} L${r} ${belt + 6} Q63 ${belt + 9} ${l} ${belt + 6}Z`;
// ベルトの上下の縫い目。
export const waistBeltStitch = (l, r, belt = WAIST_BELT) => `M${l + 1} ${belt + 1.6} Q63 ${belt + 4.6} ${r - 1} ${belt + 1.6} M${l + 1} ${belt + 4.6} Q63 ${belt + 7.6} ${r - 1} ${belt + 4.6}`;
