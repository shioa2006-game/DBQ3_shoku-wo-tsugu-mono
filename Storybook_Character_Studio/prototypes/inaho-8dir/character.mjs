import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { EYE_OPENINGS, eye, nose } from '../shared/face-parts.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

// Inaho: soft pleated toque, straight black bob, red kerchief and ochre tunic.
// Reference pixels are used only by the exporter comparison, never by this art.
export const DEFAULT_PALETTE=Object.freeze({
  ink:'#36291e',skin:'#f5c591',skinLight:'#ffe5b6',skinDark:'#cf905c',
  hair:'#202222',hairLight:'#49443a',hairDark:'#101617',
  cream:'#f3e4c9',creamLight:'#fff8e7',creamDark:'#c9b298',
  cloth:'#ce9635',clothLight:'#f2c15c',clothDark:'#8e5c1e',
  red:'#ca3822',redLight:'#f66c35',redDark:'#83251b',
  gold:'#c18b37',goldLight:'#f5d275',goldDark:'#785126',leather:'#73471f',
  iris:'#34362b',irisLight:'#9e8b52',irisDark:'#111b1f',
});
function definitions(){
  const gradient=(id)=>`<linearGradient id="${id}" x1="20%" y1="0%" x2="85%" y2="100%"><stop stop-color="var(--${id}Light)"/><stop offset=".5" stop-color="var(--${id})"/><stop offset="1" stop-color="var(--${id}Dark)"/></linearGradient>`;
  return `<defs>${Object.entries(EYE_OPENINGS).map(([id,d])=>`<clipPath id="eye-${id}"><path d="${d}"/></clipPath>`).join('')}${['hair','cream','cloth','red','gold','iris'].map(gradient).join('')}
    <radialGradient id="skin" cx="40%" cy="30%" r="80%"><stop stop-color="var(--skinLight)"/><stop offset=".65" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient></defs>`;
}
function button(x,y,rx=1.6){
  return ellipse(x,y,rx,1.8,'var(--leather)','var(--goldDark)',.65)+ellipse(x-.3,y-.5,rx*.4,.55,'var(--goldLight)','none');
}
function neckcloth(view){
  if(view===0)return path('M49 72 Q62 80 77 72 L75 79 L65 85 L58 83 L49 77Z',grad('red'),'#64281c',.9)
    +path('M60 82 Q55 84 54 94 L60 91 L63 85 L68 93 L72 91 Q70 85 65 82Z',grad('red'),'#64281c',.9)
    +path('M60 80 L66 80 L67 85 L62 87 L59 84Z',grad('red'),'#64281c',.8)
    +line('M51 75 L59 80 M74 75 L67 80 M58 86 L57 91 M67 86 L69 89','#ff9860',.8);
  if(view===1)return path('M47 73 Q58 79 74 70 L77 75 Q64 83 54 83 L47 78Z',grad('red'),'#64281c',.9)
    +path('M53 80 Q48 84 47 92 L53 90 L57 84 L60 92 L64 89 L59 81Z',grad('red'),'#64281c',.8)
    +path('M53 79 L59 79 L60 84 L55 86 L52 83Z',grad('red'),'#64281c',.8)
    +line('M62 78 L73 73 M55 82 L57 83 M50 87 L49 90','#ff9860',.8);
  if(view===2)return path('M49 74 Q59 76 73 69 L76 74 Q61 82 51 81Z',grad('red'),'#64281c',.9)
    +path('M49 79 L54 79 L54 84 L50 85 L47 92 L47 84Z',grad('red'),'#64281c',.8)
    +line('M55 77 Q63 76 72 72','#ff9860',.8);
  const cx=view===3?65:63;
  return path('M45 73 Q63 69 81 73 L80 79 Q62 82 46 79Z',grad('red'),'#64281c',.8)
    +`<g transform="translate(${cx} 78)">`
    +path('M-2 0 Q-11-6-15 0 Q-17 6-5 7 L-9 15 L-3 13 L1 5 L6 15 L11 13 L5 5 Q17 5 14-1 Q10-6 2 0Z',grad('red'),'#64281c',.8)
    +line('M-12 0 L-4 3 M4 2 L11-1 M-5 9 L-6 12 M5 8 L8 12','#ff9860',.8)
    +path('M-3-2 Q0-4 3-1 L3 5 Q0 7-3 5Z',grad('red'),'#64281c',.8)+'</g>';
}
function torso(view){
  const width=[23,21,16,21,23][view],l=63-width,r=63+width;
  const neck=[
    'M55 65 H71 L74 77 Q63 83 52 77Z',
    'M60 65 L73 62 L75 75 L55 81 L51 76Z',
    'M61 64 L71 62 L74 73 L56 80 L52 75Z',
  ][view]??'M53 64 H74 L77 78 Q63 82 50 78Z';
  let s=path(neck,grad('skin'),'#765036',.8)
    +path(`M${l+4} 77 Q63 73 ${r-4} 77 Q${r+1} 87 ${r} 99 L${r-1} 118 Q63 123 ${l+1} 118 L${l} 99 Q${l-1} 86 ${l+4} 77Z`,grad('cloth'));
  // Ivory shoulder tabs belong to the garment, and overlap the 3D sleeves.
  if(view<=1){
    s+=path(`M${r-8} 78 Q${r+2} 77 ${r} 89 L${r-5} 93 L${r-8} 85Z`,grad('cream'),'#84643d',.8);
    if(view===0)s+=path(`M${l+8} 78 Q${l-2} 77 ${l} 89 L${l+5} 93 L${l+8} 85Z`,grad('cream'),'#84643d',.8);
  }else if(view===2)s+=path('M65 78 Q77 76 77 88 L72 93 Q66 88 65 78Z',grad('cream'),'#84643d',.8);
  const c=[63,55,49][view];
  if(view<=2){
    const w=view===2?4:9;
    s+=path(`M${c-w} 80 Q${c} 83 ${c+w} 80 L${c+w-1} 111 Q${c} 114 ${c-w+1} 111Z`,grad('cream'),'#aa7732',.8)
      +line(`M${c+2} 88 V111`,'#c4a476',.6);
    for(const y of [94,104])s+=button(c+2,y,view===2?1.1:1.7);
    s+=line(`M${l+4} 97 L${l+5} 109 M${r-4} 97 L${r-5} 109`,'var(--clothDark)',.8);
  }else s+=line('M63 83 Q61 96 64 110 M47 102 Q63 108 79 102','var(--clothDark)',.8);
  s+=neckcloth(view);
  s+=path(`M${l+1} 111 Q63 116 ${r-1} 111 L${r-1} 118 Q63 122 ${l+1} 118Z`,'var(--leather)')
    +line(`M${l+3} 113 Q63 118 ${r-3} 113`,'var(--gold)',.8);
  if(view<=2)s+=path(`M${c-3.5} 113 h7 v6 h-7Z`,grad('gold'),'var(--goldDark)',.8)
    +path(`M${c-1.8} 114.5 h3.6 v3 h-3.6Z`,'var(--leather)','none')+line(`M${c} 114 v4`,'var(--goldLight)',.7);
  return s;
}
const HAIR=[
  'M36 43 Q36 25 63 26 Q89 26 90 46 L91 65 Q90 73 83 74 L79 69 L79 54 Q63 49 47 55 L46 69 L41 74 Q34 72 35 64Z',
  'M35 42 Q39 26 63 27 Q88 28 90 48 L91 64 Q92 71 85 74 L79 72 L76 66 L75 53 Q58 47 42 54 L41 67 Q34 66 35 59Z',
  'M38 40 Q46 26 68 29 Q90 32 92 49 L92 64 Q90 72 84 73 L80 71 Q75 75 70 70 L67 56 L45 49Z',
  'M37 40 Q61 26 88 40 L91 61 Q92 72 85 74 L79 72 Q73 77 66 73 Q58 77 52 73 L46 75 Q37 72 36 63Z',
  'M36 40 Q63 27 90 40 L91 61 Q91 73 84 74 L79 72 Q71 77 64 73 Q56 77 50 73 L44 75 Q35 72 35 62Z',
];
function hair(view){
  let s=path(HAIR[view],grad('hair'),'#161c1b',1)
    +`<defs><clipPath id="inaho-bob-${view}"><path d="${HAIR[view]}"/></clipPath></defs><g clip-path="url(#inaho-bob-${view})">`;
  for(let x=39;x<90;x+=4.6)s+=line(`M${x-1} 39 Q${x+4} 54 ${x} 70`,'#5b5241',.55)
    +line(`M${x+1} 46 Q${x+5} 60 ${x+2} 73`,'#121817',.65);
  return s+'</g>';
}
const inahoEye=(x,y,options={})=>eye(x,y,{size:.71,irisStroke:'#444031',pupil:'#111c1d',glint:'#b0a776',...options});
function face(view){
  if(view===4)return '';
  if(view===3)return path('M37 54 Q32 52 33 58 Q34 63 39 62Z',grad('skin'),'#785034',.8);
  const outline=[
    'M44 39 Q63 32 81 40 Q86 52 79 62 Q73 69 63 70 Q53 69 47 63 Q40 55 44 39Z',
    'M41 40 Q59 33 77 41 L79 53 Q77 62 67 67 Q57 72 48 67 Q40 63 40 55Z',
    'M43 40 Q58 34 74 44 L74 54 Q66 60 60 65 Q53 70 47 68 Q42 66 41 61 L40 58 Q35 57 36 55 L40 52Z',
  ][view];
  let s=path(outline,grad('skin'),'#785034',.9);
  if(view===0)s+=ellipse(42,57,3.3,4.7,grad('skin'),'#785034',.8)+ellipse(84,57,3.3,4.7,grad('skin'),'#785034',.8)
    +inahoEye(53,55)+inahoEye(73,55,{nose:-1})+nose(63,61.5)
    +line('M48 45 Q53 43 57 45 M68 45 Q73 43 77 45','#282722',1.1)
    +line('M59 65 Q63 67 67 64.8','#a35e3e',.8);
  if(view===1)s+=inahoEye(46,54.5,{width:.65,view:'far'})+inahoEye(63,55,{nose:-1,view:'near'})
    +ellipse(78.5,55.5,3.6,5,grad('skin'),'#785034',.8)+line('M79 53 Q76 52 77 57','#c48654',.8)
    +line('M42 45 Q46 44 50 46 M58 45 Q63 43 67 46','#282722',1.05)
    +nose(51,61.5,-1)+line('M50 65 Q55 67 59 64.8','#a35e3e',.8);
  if(view===2)s+=inahoEye(46.5,53.8,{width:.73,nose:-1,view:'side'})
    +path('M66 51 Q73 47 73 55 Q71 61 66 60 L64 56Z',grad('skin'),'#785034',.8)
    +line('M69 52 Q66 51 67 57','#c48654',.8)
    +line('M43 45 Q47 43 51 46','#282722',1.05)+line('M41 62 Q44 63.5 47 62','#a35e3e',.75);
  if(view===1)return `<g transform="translate(68 69) scale(.94 .96) translate(-68 -69)">${s}</g>`;
  if(view===2)return `<g transform="translate(68 68) scale(.88 .94) translate(-68 -68)">${s}</g>`;
  return s;
}
function fringe(view){
  if(view>=3)return '';
  const outline=[
    'M39 36 Q63 28 87 38 L85 53 L81 63 L79 60 L80 44 L76 48 L74 40 L69 48 L66 39 L63 49 L60 40 L56 49 L54 40 L50 47 L48 41 Q43 46 44 61 L41 65 L38 56Z',
    'M36 36 Q57 29 83 38 L84 46 L80 49 L76 46 L74 58 L72 62 L71 57 L73 45 L68 41 L66 49 L62 40 L58 49 L55 40 L51 47 L48 41 L43 48 L41 42 L39 55 L36 55Z',
    'M39 36 Q57 29 80 41 L77 49 L72 50 L67 49 L64 60 L61 63 L61 55 L63 45 L59 41 L56 48 L52 40 L48 47 L46 41 L41 49 L39 45Z',
  ][view];
  let s=path(outline,grad('hair'),'#161c1b',.85)
    +`<defs><clipPath id="inaho-fringe-${view}"><path d="${outline}"/></clipPath></defs><g clip-path="url(#inaho-fringe-${view})">`;
  for(let x=40;x<85;x+=5)s+=line(`M${x+3} 34 Q${x-1} 40 ${x} 47`,'#73634b',.55);
  return s+'</g>';
}
function toque(view){
  const crown=[
    'M34 29 Q28 23 35 17 Q35 10 45 9 Q49 3 58 7 Q65 2 73 7 Q82 5 87 13 Q97 16 94 24 Q98 32 89 36 Q65 42 37 35Z',
    'M33 27 Q29 20 38 15 Q39 7 48 9 Q55 2 65 8 Q74 5 80 12 Q90 11 93 22 Q100 28 94 35 Q91 43 82 41 L38 34Z',
    'M35 25 Q31 17 41 14 Q45 5 53 9 Q62 4 70 12 Q81 10 86 21 Q96 24 94 33 Q99 42 90 45 Q83 47 76 42 L40 33Z',
    'M35 28 Q30 19 39 14 Q41 6 51 9 Q60 3 69 10 Q80 7 87 17 Q96 20 93 30 Q100 40 89 45 Q78 53 63 48 Q48 49 38 41Z',
    'M34 28 Q29 19 38 15 Q40 7 50 9 Q60 3 69 9 Q80 7 87 16 Q98 20 94 30 Q99 38 89 44 Q79 51 63 47 Q49 50 38 41Z',
  ][view];
  let s=path(crown,grad('cream'),'#90765c',1);
  const folds=[
    'M37 20 Q33 28 43 30 Q48 29 46 19 M49 12 Q44 23 54 27 Q61 28 60 16 M67 12 Q74 23 65 27 M81 16 Q87 27 77 30 M89 24 Q92 30 85 32',
    'M39 17 Q35 25 43 29 M48 11 Q44 23 54 27 Q61 28 61 18 M67 13 Q75 25 67 29 M80 18 Q89 30 79 34 M91 28 Q94 35 87 36',
    'M42 17 Q37 24 46 29 M53 12 Q47 23 56 29 Q63 31 64 22 M71 17 Q82 30 73 34 M85 27 Q91 37 84 39',
    'M39 21 Q35 31 45 36 M51 13 Q43 29 56 37 Q63 39 64 28 M72 16 Q84 28 76 38 M88 25 Q93 36 86 39 M57 40 Q65 47 74 42',
    'M39 21 Q34 30 45 36 M50 13 Q43 28 54 36 Q63 39 63 28 M73 14 Q84 27 76 36 M88 24 Q93 35 85 39 M54 39 Q63 45 74 39',
  ][view];
  s+=line(folds,'#c4ac90',.85)+line(view<3?'M44 13 Q48 9 53 11 M59 9 Q65 7 70 11':'M43 15 Q50 10 55 12 M61 10 Q67 9 72 13','#fffaf0',1.4);
  const band=[
    'M36 30 Q63 23 91 31 L88 40 Q62 32 38 40Z',
    'M35 29 Q58 25 91 37 L87 44 Q61 34 37 38Z',
    'M37 28 Q59 28 90 41 L86 47 Q61 37 39 37Z',
    'M37 35 Q61 48 91 39 L88 47 Q64 55 39 43Z',
    'M36 35 Q63 47 91 36 L89 45 Q64 54 38 44Z',
  ][view];
  return s+path(band,grad('cream'),'#90765c',.9)
    +line(view===0?'M40 36 Q63 29 87 36':view===1?'M40 34 Q61 30 85 40':view===2?'M43 34 Q62 33 83 43':view===3?'M42 41 Q65 51 85 44':'M42 42 Q64 50 85 42','#fff8e7',.8);
}
export function inahoMarkup(direction,part='combined'){
  const index=DIRECTIONS.indexOf(direction);
  if(index<0)throw Error(`Unknown direction: ${direction}`);
  if(!['combined','head','torso'].includes(part))throw Error(`Unknown part: ${part}`);
  const mirror=index>4,view=mirror?8-index:index;
  const head=hair(view)+face(view)+fringe(view)+toque(view);
  const content=part==='head'?head:part==='torso'?torso(view):torso(view)+head;
  return `<g ${mirror?'transform="translate(126 0) scale(-1 1)"':''}>${content}</g>`;
}
export function buildInahoSheet({cellSize=128,palette={},part='combined'}={}){
  if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
  const colors={...DEFAULT_PALETTE,...palette};
  for(const color of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${inahoMarkup(d,part)}</g>`).join('')}</svg>`;
}
