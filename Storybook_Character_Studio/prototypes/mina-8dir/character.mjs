import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { EYE_OPENINGS, eye, nose } from '../shared/face-parts.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

// Mina: chestnut bob, warm brown eyes, ivory collar, teal blouse and brass belt.
// All silhouettes are paths. The original sheet is only used on comparison boards.
export const DEFAULT_PALETTE = Object.freeze({
  ink:'#322720', hair:'#95501e', hairLight:'#d48b40', hairDark:'#482919',
  skin:'#ffce96', skinLight:'#ffe4ba', skinDark:'#d68d57',
  cloth:'#28696a', clothLight:'#508f89', clothDark:'#173f43',
  ivory:'#f4e4bd', ivoryLight:'#fff3d6', ivoryDark:'#bda47c',
  gold:'#b98735', goldLight:'#f7ce73', goldDark:'#725024',
  leather:'#85552b', iris:'#85512b', irisLight:'#ca9851', irisDark:'#30201c',
});

function definitions() {
  const gradient=(id,a,b,c)=>`<linearGradient id="${id}" x1="15%" y1="0%" x2="85%" y2="100%"><stop stop-color="var(--${a})"/><stop offset=".5" stop-color="var(--${b})"/><stop offset="1" stop-color="var(--${c})"/></linearGradient>`;
  return `<defs>${Object.entries(EYE_OPENINGS).map(([name,d])=>`<clipPath id="eye-${name}"><path d="${d}"/></clipPath>`).join('')}
    ${gradient('hair','hairLight','hair','hairDark')}${gradient('cloth','clothLight','cloth','clothDark')}${gradient('ivory','ivoryLight','ivory','ivoryDark')}${gradient('gold','goldLight','gold','goldDark')}
    <radialGradient id="skin" cx="42%" cy="36%" r="75%"><stop stop-color="var(--skinLight)"/><stop offset=".6" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient>
    <linearGradient id="iris" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--irisDark)"/><stop offset=".55" stop-color="var(--iris)"/><stop offset="1" stop-color="var(--irisLight)"/></linearGradient>
    <radialGradient id="crown" cx="38%" cy="18%" r="85%"><stop stop-color="var(--hairLight)"/><stop offset=".4" stop-color="var(--hair)"/><stop offset="1" stop-color="var(--hairDark)"/></radialGradient>
    </defs>`;
}

function button(x,y,size=2.9) {
  return ellipse(x,y,size,size,grad('gold'),'var(--goldDark)',.8)
    + ellipse(x,y,size*.55,size*.55,'var(--leather)','var(--goldLight)',.55)
    + line(`M${x-.55} ${y-.5}L${x+.55} ${y+.5}`, 'var(--goldLight)', .65);
}

