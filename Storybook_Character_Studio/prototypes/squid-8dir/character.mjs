import {path,ellipse,line} from '../shared/svg.mjs';
import {DIRECTIONS,LABELS} from '../shared/sheet-format.mjs';
export {DIRECTIONS,LABELS};
export const DEFAULT_PALETTE=Object.freeze({skin:'#edf5fc',light:'#ffffff',shade:'#87b4dd',ink:'#506f8c',mask:'#203f56',sucker:'#b6daec'});
function definitions(){return `<defs>
<radialGradient id="squid-left" cx="35%" cy="26%" r="83%"><stop stop-color="var(--light)"/><stop offset=".62" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--shade)"/></radialGradient>
<radialGradient id="squid-right" cx="65%" cy="26%" r="83%"><stop stop-color="var(--light)"/><stop offset=".62" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--shade)"/></radialGradient>
<linearGradient id="squid-arm" x1="0" x2="1" y2=".2"><stop stop-color="#80b2d9"/><stop offset=".45" stop-color="var(--skin)"/><stop offset=".7" stop-color="#ffffff"/><stop offset="1" stop-color="#b8d5ec"/></linearGradient>
<linearGradient id="squid-fin" x1="0" x2="1" y2="0"><stop stop-color="#88b7df"/><stop offset=".65" stop-color="#e3f0fc"/><stop offset="1" stop-color="#fcfdff"/></linearGradient>
<clipPath id="squid-eye"><path d="M-6-4 Q0-1 6-1 Q6 5 0 5 Q-6 4-6-4Z"/></clipPath>
</defs>`;}
function longArm(frame){
 const d=frame==='a'?'M46 82 C36 87 24 91 22 81 Q19 75 23 69 Q24 66 21 67 C11 75 17 94 30 94 Q41 94 49 88Z'
 :'M46 81 C34 86 21 91 18 80 Q15 71 19 65 Q20 62 17 64 C8 77 16 96 30 95 Q42 94 50 87Z';
 const cups=frame==='a'?[[21,73],[21,78],[23,83],[27,87],[32,88]]:[[16,70],[16,76],[18,82],[23,88],[29,90]];
 return `<g data-part="long-arm">`+path(d,'url(#squid-arm)','var(--ink)',1)
 +cups.map(([x,y])=>ellipse(x,y,1.3,1.8,'var(--sucker)','#5d93b6',.55)+ellipse(x-.2,y-.4,.5,.7,'#f8fcff','none')).join('')+'</g>';
}
function lowerArms(view,frame){
 const spread=frame==='b';
 const roots=view===2?[43,48,53,59,65,70]:[43,50,57,65,73,80];
 const tips=view===2?(spread?[31,40,48,60,74,85]:[36,43,50,61,71,79]):(spread?[25,38,54,73,88,101]:[33,45,57,69,82,93]);
 const heights=[105,109,112,112,109,104];
 return `<g data-part="lower-arms">`+roots.map((x,i)=>{
  const tx=tips[i],y=heights[i],bend=spread?5:0;
  return `<g data-part="arm">`+path(`M${x-5} 82 C${x-4} ${95-bend} ${tx-6} ${y-4} ${tx-3} ${y-1} Q${tx} ${y+2} ${tx+3} ${y-1} C${tx+6} ${y-4} ${x+7} ${95-bend} ${x+5} 83Z`,'url(#squid-arm)','var(--ink)',.9)
   +line(`M${x-2} 88 Q${x-2} ${99-bend} ${tx} ${y-3}`,'#fcfdff',1.1)+'</g>';
 }).join('')+'</g>';
}
function fins(view){
 if(view===2)return `<g data-part="fins">`+path('M65 18 Q76 29 80 54 Q82 61 62 63 Q62 40 65 18Z','url(#squid-fin)','var(--ink)',.95)
  +path('M62 21 Q40 37 31 63 Q34 66 43 64Z','url(#squid-fin)','var(--ink)',.85)+'</g>';
 const tip=view===1?65:view===3?61:63;
 return `<g data-part="fins">`+path(`M${tip} 18 Q39 35 31 57 Q29 62 44 65Z`,'url(#squid-fin)','var(--ink)',.95)
 +path(`M${tip} 18 Q86 36 95 57 Q97 62 81 65Z`,'url(#squid-fin)','var(--ink)',.95)+'</g>';
}
const MANTLES=[
 'M63 17 C56 20 43 47 42 65 L39 84 Q41 88 62 88 Q84 88 86 84 L83 65 C81 45 70 20 63 17Z',
 'M65 17 C57 19 41 45 39 63 L35 83 Q37 88 58 88 Q81 88 84 83 L81 62 C79 43 71 20 65 17Z',
 'M65 18 C57 20 39 43 36 63 L33 82 Q35 89 55 89 Q75 89 78 85 L68 63 Q60 45 65 18Z',
 'M61 17 C51 21 41 46 40 64 L37 83 Q38 88 61 88 Q83 88 86 83 L81 63 C79 44 68 20 61 17Z',
 'M63 17 C55 20 43 46 42 65 L39 83 Q40 88 63 88 Q86 88 87 83 L83 65 C81 46 71 20 63 17Z'];
