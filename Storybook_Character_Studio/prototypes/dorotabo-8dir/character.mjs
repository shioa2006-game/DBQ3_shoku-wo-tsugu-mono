import {path,ellipse,line} from '../shared/svg.mjs';
import {DIRECTIONS,LABELS} from '../shared/sheet-format.mjs';
export {DIRECTIONS,LABELS};
export const DEFAULT_PALETTE=Object.freeze({mud:'#a87336',light:'#c59552',shade:'#795020',ink:'#4d351a',cream:'#fae3a0',grass:'#8d8b31',grassLight:'#c6b24d'});
function definitions(){return `<defs>
<radialGradient id="mud-left" cx="30%" cy="25%" r="85%"><stop stop-color="var(--light)"/><stop offset=".62" stop-color="var(--mud)"/><stop offset="1" stop-color="var(--shade)"/></radialGradient>
<radialGradient id="mud-right" cx="70%" cy="25%" r="85%"><stop stop-color="var(--light)"/><stop offset=".62" stop-color="var(--mud)"/><stop offset="1" stop-color="var(--shade)"/></radialGradient>
<linearGradient id="mud-drop" x2=".5" y2="1"><stop stop-color="var(--mud)"/><stop offset=".6" stop-color="var(--light)"/><stop offset="1" stop-color="#96612b"/></linearGradient>
<clipPath id="mud-eye"><path d="M-9-2 Q0-2 9-7 L9 1 Q6 7 0 7 Q-8 7-9-2Z"/></clipPath>
</defs>`;}
function grass(x,y,{height=23,spread=11,flip=false}={}){
 return `<g data-part="grass" transform="translate(${x} ${y}) scale(${flip?-1:1} 1)">`
 +path(`M-2 1 Q-2 ${-height*.65} ${spread*.3} ${-height} Q1 ${-height*.45} 1 1Z`,'var(--grass)','var(--ink)',.65)
 +path(`M0 1 Q${spread*.4} ${-height*.8} ${spread} ${-height*.85} Q${spread*.35} ${-height*.4} 2 1Z`,'var(--grassLight)','var(--ink)',.65)
 +path(`M-1 1 Q${-spread*.8} ${-height*.7} ${-spread} ${-height*.7} Q-4 ${-height*.25} 0 1Z`,'var(--grass)','var(--ink)',.65)
 +line(`M0-2 Q1 ${-height*.5} ${spread*.3} ${-height*.9}`,'#ddd17a',.65)+'</g>';
}
function pool(fill){return `<g data-part="pool">`
 +path('M29 103 Q21 101 18 106 Q9 104 10 111 Q6 116 19 117 Q19 121 31 119 Q38 123 48 119 Q60 123 69 120 Q82 123 91 119 Q102 122 104 116 Q120 118 116 111 Q121 107 109 105 Q105 101 95 105Z',fill,'var(--ink)',1.2)
 +[[16,112,6,2.5],[29,113,7,3],[101,111,8,3.4],[111,113,5,2.2],[46,118,5,2],[83,117,6,2.5]].map(([x,y,rx,ry])=>ellipse(x,y,rx,ry,'#b38444','#93612c',.7)+ellipse(x-1,y-1,rx*.5,ry*.25,'#d1a460','none')).join('')+'</g>';}
const SHAPES=[
 'M29 99 Q26 93 30 87 Q25 82 30 75 Q27 69 32 62 Q31 54 37 49 Q38 40 48 36 Q59 30 73 35 Q87 36 91 50 Q98 55 95 67 Q102 74 97 83 Q104 93 99 102 Q106 108 98 114 Q86 120 64 119 Q43 121 27 114 Q22 108 29 99Z',
 'M25 97 Q23 90 27 84 Q23 78 28 71 Q26 62 32 56 Q32 45 43 40 Q56 31 70 35 Q87 35 93 53 Q99 60 96 71 Q102 82 98 90 Q101 98 97 104 Q106 112 95 116 Q78 121 57 118 Q34 120 24 112 Q20 105 25 97Z',
 'M29 98 Q26 92 30 85 Q25 80 29 74 Q28 66 33 59 Q34 45 47 41 Q59 35 71 40 Q87 42 91 58 Q98 66 95 79 Q100 90 95 101 Q105 110 94 115 Q75 120 53 117 Q33 120 25 112 Q22 106 29 98Z',
 'M30 99 Q26 91 31 84 Q26 76 31 69 Q30 57 37 50 Q38 38 52 36 Q68 31 82 40 Q93 46 94 60 Q100 67 96 77 Q102 86 97 96 Q101 103 98 109 Q105 116 90 118 Q71 121 53 118 Q35 121 25 112 Q23 105 30 99Z',
 'M30 98 Q26 90 30 83 Q26 76 31 68 Q31 56 38 50 Q41 37 55 36 Q70 33 82 42 Q93 49 94 64 Q99 71 95 81 Q101 88 97 98 Q103 106 98 112 Q96 119 77 119 Q61 122 43 118 Q28 120 25 111 Q23 105 30 98Z'];
function drop(x,y,size=1){return `<g transform="translate(${x} ${y}) scale(${size})">`
 +path('M-2-5 Q0-9 1-5 Q0-1 3 1 Q4 6 0 7 Q-5 6-3 2 Q-1-1-2-5Z','url(#mud-drop)','#6e471d',1.05)
 +line('M-1 1 Q-3 5 0 5','#e0ae62',.7)+'</g>';}
