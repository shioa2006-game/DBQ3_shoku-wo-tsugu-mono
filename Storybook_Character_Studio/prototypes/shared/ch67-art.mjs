// 第6〜7章の設定画用。輪郭と衣装は各 character.mjs に置き、小さな描画部品のみ共有する。
import { path, ellipse, line } from './svg.mjs';
export { path, ellipse, line };
export { DIRECTIONS, LABELS } from './sheet-format.mjs';
export { buildSheet, clipped } from './humanoid-kit.mjs';
export const defs = `<defs>
 <clipPath id="ch67-eye-opening"><path d="M-6 0 Q-5 -6.2 0 -6 Q5 -6 6 -.4 Q4.6 5.7 0 5.7 Q-4.5 5.5 -6 0Z"/></clipPath>
 <radialGradient id="skin" cx="38%" cy="25%" r="85%"><stop stop-color="var(--skinLight)"/><stop offset=".7" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient>
 ${['hair','cloth','apron','ivory'].map(id=>`<linearGradient id="${id}" x2=".8" y2="1"><stop stop-color="var(--${id}Light)"/><stop offset=".55" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`).join('')}
</defs>`;
export function eye(x,y,sx=1,sy=1){
 return `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">`
  +path('M-6 0 Q-5 -6.2 0 -6 Q5 -6 6 -.4 Q4.6 5.7 0 5.7 Q-4.5 5.5 -6 0Z','#fff6df','none')
  +'<g clip-path="url(#ch67-eye-opening)">'+ellipse(.5,.1,3.65,5.3,'#403027','none')+ellipse(.7,-.1,1.9,3.5,'#211e1c','none')
  +ellipse(1.5,-2.6,1.2,1.65,'#fffaf0','none')+ellipse(-.7,2.9,.7,.55,'#ac7850','none')
  +'</g>'+line('M-6 0 Q-5 -6.2 0 -6 Q4.8 -6 6 -.4','#3a2b25',1.35)+'</g>';
}
export function ear(x,y,sx=1){return `<g transform="translate(${x} ${y}) scale(${sx} 1)">`
 +path('M0 -6 C-6 -9 -7 5 -1 7 C4 8 5 -2 0 -6Z','url(#skin)','#67452e',.85)
 +line('M-1 -3 Q-4 -4 -3 2 Q0 1 0 4','var(--skinDark)',1.1)+'</g>';}
export const rivet=(x,y)=>ellipse(x,y,2.15,2.55,'#c29b5d','#503c28',.85)+ellipse(x-.4,y-.5,1,1.4,'#e4c385','none');
export function buckle(x,y,w=10){return path(`M${x-w/2} ${y-3.6}h${w}v7.2h-${w}Z`,'#c7a16a','#372b23',1.15)+path(`M${x-w/2+1.8} ${y-1.8}h${w-3.6}v3.6h-${w-3.6}Z`,'#4b3529','none')+line(`M${x} ${y}h${w/2-1}`,'#d6b47d',.9);}
