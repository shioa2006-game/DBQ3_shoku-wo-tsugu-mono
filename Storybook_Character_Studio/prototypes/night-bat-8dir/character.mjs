import {path,ellipse,line} from '../shared/svg.mjs';
import {DIRECTIONS,LABELS} from '../shared/sheet-format.mjs';
export {DIRECTIONS,LABELS};
export const DEFAULT_PALETTE=Object.freeze({body:'#263759',light:'#3d537b',dark:'#19253f',wing:'#8850a3',wingLight:'#ae71bf',inner:'#b97cbc',ink:'#131b30',eye:'#ffd842'});
function definitions(){return `<defs>
<radialGradient id="fur" cx="30%" cy="25%" r="85%"><stop stop-color="var(--light)"/><stop offset=".55" stop-color="var(--body)"/><stop offset="1" stop-color="var(--dark)"/></radialGradient>
<linearGradient id="membrane" x2=".3" y2="1"><stop stop-color="var(--wingLight)"/><stop offset="1" stop-color="var(--wing)"/></linearGradient>
<linearGradient id="ear" x2="1" y2=".2"><stop stop-color="#764d8a"/><stop offset=".5" stop-color="var(--inner)"/><stop offset="1" stop-color="#764a85"/></linearGradient>
<clipPath id="bat-eye"><path d="M-4-6 Q-1-2 4-1 C6 4 2 7-1 6 C-5 5-6 0-4-6Z"/></clipPath>
</defs>`;}
function eye(x,y,sx=1,flip=false){return `<g data-part="eye" transform="translate(${x} ${y}) scale(${flip?-sx:sx} 1)">`
 +path('M-4-6 Q-1-2 4-1 C6 4 2 7-1 6 C-5 5-6 0-4-6Z','var(--eye)','var(--ink)',.9)
 +'<g clip-path="url(#bat-eye)">'+ellipse(1,-.5,1.9,4,'#141c30','none')+ellipse(.2,-2,1,1.3,'#fffbe0','none')+'</g></g>';}