// Prototype 06 (2026-11-08): the belt sits at the waist (as on the hero) and the blouse's short skirt
// shows below it down to the old hem, so the figure has hips when it is enlarged. The 3D arms hang at
// the sides, so the torso draws no arm lines; the sides turn away with a soft shade instead. The hem,
// the width and the neck are unchanged, so the rig settings and the game's leg joint stay as they were.
const BELT=100;
function torso(view) {
  const width=[24,22,17,22,24][view],l=63-width,r=63+width,c=view===0?63:view===1?53:49;
  // Blouse: chest, a waist taken in by the belt, and the skirt flaring a little to the old hem.
  const body=`M${l+6} 76 Q63 71 ${r-6} 76 Q${r+1} 82 ${r} 92 Q${r-1} 97 ${r-2} ${BELT} L${r-2} ${BELT+6} Q${r} ${BELT+11} ${r+1} 118 Q63 123 ${l-1} 118 Q${l} ${BELT+11} ${l+2} ${BELT+6} L${l+2} ${BELT} Q${l+1} 97 ${l} 92 Q${l-1} 82 ${l+6} 76Z`;
  let s=path(body,grad('cloth'));
  // Sides turning away (the far side of the diagonal views is the darker one), and the skirt in the
  // shadow of the belt.
  const [near,far]=[[7,7],[4,10],[3,9],[4,10],[7,7]][view];
  s+=`<defs><clipPath id="mina-body-${view}"><path d="${body}"/></clipPath></defs><g clip-path="url(#mina-body-${view})">`
    +path(`M${l-3} 76 Q${l+near} 88 ${l+near-1} ${BELT} L${l+near-2} 124 L${l-3} 124Z`,'var(--clothDark)','none',0,'opacity=".4"')
    +path(`M${r+3} 76 Q${r-far} 88 ${r-far+1} ${BELT} L${r-far+2} 124 L${r+3} 124Z`,'var(--clothDark)','none',0,'opacity=".4"')
    +path(`M${l} ${BELT+6} Q63 ${BELT+9} ${r} ${BELT+6} L${r} ${BELT+9} Q63 ${BELT+12} ${l} ${BELT+9}Z`,'var(--clothDark)','none',0,'opacity=".25"')
    +'</g>';
  if(view===0) {
    s+='<g transform="translate(0 -3)">';
    s+=path(`M${c-10} 72 Q${c} 70 ${c+12} 73 L${c+9} 81 Q${c} 86 ${c-8} 79Z`,grad('skin'),'none');
    s+=path(`M${c-11} 73 Q${c-10} 78 ${c} 81 L${c-5} 86 Q${c-14} 84 ${c-16} 77Z`,grad('ivory'));
    s+=path(`M${c+11} 73 Q${c+8} 79 ${c} 81 L${c+5} 86 Q${c+15} 84 ${c+18} 76Z`,grad('ivory'));
    s+=line(`M${c-10} 74 Q${c} 85 ${c+9} 74`,'var(--goldDark)',.7);
    s+=path(`M${c} 81 l2.4 2.6-2.4 3-2.4-3Z`,grad('gold'),'var(--goldDark)',.7);
    s+='</g>';
    s+=line(`M${c} 85 V${BELT}`,'var(--clothDark)',.65);
    s+=button(c,88.5,2.6)+button(c,95,2.6);
  } else if(view===1) {
    // The throat sits behind the chin; the collar opens diagonally toward the
    // front placket, with a small far leaf and a wider near leaf.
    s+=path('M53 70 Q56 74 59 76 Q57 79 54 81 Q48 80 46 76Z',grad('ivory'));
    s+=path('M76 68 Q69 72 59 76 C60 79 62 81 65 82 Q76 80 81 73Z',grad('ivory'));
    s+=line('M54 72 Q59 78 74 70','var(--goldDark)',.7);
    s+=path('M57 77 l2.1 2.4-2.5 2.7-2-2.6Z',grad('gold'),'var(--goldDark)',.7);
    s+=line(`M${c} 85 V${BELT}`,'var(--clothDark)',.65);
    s+=button(c,88.5,2.6)+button(c,95,2.6);
  } else if(view===2) {
    // Profile collar climbs toward the nape, instead of a horizontal ring.
    s+=path('M53 73 Q64 71 74 67 L78 72 Q70 79 59 82 Q55 82 53 78Z',grad('ivory'));
    s+=path('M51 73 Q55 74 55 78 L51 82 L47 79Z','var(--ivory)','var(--ivoryDark)',.7);
    s+=line('M55 76 Q65 73 73 69','var(--ivoryDark)',.65);
    s+=line('M53 76 Q53 80 49 83','var(--goldDark)',.75);
    s+=ellipse(49.5,84,1.4,2,grad('gold'),'var(--goldDark)',.6);
    s+=button(48.5,88.5,1.7)+button(48.5,95,1.7);
  } else {
    s+=path('M43 75 Q63 69 84 75 L81 80 Q64 85 46 80Z',grad('ivory'));
    s+=line('M49 79 Q64 82 78 78','var(--ivoryDark)',.7);
    s+=line(`M63 84 Q62 92 63 ${BELT}`,'var(--clothDark)',.85);
  }
  // The skirt below the belt: the front opening (or the back seam), two folds and the hem's stitching.
  if(view!==2) s+=line(`M${view<=1?c:63} ${BELT+9} V120`,'var(--clothDark)',.65);
  s+=line(view===2?`M66 ${BELT+9} Q67 114 69 119`:`M${l+9} ${BELT+9} Q${l+8} 114 ${l+6} 119 M${r-9} ${BELT+9} Q${r-8} 114 ${r-6} 119`,'var(--clothDark)',.6);
  s+=line(`M${l} 116.5 Q63 121.5 ${r} 116.5`,'var(--clothLight)',.55);
  // Belt: a little flatter than before, as it now goes round the waist instead of the bust's lower edge.
  s+=path(`M${l+2} ${BELT} Q63 ${BELT+3} ${r-2} ${BELT} L${r-2} ${BELT+6} Q63 ${BELT+9} ${l+2} ${BELT+6}Z`,'var(--leather)');
  s+=line(`M${l+3} ${BELT+1.6} Q63 ${BELT+4.6} ${r-3} ${BELT+1.6} M${l+3} ${BELT+4.6} Q63 ${BELT+7.6} ${r-3} ${BELT+4.6}`,'var(--gold)',.65);
  for(const x of [l+7,l+15,r-15,r-7]) s+=line(`M${x} ${BELT+2} v3`,'var(--goldDark)',.7);
  if(view<=1) s+=path(`M${c-4} ${BELT+.5} h8 v8 h-8Z`,grad('gold'),'var(--goldDark)',.8)
    +path(`M${c-2.3} ${BELT+2.5} h4.6 v4 h-4.6Z`,'var(--leather)','var(--goldDark)',.5)
    +line(`M${c} ${BELT+2} v5`,'var(--goldLight)',.8);
  return s;
}

