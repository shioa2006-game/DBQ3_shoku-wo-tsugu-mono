import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { EYE_OPENINGS, eye, nose } from '../shared/face-parts.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

// Jinbei: exposed forehead, fully white swept-back hair and eyebrows, mature jaw.
// Neck and folded collar belong exclusively to the torso.
export const DEFAULT_PALETTE=Object.freeze({
  ink:'#312619',skin:'#d6a06a',skinLight:'#f4ce8e',skinDark:'#a97348',
  hair:'#e1e4e1',hairLight:'#fffef5',hairDark:'#a1aaa9',hairInk:'#626e70',
  cloth:'#354b30',clothLight:'#62734a',clothDark:'#243523',
  ivory:'#dbc695',ivoryLight:'#fff0c6',ivoryDark:'#a88a58',
  gold:'#b38235',goldLight:'#edcb6c',goldDark:'#655020',leather:'#68421f',
  iris:'#51472e',irisLight:'#b3a06a',irisDark:'#151c1a',
});
function definitions(){
  const gradient=id=>`<linearGradient id="${id}" x1="20%" y1="0%" x2="80%" y2="100%"><stop stop-color="var(--${id}Light)"/><stop offset=".48" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`;
  return `<defs>${Object.entries(EYE_OPENINGS).map(([id,d])=>`<clipPath id="eye-${id}"><path d="${d}"/></clipPath>`).join('')}${['hair','cloth','ivory','gold','iris'].map(gradient).join('')}
  <radialGradient id="skin" cx="40%" cy="30%" r="85%"><stop stop-color="var(--skinLight)"/><stop offset=".65" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient></defs>`;
}
function button(x,y,rx=3.4){
  return ellipse(x,y,rx,3.4,grad('gold'),'var(--goldDark)',.85)
    +ellipse(x,y,rx*.56,1.9,'var(--leather)','var(--goldLight)',.65)
    +line(`M${x-.5} ${y-.6} l1 1.2`,'var(--goldLight)',.7);
}
function torso(view){
  const width=[27,26,22,26,27][view],l=63-width,r=63+width;
  const neck=[
    'M53 63 H73 L77 79 Q64 89 50 78Z',
    'M60 64 L75 61 L78 75 L58 86 L50 77Z',
    'M61 64 L73 61 L76 73 Q65 81 55 84 L51 77Z',
  ][view]??'M52 63 H75 L79 79 Q63 85 48 78Z';
  let s=path(neck,grad('skin'),'#755135',.85)
    +path(`M${l+5} 78 Q63 72 ${r-5} 78 Q${r+2} 84 ${r} 99 L${r-1} 118 Q63 123 ${l+1} 118 L${l} 99 Q${l-2} 85 ${l+5} 78Z`,grad('cloth'));
  // Folded cream collar is owned solely by the torso, including its neck.
  if(view===0){
    s+=path('M51 72 L63 80 L75 72 L80 77 L70 88 L64 83 L58 89 L47 77Z',grad('ivory'),'#695332',.9)
      +path('M54 75 L63 81 L72 75 L66 85 L63 88 L60 84Z',grad('skin'),'#927044',.6)
      +line('M51 75 L58 85 L62 82 M75 75 L70 84 L65 82','var(--ivoryDark)',.8)
      +line('M63 94 V112','var(--clothDark)',1)+button(63,98)+button(63,108);
  }else if(view===1){
    s+=path('M50 73 L58 79 L74 70 L80 75 L64 87 L58 82 L53 89 L46 77Z',grad('ivory'),'#695332',.9)
      +path('M54 76 L59 79 L71 73 L60 85 L57 87Z',grad('skin'),'#927044',.6)
      +line('M50 76 L53 85 L57 81 M75 74 L64 84 L60 81','var(--ivoryDark)',.8)
      +line('M56 94 V112','var(--clothDark)',1)+button(56,98,3)+button(56,108,3);
  }else if(view===2){
    s+=path('M50 76 Q61 75 74 69 L78 74 Q63 81 55 86 L52 89 L48 85 L47 80Z',grad('ivory'),'#695332',.85)
      +line('M53 79 Q63 77 74 72 M50 82 L51 90','var(--ivoryDark)',.8)
      +button(49,98,1.8)+button(49,108,1.8);
  }else{
    s+=path('M45 74 Q63 69 82 74 L80 80 Q64 84 47 80Z',grad('ivory'),'#695332',.85)
      +line('M49 77 Q63 81 78 77','var(--ivoryDark)',.75)
      +line('M63 83 Q61 97 64 110','var(--clothDark)',.8)
      +line('M48 102 Q62 107 78 103','var(--clothLight)',.7);
  }
  s+=line(`M${l+6} 84 Q${l+1} 94 ${l+6} 105 M${r-6} 83 Q${r-1} 94 ${r-6} 105`,'var(--clothDark)',1)
    +line(`M${l+8} 90 Q${l+5} 97 ${l+8} 103 M${r-8} 91 Q${r-5} 97 ${r-8} 102`,'var(--clothLight)',.65)
    +path(`M${l+1} 111 Q63 116 ${r-1} 111 L${r-1} 118 Q63 123 ${l+1} 118Z`,'var(--leather)')
    +line(`M${l+2} 113 Q63 118 ${r-2} 113 M${l+2} 117 Q63 122 ${r-2} 117`,'#ab7c3e',.7);
  for(const x of [l+7,l+15,r-15,r-7])s+=line(`M${x} 115 v4`,'#362a19',.8);
  if(view<=2){
    const c=[63,56,49][view],w=view===2?2.5:4.5;
    s+=path(`M${c-w} 112 h${w*2} v8 h${-w*2}Z`,grad('gold'),'var(--goldDark)',.85)
      +path(`M${c-w+1.4} 114 h${w*2-2.8} v4 h${2.8-w*2}Z`,'var(--leather)','none')
      +line(`M${c} 113.5 v5`,'var(--goldLight)',.8);
  }
  return s;
}
// One continuous silhouette per view: no separate crown cap or temple patch.
const HAIR=[
  'M35 44 Q31 31 38 24 L36 22 Q40 21 44 21 L42 18 Q48 19 51 17 L51 15 L59 17 L62 14 L68 17 L73 16 Q88 20 92 33 Q94 45 86 60 L83 61 L81 45 L79 31 Q73 23 66 26 L63 28 L58 25 Q49 24 45 31 L43 46 L41 60 L38 58Z',
  'M34 44 Q31 32 38 24 L36 22 Q40 21 44 21 L43 18 L51 18 L52 15 L60 17 L63 14 L69 18 L75 17 Q90 22 94 34 Q97 48 88 61 L82 66 L78 65 L75 59 Q84 58 83 51 Q82 47 77 48 L74 55 L73 48 L73 32 Q65 24 57 27 L53 29 L49 26 Q41 26 39 35 L38 47Z',
  'M36 38 Q33 29 40 24 L38 22 L46 22 L45 19 L52 20 L53 16 L60 19 L64 16 L70 19 Q87 20 93 31 Q99 44 91 56 L86 63 L78 68 L72 66 L69 61 Q76 58 75 51 Q74 45 67 47 L64 55 L62 58 L62 50 L65 39 Q67 30 59 27 Q48 23 42 29 L40 37Z',
  'M36 39 Q32 26 47 19 Q62 11 78 18 Q94 24 95 38 Q96 53 86 64 L80 69 L74 67 L67 71 L60 68 L53 71 L47 66 L43 65 Q45 60 42 54 Q39 49 36 47Z',
  'M35 40 Q31 27 45 20 Q61 11 78 18 Q92 24 94 37 Q98 52 87 64 L81 69 L75 67 L68 71 L61 68 L54 71 L48 67 L42 67 Q34 57 35 40Z',
];
function hair(view){
  const clip=`jinbei-hair-${view}`;
  let s=path(HAIR[view],grad('hair'),'var(--hairInk)',.9)
    +`<defs><clipPath id="${clip}"><path d="${HAIR[view]}"/></clipPath></defs><g clip-path="url(#${clip})">`;
  // Open, tapered-looking strands follow the scalp. They do not enclose panels
  // or restart a gradient at the crown/temple boundary.
  const strands=[
    ['M39 37 Q36 25 49 21','M43 31 Q43 23 56 20','M50 27 Q52 20 62 20','M60 25 Q64 20 72 22','M70 26 Q80 25 85 34 Q89 44 85 53','M77 23 Q88 28 89 38','M40 43 Q39 49 40 54','M82 37 Q85 44 84 48'],
    ['M36 38 Q35 26 48 21','M41 30 Q43 23 56 20','M49 26 Q53 20 63 21','M59 25 Q66 21 75 25','M69 28 Q83 29 87 40 Q90 51 82 61','M78 23 Q92 31 91 43 Q91 51 87 55','M76 37 Q79 42 77 46'],
    ['M38 33 Q39 24 51 22','M44 27 Q52 21 63 23','M55 25 Q70 23 81 31 Q91 41 86 53','M65 21 Q80 24 87 33 Q94 45 88 53','M73 20 Q87 24 91 34','M70 32 Q78 35 80 41','M76 43 Q85 48 80 58 Q78 62 75 64','M88 48 Q87 58 82 62','M65 40 Q66 43 64 48'],
  ][view];
  if(strands){
    for(const [i,d] of strands.entries())s+=`<g opacity="${i%3===0?.65:.45}">${line(d,'var(--hairDark)',.65)}</g>`;
  }else{
    for(let i=0;i<11;i++){
      const x=35+i*5.5,root=59+i*.65,end=57+Math.sin(i*1.7)*7;
      s+=`<g opacity=".55">${line(`M${root} 19 C${x+13} 24 ${x+8} 33 ${x+5} 43 Q${x+2} 52 ${x} ${end}`,'var(--hairDark)',.65)}</g>`;
      if(i%2===0)s+=`<g opacity=".45">${line(`M${x+7} 44 Q${x+8} 54 ${x+1} 65`,'var(--hairDark)',.55)}</g>`;
    }
  }
  return s+'</g>';
}
const jinbeiEye=(x,y,options={})=>`<g transform="translate(0 ${y}) scale(1 .76) translate(0 ${-y})">${eye(x,y,{size:.74,width:1.12,irisStroke:'#45432b',pupil:'#20241b',glint:'#9caa72',...options})}</g>`;
function face(view){
  if(view===4)return '';
  if(view===3)return path('M37 43 Q29 43 32 54 Q33 63 40 62 L44 57Z',grad('skin'),'#735032',.8)
    +line('M35 47 Q31 49 36 57','var(--skinDark)',.8);
  const outline=[
    'M43 26 Q63 20 82 28 L84 48 Q84 57 79 65 L77 71 Q64 77 51 71 L47 65 Q40 59 40 48Z',
    'M39 26 Q56 20 76 29 L80 48 Q78 59 71 67 L68 72 Q57 76 47 71 L43 65 Q37 60 37 50Z',
    'M41 29 Q56 24 73 36 L75 53 Q66 61 62 68 L58 72 L47 71 Q41 70 41 65 L39 61 Q33 60 35 57 L39 52Z',
  ][view];
  let s=path(outline,grad('skin'),'#755335',1);
  if(view===0){
    s+=ellipse(39,52,3.5,5.8,grad('skin'),'#735032',.85)+ellipse(86,52,3.5,5.8,grad('skin'),'#735032',.85)
      +jinbeiEye(51.5,48)+jinbeiEye(74,48,{nose:-1})
      +path('M44 38 Q50 35 58 38 L58 42 Q50 40 44 42Z',grad('hair'),'var(--hairInk)',.45)
      +path('M68 38 Q75 35 82 38 L82 42 Q75 40 68 42Z',grad('hair'),'var(--hairInk)',.45)
      +path('M61 49 Q59 56 59 59 Q63 62 67 59', 'none','#ac7948',.9)
      +line('M62 50 L62 57','#ffe2a6',.9)
      +line('M50 63 Q62 66 75 63','#795030',1.1)
      +line('M49 60 Q47 63 49 66 M76 59 Q79 63 77 67','#b08251',.8)
      +line('M47 55 Q51 57 55 55 M70 55 Q74 57 78 55 M55 70 Q63 72 71 70','#bb8d58',.7);
  }else if(view===1){
    s+=jinbeiEye(43.5,48,{width:.65,view:'far'})+jinbeiEye(63,48,{nose:-1,view:'near'})
      +ellipse(79,52,4.1,6,grad('skin'),'#735032',.8)+line('M80 49 Q76 48 77 56','var(--skinDark)',.8)
      +path('M38 38 Q43 35 49 38 L49 42 Q44 40 38 42Z',grad('hair'),'var(--hairInk)',.45)
      +path('M56 38 Q63 35 70 38 L70 42 Q63 40 56 42Z',grad('hair'),'var(--hairInk)',.45)
      +path('M51 49 Q48 55 47 58 Q50 61 54 59','none','#ac7948',.9)
      +line('M44 63 Q54 66 66 62','#795030',1)
      +line('M44 59 Q41 63 43 67 M67 58 Q71 61 69 66 M57 55 Q62 57 66 55 M49 70 Q56 72 62 70','#b08251',.75);
  }else{
    s+=jinbeiEye(44.5,46.5,{width:.75,nose:-1,view:'side'})
      +path('M39 37 Q45 34 51 38 L50 41 Q45 38 39 40Z',grad('hair'),'var(--hairInk)',.45)
      +path('M65 47 Q74 44 74 52 Q73 60 66 60 L62 55Z',grad('skin'),'#735032',.85)
      +line('M69 49 Q65 48 67 56','var(--skinDark)',.8)
      +line('M39 63 Q44 65 51 63','#795030',1)
      +line('M51 56 Q55 62 52 67 M44 69 Q50 71 55 69','#b08251',.7);
  }
  return s;
}
export function jinbeiMarkup(direction,part='combined'){
  const index=DIRECTIONS.indexOf(direction);
  if(index<0)throw Error(`Unknown direction: ${direction}`);
  if(!['combined','head','torso'].includes(part))throw Error(`Unknown part: ${part}`);
  const mirror=index>4,view=mirror?8-index:index;
  const head=`<g transform="translate(63 74) scale(${view===2?1:1.035} 1.045) translate(-63 -74)">${face(view)+hair(view)}</g>`;
  const content=part==='head'?head:part==='torso'?torso(view):torso(view)+head;
  return `<g ${mirror?'transform="translate(126 0) scale(-1 1)"':''}>${content}</g>`;
}
export function buildJinbeiSheet({cellSize=128,palette={},part='combined'}={}){
  if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
  const colors={...DEFAULT_PALETTE,...palette};
  for(const color of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${jinbeiMarkup(d,part)}</g>`).join('')}</svg>`;
}