function wing(frame,back=false){
 // Extend both root edges into the torso before directional transforms.
 // A lifts the wrist; B lowers the membrane. The body and feet do not squash.
 const b=frame==='b',tip=b?93:82,elbow=b?77:70;
 return `<g data-part="wing">`+path(`M58 80 Q34 ${elbow-5} 25 ${elbow+5} Q19 ${tip-5} 18 ${tip} Q26 ${tip-3} 29 ${tip+7} Q35 ${tip+2} 40 ${tip+11} Q42 91 58 92Z`,back?'#71418d':'url(#membrane)','var(--ink)',1.4)
 +line(`M58 81 Q34 ${elbow-3} 25 ${elbow+5} L18 ${tip}`,'#4e3b6b',1.4)
 +line(`M25 ${elbow+5} Q30 ${tip-7} 29 ${tip+7}`,'#322947',1.1)
 +line(`M25 ${elbow+5} Q38 ${tip-6} 40 ${tip+11}`,'#322947',1.1)
 +line(`M27 ${elbow+5} Q35 ${elbow+2} 43 79`,'#cf94cf',.65)
 +path(`M28 ${elbow+1} Q27 ${elbow-5} 24 ${elbow-4} L25 ${elbow+4}Z`,'var(--body)','var(--ink)',.8)+'</g>';
}
function ears(view){
 if(view===2)return path('M60 65 Q62 43 77 30 Q77 53 67 70Z','url(#fur)')+path('M64 60 Q67 43 75 35 Q73 53 66 63Z','url(#ear)','none')
  +path('M47 67 Q45 52 49 46 Q57 56 57 66Z','var(--dark)');
 const rear=view>=3;
 return path('M48 73 Q38 63 39 48 Q51 54 58 68Z','url(#fur)')
  +(!rear?path('M47 68 Q41 59 42 52 Q51 59 53 68Z','url(#ear)','none'):'')
  +path('M67 68 Q73 54 87 47 Q85 65 76 74Z','url(#fur)')
  +(!rear?path('M73 67 Q77 57 84 52 Q82 64 76 69Z','url(#ear)','none'):'')
  +line('M40 49 Q40 59 46 66','#597098',.6)+line('M84 50 Q80 54 77 57','#6c719c',.65);
}
function feet(view){return `<g data-part="feet">`+[view===2?57:56,view===2?65:69].map(x=>path(`M${x-3} 98 L${x-3} 105 L${x} 103 L${x+2} 106 L${x+4} 100Z`,'#61416f','var(--ink)',.8)).join('')+'</g>';}
function body(view){
 const shapes=[
 'M47 68 L51 64 L55 65 L59 62 L62 65 L67 63 Q81 67 82 82 Q84 95 73 100 Q63 105 51 99 Q40 92 43 81Z',
 'M44 69 L48 64 L52 65 L56 62 L59 64 Q76 61 81 76 Q88 93 74 100 Q60 106 46 98 Q37 91 39 81Z',
 'M43 65 Q52 58 64 62 Q78 66 77 83 Q77 98 62 101 Q49 103 40 95 Q34 88 37 78 L35 76Z',
 'M47 65 Q58 60 69 67 Q80 69 82 84 Q85 98 71 102 Q53 106 44 96 Q38 84 47 65Z',
 'M48 66 Q62 61 76 67 Q85 79 82 92 Q79 105 63 104 Q46 104 43 92 Q40 78 48 66Z'];
 return `<g data-part="body">`+path(shapes[view],'url(#fur)','var(--ink)',1.3)
  +line(view===2?'M39 79 Q38 91 49 96':'M46 83 Q44 94 55 98','#34466a',1.1)
  +(view>=3?line('M53 74 Q63 70 73 76','#405477',.8):'')+'</g>';
}
function face(view){
 if(view>=3)return '';
 if(view===2)return eye(40,80,.68)+path('M37 91 Q40 94 44 92','none','#c36586',.9);
 const front=view===0;
 return eye(front?53:46,84,front?1:.68)+eye(front?73:66,83,1,true)
  +path(front?'M57 94 Q63 98 69 93 Q65 102 59 98Z':'M48 94 Q54 98 61 94 Q56 101 50 98Z','#a74368','var(--ink)',.8)
  +path(front?'M58 95 L60 98 L61 96Z':'M49 95 L51 98 L52 96Z','#fff4d9','none')
  +ellipse(front?63:54,90,1.8,1,'#101b31','none');
}
export function batMarkup(direction,frame='a'){
 const index=DIRECTIONS.indexOf(direction);
 if(index<0)throw Error(`Unknown direction: ${direction}`);
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 const view=index>4?8-index:index,back=view>=3;
 let wings;
 if(view===2)wings=`<g transform="translate(119 2) scale(-1 .98)">${wing(frame,back)}</g>`;
 else if(view===1||view===3)wings=`<g transform="translate(10 7) scale(.74 .92)">${wing(frame,back)}</g><g transform="translate(133 0) scale(-1 1)">${wing(frame,back)}</g>`;
 else wings=`<g transform="translate(63 0) scale(.9 1) translate(-63 0)">${wing(frame,back)}<g transform="translate(126 0) scale(-1 1)">${wing(frame,back)}</g></g>`;
 return `<g data-direction="${direction}" transform="${index>4?'translate(126 0) scale(-1 1)':''}">${wings}${feet(view)}${ears(view)}<g transform="translate(60 83) scale(.94 .87) translate(-60 -83)">${body(view)}${face(view)}${view===2?path('M65 69 Q73 74 68 79 Q66 80 65 77','var(--body)','#26334f',.7):''}</g></g>`;
}
export function buildBatSheet({frame='a',cellSize=128,palette={}}={}){
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
 const colors={...DEFAULT_PALETTE,...palette};
 for(const c of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(c))throw Error('Invalid palette color');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${batMarkup(d,frame)}</g>`).join('')}</svg>`;
}