function texture(view,flip,clip){
 const drops=view===0?[[35,70,.85],[44,59,.7],[83,48,.55],[90,74,.75],[36,91,.9],[50,99,.8],[83,99,.95],[63,107,.7]]
 :view===1?[[30,64,.8],[74,48,.55],[84,65,.65],[91,88,.9],[37,96,.8],[65,101,.9],[80,110,.6]]
 :view===2?[[41,59,.6],[64,66,.75],[75,54,.55],[87,87,.9],[49,88,.8],[40,105,.8],[64,105,.6]]
 :[[43,59,.65],[64,56,.8],[80,68,.7],[35,79,.8],[53,83,.95],[74,91,.9],[91,89,.75],[41,105,.8],[62,108,.65],[84,107,.8]];
 return `<g clip-path="url(#${clip})">${drops.map(p=>drop(...p)).join('')}`
 +[[47,42,5,2.5],[40,49,2.8,1.7],[78,42,2.1,1.5],[30,106,3,1.2]].map(([x,y,rx,ry])=>ellipse(flip?126-x:x,y,rx,ry,'#edbc74','none',0,'transform="rotate(-24 '+(flip?126-x:x)+' '+y+')" opacity=".8"')).join('')
 +Array.from({length:25},(_,i)=>{const x=31+(i*19+view*7)%64,y=45+(i*23+view*3)%68;return ellipse(x,y,.7+(i%3)*.25,.5+(i%2)*.2,i%2?'#d49d52':'#80511f','none',0,'opacity=".6"');}).join('')+'</g>';
}
function eye(x,y,{sx=1,flip=false}={}){return `<g data-part="eye" transform="translate(${x} ${y}) scale(${flip?-sx:sx} .82)">`
 +path('M-9-2 Q0-2 9-7 L9 1 Q6 7 0 7 Q-8 7-9-2Z','var(--cream)','var(--ink)',1.4)
 +'<g clip-path="url(#mud-eye)">'+ellipse(1,2,2.5,4.3,'#2c2717','none')+'</g>'
 +path('M-10-2 Q-9-9-3-12 Q6-16 9-10 L9-7 Q0-2-9-2Z','var(--mud)','#795020',.7)
 +line('M-9-2 Q0-2 9-7','#5b3b17',1.6)+'</g>';}
function face(view){
 if(view>=3)return '';
 if(view===2)return eye(36,76,{sx:.58,flip:true})+line('M29 91 Q33 88 37 90','#503817',1.25);
 const front=view===0;
 return eye(front?49:35,75,{sx:front?1:.68})+eye(front?79:60,76,{flip:true})
 +line(front?'M55 91 Q63 86 71 91':'M36 91 Q43 87 50 91','#503817',1.4)
 +path(front?'M59 84 Q62 80 65 84':'M40 83 Q43 80 45 84','none','#8b5d28',.9);
}
export function dorotaboMarkup(direction,frame='a'){
 const index=DIRECTIONS.indexOf(direction);
 if(index<0)throw Error(`Unknown direction: ${direction}`);
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 const view=index>4?8-index:index,flip=index>4,clip=`mud-${direction}-${frame}`,fill=`url(#mud-${flip?'right':'left'})`;
 const pose=frame==='b'?'translate(63 120) scale(1.025 .91) translate(-63 -120)':'';
 const sprout=[78,70,48,66,60][view];
 return `<g data-direction="${direction}" transform="${flip?'translate(126 0) scale(-1 1)':''}"><g transform="${pose}">`
 +grass(24,109,{height:25,spread:12,flip:true})+grass(103,109,{height:24,spread:13})+pool(fill)
 +`<defs><clipPath id="${clip}"><path d="${SHAPES[view]}"/></clipPath></defs>`
 +`<g data-part="body">${path(SHAPES[view],fill,'var(--ink)',1.35)}${texture(view,flip,clip)}${drop(view===1?26:30,80,.95)}${drop(96,80,.9)}${drop(30,101,.85)}</g>`
 +face(view)+grass(sprout,view===2?44:37,{height:20,spread:10,flip:view===4})
 +grass(view===2?77:28,113,{height:17,spread:9,flip:true})
 +[[35,113,6,2],[68,117,7,2.1],[92,114,6,2.5]].map(([x,y,rx,ry])=>ellipse(x,y,rx,ry,'#b17e3e','#92632c',.5)+line(`M${x-rx*.5} ${y-1} Q${x} ${y-2} ${x+rx*.5} ${y-1}`,'#c79754',.65)).join('')+'</g></g>';
}
export function buildDorotaboSheet({frame='a',cellSize=128,palette={}}={}){
 if(!['a','b'].includes(frame))throw Error('Unknown frame');
 if(!Number.isInteger(cellSize)||cellSize<128||cellSize>1024)throw Error('cellSize must be an integer from 128 to 1024');
 const colors={...DEFAULT_PALETTE,...palette};
 for(const c of Object.values(colors))if(!/^#[0-9a-f]{6}$/i.test(c))throw Error('Invalid palette color');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';')}">${definitions()}${DIRECTIONS.map((d,i)=>`<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${dorotaboMarkup(d,frame)}</g>`).join('')}</svg>`;
}
