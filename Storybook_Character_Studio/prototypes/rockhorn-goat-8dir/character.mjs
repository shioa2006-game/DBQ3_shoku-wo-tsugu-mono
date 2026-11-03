import { path, ellipse, line } from '../shared/svg.mjs';
import { monsterSheet } from '../shared/monster-export.mjs';

const palette = { ink: '#44332d', fur: '#8b7263', light: '#ae9481', dark: '#705b50', cream: '#e1c5a4' };
const defs = `<defs>
  <linearGradient id="coat" x2=".35" y2="1"><stop stop-color="var(--light)"/><stop offset=".58" stop-color="var(--fur)"/><stop offset="1" stop-color="var(--dark)"/></linearGradient>
  <g id="horn">
    <!-- Six cross sections turn a wide, broken stone ridge back to a blunt tip. -->
    ${path('M0 2 L1 -11 10 -24 22 -31 34 -29 41 -21 44 -9 41 1 37 8 33 4 33 -4 28 -10 22 -11 16 -8 12 1 7 6Z','#8d7967')}
    ${path('M1 -11 L10 -24 22 -31 34 -29 29 -24 19 -22 11 -15 6 -6Z','#d3bd9e','none')}
    ${path('M6 -6 L11 -15 19 -22 18 -16 12 -8 9 1 4 4Z','#b5a18a','none')}
    ${path('M18 -16 L19 -22 29 -24 34 -29 37 -23 30 -18 27 -13 22 -11 16 -8Z','#ae9681','none')}
    ${path('M30 -18 L37 -23 41 -21 44 -9 40 -12 35 -9 31 -7 27 -13Z','#a08972','none')}
    ${path('M1 -11 L6 -6 4 4 0 2Z M12 1 L16 -8 22 -11 18 -16 12 -8Z M31 -7 L35 -9 40 -12 38 -5 33 0 33 -4Z','#715d50','none')}
    ${line('M10 -24 L11 -15 14 -12 M22 -31 L19 -22 18 -16 M34 -29 L29 -24 30 -18 M44 -9 L40 -12 36 -10 M41 1 L38 0 35 4','#756151',.75)}
  </g>
</defs>`;
const group = (transform, parts) => `<g transform="${transform}">${parts}</g>`;
const paint = (d, color) => path(d, color, 'none');

function horn(x, y, width, height) {
  return `<use href="#horn" transform="translate(${x} ${y}) scale(${width} ${height})"/>`;
}

function leg(x, y, far, hind) {
  const thigh = hind ? 'M-8 -33 Q-13 -22 -5 -14 L-7 -7' : 'M-7 -33 L-5 -15 -6 -7';
  return group(`translate(${x} ${y})`, path(thigh + ' L-8 -3 5 -3 4 -9 7 -19 7 -30Z', far ? '#705b50' : 'url(#coat)')
    + paint('M-6 -13 L-2 -9 0 -12 2 -9 5 -14 4 -7 5 -3 -7 -3Z',far ? '#b19b83' : 'var(--cream)')
    + path('M-6 -5 L-2 -6 2 -5 5 -5 7 -1 6 1 -8 1 -9 0Z','#615349')
    + line('M-1 -5 L-2 1','#352c29',1));
}

function ear(x,y,width,back) {
  return group(`translate(${x} ${y}) scale(${width} 1)`, path('M0 1 Q5 -5 16 -6 Q12 4 2 6Z','var(--fur)')
    + paint('M3 2 Q8 -2 13 -4 Q9 1 4 3Z',back ? '#a98d77' : '#c98d7d'));
}

function eye(x,y,width) {
  return group(`translate(${x} ${y}) scale(${width} 1)`,path('M-5 -4 L5 0 Q5 5 0 5 Q-5 5 -5 -4Z','#e7bd70')
    + ellipse(0,1,1.8,3,'#463024','none') + ellipse(-.7,-.3,.7,.7,'#fff0c9','none')
    + line('M-6 -5 Q0 -2 5 0','#46362d',1.9));
}

