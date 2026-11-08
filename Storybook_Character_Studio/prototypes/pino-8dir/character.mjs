import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { WAIST_BELT, waistOutline, waistShade, waistBeltBand, waistBeltStitch } from '../shared/waist.mjs';
import { EYE_OPENINGS, eye, nose } from '../shared/face-parts.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

// Pino, the carpenter apprentice. Authored paths only; reference pixels are
// confined to the comparison board, never included in these output sheets.
export const DEFAULT_PALETTE=Object.freeze({
  ink:'#30251d',skin:'#f5c28b',skinLight:'#ffe1ae',skinDark:'#ce8c54',
  hair:'#171d22',hairLight:'#3b4145',hairDark:'#0c1015',
  cap:'#263e61',capLight:'#3b577d',capDark:'#15253e',
  cloth:'#94401f',clothLight:'#b75a2c',clothDark:'#592511',
  ivory:'#e8d3a5',ivoryLight:'#fff0c9',ivoryDark:'#b49b70',
  gold:'#bc8839',goldLight:'#edc46d',goldDark:'#684521',leather:'#694020',
  iris:'#3d3930',irisLight:'#9b8557',irisDark:'#111c25',
});
function definitions(){
  const gradient=(id,a,b,c)=>`<linearGradient id="${id}" x1="15%" y1="0%" x2="85%" y2="100%"><stop stop-color="var(--${a})"/><stop offset=".5" stop-color="var(--${b})"/><stop offset="1" stop-color="var(--${c})"/></linearGradient>`;
  return `<defs>${Object.entries(EYE_OPENINGS).map(([id,d])=>`<clipPath id="eye-${id}"><path d="${d}"/></clipPath>`).join('')}
    ${['cap','hair','cloth','ivory','gold'].map(id=>gradient(id,`${id}Light`,id,`${id}Dark`)).join('')}
    <radialGradient id="skin" cx="40%" cy="30%" r="80%"><stop stop-color="var(--skinLight)"/><stop offset=".6" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient>
    ${gradient('iris','irisDark','iris','irisLight')}</defs>`;
}
function button(x,y,r=3.3){
  return ellipse(x,y,r,r,grad('gold'),'var(--goldDark)',.8)
    +ellipse(x,y,r*.56,r*.56,'var(--leather)','var(--goldLight)',.55)
    +line(`M${x-.4} ${y-.5}l.8 1`,'var(--goldLight)',.55);
}
// Prototype 02 (2026-11-08): the belt sits at the waist and the jacket's skirt shows below it down to the old
// hem (shared/waist.mjs). The 3D arms hang at the sides, so the torso draws no arm lines; the sides are shaded.
function torso(view){
  const width=[22,21,16,21,22][view],l=63-width,r=63+width,B=WAIST_BELT;
  const throat=[
    'M55 63 H71 L73 77 Q63 84 53 77Z',
    'M61 64 L74 60 Q72 67 75 73 L57 80 L53 75Z',
    'M61 62 L72 59 Q70 65 74 72 Q64 78 54 79 L52 74Z',
  ][view]??'M54 62 H72 L75 78 Q64 82 51 78Z';
  let s=path(throat,grad('skin'),'#70442b',.85);
  const body=waistOutline(l,r,{top:77,crown:72,inset:5,bulge:1,pinch:1.5,hem:124});
  s+=path(body,grad('cloth'))+waistShade(`pino-body-${view}`,body,l,r,view,{color:'var(--clothDark)'});
  if(view===0){
    s+=path('M52 72 Q63 77 75 72 L80 77 L69 85 L63 81 L56 85 L46 77Z',grad('ivory'),'#6f5436',.9)
      +line('M51 75 L61 80 M75 75 L65 80','var(--ivoryDark)',.85)
      +path('M61 82 Q56 85 55 91 L60 95 L64 85Z',grad('ivory'),'#6f5436',.8)
      +path('M65 82 Q71 84 72 89 L69 93 L63 86Z',grad('ivory'),'#6f5436',.8)
      +path('M61 80 Q64 79 67 82 L65 87 L60 85Z',grad('ivory'),'#6f5436',.9)
      +line('M59 88 L60 91 M68 86 L69 89','var(--ivoryDark)',.7)
      +line(`M63 94 V${B}`,'var(--clothDark)',.8)+button(63,97,2.3);
  }else if(view===1){
    s+=path('M49 74 L57 78 Q64 76 75 70 L79 75 Q69 82 59 84 L53 82 L47 78Z',grad('ivory'),'#6f5436',.9)
      +line('M60 80 Q69 78 76 73','var(--ivoryDark)',.8)
      +path('M55 81 Q49 85 49 91 L53 94 L59 85Z',grad('ivory'),'#6f5436',.8)
      +path('M58 82 Q64 86 63 91 L60 93 L56 85Z',grad('ivory'),'#6f5436',.8)
      +path('M54 80 L60 81 L59 86 L54 86Z',grad('ivory'),'#6f5436',.8)
      +line(`M54 94 V${B}`,'var(--clothDark)',.8)+button(54,97,2.3);
  }else if(view===2){
    s+=path('M50 74 Q60 76 74 69 L78 74 Q65 82 54 83 L49 79Z',grad('ivory'),'#6f5436',.9)
      +line('M55 78 Q65 77 74 72','var(--ivoryDark)',.8)
      +path('M50 81 L54 83 L52 94 L48 91Z',grad('ivory'),'#6f5436',.8)
      +path('M49 80 L54 80 L54 85 L49 85Z',grad('ivory'),'#6f5436',.8)
      +button(48,97,1.5);
  }else{
    s+=path('M44 75 Q63 69 82 75 L80 81 Q64 84 46 80Z',grad('ivory'),'#6f5436',.85)
      +line('M48 77 Q63 80 78 77','var(--ivoryDark)',.8)
      +line(`M63 84 Q62 92 63 ${B}`,'var(--clothDark)',.8);
  }
  // The jacket below the belt: the front opening with one more button (the back seam), two folds and the
  // hem's stitching.
  const c=[63,54,48,63,63][view];
  if(view!==2)s+=line(`M${c} ${B+9} V120`,'var(--clothDark)',.8);
  if(view<=2)s+=button(c,112.5,view===2?1.5:2.3);
  s+=line(view===2?`M66 ${B+9} Q67 114 69 119`:`M${l+9} ${B+9} Q${l+8} 114 ${l+6} 119 M${r-9} ${B+9} Q${r-8} 114 ${r-6} 119`,'var(--clothDark)',.6)
    +line(`M${l} 116.5 Q63 121.5 ${r} 116.5`,'var(--clothLight)',.55);
  s+=path(waistBeltBand(l+1.5,r-1.5,B),'var(--leather)')
    +line(`M${l+2.5} ${B+2} Q63 ${B+5} ${r-2.5} ${B+2}`,'var(--gold)',.7);
  for(const x of [l+7,l+14,r-14,r-7])s+=line(`M${x} ${B+2.5} v3`,'var(--goldDark)',.7);
  if(view<=2){
    const x=[63,54,48][view],w=view===2?2:4;
    s+=ellipse(x,B+4,w+1,4.2,grad('gold'),'var(--goldDark)',.8)
      +ellipse(x,B+4,w-.5,2.5,'var(--leather)','var(--goldLight)',.65)
      +line(`M${x} ${B+2} v4`,'var(--gold)',.8);
  }
  return s;
}
function hairBack(view){
  const outline=[
    'M38 39 Q40 24 64 28 Q85 27 88 43 Q87 48 93 52 L88 53 L93 57 L87 57 L88 61 L82 65 L82 52 Q63 46 43 53 L43 64 L38 61 L39 57 L33 57 L38 53 L33 52 Q39 48 38 39Z',
    'M35 39 Q41 25 66 27 Q87 29 88 46 L85 65 L81 69 L78 64 L75 67 L72 61 Q58 49 39 54Z',
    'M37 37 Q46 24 70 29 Q91 33 90 51 L86 67 L82 71 L80 67 L76 70 L74 65 L68 67 L67 55 L44 48Z',
    'M36 40 Q61 25 87 39 L89 58 L85 70 L81 69 L77 73 L73 70 L68 73 L63 70 L57 72 L54 68 L49 71 L45 65 L39 65Z',
    'M38 40 Q63 29 88 40 L88 58 L84 69 L80 68 L76 73 L72 70 L66 73 L63 70 L57 73 L53 69 L48 71 L45 67 L41 68 L38 60Z',
  ][view];
  let s=path(outline,grad('hair'),'#12171c',1)
    +`<defs><clipPath id="pino-hair-${view}"><path d="${outline}"/></clipPath></defs><g clip-path="url(#pino-hair-${view})">`;
  for(let i=0;i<9;i++){
    const x=42+i*5,end=65+(i%3)*2;
    s+=line(`M${x-5} 40 C${x+1} 47 ${x+3} 57 ${x-2} ${end}`,'var(--hairLight)',.65);
    s+=line(`M${x-2} 49 Q${x+4} 61 ${x} ${end+2}`,'var(--hairDark)',.8);
  }
  return s+'</g>';
}
const pinoEye=(x,y,options={})=>eye(x,y,{size:.79,irisStroke:'#343632',pupil:'#0d171e',glint:'#a5a582',...options});
function face(view){
  if(view===4)return '';
  if(view===3)return path('M37 54 Q31 51 33 58 Q34 63 39 63Z',grad('skin'),'#744729',.85);
  const outline=[
    'M43 36 Q64 28 82 38 C86 46 84 57 81 62 C77 68 70 71 63 71 C55 71 48 68 44 62 C40 56 39 45 43 36Z',
    'M38 37 Q58 29 78 38 L81 54 C79 63 70 69 61 71 C52 72 44 68 40 62 C37 56 35 45 38 37Z',
    'M38 36 Q57 29 76 39 L77 54 Q68 58 63 63 C57 68 50 71 44 70 C40 69 37 66 36 62 L36 59 Q30 58 32 55 L36 52Z',
  ][view];
  let s=path(outline,grad('skin'),'#77482b',1);
  if(view===0){
    s+=ellipse(40,57,3.5,5,grad('skin'),'#77482b',.9)+ellipse(86,57,3.5,5,grad('skin'),'#77482b',.9)
      +pinoEye(52,55)+pinoEye(74,55,{nose:-1})
      +line('M46 44 Q51 42 56 44 M69 44 Q75 42 79 45','#242321',1.5)
      +nose(63,62)+line('M58 66 Q63 68 68 65.8','#8e5433',.85);
  }else if(view===1){
    s+=pinoEye(43,54,{width:.68,view:'far'})+pinoEye(62,55,{nose:-1,view:'near'})
      +line('M39 44 Q43 42 47 44 M56 44 Q62 42 67 45','#242321',1.45)
      +nose(48,62,-1)+line('M47 66 Q52 68 57 65.5','#8e5433',.8)
      +ellipse(80,56,4.2,5.5,grad('skin'),'#77482b',.85)+line('M81 54 Q77 52 78 58','#bf804d',.85);
  }else{
    s+=pinoEye(43,53,{width:.76,nose:-1,view:'side'})+line('M38 43 Q43 41 48 44','#242321',1.5)
      +line('M36.5 64 Q40 65.5 42 63.8','#8e5433',.8)
      +path('M66 50 Q74 47 74 55 Q73 62 66 62 L63 58Z',grad('skin'),'#77482b',.9)
      +line('M68 53 Q64 52 66 58','#bf804d',.85);
  }
  // Keep the ear/jaw attachment fixed while shortening the profile's muzzle
  // and cheek. Hair remains rooted at the skull, rather than moving with skin.
  if(view===1)return `<g transform="translate(68 71) scale(.91 .92) translate(-68 -71)">${s}</g>`;
  return view===2?`<g transform="translate(70 70) scale(.86 .92) translate(-70 -70)">${s}</g>`:s;
}
function fringe(view){
  if(view>=3)return '';
  const outline=[
    'M39 36 Q60 27 86 37 L86 52 L82 61 L80 55 L80 43 L76 46 L74 39 Q69 46 66 49 L65 39 Q61 46 57 48 L58 38 Q52 40 49 47 L48 40 Q42 46 42 55 L39 52Z',
    'M35 36 Q55 28 82 38 L84 47 L80 50 L77 48 L75 60 L72 63 L73 47 L70 41 L66 46 L65 38 Q60 45 56 48 L57 38 Q49 41 47 46 L46 40 L39 49 L37 45Z',
    'M34 36 Q55 27 78 40 L77 48 L72 51 L67 50 L64 61 L61 63 L62 49 L58 41 L54 46 L53 39 L46 45 L45 39 L38 48 L37 42 L33 45Z',
  ][view];
  let s=path(outline,grad('hair'),'#12171c',.95)
    +`<defs><clipPath id="pino-fringe-${view}"><path d="${outline}"/></clipPath></defs><g clip-path="url(#pino-fringe-${view})">`;
  for(let x=40;x<85;x+=6)s+=line(`M${x+4} 33 Q${x-1} 39 ${x} 47`,'var(--hairLight)',.7);
  return s+'</g>';
}
function cap(view){
  // Five crown silhouettes: side/back have their own volume over the occiput.
  const crown=[
    'M33 32 Q36 21 50 16 Q64 10 77 18 Q89 23 94 34 Q97 39 90 42 Q64 45 36 42 Q30 38 33 32Z',
    'M31 31 Q38 18 54 15 Q69 12 82 23 Q96 32 97 42 Q97 48 86 48 Q65 40 34 39Z',
    'M31 31 Q37 19 52 15 C67 11 81 21 92 34 Q101 44 94 49 Q88 57 78 53 L51 42 L32 38Z',
    'M35 28 Q43 16 60 15 Q79 16 91 30 Q101 43 94 53 Q87 64 66 62 Q45 59 35 48 Q29 38 35 28Z',
    'M34 29 Q42 17 60 15 Q79 15 92 30 Q99 39 92 52 Q82 64 62 63 Q43 61 34 51 Q28 39 34 29Z',
  ][view];
  let s=path(crown,grad('cap'),'#142038',1.35);
  const seams=[
    'M62 16 Q60 24 61 31 M62 16 Q45 22 37 32 M62 16 Q80 22 91 34',
    'M54 16 Q58 24 63 33 M54 16 Q77 24 91 40 M54 16 Q40 22 35 30',
    'M52 16 Q64 24 74 39 Q83 48 91 48 M52 16 Q41 24 36 32 M52 16 Q74 18 87 32',
    'M60 17 Q61 35 64 55 M60 17 Q40 29 36 43 M60 17 Q85 27 93 45',
    'M61 17 Q62 36 62 57 M61 17 Q40 28 35 46 M61 17 Q85 28 91 46',
  ][view];
  s+=line(seams,'#203351',.8);
  if(view>=3){
    s+=path(view===4?'M34 47 Q61 66 93 47 L90 54 Q65 70 37 54Z':'M34 43 Q61 64 96 46 L92 54 Q66 67 37 51Z','#1b2d48','#142038',.8)
      +line(view===4?'M38 51 Q63 66 88 53':'M39 49 Q65 64 91 51','#425c7c',.75);
  }else{
    const band=['M34 35 Q63 27 93 36 L90 42 Q63 34 36 42Z','M32 33 Q58 29 93 43 L89 48 Q62 37 33 40Z','M33 33 Q56 31 92 48 L88 53 Q62 41 35 40Z'][view];
    s+=path(band,'#1b2d48','#142038',.85);
    const visor=['M35 40 Q63 32 90 40 Q76 44 63 41 Q47 44 35 43Z','M30 38 Q48 32 72 40 Q62 45 48 42 L29 43Z','M30 36 Q44 33 57 40 Q44 44 29 42 L26 40Z'][view];
    s+=path(visor,grad('cap'),'#142038',1)
      +line(view===0?'M39 39 Q62 34 85 39':view===1?'M33 38 Q48 35 64 40':'M31 37 Q42 35 50 39','#496181',.65);
  }
  return s;
}
export function pinoMarkup(direction,part='combined'){
  const index=DIRECTIONS.indexOf(direction);
  if(index<0)throw Error(`Unknown direction: ${direction}`);
  if(!['combined','head','torso'].includes(part))throw Error(`Unknown part: ${part}`);
  const mirror=index>4,view=mirror?8-index:index;
  const headArt=hairBack(view)+face(view)+fringe(view)+cap(view);
  const head=view===2?`<g transform="translate(63 70) scale(.94 .96) translate(-63 -70)">${headArt}</g>`
    :view===1?`<g transform="translate(63 71) scale(.98 .99) translate(-63 -71)">${headArt}</g>`:headArt;
  const content=part==='head'?head:part==='torso'?torso(view):torso(view)+head;
  return `<g ${mirror?'transform="translate(126 0) scale(-1 1)"':''}>${content}</g>`;
}
export function buildPinoSheet({cellSize=128,palette={},part='combined'}={}){
  if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
  const colors={...DEFAULT_PALETTE,...palette};
  for(const color of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${pinoMarkup(d,part)}</g>`).join('')}</svg>`;
}