const BOB = [
  // Front-facing hair has an open neckline: no solid strip below the chin.
  'M32 33 C31 18 45 8 61 8 C81 5 95 21 94 39 Q93 49 98 59 Q99 66 91 68 L86 66 Q86 57 83 50 Q63 46 43 51 L41 65 L36 68 Q27 69 29 61 Q34 48 32 33Z',
  'M33 32 C32 15 47 8 63 8 C84 6 96 24 94 40 Q94 51 99 61 Q99 70 89 73 L83 70 Q79 67 78 60 Q59 48 40 59 L38 66 Q31 66 33 55Z',
  'M33 33 C33 17 44 9 59 8 C81 5 94 20 94 39 Q94 50 99 59 Q101 68 90 72 L85 70 Q78 73 72 68 L70 57 Q56 49 45 48 L40 53Z',
  'M35 29 C36 15 48 8 64 8 C83 8 94 22 94 40 Q94 52 99 61 Q100 70 89 73 L85 71 Q75 78 64 74 Q52 79 41 73 L36 74 Q27 71 30 61 Q35 46 35 29Z',
  'M33 30 C33 16 46 8 63 8 C81 8 94 22 94 39 Q94 52 99 62 Q100 72 89 73 L84 71 Q74 78 63 74 Q51 78 41 72 L36 74 Q27 71 28 63 Q33 47 33 30Z',
];

function bob(view) {
  let s=path(BOB[view],grad('crown'),'#432a1c',1.35)
    +`<defs><clipPath id="bob-${view}"><path d="${BOB[view]}"/></clipPath></defs><g clip-path="url(#bob-${view})">`;
  // Locks curve around the skull and tuck inward at the rounded bob hem.
  const part=view===0?62:view===1?54:view===2?49:view===3?57:62;
  for(let i=0;i<9;i++) {
    const end=35+i*7, start=part+(i-4)*2.3;
    s+=line(`M${start} ${12+Math.abs(i-4)*.6} C${end} 21 ${end+4} 33 ${end+2} 46 Q${end+8} 62 ${end} ${68+((i%3)*1.5)}`,'var(--hairDark)',.7);
    s+=line(`M${start-1} ${15+Math.abs(i-4)} C${end-2} 27 ${end+1} 38 ${end} 48 Q${end+5} 59 ${end-1} 65`,'#c18442',.5);
  }
  s+=line(`M${part-4} 11 Q${part+7} 8 ${part+15} 16`,'#e4a455',.9);
  return s+'</g>';
}

