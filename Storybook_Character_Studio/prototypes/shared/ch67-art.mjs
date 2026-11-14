// 第6〜7章の設定画用。輪郭と衣装は各 character.mjs に置き、小さな描画部品のみ共有する。
import { path, ellipse, line } from './svg.mjs';
import { EYE_OPENINGS, eye as establishedEye } from './face-parts.mjs';
export { path, ellipse, line };
export { DIRECTIONS, LABELS } from './sheet-format.mjs';
export { buildSheet, clipped } from './humanoid-kit.mjs';
export const defs = `<defs>
 ${Object.entries(EYE_OPENINGS).map(([view,d])=>`<clipPath id="eye-${view}"><path d="${d}"/></clipPath>`).join('')}
 <linearGradient id="iris" x2="0" y2="1"><stop stop-color="#6e5540"/><stop offset=".5" stop-color="#3d2d22"/><stop offset="1" stop-color="#201a15"/></linearGradient>
 <radialGradient id="skin" cx="38%" cy="25%" r="85%"><stop stop-color="var(--skinLight)"/><stop offset=".7" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient>
 ${['hair','cloth','apron','ivory'].map(id=>`<linearGradient id="${id}" x2=".8" y2="1"><stop stop-color="var(--${id}Light)"/><stop offset=".55" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`).join('')}
</defs>`;
// ロク・カヤと同じまぶた、縦長の虹彩・瞳孔、小さい反射光を使う。
// 左右の鼻側を指定し、正面で両目が同じ斜め方向へ寄らないようにする。
export function eye(x,y,{squash=1,...options}={}){
 return `<g transform="translate(0 ${y}) scale(1 ${squash}) translate(0 ${-y})">`
  +establishedEye(x,y,{irisStroke:'#3c2c20',pupil:'#211b16',glint:'#a58a62',...options})+'</g>';
}
export function ear(x,y,sx=1){return `<g transform="translate(${x} ${y}) scale(${sx} 1)">`
 +path('M0 -6 C-6 -9 -7 5 -1 7 C4 8 5 -2 0 -6Z','url(#skin)','#67452e',.85)
 +line('M-1 -3 Q-4 -4 -3 2 Q0 1 0 4','var(--skinDark)',1.1)+'</g>';}
export const rivet=(x,y)=>ellipse(x,y,2.15,2.55,'#c29b5d','#503c28',.85)+ellipse(x-.4,y-.5,1,1.4,'#e4c385','none');
export function buckle(x,y,w=10){return path(`M${x-w/2} ${y-3.6}h${w}v7.2h-${w}Z`,'#c7a16a','#372b23',1.15)+path(`M${x-w/2+1.8} ${y-1.8}h${w-3.6}v3.6h-${w-3.6}Z`,'#4b3529','none')+line(`M${x} ${y}h${w/2-1}`,'#d6b47d',.9);}
