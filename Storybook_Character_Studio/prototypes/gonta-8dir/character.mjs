import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { WAIST_BELT, waistOutline, waistShade, waistBeltBand, waistBeltStitch } from '../shared/waist.mjs';
import { EYE_OPENINGS, eye, nose } from '../shared/face-parts.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

// Gonta's short swept hair and broader jaw are authored separately from the
// child characters. Only drawing primitives and facial components are shared.
export const DEFAULT_PALETTE=Object.freeze({
  ink:'#312619',skin:'#dfaa70',skinLight:'#f4c98d',skinDark:'#b47644',
  hair:'#53391f',hairLight:'#8c6135',hairDark:'#2c2319',
  cloth:'#435a30',clothLight:'#6d8248',clothDark:'#273a23',
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
// Prototype 02 (2026-11-08): the belt sits at the waist and the tunic's skirt shows below it down to the old
// hem (shared/waist.mjs). The 3D arms hang at the sides, so the torso draws no arm lines; the sides are shaded.
function torso(view){
  const width=[26,24,17,24,26][view],l=63-width,r=63+width,B=WAIST_BELT;
  const neck=[
    'M53 63 H73 L77 79 Q64 89 50 78Z',
    'M60 64 L75 61 L78 75 L58 86 L50 77Z',
    'M61 64 L73 61 L76 73 Q65 81 55 84 L51 77Z',
  ][view]??'M52 63 H75 L79 79 Q63 85 48 78Z';
  const body=waistOutline(l,r,{top:78,crown:72,inset:5,bulge:2,pinch:1});
  let s=path(neck,grad('skin'),'#755135',.85)+path(body,grad('cloth'))
    +waistShade(`gonta-body-${view}`,body,l,r,view,{color:'var(--clothDark)'});
  // Folded cream collar is owned solely by the torso, including its neck.
  if(view===0){
    s+=path('M51 72 L63 80 L75 72 L80 77 L70 86 L65 94 L61 94 L56 85 L47 77Z',grad('ivory'),'#695332',.9)
      +path('M54 75 L63 81 L72 75 L66 85 L63 88 L60 84Z',grad('skin'),'#927044',.6)
      +line('M51 75 L59 84 L62 91 M75 75 L67 84 L64 91','var(--ivoryDark)',.8)
      +line(`M63 94 V${B}`,'var(--clothDark)',1)+button(63,97.3,2.4);
  }else if(view===1){
    s+=path('M50 73 L58 79 L74 70 L80 75 Q68 83 61 89 L57 94 L53 88 L46 77Z',grad('ivory'),'#695332',.9)
      +path('M54 76 L59 79 L71 73 L60 85 L57 87Z',grad('skin'),'#927044',.6)
      +line('M50 76 L55 84 L56 90 M75 74 L63 83 L59 90','var(--ivoryDark)',.8)
      +line(`M56 94 V${B}`,'var(--clothDark)',1)+button(56,97.3,2.4);
  }else if(view===2){
    s+=path('M50 76 Q61 75 74 69 L78 74 Q63 81 55 88 L52 94 L48 88 L47 80Z',grad('ivory'),'#695332',.85)
      +line('M53 79 Q63 77 74 72 M50 82 L51 90','var(--ivoryDark)',.8)
      +button(49,97.3,1.6);
  }else{
    s+=path('M45 74 Q63 69 82 74 L80 80 Q64 84 47 80Z',grad('ivory'),'#695332',.85)
      +line('M49 77 Q63 81 78 77','var(--ivoryDark)',.75)
      +line(`M63 83 Q61 92 63 ${B}`,'var(--clothDark)',.8);
  }
  // The tunic below the belt: the front opening with one more button (the back seam), two folds and the
  // hem's stitching.
  const c=[63,56,49,63,63][view];
  if(view!==2)s+=line(`M${c} ${B+9} V120`,'var(--clothDark)',1);
  if(view<=2)s+=button(c,112.5,view===2?1.6:2.4);
  s+=line(view===2?`M66 ${B+9} Q67 114 69 119`:`M${l+10} ${B+9} Q${l+9} 114 ${l+7} 119 M${r-10} ${B+9} Q${r-9} 114 ${r-7} 119`,'var(--clothDark)',.6)
    +line(`M${l} 116.5 Q63 121.5 ${r} 116.5`,'var(--clothLight)',.55)
    +path(waistBeltBand(l+1,r-1,B),'var(--leather)')
    +line(waistBeltStitch(l+1,r-1,B),'#ab7c3e',.7);
  for(const x of [l+7,l+15,r-15,r-7])s+=line(`M${x} ${B+2} v3`,'#362a19',.8);
  if(view<=2){
    const w=view===2?2.5:4.5;
    s+=path(`M${c-w} ${B+.5} h${w*2} v8 h${-w*2}Z`,grad('gold'),'var(--goldDark)',.85)
      +path(`M${c-w+1.4} ${B+2.5} h${w*2-2.8} v4 h${2.8-w*2}Z`,'var(--leather)','none')
      +line(`M${c} ${B+2} v5`,'var(--goldLight)',.8);
  }
  return s;
}
const HAIR=[
  'M35 40 Q30 36 35 30 L32 29 Q37 23 43 23 L40 19 Q49 19 55 17 L52 14 Q63 14 70 18 L74 15 L75 20 Q87 21 91 29 L88 29 Q96 35 92 43 L93 47 Q90 55 85 63 L80 59 L78 45 Q63 38 47 47 L45 61 L41 65 Q34 57 35 47 L32 46Z',
  'M35 40 Q30 35 36 29 L33 27 Q40 22 46 22 L43 18 Q52 18 59 16 L57 13 Q67 14 72 19 L77 17 L78 21 Q90 24 93 31 L89 31 Q96 38 92 46 L93 49 Q90 60 84 66 L79 64 L76 57 L76 44 Q58 36 43 50 L40 59 L36 55Z',
  'M37 39 Q30 35 37 29 L35 26 Q42 22 48 23 L45 19 Q56 16 62 19 L66 15 Q72 18 76 21 Q89 22 93 31 L90 31 Q97 37 93 45 L95 48 Q91 55 87 59 L85 66 L80 64 L76 68 Q69 63 67 54 L50 47Z',
  'M36 38 Q31 32 38 28 L36 25 Q42 21 49 22 L46 18 Q57 16 63 19 L68 15 Q74 18 78 22 Q87 23 93 31 L90 32 Q97 38 93 46 L95 50 L88 58 L85 66 L80 64 L75 70 L69 67 L63 71 L58 67 L51 69 L48 65 L42 66 Q37 61 36 55 L34 51 L36 45 L33 43Z',
  'M35 39 Q30 33 37 29 L35 25 Q42 21 49 22 L46 18 Q57 16 64 19 L69 15 Q75 18 79 22 Q88 23 93 31 L90 33 Q97 39 93 46 L95 50 L89 58 L86 65 L80 64 L76 70 L70 67 L64 71 L58 67 L52 69 L48 65 L42 66 Q36 61 35 55 L33 51 L36 45 L33 43Z',
];
function hairBack(view){
  let s=path(HAIR[view],grad('hair'),'#392b1b',1.05)
    +`<defs><clipPath id="gonta-hair-${view}"><path d="${HAIR[view]}"/></clipPath></defs><g clip-path="url(#gonta-hair-${view})">`;
  const root=[69,65,62,61,62][view];
  // Overlapping swept locks follow the crown rather than parallel hair stripes.
  for(let i=0;i<10;i++){
    const end=34+i*6,y=50+Math.sin(i*1.3)*9;
    s+=path(`M${root+(i-5)*1.2} 23 Q${end+8} 26 ${end-2} ${y} Q${end+9} ${y-9} ${end+7} ${y+5} Q${end+14} ${y-10} ${end+9} 31Z`,grad('hair'),'#4b3420',.65)
      +line(`M${root+(i-5)} 24 Q${end+6} 28 ${end} ${y-6}`,'#af824a',.55);
  }
  if(view>=3)for(let i=0;i<8;i++){
    const x=40+i*6;
    s+=path(`M${x} 44 Q${x+7} 48 ${x+8} 59 L${x+4} 55 L${x+6} 68 Q${x-1} 62 ${x-2} 55Z`,grad('hair'),'#48321e',.6)
      +line(`M${x} 48 Q${x+4} 56 ${x+4} 62`,'#936b37',.55);
  }
  return s+'</g>';
}
const gontaEye=(x,y,options={})=>`<g transform="translate(0 ${y}) scale(1 .9) translate(0 ${-y})">${eye(x,y,{size:.72,width:1.05,irisStroke:'#4b4128',pupil:'#17201d',glint:'#b9aa70',...options})}</g>`;
function face(view){
  if(view===4)return '';
  if(view===3)return path('M37 49 Q30 48 33 56 Q34 62 40 61Z',grad('skin'),'#735032',.85)
    +line('M35 51 Q33 53 36 57','var(--skinDark)',.75);
  const outline=[
    'M42 35 Q62 27 83 36 Q87 48 82 59 Q79 68 71 71 Q63 74 55 71 Q46 69 42 62 Q37 52 42 35Z',
    'M39 36 Q57 28 78 37 L80 53 Q78 63 70 68 Q61 73 52 71 Q43 69 40 62 Q36 52 39 36Z',
    'M42 36 Q58 30 75 40 L75 54 Q67 60 61 66 Q54 71 48 70 Q43 68 41 64 L40 60 Q34 59 35 56 L40 52Z',
  ][view];
  let s=path(outline,grad('skin'),'#735032',1);
  if(view===0){
    s+=ellipse(39.5,54,3.8,5.6,grad('skin'),'#735032',.9)+ellipse(86,54,3.8,5.6,grad('skin'),'#735032',.9)
      +gontaEye(52,52.5)+gontaEye(74,52.5,{nose:-1})
      +path('M45 42 Q51 38 58 41 L57 44 Q51 42 45 45Z','#3b2b1c','none')
      +path('M68 41 Q75 38 81 42 L81 45 Q75 42 69 44Z','#3b2b1c','none')
      +nose(63,60.8)+line('M57 65.5 Q63 68 70 64.8','#875334',1)
      +line('M60 70 Q64 71 67 69.5','#c08953',.65);
  }else if(view===1){
    s+=gontaEye(46,52.5,{width:.66,view:'far'})+gontaEye(64,53,{nose:-1,view:'near'})
      +ellipse(79,54,4.1,5.7,grad('skin'),'#735032',.8)+line('M80 51 Q76 50 77 57','var(--skinDark)',.8)
      +path('M41 42 Q45 39 51 41 L50 44 Q46 42 41 45Z','#3b2b1c','none')
      +path('M58 41 Q64 39 70 42 L69 45 Q63 42 58 44Z','#3b2b1c','none')
      +nose(51,61,-1)+line('M49 65 Q55 68 61 65','#875334',.9)
      +line('M53 70 Q58 71 61 69.5','#c08953',.65);
  }else{
    s+=gontaEye(46.5,51.5,{width:.73,nose:-1,view:'side'})
      +path('M42 41 Q47 38 52 42 L51 44 Q47 42 42 44Z','#3b2b1c','none')
      +path('M66 49 Q74 46 74 54 Q72 62 66 61 L63 56Z',grad('skin'),'#735032',.85)
      +line('M69 51 Q65 50 67 57','var(--skinDark)',.8)
      +line('M41 63 Q45 65 49 63.5','#875334',.85);
  }
  return s;
}
function fringe(view){
  if(view>=3)return '';
  const outline=[
    'M36 35 Q45 17 69 22 Q83 23 89 35 L86 48 L84 56 L81 56 L80 39 Q73 30 65 36 L59 42 L61 33 Q51 35 47 44 L47 37 L39 48 L40 39 L36 46Z',
    'M34 34 Q46 18 65 22 Q82 23 86 36 L83 47 L79 48 L77 57 L74 59 L74 48 L76 39 Q67 31 60 37 L55 43 L56 34 Q47 37 43 45 L43 38 L36 49 L37 39 L33 43Z',
    'M36 34 Q45 19 62 23 Q80 23 85 37 L80 47 L74 49 L69 48 L66 59 L63 61 L63 51 L66 40 Q59 34 52 40 L47 46 L47 38 L39 47 L40 39 L34 43Z',
  ][view];
  const ridges=[
    'M40 33 Q49 23 64 25 Q49 27 42 38 M69 26 Q76 25 83 34 M59 29 Q52 34 49 39 M75 30 Q83 36 83 46',
    'M39 32 Q48 23 62 25 Q47 29 39 41 M64 26 Q75 25 81 35 M58 29 Q49 33 46 39 M73 31 Q80 36 78 44',
    'M40 32 Q48 24 60 26 Q48 29 40 40 M62 27 Q73 25 80 35 M58 31 Q52 33 49 38 M70 32 Q77 37 71 45',
  ][view];
  let s=path(outline,grad('hair'),'#49301c',.85)
    +`<defs><clipPath id="gonta-fringe-${view}"><path d="${outline}"/></clipPath></defs><g clip-path="url(#gonta-fringe-${view})">`;
  const root=[70,66,62][view];
  for(let i=0;i<12;i++){
    const x=34+i*4.5,endY=40+Math.sin(i*.8)*5;
    s+=line(`M${root+(i-6)*.5} 23 C${x+7} 24 ${x-2} 31 ${x} ${endY}`,'#402d1c',.8)
      +line(`M${root+(i-6)*.5} 24 C${x+8} 25 ${x+1} 31 ${x+1} ${endY-2}`,'#a57740',.55);
  }
  return s+line(ridges,'#9c703b',.7)+'</g>';
}
export function gontaMarkup(direction,part='combined'){
  const index=DIRECTIONS.indexOf(direction);
  if(index<0)throw Error(`Unknown direction: ${direction}`);
  if(!['combined','head','torso'].includes(part))throw Error(`Unknown part: ${part}`);
  const mirror=index>4,view=mirror?8-index:index;
  const head=hairBack(view)+face(view)+fringe(view);
  const content=part==='head'?head:part==='torso'?torso(view):torso(view)+head;
  return `<g ${mirror?'transform="translate(126 0) scale(-1 1)"':''}>${content}</g>`;
}
export function buildGontaSheet({cellSize=128,palette={},part='combined'}={}){
  if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
  const colors={...DEFAULT_PALETTE,...palette};
  for(const color of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${gontaMarkup(d,part)}</g>`).join('')}</svg>`;
}