const warmEye=(x,y,options={})=>eye(x,y,{size:.76,irisStroke:'#5c351e',pupil:'#291c18',glint:'#d4a465',...options});
function face(view) {
  if(view===4) return '';
  if(view===3) return path('M35 47 Q31 46 32 53 Q32 58 36 58 Q34 53 35 47Z',grad('skin'),'#603b27',.8)
    +line('M34 49 Q32.5 51 34 54','var(--skinDark)',.6);
  let s=path(view===0?'M42 29 Q64 21 84 31 C87 43 85 53 81.5 58.5 C77 64 69.5 67 63 67 C55 67 47 63.5 43 58.5 C39 53 38 41 42 29Z'
    :view===1?'M37 30 Q57 22 79 33 L81 52 C78.8 60 69.5 65 60 67 C51 68 43 64.5 39.5 59 C36.5 53 35.5 43 37 30Z'
    :'M37 30 Q55 22 76 34 L77 52 Q70 57 65 60 C58 65 51 67 45 66.5 C40.5 66 38 63.5 36.8 60 Q35.5 58.5 35.5 57 Q29 55 32 53 Q35 50 36 46Z',grad('skin'));
  if(view===0) {
    s+=ellipse(39,52,3.7,5.5,grad('skin'))+ellipse(86,52,3.7,5.5,grad('skin'));
    s+=warmEye(52,50)+warmEye(74,50,{nose:-1});
    s+=line('M46 40 Q50 38 56 40 M69 40 Q74 38 79 40','#624020',1.1);
    s+=nose(63,58)+line('M58 61.5 Q63 64 68 61.5','#884c32',.9);
    s+=ellipse(45,58,2.6,1,'#efae81','none',0,'opacity=".5"')+ellipse(81,58,2.6,1,'#efae81','none',0,'opacity=".5"');
  } else if(view===1) {
    s+=warmEye(43,49,{width:.66,view:'far'})+warmEye(62,50,{nose:-1,view:'near'});
    s+=line('M39 40 Q42 38 46 40 M56 40 Q62 38 67 40','#624020',1.1);
    s+=nose(47.5,57.5,-1)+line('M47 61.5 Q52 63.5 57 61.1','#884c32',.9);
    s+=ellipse(79,52,4.4,6.2,grad('skin'))+line('M80 49 Q76 48 77 55','var(--skinDark)',.9);
    s+=ellipse(70,58.5,2.6,1,'#efae81','none',0,'opacity=".5"');
  } else {
    s+=warmEye(43,48.5,{width:.77,nose:-1,view:'side'});
    s+=line('M38 39 Q43 37 48 40','#624020',1.1);
    s+=line('M36.5 60 Q39 61 41 59.8','#884c32',.8);
    s+=path('M66 46 Q74 43 74 51 Q73 58 66 58 L63 54Z',grad('skin'))
      +line('M68 49 Q64 48 66 54','var(--skinDark)',.9);
  }
  // Shorten the profile without pulling the jaw away from the collar.
  // The reference three-quarter face is already close in height; narrow it
  // gently instead of applying the stronger profile reduction.
  if(view===1)return `<g transform="translate(66 67) scale(.94 .98) translate(-66 -67)">${s}</g>`;
  return view===2?`<g transform="translate(68 66.5) scale(.90 .94) translate(-68 -66.5)">${s}</g>`:s;
}

