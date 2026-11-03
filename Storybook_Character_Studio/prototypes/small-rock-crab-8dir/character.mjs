import { path, ellipse, line } from '../shared/svg.mjs';
import { monsterSheet } from '../shared/monster-export.mjs';

const palette = { ink:'#47382e', rust:'#aa543a', clawLight:'#c67c54', clawShade:'#803f31' };
const face = (d,color) => path(d,color,'none');
const defs = `<defs>
  <linearGradient id="pincer" x2=".4" y2="1"><stop stop-color="var(--clawLight)"/><stop offset=".49" stop-color="var(--rust)"/><stop offset="1" stop-color="var(--clawShade)"/></linearGradient>
  <g id="pincer-shape">
    ${path('M-9 -4 Q-10 -14 1 -18 Q13 -22 23 -8 Q15 -12 10 -9 L3 -3 Q9 6 22 3 Q16 14 4 14 Q-6 14 -10 7Z','url(#pincer)')}
    ${face('M-7 -8 Q-1 -18 6 -16 L15 -12 Q9 -14 4 -11 L-1 -7Z','#d9946b')}
    ${face('M-7 6 L-2 8 4 4 Q11 10 17 7 Q12 14 2 12 L-5 10Z','#92482f')}
    ${line('M-7 -3 Q-6 2 -2 4','#935039',.75)}
  </g>
  <g id="front-pincer">
    ${path('M-4 6 Q-11 3 -10 -8 Q-10 -16 -5 -27 L0 -36 Q1 -29 -1 -22 L-3 -14 Q-3 -10 0 -10 Q4 -11 8 -17 L15 -25 Q14 -17 11 -10 Q8 0 3 5 Q0 8 -4 6Z','url(#pincer)')}
    ${face('M-8 -8 Q-8 -17 -1 -29 L-5 -14 -4 -9 -6 -4Z','#d9946b')}
    ${face('M-7 1 Q0 3 5 -4 L11 -16 Q10 -5 4 3 Q-1 9 -7 1Z','#92482f')}
    ${line('M-2 -10 Q-1 -7 3 -8','#85422e',1)}
  </g></defs>`;

// x は左右、z は前方、h は高さ。同じ岩の稜線を回転してひびの位置を保つ。
const rim = [[-40,19,15],[-25,18,31],[8,17,35],[34,19,23],[44,20,-2],
  [32,19,-22],[5,21,-31],[-25,20,-26],[-42,19,-7]];
const ridge = [[-29,39,7],[-18,43,16],[2,47,16],[21,38,10],[28,35,-2],
  [21,41,-14],[3,48,-19],[-15,43,-17],[-31,33,-4]];
const summit = [-3,54,-2];
const stone = ['#a09888','#969388','#a7a59a','#85877f','#96968c','#888a83','#a5a293','#aaa697','#b4ac99'];
const cap = ['#c4bdaa','#ccc4af','#bcb9ab','#aaa99d','#b5b2a5','#a7a699','#c0bcac','#c7bfac','#c9c0aa'];

function camera(view) {
  const angle = view * Math.PI / 4, c = Math.cos(angle), s = Math.sin(angle);
  const depth = ([x,h,z]) => s*x + c*z;
  const project = ([x,h,z]) => [63+c*x-s*z, 103-.96*h+.31*(s*x+c*z)];
  return { project, depth, c, s };
}
function shell({project,depth}, lift) {
  const facets = [];
  function polygon(vertices, color, fissure='') {
    const points = vertices.map(project);
    const [a,b,c] = points;
    if ((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]) >= 0) return;
    const d = 'M'+points.map(p=>p.join(' ')).join(' L')+'Z';
    facets.push({ depth:vertices.reduce((sum,p)=>sum+depth(p),0)/vertices.length,
      svg:path(d,color,color,.55) + fissure });
  }
  // ひびは石の面を横断する。三角形内の比率で指定して、角度を変えても同じ場所につなぐ。
  function crack(vertices, weights) {
    const points = weights.map(([u,v]) => project(vertices[0].map((a,i) =>
      a*(1-u-v)+vertices[1][i]*u+vertices[2][i]*v)));
    return path('M'+points.map(p=>p.join(' ')).join(' L')+'Z','#554d42','none');
  }
  for (let i=0;i<rim.length;i++) {
    const j=(i+1)%rim.length;
    const bottom = ([x,h,z])=>[x*.94,h-4,z*.94];
    polygon([ridge[i],ridge[j],summit],cap[i]);
    const lower=[rim[i],rim[j],ridge[j]], upper=[ridge[j],ridge[i],rim[i]];
    const split = [0,1,2,4,5,7].includes(i);
    polygon(lower,stone[i],split ? crack(lower,[[0,.42],[.20,.43],[.30,.35],[.59,.41],[.62,.38],[.31,.27],[.20,.35],[0,.35]]) : '');
    polygon(upper,stone[i],split ? crack(upper,[[.41,.59],[.24,.55],[.16,.61],[0,.58],[0,.65],[.16,.68],[.25,.62],[.38,.62]]) : '');
    polygon([bottom(rim[i]),bottom(rim[j]),rim[j],rim[i]],'#665f55');
  }
  const svg = facets.sort((a,b)=>a.depth-b.depth).map(f=>f.svg).join('');
  return `<g transform="translate(0 ${-lift})">${svg}</g>`;
}

