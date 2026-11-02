import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { EYE_OPENINGS, eye, nose } from '../shared/face-parts.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

// Watari: navy sailor cap, short grey hair, grey moustache, gold lapels and red neckerchief.
// Neck and folded collar belong exclusively to the torso.
export const DEFAULT_PALETTE=Object.freeze({
  ink:'#312619',skin:'#ce9c64',skinLight:'#edc98e',skinDark:'#9d6b43',
  hair:'#c9c4af',hairLight:'#eee6cb',hairDark:'#88897f',hairInk:'#54584e',
  cap:'#203c53',capLight:'#3a5970',capDark:'#0f2034',
  red:'#a32f20',redLight:'#da5940',redDark:'#641d19',
  cloth:'#17374b',clothLight:'#315468',clothDark:'#0d2334',
  ivory:'#dbc695',ivoryLight:'#fff0c6',ivoryDark:'#a88a58',
  gold:'#b38235',goldLight:'#edcb6c',goldDark:'#655020',leather:'#68421f',
  iris:'#51472e',irisLight:'#b3a06a',irisDark:'#151c1a',
});
function definitions(){
  const gradient=id=>`<linearGradient id="${id}" x1="20%" y1="0%" x2="80%" y2="100%"><stop stop-color="var(--${id}Light)"/><stop offset=".48" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`;
  return `<defs>${Object.entries(EYE_OPENINGS).map(([id,d])=>`<clipPath id="eye-${id}"><path d="${d}"/></clipPath>`).join('')}${['hair','cap','red','cloth','ivory','gold','iris'].map(gradient).join('')}
  <radialGradient id="skin" cx="40%" cy="30%" r="85%"><stop stop-color="var(--skinLight)"/><stop offset=".65" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient></defs>`;
}
function torso(view){
  const w=[26,24,20,24,26][view],l=63-w,r=63+w;
  const neck=[
    'M54 64 H72 L75 78 L63 85 L51 78Z',
    'M58 64 L73 61 L76 75 L56 85 L49 77Z',
    'M61 64 L73 61 L76 73 L54 85 L49 77Z',
    'M53 64 H74 L78 78 H48Z',
    'M53 64 H74 L78 78 H48Z',
  ][view];
  let s=path(neck,grad('skin'),'#755135',.8)
    +path(`M${l+5} 78 Q63 72 ${r-5} 78 Q${r+1} 84 ${r} 98 L${r-1} 118 Q63 123 ${l+1} 118 L${l} 98 Q${l-1} 85 ${l+5} 78Z`,grad('cloth'),'#172b32',1);
  if(view<3){
    const c=[63,56,47][view],sw=[12,10,5][view];
    s+=path(`M${c-sw} 75 Q${c} 80 ${c+sw} 74 L${c+sw-2} 111 Q${c} 114 ${c-sw+2} 111Z`,grad('ivory'),'#827052',.7);
    const lapels=[
      ['M49 74 L40 82 L48 85 L44 92 L58 111 L53 85Z','M77 74 L86 82 L78 85 L82 92 L68 111 L73 85Z'],
      ['M48 74 L40 81 L46 85 L42 90 L52 109 L51 84Z','M73 71 L82 80 L72 85 L76 92 L61 110 L65 84Z'],
      ['M49 76 L44 80 L47 84 L44 90 L47 108 L51 83Z','M73 70 L78 78 L65 84 L68 91 L52 110 L57 83Z'],
    ][view];
    for(const p of lapels)s+=path(p,grad('cloth'),'var(--goldLight)',.9);
    s+=path(`M${c-sw+1} 75 L${c} 81 L${c+sw-1} 75 L${c+6} 88 L${c} 83 L${c-5} 89Z`,grad('ivory'),'#8a7854',.65)
      +path(`M${c-3} 82 L${c+3} 82 L${c+4} 87 L${c} 91 L${c-4} 87Z`,grad('red'),'var(--redDark)',.75)
      +path(`M${c-2} 88 Q${c-9} 91 ${c-8} 100 Q${c-2} 98 ${c} 91Z`,grad('red'),'var(--redDark)',.7)
      +path(`M${c+2} 88 Q${c+10} 91 ${c+8} 99 Q${c+2} 98 ${c} 91Z`,grad('red'),'var(--redDark)',.7)
      +line(`M${c-3} 91 L${c-6} 97 M${c+3} 91 L${c+6} 96`,'var(--redLight)',.6);
  }else{
    s+=path('M46 74 Q63 70 81 74 L83 81 Q63 78 44 82Z',grad('cloth'),'#172b32',.9)
      +line('M48 75 Q63 72 79 75','var(--gold)',.7)
      +line('M63 83 Q61 96 64 110','var(--clothDark)',.7)
      +line('M48 101 Q62 105 79 101','var(--clothLight)',.7);
  }
  s+=line(`M${l+6} 85 Q${l+2} 95 ${l+6} 104 M${r-6} 85 Q${r-2} 95 ${r-6} 104`,'var(--clothDark)',.9)
    +path(`M${l+1} 111 Q63 116 ${r-1} 111 L${r-1} 118 Q63 123 ${l+1} 118Z`,'var(--leather)','#3d2c1b',.9)
    +line(`M${l+2} 113 Q63 118 ${r-2} 113 M${l+2} 117 Q63 122 ${r-2} 117`,'#aa7940',.65);
  for(const x of [l+6,l+13,r-13,r-6])s+=line(`M${x} 115 v4`,'#38291c',.7);
  if(view<3){
    const c=[63,56,47][view],w=view===2?2:4;
    s+=path(`M${c-w} 112 h${w*2} v8 h${-w*2}Z`,grad('gold'),'var(--goldDark)',.8)
      +path(`M${c-w+1.2} 114 h${w*2-2.4} v4 h${2.4-w*2}Z`,'var(--leather)','none');
  }
  return s;
}
// Hair is one connected contour around the face and ears; its upper area is
// covered by a separate, intentional cloth cap, not another painted hair layer.
const HAIR=[
 'M36 34 Q62 23 89 35 L87 48 L85 58 L81 62 L80 51 L79 39 Q62 32 46 39 L44 51 L43 61 L39 57 L38 50 L35 46Z',
 'M35 34 Q63 23 91 36 Q94 52 84 67 L79 65 L75 60 Q85 57 82 50 L77 48 L75 56 L73 53 L74 39 Q55 31 40 40 L38 49 L35 45Z',
 'M37 34 Q62 23 91 34 Q95 48 90 57 L86 61 L82 59 L79 64 L76 61 L72 65 L69 61 L67 60 Q76 57 74 50 Q72 46 66 49 L64 57 L61 59 L62 46 L64 37Z',
 'M36 34 Q63 24 92 35 Q96 48 89 58 L86 62 L81 60 L77 65 L73 62 L68 66 L63 63 L58 66 L54 62 L49 65 L45 61 L42 61 Q44 53 36 47Z',
 'M35 34 Q63 24 93 35 Q96 48 89 58 L86 62 L81 60 L77 65 L73 62 L68 66 L63 63 L58 66 L54 62 L49 65 L44 61 L39 63 Q34 52 35 34Z',
];
function hair(view){
  const clip=`watari-hair-${view}`;
  let s=path(HAIR[view],grad('hair'),'var(--hairInk)',.85)
    +`<defs><clipPath id="${clip}"><path d="${HAIR[view]}"/></clipPath></defs><g clip-path="url(#${clip})">`;
  for(let i=0;i<12;i++){
    const x=37+i*4.6;
    s+=line(`M${x} 34 Q${x+6} 43 ${x+2} 53 L${x+1} ${60+(i%3)*3}`,'var(--hairDark)',.65)
      +line(`M${x+1} 37 Q${x+6} 45 ${x+3} 55`,'var(--hairLight)',.6);
  }
  return s+'</g>';
}
function cap(view){
  const crown=[
    'M34 31 Q37 21 50 17 Q65 12 78 19 Q89 24 92 32 Q65 41 34 31Z',
    'M33 28 Q37 18 52 17 Q73 15 88 26 Q94 31 94 36 Q68 42 36 34Z',
    'M35 21 Q39 13 53 18 Q79 24 91 37 Q94 43 88 45 Q62 39 37 30Z',
    'M35 24 Q41 15 58 18 Q79 20 92 33 Q97 41 87 45 Q61 45 38 34Z',
    'M35 31 Q36 21 51 17 Q67 14 81 21 Q91 26 93 33 Q86 43 65 44 Q44 43 35 37Z',
  ][view];
  let s=path(crown,grad('cap'),'#122335',1)
    +line([
      'M40 28 Q64 18 86 29','M39 24 Q62 18 86 31','M41 21 Q63 22 86 37',
      'M42 23 Q66 20 86 35','M42 28 Q64 19 87 30',
    ][view],'#45627a',.75);
  const band=[
    'M36 31 Q63 24 90 32 L87 38 Q64 32 39 38Z',
    'M34 29 Q60 25 92 35 L90 40 Q60 31 37 36Z',
    'M36 28 Q61 29 90 40 L87 45 Q61 35 37 34Z',
    'M37 32 Q61 41 89 40 L87 46 Q61 46 39 38Z',
    'M36 34 Q64 42 92 34 L90 40 Q65 48 38 40Z',
  ][view];
  s+=path(band,'#142b3e','#101e2b',.8);
  if(view<3){
    s+=path([
      'M41 35 Q63 29 86 35 Q78 41 63 40 Q49 41 36 39Z',
      'M38 32 Q56 30 76 35 Q64 40 44 39 L31 37Z',
      'M38 32 Q49 32 60 35 Q49 39 36 39 L32 37Z',
    ][view],grad('cap'),'#101e2b',.85);
    const x=[86,80,65][view];
    s+=ellipse(x,37,1.8,2,grad('gold'),'var(--goldDark)',.65);
  }
  return s;
}
const watariEye=(x,y,options={})=>`<g transform="translate(0 ${y}) scale(1 .76) translate(0 ${-y})">${eye(x,y,{size:.69,width:1.08,irisStroke:'#45432b',pupil:'#20241b',glint:'#9caa72',...options})}</g>`;
function face(view){
  if(view===4)return '';
  if(view===3)return path('M37 43 Q29 43 32 54 Q33 63 40 62 L44 57Z',grad('skin'),'#735032',.8)
    +line('M35 47 Q31 49 36 57','var(--skinDark)',.8);
  const outline=[
    'M43 26 Q63 20 82 28 L84 48 Q84 57 79 65 L77 71 Q64 75 52 71 L47 65 Q40 59 40 48Z',
    'M39 26 Q56 20 76 29 L80 48 Q78 59 71 67 L68 72 Q57 74 48 71 L43 65 Q37 60 37 50Z',
    'M41 29 Q56 24 73 36 L75 53 Q66 61 62 68 L58 72 L47 71 Q41 70 41 65 L39 61 Q33 60 35 57 L39 52Z',
  ][view];
  let s=path(outline,grad('skin'),'#755335',1);
  if(view===0){
    s+=ellipse(39,52,3.5,5.8,grad('skin'),'#735032',.85)+ellipse(86,52,3.5,5.8,grad('skin'),'#735032',.85)
      +watariEye(51.5,48)+watariEye(74,48,{nose:-1})
      +path('M44 38 Q50 35 58 38 L58 42 Q50 40 44 42Z','#443a2a','#2d291f',.45)
      +path('M68 38 Q75 35 82 38 L82 42 Q75 40 68 42Z','#443a2a','#2d291f',.45)
      +path('M61 49 Q59 56 59 59 Q63 62 67 59', 'none','#ac7948',.9)
      +line('M62 50 L62 57','#ffe2a6',.9)
      +line('M50 63 Q62 66 75 63','#795030',1.1)
      +line('M49 60 Q47 63 49 66 M76 59 Q79 63 77 67','#b08251',.8)
      +line('M47 55 Q51 57 55 55 M70 55 Q74 57 78 55 M55 70 Q63 72 71 70','#bb8d58',.7);
  }else if(view===1){
    s+=watariEye(43.5,48,{width:.65,view:'far'})+watariEye(63,48,{nose:-1,view:'near'})
      +ellipse(79,52,4.1,6,grad('skin'),'#735032',.8)+line('M80 49 Q76 48 77 56','var(--skinDark)',.8)
      +path('M38 38 Q43 35 49 38 L49 42 Q44 40 38 42Z','#443a2a','#2d291f',.45)
      +path('M56 38 Q63 35 70 38 L70 42 Q63 40 56 42Z','#443a2a','#2d291f',.45)
      +path('M51 49 Q48 55 47 58 Q50 61 54 59','none','#ac7948',.9)
      +line('M44 63 Q54 66 66 62','#795030',1)
      +line('M44 59 Q41 63 43 67 M67 58 Q71 61 69 66 M57 55 Q62 57 66 55 M49 70 Q56 72 62 70','#b08251',.75);
  }else{
    s+=watariEye(44.5,46.5,{width:.75,nose:-1,view:'side'})
      +path('M39 37 Q45 34 51 38 L50 41 Q45 38 39 40Z','#443a2a','#2d291f',.45)
      +path('M65 47 Q74 44 74 52 Q73 60 66 60 L62 55Z',grad('skin'),'#735032',.85)
      +line('M69 49 Q65 48 67 56','var(--skinDark)',.8)
      +line('M39 63 Q44 65 51 63','#795030',1)
      +line('M51 56 Q55 62 52 67 M44 69 Q50 71 55 69','#b08251',.7);
  }
  const moustache=[
    'M62 59 Q57 57 53 62 L49 63 Q54 66 62 62 Q70 66 77 62 L73 62 Q68 57 64 59Z',
    'M50 59 Q46 58 43 62 L41 63 Q45 65 51 62 Q59 65 67 61 L63 62 Q56 57 52 59Z',
    'M39 59 Q44 57 49 60 L55 61 Q50 64 42 62 L38 62Z',
  ][view];
  s+=path(moustache,grad('hair'),'var(--hairInk)',.65);
  return s;
}
export function watariMarkup(direction,part='combined'){
  const index=DIRECTIONS.indexOf(direction);
  if(index<0)throw Error(`Unknown direction: ${direction}`);
  if(!['combined','head','torso'].includes(part))throw Error(`Unknown part: ${part}`);
  const mirror=index>4,view=mirror?8-index:index;
  // Rear-quarter cap, hair and ear scale together around the neck-side anchor.
  const scale=view===3?[.83,.90]:view===2?[.90,.93]:view===1?[.94,.95]:[.96,.98];
  const head=`<g transform="translate(63 73) scale(${scale[0]} ${scale[1]}) translate(-63 -73)">${face(view)+hair(view)+cap(view)}</g>`;
  const content=part==='head'?head:part==='torso'?torso(view):torso(view)+head;
  return `<g ${mirror?'transform="translate(126 0) scale(-1 1)"':''}>${content}</g>`;
}
export function buildWatariSheet({cellSize=128,palette={},part='combined'}={}){
  if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
  const colors={...DEFAULT_PALETTE,...palette};
  for(const color of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${watariMarkup(d,part)}</g>`).join('')}</svg>`;
}
