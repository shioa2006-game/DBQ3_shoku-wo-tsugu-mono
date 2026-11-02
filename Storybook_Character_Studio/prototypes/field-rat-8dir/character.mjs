import {path,ellipse,line} from '../shared/svg.mjs';
import {DIRECTIONS,LABELS} from '../shared/sheet-format.mjs';
export {DIRECTIONS,LABELS};
export const DEFAULT_PALETTE=Object.freeze({fur:'#929493',light:'#b4b5b1',shade:'#686d70',ink:'#393a39',pink:'#e69a92',pinkShade:'#b96966',ivory:'#fff0ce',eye:'#eac44e'});
function definitions(){return `<defs>
<radialGradient id="rat-fur" cx="32%" cy="20%" r="85%"><stop stop-color="var(--light)"/><stop offset=".62" stop-color="var(--fur)"/><stop offset="1" stop-color="var(--shade)"/></radialGradient>
<radialGradient id="rat-ear" cx="30%" cy="25%"><stop stop-color="#f7b9af"/><stop offset="1" stop-color="var(--pinkShade)"/></radialGradient>
<linearGradient id="rat-muzzle" x2="0" y2="1"><stop stop-color="#c1c1b9"/><stop offset="1" stop-color="#9a9c95"/></linearGradient>
<clipPath id="rat-eye"><path d="M-5-5 Q-1-2 5-1 Q5 5 1 5 Q-5 4-5-5Z"/></clipPath>
</defs>`;}
function ear(x,y,rx=10,ry=11,front=true,angle=0){return `<g transform="rotate(${angle} ${x} ${y})">`
 +ellipse(x,y,rx,ry,'url(#rat-fur)','var(--ink)',1.1)
 +path(`M${x-rx+1.8} ${y+2} Q${x-rx-1} ${y-ry+1} ${x} ${y-ry+1.5} Q${x+rx-2} ${y-ry+1} ${x+rx-1} ${y-1}`,'none','#deddd1',1.2)
 +(front?ellipse(x,y+1,rx-3,ry-3,'url(#rat-ear)','#815e5a',.7):'')+'</g>';}
function eye(x,y,sx=1,flip=false){return `<g data-part="eye" transform="translate(${x} ${y}) scale(${flip?-sx:sx} 1)">`
 +path('M-5-5 Q-1-2 5-1 Q5 5 1 5 Q-5 4-5-5Z','#faf5dd','var(--ink)',1)
 +'<g clip-path="url(#rat-eye)">'+ellipse(1.5,1,2.8,4,'var(--eye)','none')+ellipse(2,0,1.3,3.4,'#242726','none')+ellipse(1,-1.4,.7,.9,'#fffbed','none')+'</g>'
 +line('M-5-5 Q-1-2 5-1','#39372e',1.2)+'</g>';}
function tail(view,frame){
 const low=frame==='b';
 const d=view===4?(low?'M64 113 C59 121 74 122 87 119 Q101 118 102 107':'M64 113 C58 119 74 123 89 118 Q103 114 102 104')
 :view===2?(low?'M78 111 Q94 110 104 115 Q110 118 112 118':'M78 111 Q102 119 109 110 Q112 106 111 103')
 :(low?'M77 111 Q101 124 104 107 Q104 103 102 100':'M77 111 Q100 120 103 105 Q104 101 101 98');
 // A broad root stays beneath the rump. Rings share the same curved centerline.
 return `<g data-part="tail">`+line(d,'#815e5b',6.2)+line(d,'var(--pink)',4.6)
 +path(d,'none','#b77570',4,'stroke-dasharray=".7 3"')+path(d,'none','#ffd0bc',1,'transform="translate(0 -.7)" opacity=".65"')+'</g>';
}
function feet(view){
 // In profile, the rump hides the far foot; only the near grounded foot is visible.
 const positions=view===2?[40]:view===3?[39,79]:[37,78];
 return `<g data-part="feet">`+positions.map(x=>ellipse(x,118,7,2.7,'var(--pink)','#694e49',.9)+line(`M${x-3} 117 L${x-4} 120 M${x} 117 L${x} 120 M${x+3} 117 L${x+4} 120`,'#b76e65',.6)).join('')+'</g>';
}
function ears(view,near=false){
if(near)return view===1?ear(76,67,10,11,true,20):view===2?ear(62,67,8.5,11,true,16):view===3?ear(49,66,9,11,false,-18):'';

 if(view===0)return ear(37,66,10,11,true,-18)+ear(80,66,10,11,true,18);
 if(view===1)return ear(39,66,7,10,true,-12);
 if(view===2)return ear(41,69,5,8,false);
 if(view===3)return ear(77,66,7,9,false,14);
 return ear(38,65,9,10,false,-18)+ear(79,65,9,10,false,18);
}
function body(view){
 const shapes=[
 'M39 76 Q43 66 52 66 L55 62 L56 66 L61 63 L61 66 Q74 65 80 78 Q90 91 90 104 Q91 116 75 119 Q57 122 40 118 Q26 116 28 101 Q28 86 39 76Z',
 'M34 80 Q39 68 49 67 L51 63 L53 67 L58 64 L58 67 Q75 64 83 81 Q94 100 86 112 Q78 122 55 119 Q36 121 28 108 Q24 97 34 80Z',
 'M34 81 Q41 68 54 65 L57 62 L58 65 Q78 65 85 84 Q94 102 86 112 Q81 120 61 119 Q41 120 31 110 Q27 105 29 98 L25 93 L29 88Z',
 'M43 73 Q52 66 61 66 L62 63 L65 67 Q78 69 84 84 Q95 108 85 115 Q68 123 42 118 Q30 116 30 103 Q32 86 43 73Z',
 'M43 73 Q49 67 57 67 L58 64 L62 67 Q73 67 80 81 Q94 104 87 115 Q78 123 57 121 Q34 121 30 111 Q26 99 43 73Z'];
 return `<g data-part="body">`+path(shapes[view],'url(#rat-fur)','var(--ink)',1.25)
 +line(view===2?'M38 79 Q30 92 33 101':view>=3?'M43 80 Q32 97 34 108':'M37 82 Q29 95 33 106','#c1c2b9',.8)
 +path(view===2?'M82 98 Q88 114 65 116 Q80 113 82 98Z':'M83 99 Q87 115 67 117 Q81 113 83 99Z','#5c6367','none',0,'opacity=".23"')
 +(view>=3?ellipse(49,77,4,2.2,'#e2e0d6','none',0,'transform="rotate(-38 49 77)" opacity=".8"'):'')+'</g>';
}
function paw(x,y,flip=false){return `<g data-part="paw" transform="translate(${x} ${y}) scale(${flip?-1:1} 1)">`
 +path('M-5-5 Q3-8 6-1 L3 4 Q-3 6-6 2Z','var(--fur)','var(--ink)',.8)
 +ellipse(1,2,3.6,3,'var(--pink)','#815b55',.65)
 +line('M-1 1 L-2 3 M1 1 L1 4 M3 1 L3 3','#b07169',.55)+'</g>';}