function leg(camera,side,index,brace) {
  const z = 18-12*index;
  const reach = [55,59,57,50][index];
  const root = camera.project([side*29,15,z]);
  const knee = camera.project([side*(reach-10),16,z*1.2]);
  const toe = camera.project([side*(reach+(brace?1:0)),0,z*1.45]);
  const segment = (a,b,thickness,color) => {
    const d='M'+a.join(' ')+' L'+b.join(' ');
    return line(d,'#513b31',thickness+1.6)+line(d,color,thickness);
  };
  const ankle = [toe[0]*.7+knee[0]*.3, toe[1]*.62+knee[1]*.38];
  return segment(root,knee,9,'#a65b42')+segment(knee,ankle,6,'#bb7150')
    + path(`M${ankle[0]-3} ${ankle[1]} Q${ankle[0]-2} ${toe[1]-1} ${toe.join(' ')} Q${ankle[0]+4} ${ankle[1]+2} ${ankle[0]+3} ${ankle[1]-1}Z`,'#c29c72','#563e32',.8);
}
function pincer(camera,side,brace,front) {
  // 正面は手首を支点にハサミを立て、爪先を上に開いたまま両腕を上下させる。
  const height = front ? (brace ? 27 : 16) : (brace ? 27 : 14);
  const [x,y] = camera.project([side*(front ? 35 : 28),height,37]);
  // 真横では奥の腕が隠れ、見えている爪先は進行方向を向く。
  const outward = side*camera.c-1.25*camera.s;
  const width = Math.sign(outward || -1)*Math.max(.70,Math.min(1,Math.abs(outward)));
  const root = camera.project([side*26,13,22]);
  return line('M'+root.join(' ')+' L'+x+' '+y,'#634032',10)
    + line('M'+root.join(' ')+' L'+x+' '+y,'#a55c42',7)
    + (front ? `<use href="#front-pincer" transform="translate(${x} ${y}) scale(${side} 1)"/>`
      : `<use href="#pincer-shape" transform="translate(${x} ${y}) scale(${width} 1) rotate(${brace?-28:3})"/>`);
}
function draw(view,frame) {
  const cam=camera(view), brace=frame==='b', lift=brace && view!==0 ? 2 : 0;
  const limbs=[];
  for (const side of [-1,1]) {
    for (let i=0;i<4;i++) limbs.push({z:cam.depth([side*44,0,18-i*12]),svg:leg(cam,side,i,brace)});
    if (view!==4 && !(view===2 && side===-1)) {
      limbs.push({z:cam.depth([side*28,0,37]),svg:pincer(cam,side,brace,view===0)});
    }
  }
  limbs.sort((a,b)=>a.z-b.z);
  const [fx,fy]=cam.project([0,7,30]);
  const body=ellipse(63-4*cam.s,96-lift,view===2?29:37,12,'#83624a');
  let features='';
  if (view<=2) {
    for (const side of (view===2?[1]:[-1,1])) {
      const [x,y]=cam.project([side*13,12,32]);
      features+=ellipse(x,y-lift,view===2?2.6:3.7,3.9,'#edab44','#533c29',1)
        + ellipse(x-.5,y-lift-.7,1.3,2.4,'#3d3028','none');
    }
    if (view!==2) features+=line(`M${fx-3} ${fy-lift} q3 -4 6 0`,'#49352b',1.1);
  }
  // 甲羅で奥の脚を隠し、手前のハサミを甲羅の縁に重ねる。
  const behind=limbs.filter(l=>l.z<28), ahead=limbs.filter(l=>l.z>=28);
  const parts = behind.map(l=>l.svg).join('') + body + features + shell(cam,lift) + ahead.map(l=>l.svg).join('');
  // 翼のように横へ開くハサミも、斜め前のセルの左右に余白を残す。
  return `<g transform="translate(63 103) scale(.87) translate(-63 -103)">${parts}</g>`;
}
export const buildCrabSheet = options => monsterSheet(options,palette,defs,draw);
