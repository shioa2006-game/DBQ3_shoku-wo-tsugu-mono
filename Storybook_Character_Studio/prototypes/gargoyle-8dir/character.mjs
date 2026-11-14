import { path, line, ellipse } from '../shared/svg.mjs';
import { monsterSheet } from '../shared/monster-export.mjs';
import { tube } from '../shared/monster-kit.mjs';

const palette = { ink:'#36343c', stone:'#797982', light:'#a4a3aa', shadow:'#585963', membrane:'#796a83' };
const fill = (d,c) => path(d,c,'none');
const slab = (d,c='var(--stone)') => path(d,c,'var(--ink)',1.1);
const group = (x,y,parts) => `<g transform="translate(${x} ${y})">${parts}</g>`;
const points = pts => 'M'+pts.map(p=>p.join(' ')).join(' L')+'Z';

function face(view) {
  const back=view>=3, profile=view===2;
  const cheek=profile?'M-17 -5 L-12 -15 -3 -19 9 -17 16 -8 13 5 4 12 -8 11 -18 6 -20 1Z'
    :'M-16 -8 L-10 -16 1 -19 11 -16 17 -7 15 4 8 12 -5 14 -14 8 -18 1Z';
  let head=slab(cheek)+fill('M-13 -9 L-8 -15 1 -18 7 -15 -2 -11 -6 -5Z','var(--light)')
    +fill('M8 -14 L15 -7 13 3 7 8 3 4 7 -3Z','#666673');
  function horn(x,scale) {
    return `<g transform="translate(${x} -14) scale(${scale} 1)">`
      +slab('M-4 1 Q-5 -4 -3 -10 L2 -17 Q1 -10 5 -4 L5 1Z','#9c9898')
      +fill('M-3 -8 L1 -15 -1 -7 1 -2 -3 0Z','#c0b8ad')+'</g>';
  }
  function ear(x,sign) {
    return `<g transform="translate(${x} -6) scale(${sign} 1)">`+slab('M-2 -3 L12 -11 8 0 2 6 -2 5Z')
      +fill('M1 1 L9 -7 6 0 2 3Z',back?'#696872':'#55515d')+'</g>';
  }
  const straight=view===0 || view===4;
  const farHorn=horn(straight?-9:-6,profile?-.66:-.88);
  const nearHorn=horn(straight?8:5,1);
  if(view===3) {
    // 奥の耳の根元だけを頭で隠し、手前の耳は側面の輪郭に重ねる。
    return farHorn+nearHorn+ear(15,.85)+head+ear(-13,-1)
      +line('M-7 -8 L-2 -10 4 -6','#898992',.8);
  }
  let result=farHorn+nearHorn+(straight?ear(-13,-1):'')+head+ear(straight?13:10,1);
  if(back) return result+line('M-7 -8 L-2 -10 4 -6','#898992',.8);
  function eye(x,width) {
    return `<g transform="translate(${x} -3) scale(${width} 1)">`
      +slab('M-6 -3 L5 0 3 5 -1 6 -5 4Z','#daa24a')+ellipse(.1,2,1.5,2.4,'#373038','none')
      +slab('M-7 -6 L-3 -7 6 -1 4 1 -5 -2Z','#8f909c')+'</g>';
  }
  result+=profile?eye(-11,-.9):view===1?eye(-12,.64)+eye(2,-1):eye(-8,1)+eye(8,-1);
  const mx=profile?-14:view===1?-8:0;
  return result+group(mx,6,slab('M-11 -2 L-7 -5 4 -6 10 -2 10 4 6 8 -4 8 -11 4Z','#95929a')
    +fill('M-10 -2 L-6 -4 2 -5 5 -3 -4 -2Z','#b5b1b3')
    +ellipse(-6,-.7,1.2,.8,'#48434b','none')+(!profile?ellipse(2,-1,1,.7,'#48434b','none'):'')
    +line('M-9 4 Q-2 1 7 4','#45404a',1.2)
    +slab('M-7 5 L-8 1 -10 3 -9 6Z','#d2cbb9')
    +(profile?'':slab('M5 5 L6 0 8 3 7 6Z','#d2cbb9')));
}