function whiskers(x,y,side=1,short=false){const len=short?8:13;return `<g data-part="whiskers">`+[-3,0,3].map((dy,i)=>line(`M${x} ${y+dy} Q${x+side*6} ${y+dy-2} ${x+side*len} ${y+(i-1)*5}`, '#4b4c47',.65)).join('')+'</g>';}
function teeth(x,y,sx=1){return `<g data-part="teeth" transform="translate(${x} ${y}) scale(${sx} 1)">`
 +path('M-7 0 Q0-2 7 0 L6 11 Q0 13-6 11Z','var(--ivory)','#6a5d48',.9)
 +line('M0 0 L0 11','#99866a',.8)+line('M-5 1 L-5 8','#fffcef',1)+'</g>';}
function face(view){
 if(view>=3)return view===3?paw(34,105)+whiskers(35,92,-1,true):'';
 // Profile eye sits inside the cheek, with its pupil directed toward the nose.
 if(view===2)return eye(39,85,.65,true)+ellipse(32,95,6,4,'url(#rat-muzzle)','none')
  +path('M26 90 Q29 88 32 91 Q29 95 26 93Z','var(--pink)','#654b46',.7)
  +teeth(31,98,.42)+whiskers(29,94,-1,true)+paw(43,106);
 const front=view===0,cx=front?58:45;
 return eye(front?47:36,85,front?1:.63)+eye(front?70:57,85,1,true)
  +ellipse(cx,99,front?13:11,6.5,'url(#rat-muzzle)','none')
  +path(`M${cx-5} 92 Q${cx} 89 ${cx+5} 92 Q${cx+3} 97 ${cx} 97 Q${cx-3} 96 ${cx-5} 92Z`,'var(--pink)','#634b46',.8)
  +line(`M${cx} 97 L${cx} 100 M${cx-8} 101 Q${cx} 104 ${cx+8} 101`,'#635e53',.7)
  +teeth(cx,100,front?1:.88)+whiskers(front?40:31,95,-1,!front)+whiskers(front?76:63,95,1)
  +paw(front?36:29,106)+paw(front?81:72,106,true);
}
export function ratMarkup(direction,frame='a'){
 const index=DIRECTIONS.indexOf(direction);
 if(index<0)throw Error(`Unknown direction: ${direction}`);
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 const view=index>4?8-index:index;
 const pose=frame==='b'?'translate(58 118) scale(1.045 .92) translate(-58 -118)':'';
 // Grounded feet and tail remain outside the small breathing/crouch transform.
 return `<g data-direction="${direction}" transform="${index>4?'translate(126 0) scale(-1 1)':''}">${view<3?tail(view,frame):''}${feet(view)}<g transform="${pose}">${ears(view)}${body(view)}${ears(view,true)}${face(view)}</g>${view>=3?tail(view,frame):''}</g>`;
}
export function buildRatSheet({frame='a',cellSize=128,palette={}}={}){
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
 const colors={...DEFAULT_PALETTE,...palette};
 for(const c of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(c))throw Error('Invalid palette color');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${ratMarkup(d,frame)}</g>`).join('')}</svg>`;
}