const OUTLINES=[
 'M39 84 L42 65 C43 47 56 20 63 17 C70 20 81 45 83 65 L86 84',
 'M35 83 L39 63 C41 45 57 19 65 17 C71 20 79 43 81 62 L84 83',
 'M33 82 L36 63 C39 43 57 20 65 18 Q60 45 68 63 L78 85',
 'M37 83 L40 64 C41 46 51 21 61 17 C68 20 79 44 81 63 L86 83',
 'M39 83 L42 65 C43 46 55 20 63 17 C71 20 81 46 83 65 L87 83'];
function eye(x,y,sx=1,flip=false){return `<g data-part="eye" transform="translate(${x} ${y}) scale(${flip?-sx:sx} 1)">`
 +path('M-6-4 Q0-1 6-1 Q6 5 0 5 Q-6 4-6-4Z','#fcffff','var(--mask)',.75)
 +'<g clip-path="url(#squid-eye)">'+ellipse(1,.8,2.6,3.8,'#243f55','none')+ellipse(.3,-.5,.9,1.2,'#faffff','none')+'</g></g>';}
function face(view){
 if(view>=3)return '';
 if(view===2)return `<g data-part="mask">`+path('M35 65 Q39 68 45 66 Q49 70 46 77 Q40 81 34 77Z','var(--mask)','var(--ink)',.65)+eye(40,72,.67,true)+'</g>';
 const front=view===0;
 return `<g data-part="mask">`+path(front?'M46 65 Q53 69 63 69 Q73 69 79 65 Q84 68 82 76 Q80 83 72 81 L63 78 L54 81 Q44 83 43 76 Q42 68 46 65Z':'M39 65 Q45 69 53 69 Q62 69 71 65 Q76 67 75 75 Q72 83 65 80 L56 78 Q45 83 38 79 Q33 73 39 65Z','var(--mask)','var(--ink)',.7)
 +eye(front?52:41,73,front?1:.67)+eye(front?74:65,73,1,true)+line(front?'M58 84 Q63 81 68 84':'M48 84 Q53 81 58 84','#65869f',.8)+'</g>';
}
export function squidMarkup(direction,frame='a'){
 const index=DIRECTIONS.indexOf(direction);
 if(index<0)throw Error(`Unknown direction: ${direction}`);
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 const view=index>4?8-index:index;
 // Rear quarters expose the opposite near fin/arm from front quarters.
 // Mirror the drawing, not the sheet direction; lighting stays screen-left.
 const flip=(index>4)!==(view===3);
 const near=view===2?`<g transform="translate(108 4) scale(-.86 .94)">${longArm(frame)}</g>`:'';
 const curls=view===2?`<g transform="translate(22 6) scale(.58 .93)">${longArm(frame)}</g>`
 :view===1||view===3?`<g transform="translate(12 1) scale(.77 1)">${longArm(frame)}</g><g transform="translate(125 0) scale(-1 1)">${longArm(frame)}</g>`
 :longArm(frame)+`<g transform="translate(126 0) scale(-1 1)">${longArm(frame)}</g>`;
 return `<g data-direction="${direction}" transform="${flip?'translate(126 0) scale(-1 1)':''}">${curls}${lowerArms(view,frame)}${fins(view)}`
 +`<g data-part="mantle">${path(MANTLES[view],`url(#squid-${flip?'right':'left'})`,'none')}${line(OUTLINES[view],'var(--ink)',1)}`
 +line(view===2?'M62 23 Q44 43 39 62':flip?'M67 24 Q77 45 79 61':'M59 24 Q47 46 46 61','#ffffff',1.4)+'</g>'
 +face(view)+near+'</g>';
}
export function buildSquidSheet({frame='a',cellSize=128,palette={}}={}){
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
 const colors={...DEFAULT_PALETTE,...palette};
 for(const c of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(c))throw Error('Invalid palette color');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${squidMarkup(d,frame)}</g>`).join('')}</svg>`;
}