// 肩から腰までの石の面と腕脚の節は共通。x は左右、h は高さ、z は前方。
function draw(view,frame,flying,heavy=false) {
  const angle=view*Math.PI/4, c=Math.cos(angle), s=Math.sin(angle);
  const project=([x,h,z])=>[63+c*x-s*z,115-h+.23*(s*x+c*z)];
  const P=(x,h,z)=>project([x,h,z]);
  const poly=(vertices,color)=>slab(points(vertices.map(project)),color);
  function block(start,end,r1,r2) {
    const a=project(start), b=project(end), dx=b[0]-a[0],dy=b[1]-a[1];
    const len=Math.hypot(dx,dy)||1, nx=-dy/len,ny=dx/len;
    const at=(t,r)=>[a[0]+t*dx+nx*r,a[1]+t*dy+ny*r];
    return slab(points([at(-.1,0),at(.12,-r1),at(.7,-r2),at(1.12,0),at(.83,r2),at(.16,r1)]))
      +fill(points([at(.1,0),at(.13,-r1+.7),at(.69,-r2+.7),at(.57,-1)]),'var(--light)')
      +fill(points([at(.19,r1-.8),at(.55,1),at(1,0),at(.80,r2-.6)]),'var(--shadow)');
  }
  const b=frame==='b';
  function wing(side) {
    const root=[side*(heavy?11:8),62,-7];
    const w=(x,h,z)=>P(side*x*(heavy?1.22:1),h,z).join(' ');
    const base=project(root).join(' ');
    if(!flying) {
      // 各肩に独立した一枚。先端も背骨を越えず同じ側の腰へ下がる。
      const knuckle=w(15,77,-12), tip=w(14,29,-19), fold=w(18,49,-18);
      return slab(`M${base} Q${w(11,75,-10)} ${knuckle} Q${w(23,63,-17)} ${fold} L${tip} Q${w(11,40,-15)} ${w(7,39,-13)}Z`,'var(--membrane)')
        +line(`M${base} Q${w(11,75,-10)} ${knuckle} Q${w(23,59,-18)} ${tip}`,'var(--ink)',2.8)
        +line(`M${base} Q${w(11,74,-10)} ${knuckle} Q${w(22,59,-18)} ${tip}`,'#95939b',1.5)
        +line(`M${knuckle} Q${w(14,57,-15)} ${w(12,40,-16)}`,'#554d60',1);
    }
    const wrist=w(23,b?70:96,-11), tip=w(55,b?47:63,-29);
    const notch1=w(48,b?50:65,-32), digit1=w(43,b?34:48,-30);
    const notch2=w(35,b?44:55,-22), digit2=w(30,b?33:46,-20);
    const hip=w(7,48,-8);
    return slab(`M${base} Q${w(17,72,-8)} ${wrist} Q${w(47,b?68:89,-17)} ${tip} Q${notch1} ${digit1} Q${notch2} ${digit2} Q${w(20,53,-13)} ${hip}Z`,'var(--membrane)')
      +fill(`M${wrist} Q${w(42,b?62:80,-17)} ${tip} Q${notch1} ${digit1}Z`,'#675d73')
      +line(`M${digit1} L${wrist} L${digit2}`,'#504b59',1.4)
      +line(`M${base} Q${w(17,72,-8)} ${wrist} Q${w(47,b?68:89,-17)} ${tip}`,'var(--ink)',3.6)
      +line(`M${base} Q${w(17,72,-8)} ${wrist} Q${w(47,b?68:89,-17)} ${tip}`,'#96939c',2);
  }
  function foot(side) {
    // 重装型の試作は両足を接地した静止姿勢。歩行・攻撃は後で制作する。
    const step=flying||heavy?0:side*(b?1:-1);
    const hip=[side*(heavy?11:8),39,0], knee=[side*(heavy?17:13),25,8+step*3];
    const ankle=[side*(heavy?15:10),flying?16:8+(step>0?8:0),flying?-7:step*6];
    let leg=block(hip,knee,heavy?10:8,heavy?8.5:7)+block(knee,ankle,heavy?7.5:6,heavy?5.5:4.5);
    for(const toe of [-1,0,1]) leg+=poly([[ankle[0]+toe*3,ankle[1],ankle[2]],
      [ankle[0]+toe*4+2,ankle[1]-3,ankle[2]+3],
      [ankle[0]+toe*5,ankle[1]-(flying?7:5),ankle[2]+9-Math.abs(toe)],
      [ankle[0]+toe*3-2,ankle[1]-3,ankle[2]+4]],'#a7a2a2');
    return leg;
  }
  function arm(side) {
    if(heavy) {
      const shoulder=[side*20,64,1], elbow=[side*29,47,7], hand=[side*28,33,17];
      const v=(x,h,z)=>[side*x,h,z];
      // 肩と前腕の張り出しで壁破壊役の輪郭を作る。手は低く構えた岩の拳。
      return block(shoulder,elbow,11,8)+block(elbow,hand,12,10)
        +poly([v(12,65,3),v(18,72,1),v(27,69,0),v(30,61,3),v(23,57,8),v(15,59,7)],'var(--stone)')
        +poly([v(12,65,3),v(18,72,1),v(27,69,0),v(23,65,7),v(16,63,8)],'var(--light)')
        +poly([v(21,48,12),v(30,51,9),v(37,43,12),v(35,34,20),v(25,32,23),v(20,38,21)],'var(--stone)')
        +poly([v(21,48,12),v(30,51,9),v(34,46,14),v(27,43,18),v(20,38,21)],'var(--light)')
        +poly([v(35,34,20),v(33,28,24),v(25,27,25),v(21,32,23),v(25,37,21)],'var(--shadow)')
        +[-1,0,1].map(f=>poly([v(28+f*3,33,23),v(30+f*3,31,24),v(29+f*3,26,26),v(27+f*3,29,25)],'#aaa6a9')).join('');
    }
    const shoulder=[side*13,62,2], elbow=[side*19,48,8], hand=[side*20,43,18];
    let arm=block(shoulder,elbow,7.6,5.7)+block(elbow,hand,7.3,5.7);
    for(const finger of [-1,0,1]) {
      const x=hand[0]+finger*3;
      arm+=poly([[x-2,45,17],[x+2,45,18],[x+2,42,22],[x,37+Math.abs(finger),24],[x-2,41,21]],'#aaa6a9');
    }
    return arm;
  }
  const body=heavy ? block([0,65,0],[0,36,-1],21,13)
    +(view>=3
      ? poly([[-16,63,-6],[-9,68,-8],[0,66,-12],[10,68,-8],[16,63,-6],[11,47,-9],[0,42,-12],[-11,47,-9]],'var(--shadow)')
        +poly([[-13,62,-8],[-8,66,-9],[-2,63,-13],[-2,47,-13],[-10,50,-10]],'var(--stone)')
      : poly([[-19,62,3],[-12,68,6],[0,64,14],[0,53,14],[-13,55,10]],'var(--light)')
        +poly([[0,64,14],[12,68,6],[19,62,3],[13,55,10],[0,53,14]],'var(--stone)')
        +poly([[-11,51,10],[0,53,13],[11,51,10],[8,41,8],[0,37,10],[-8,41,8]],'var(--stone)'))
    : block([0,65,0],[0,38,-1],14,10)
    +poly([[-12,62,2],[-7,66,5],[0,63,9],[0,54,9],[-9,56,5]],'#898993')
    +poly([[0,63,9],[8,65,5],[12,62,2],[8,56,5],[0,54,9]],'#70717e');
  const tailPts=[[0,40,-5],[1,29,-16],[3,25,-27],[5,28,-33],[5,32,-32]].map(project);
  const tail=slab(tube(tailPts,[4,3.5,2.8,1.8,.5]),'#777580');
  const [hx,hy]=P(0,heavy?74:71,heavy?10:7);
  const head=group(hx,hy,`<g transform="scale(.84)">${face(view)}</g>`);
  const rear=view>=3;
  const trunk=foot(-1)+arm(-1)+foot(1)+body;
  if(view===3) return trunk+arm(1)+wing(-1)+wing(1)+head+tail;
  if(rear) return trunk+arm(1)+head+wing(-1)+wing(1)+tail;
  if(view===1 || view===2) return wing(-1)+tail+trunk+wing(1)+arm(1)+head;
  return wing(-1)+wing(1)+tail+trunk+arm(1)+head;
}

export const buildFlightSheet = options => monsterSheet(options,palette,'',(view,frame)=>draw(view,frame,true));
export const buildGroundSheet = options => monsterSheet(options,palette,'',(view,frame)=>draw(view,frame,false));
// 静止試作。表示リグ用のA/Bは同じ造形で、角・耳・顔は通常型を共有する。
export const buildHeavyGroundSheet = options => monsterSheet(options,palette,'',view=>draw(view,'a',false,true));