// The fringe and temple are one continuous surface, rooted at the crown.
// Fine curved grooves describe locks without outlined leaves pasted on the face.
function fringe(view) {
  if(view>=3) return '';
  const outlines=[
    'M35 37 C34 23 46 10 61 10 C78 9 89 24 88 40 Q89 51 83 60 L80 63 Q82 49 79 36 L76 40 Q72 34 70 29 Q69 38 65 42 L62 35 L58 43 Q54 36 54 30 L50 39 Q46 36 46 30 Q42 34 40 43 Q39 52 42 63 L38 61 Q32 51 35 37Z',
    'M34 37 C33 21 45 10 59 10 C76 10 88 23 87 41 Q86 45 84 47 Q81 43 77.5 46 Q76 49 76 54 Q75 59 74 62 L72.5 58 Q75 48 75 38 L72 40 Q68 34 67 28 Q64 36 61 40 L58 34 L54 42 Q51 35 51 29 L46 37 Q42 35 43 29 Q39 34 38 41 L35 46Z',
    'M35 36 C34 22 42 12 54 10 C70 9 82 20 87 34 Q82 42 75 48 Q72 44 66 46 C64 54 62 59 59 62 L55 64 Q59 52 57 42 L53 34 L50 39 Q47 35 46 29 Q41 34 40 43 L37 40 L33 44Z',
  ];
  const grooves=[
    ['M60 13 Q42 18 38 37 Q34 48 39 58','M60 14 Q46 22 48 34','M61 15 Q53 23 58 38','M63 15 Q68 23 65 37','M65 14 Q76 21 76 34','M66 13 Q87 22 84 43 Q86 53 82 58'],
    ['M57 13 Q40 18 36 36','M57 15 Q44 22 45 33','M58 15 Q50 22 54 37','M60 14 Q66 23 61 36','M61 13 Q75 20 72 35','M62 12 Q84 23 82 42 Q80 54 76 60'],
    ['M53 13 Q40 18 36 35','M54 15 Q45 22 48 34','M56 13 Q62 21 61 34 Q63 49 58 59','M58 12 Q75 19 80 32'],
  ];
  let s=path(outlines[view],grad('crown'),'#54301b',.9)
    +`<defs><clipPath id="fringe-${view}"><path d="${outlines[view]}"/></clipPath></defs><g clip-path="url(#fringe-${view})">`;
  const part=[61,58,54][view];
  for(let i=0;i<14;i++) {
    const end=34+i*4,root=part+(i-6)*.65,y= i<2||i>10?59:43;
    s+=line(`M${root} 13 C${end-2} 19 ${end-3} 32 ${end} ${y}`,'#78411f',.5);
    s+=line(`M${root+1} 16 C${end} 22 ${end-1} 31 ${end+1} ${y-4}`,'#bb7d3c',.4);
  }
  for(const d of grooves[view]) s+=line(d,'#69391d',.8);
  const highlights=[
    ['M52 16 Q40 25 39 34','M58 18 Q54 24 56 30','M66 17 Q74 23 74 29','M76 20 Q84 32 82 43'],
    ['M50 16 Q39 24 38 32','M56 17 Q51 24 53 30','M64 17 Q74 23 73 29','M76 23 Q81 35 78 46'],
    ['M48 16 Q40 23 38 31','M57 17 Q61 25 60 35 Q62 45 59 52','M66 17 Q76 23 80 30'],
  ];
  for(const d of highlights[view]) s+=line(d,'#c48745',.85);
  return s+'</g>';
}

export function minaMarkup(direction, part = 'combined') {
  if(!['combined','head','torso'].includes(part)) throw Error(`Unknown part: ${part}`);
  const index=DIRECTIONS.indexOf(direction);
  if(index<0) throw Error(`Unknown direction: ${direction}`);
  const mirror=index>4,view=mirror?8-index:index;
  const neckShapes=[
    'M55 61 H71 L73 76 Q63 81 53 76Z',
    'M64 60 L75 58 Q73 66 76 70 L59 78 L54 74 Q61 67 64 60Z',
    'M61 61 L72 59 Q71 66 74 70 Q66 74 55 77 L53 73 Q59 68 61 61Z',
  ];
  let neck=path(neckShapes[view]??'M54 61 H72 L74 77 Q63 84 51 77Z',grad('skin'));
  if(view===1) neck+=path('M63 63 Q68 62 74 59 L72 66 Q65 69 58 73Z','#cf8b55','none',0,'opacity=".35"');
  if(view===2) neck+=path('M61 63 L70 60 L68 66 Q63 68 57 72Z','#cf8b55','none',0,'opacity=".35"');
  // From the front the neck and collar occlude the rear hair. From behind the
  // bob still sits over the collar, matching the original view-dependent overlap.
  const layers=view===0?bob(view)+neck+torso(view):view<=2?neck+bob(view)+torso(view):torso(view)+neck+bob(view);
  // Runtime parts have explicit ownership: head = hair/face; torso = neck/clothes.
  // Cropping the combined sheet twice would include the collar in both meshes.
  const headArt=bob(view)+face(view)+fringe(view);
  const head=view===2?`<g transform="translate(63 67) scale(.96 .97) translate(-63 -67)">${headArt}</g>`:headArt;
  const content=part==='head'?head
    :view===2?(part==='torso'?neck+torso(view):neck+torso(view)+head)
    :part==='torso'?neck+torso(view):layers+face(view)+fringe(view);
  return `<g ${mirror?'transform="translate(126 0) scale(-1 1)"':''}>${content}</g>`;
}
export function buildMinaSheet({cellSize=128,palette={},part='combined'}={}) {
  if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024) throw Error('cellSize must be an integer from 128 to 1024');
  const colors={...DEFAULT_PALETTE,...palette};
  for(const value of Object.values(colors)) if(!/^#[0-9a-f]{6}$/i.test(value)) throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${minaMarkup(d,part)}</g>`).join('')}</svg>`;
}