// 部品は頭の中心を基準に置く。横顔では奥の目と角は手前の輪郭に隠れる。
function head(view) {
  const side = view === 2, rear = view > 2, front = view === 0 || view === 4;
  const horns = front ? horn(-5,-12,-1,1) + horn(5,-12,1,1)
    : (side ? '' : horn(-8,-13,-.57,.9)) + horn(side ? -8 : 0,-12,1.12,1);
  const ears = (front ? ear(-7,0,-1,rear) : '') + ear(8,-1,1,rear);
  const crown = path(side ? 'M-16 -7 Q-14 -16 0 -17 Q16 -18 18 -3 L14 9 9 7 6 15 -6 13 -19 10 -23 6Z'
    : 'M-16 -7 Q-17 -13 -9 -15 L-12 -19 -4 -16 -1 -20 5 -16 10 -18 9 -15 Q19 -12 16 0 L18 5 13 5 13 10 8 10 5 14 -4 15 -11 11 -15 12 -14 7 -19 6Z','url(#coat)');
  if (rear) return horns + crown + ears;
  if (side) {
    const profile = path('M-7 -4 Q-10 0 -21 4 Q-25 6 -23 10 Q-17 14 -8 14 L0 9Z','var(--cream)')
      + path('M-18 12 L-17 20 -14 17 -13 23 -9 17 -7 12Z','#d8bb98')
      + paint('M-24 6 Q-21 4 -19 5 L-21 8 -24 8Z','#47352d')
      + line('M-22 10 Q-17 13 -12 10','#705344',.85);
    return horns + crown + ears + profile + eye(-11,-2,-.84);
  }
  const muzzleX = view === 1 ? -7 : 0;
  const muzzle = group(`translate(${muzzleX} 7)`,path('M-8 6 L-7 13 -4 12 -2 21 1 17 3 19 7 10 7 5Z','#cfb190')
    + paint('M-5 8 L-3 13 -2 11 0 16 4 10 4 7Z','#ecd4b4')
    + path('M-10 -3 Q-6 -6 0 -4 Q5 -6 10 -3 L8 3 Q5 9 -1 9 Q-8 8 -10 4Z','var(--cream)')
    + path('M-5 -2 Q-1 -3 3 -2 L0 1 -2 2Z','#4c382c','none')
    + line('M-1 2 L-1 4 Q-4 6 -6 4 M-1 4 Q2 6 5 4','#67503f',.75));
  const eyes = view === 1 ? eye(-13,-3,.52)+eye(2,-2,-1) : eye(-9,-3,1)+eye(9,-3,-1);
  return horns + crown + ears + paint('M-5 -14 L-1 -16 4 -14 1 -10 -1 -12 -4 -9Z','#b69a83') + muzzle + eyes;
}

// 胴の位置・幅、頭の位置、奥二脚と手前二脚の接地点。斜め後ろは尻と尾が首に重なる。
const views = [
  { body:[63,80,.76], skull:[63,54], far:[44,82], near:[51,75] },
  { body:[70,80,.96], skull:[48,54], far:[48,88], near:[55,94] },
  { body:[73,80,1.12], skull:[35,55], far:[48,85], near:[53,100] },
  { body:[67,80,1], skull:[49,54], far:[43,79], near:[56,90] },
  { body:[63,80,.82], skull:[63,54], far:[47,80], near:[48,78] },
];
function draw(view,frame) {
  const {body:[x,y,width],skull:[hx,hy],far,near} = views[view];
  const brace = frame === 'b', rear = view >= 3;
  const trunk = group(`translate(${x} ${y+(brace?2:0)}) scale(${width} 1)`,
    path('M-31 -7 Q-29 -24 -12 -22 L-6 -25 -5 -22 0 -24 3 -21 Q29 -23 31 -6 Q34 12 24 20 L20 18 16 21 7 18 Q-4 20 -14 17 L-17 21 -19 17 -24 19 -25 14 Q-34 10 -31 -7Z','url(#coat)')
    + paint('M-29 0 Q-20 13 -13 9 L-14 13 -6 10 -4 14 5 11 Q19 15 29 4 Q27 19 17 18 Q5 16 -4 18 Q-28 18 -29 0Z','#796255')
    + paint('M-21 -13 Q-11 -22 1 -18 L-5 -15 -3 -14 -11 -12 -9 -15Z','#b19a85')
    + paint('M0 -17 Q12 -19 20 -13 L15 -13 18 -10 10 -13 12 -10Z','#a68b76')
    + paint('M20 -6 Q14 -1 14 4 L16 2 Q14 10 18 15 L21 13 20 17 Q26 13 27 8 Q24 18 17 19 L11 14 Q8 2 20 -6Z','#806759'));
  const tailX = view===4 ? x : x+width*24;
  const tail = group(`translate(${tailX} ${y-9}) rotate(${view===4 ? 92 : -14})`,
    path('M-4 0 Q5 0 11 -7 L10 -3 13 -5 Q13 4 4 8 L0 9Z','var(--fur)') + paint('M0 3 L8 -2 6 2 10 0 4 5Z','#b49b83'));
  const bib = group(`translate(${hx} ${hy+13+(brace?4:0)})`,path('M-13 -5 Q-16 2 -13 15 L-10 12 -7 20 -5 16 0 24 4 16 6 19 11 11 12 14 Q17 5 13 -5Z','url(#coat)')
    + paint('M-10 1 L-8 10 -6 7 -2 15 0 11 3 15 9 5 6 7 8 0Z','#bb9e83'));
  const neckAngle = brace && view!==0 && view!==4 ? -15 : 0;
  const skull = group(`translate(${hx} ${hy+(brace?7:0)}) rotate(${neckAngle})`,head(view));
  const legs = far.map((lx,i)=>leg(lx,114,true,i===1)).join('') + near.map((lx,i)=>leg(lx+(brace?(i?2:-2):0),120,false,i===1)).join('');
  if (rear) return legs + skull + trunk + tail;
  return legs + (view ? tail : '') + trunk + bib + skull;
}

export const buildGoatSheet = options => monsterSheet(options, palette, defs, draw);
