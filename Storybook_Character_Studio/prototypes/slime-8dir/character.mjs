import {path,ellipse,line} from '../shared/svg.mjs';
import {DIRECTIONS,LABELS} from '../shared/sheet-format.mjs';
export {DIRECTIONS,LABELS};
export const DEFAULT_PALETTE=Object.freeze({body:'#5548ed',light:'#9795ff',dark:'#3022ab',ink:'#262151',iris:'#8b21c2',cheek:'#f466e5'});
// The upper eye edge follows the eyebrow's underside, so every eye layer
// stays below the brow in all mirrored views and both squash poses.
const EYE_OPENING='M-10-9 Q-1-6 9-3 C12 4 5 12-3 9 Q-12 7-10-9Z';
function definitions(){return `<defs><clipPath id="slime-eye"><path d="${EYE_OPENING}"/></clipPath>
<radialGradient id="jelly" cx="36%" cy="28%" r="79%"><stop stop-color="var(--light)"/><stop offset=".63" stop-color="var(--body)"/><stop offset=".85" stop-color="var(--dark)"/><stop offset="1" stop-color="#201776"/></radialGradient>
<linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff6ff"/><stop offset="1" stop-color="#9d83e7"/></linearGradient>
<radialGradient id="cheek"><stop stop-color="#ffacff"/><stop offset="1" stop-color="var(--cheek)"/></radialGradient>
<linearGradient id="iris" x2="0" y2="1"><stop stop-color="#3b145d"/><stop offset="1" stop-color="var(--iris)"/></linearGradient>
</defs>`;}
function slimeEye(x,y,{sx=1,sy=1,flip=false}={}){
  const opening=EYE_OPENING;
  return `<g transform="translate(${x} ${y}) scale(${(flip?-sx:sx)*1.14} ${sy*1.14})">`
    +path(opening,'#fffaf4','#27213b',1.1)
    +'<g clip-path="url(#slime-eye)">'+ellipse(1.8,-.1,5.1,8,'url(#iris)','#2c1239',.7)
    +ellipse(2,-1.4,2.8,5.9,'#160f27','none')
    +ellipse(-.1,-4.1,1.7,2.3,'#ffffff','none')
    +'</g>'+path('M-11-12 Q-1-9 10-5 L9-3 Q-1-6-10-9Z','#211b30','none')+'</g>';
}
function expression(view){
  if(view>=3)return '';
  if(view===0)return slimeEye(44,81)+slimeEye(83,81,{flip:true})
    +ellipse(33,98,8.2,3.7,'url(#cheek)','none')+ellipse(94,98,8.2,3.7,'url(#cheek)','none')
    +ellipse(31,97,3.5,1.1,'#ffd9ff','none')+ellipse(92,97,3.5,1.1,'#ffd9ff','none')
    +line('M50 102 Q63 111 76 102','#231745',1.25);
  if(view===1)return slimeEye(27,79,{sx:.68,sy:.97})+slimeEye(61,81,{flip:true,sx:1.03})
    +ellipse(19,96,4.7,3.1,'url(#cheek)','none')+ellipse(73,98,9.3,3.8,'url(#cheek)','none')
    +ellipse(70,97,4,1.2,'#ffd9ff','none')+line('M29 100 Q41 107 54 101','#231745',1.2);
  return slimeEye(24,80,{sx:.61,sy:.98,flip:true})
    +ellipse(29,97,7.2,3.2,'url(#cheek)','none')+ellipse(27,96,3,1,'#ffd9ff','none');
}
export function slimeMarkup(direction,frame='a'){
  const i=DIRECTIONS.indexOf(direction);
  if(i<0)throw Error(`Unknown direction: ${direction}`);
  if(!['a','b'].includes(frame))throw Error(`Unknown frame: ${frame}`);
  const view=i>4?8-i:i,sign=i>4?-1:1;
  const tip=63+[0,1,3,2,0][view]*sign,w=[51,52,51,52,51][view];
  const shape=`M${tip} 21 C${tip-8} 20 ${tip-5} 36 ${tip-16} 46 C${63-w+4} 61 ${63-w} 80 ${63-w} 97 C${63-w} 113 34 119 63 119 C92 119 ${63+w} 113 ${63+w} 97 C${63+w} 78 ${63+w-5} 61 ${tip+16} 46 C${tip+4} 35 ${tip+7} 21 ${tip} 21Z`;
  const clip=`slime-${direction}-${frame}`;
  // Both poses keep the same base: squash around the ground, not the center.
  const pose=frame==='b'?'translate(63 119) scale(1.055 .9) translate(-63 -119)':'';
  let out=`<g transform="${pose}">`+path(shape,'url(#jelly)','var(--ink)',2)
    +`<defs><clipPath id="${clip}"><path d="${shape}"/></clipPath></defs><g clip-path="url(#${clip})">`
    +path(shape,'none','url(#rim)',1.2,'opacity=".5"')
    +path('M17 94 Q21 109 46 113 Q74 120 102 109 Q94 120 61 121 Q24 120 17 104Z','#8b75f1','none',0,'opacity=".35"')
    +ellipse(39,59,12,5.3,'#faf5ff','none',0,'transform="rotate(-40 39 59)"')
    +ellipse(53,43,6.5,2.7,'#ffffff','none',0,'transform="rotate(-54 53 43)"')
    +line(`M${tip-2} 25 Q${tip-2} 32 ${tip-5} 37`,'#fefaff',2.4)
    +ellipse(29,76,5.7,3,'#bfc0ff','none',0,'transform="rotate(-55 29 76)" opacity=".85"')
    +ellipse(96,65,9.2,4,'#b6a6ff','none',0,'transform="rotate(48 96 65)" opacity=".66"')
    +ellipse(105,83,5.3,2.6,'#a598ff','none',0,'transform="rotate(67 105 83)" opacity=".55"')
    +path('M108 99 Q108 108 99 111 Q104 102 108 99Z','#9c86f4','none',0,'opacity=".5"');
  out+=`<g ${i>4?'transform="translate(126 0) scale(-1 1)"':''}>${expression(view)}</g></g></g>`;
  return out;
}
export function buildSlimeSheet({frame='a',cellSize=128,palette={}}={}){
  if(!['a','b'].includes(frame))throw Error('Unknown frame');
  if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
  const colors={...DEFAULT_PALETTE,...palette};
  for(const c of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(c))throw Error('Invalid palette color');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${slimeMarkup(d,frame)}</g>`).join('')}</svg>`;
}
