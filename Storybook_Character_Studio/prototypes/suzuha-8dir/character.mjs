import { path, ellipse, line, defs, eye, ear, buildSheet, clipped, DIRECTIONS, LABELS } from '../shared/ch67-art.mjs';
export { DIRECTIONS, LABELS };
const palette={ink:'#453129',skinLight:'#ffdfad',skin:'#f5c796',skinDark:'#d49d6d',hairLight:'#936c58',hair:'#735041',hairDark:'#4c362e',clothLight:'#ab7e82',cloth:'#8e656c',clothDark:'#684951',apronLight:'#f8ebd2',apron:'#ead7b9',apronDark:'#cbb495',ivoryLight:'#fff2dc',ivory:'#eddcc2',ivoryDark:'#cbb598'};
const skin='url(#skin)',hair='url(#hair)',cloth='url(#cloth)',apron='url(#apron)',ivory='url(#ivory)';
const faces=[
 'M38 29 Q43 18 63 21 Q84 20 89 33 L87 52 Q83 65 63 69 Q43 66 39 54Z',
 'M36 29 Q44 20 61 23 Q81 24 85 42 L80 54 Q70 65 53 69 Q40 69 35 58 L34 43Z',
 'M40 26 Q56 23 71 34 L78 49 Q69 61 58 65 L51 69 L42 68 Q37 65 36 59 L33 56 Q31 53 35 50 L36 46 L35 35Z',
 'M40 31 Q57 25 74 36 L80 53 Q68 65 55 68 Q45 66 41 57Z',''
];
const crowns=[
 'M34 49 C27 39 31 29 34 25 C34 16 46 10 54 8 Q67 3 74 11 C86 11 95 26 94 36 C98 47 89 58 81 60 L78 48 Q82 36 76 26 Q68 20 62 25 Q56 19 50 27 L42 43 L42 56Z',
 'M34 51 C27 41 31 28 36 23 C37 14 49 7 60 7 Q68 7 72 12 C86 12 96 27 94 39 Q98 50 85 62 L75 57 L78 45 Q74 32 66 25 L61 25 Q51 19 44 30 L38 47 L38 57Z',
 'M36 43 C28 32 32 22 40 18 C44 10 57 6 68 8 C82 9 92 20 94 33 Q99 46 88 57 Q81 67 65 65 L58 57 Q68 52 67 45 Q54 42 46 29 Q42 24 40 29 L38 41Z',
 'M39 39 C31 30 34 19 47 13 C56 5 73 7 82 14 Q97 24 95 40 Q96 55 79 65 L61 65 Q50 61 49 52 L45 46Z',
 'M32 40 C28 28 36 15 47 12 C55 4 70 5 78 11 C90 14 96 28 94 40 Q97 52 85 60 Q80 67 64 68 Q45 67 38 59 Q30 53 32 40Z'
];
function bun(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">`+path('M-10 -5 Q-13 3 -7 8 Q0 13 8 8 Q15 2 10 -6 Q1 -11 -10 -5Z',hair,'#48332b',1)+line('M-7 -4 Q-10 5 -3 7 M-1 -7 Q4 -1 -1 8 M5 -5 Q12 2 5 7','#594034',1)+line('M-7 -5 Q-4 -7 -1 -7 M5 -4 L7 -1','#9e7460',.8)+'</g>';}
function bow(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">`+path('M0 0 Q-7 -7 -13 -1 L-9 5 L-2 1 L-5 9 L0 9 L3 2 L9 6 L13 1 Q9 -6 3 -1Z','#be9147','#624726',.9)+path('M-2 -2 L3 -2 L4 2 L-2 3Z','#d7a956','#805a2b',.7)+line('M-10 -1 L-5 -1 M7 -1 L10 1','#e8bd6e',.8)+'</g>';}
// 広い毛束を耳の後ろからお団子へ流す。白髪の筋は顔・耳より前に描く。
function hairDetail(v,d){
 const locks=v<2?[
 'M34 35 Q34 22 46 18 Q57 9 63 22 Q55 15 48 25 Q42 32 34 35Z',
 'M35 43 Q39 33 49 27 Q57 20 60 23 Q51 35 38 43 L37 51Z',
 'M44 15 Q54 9 63 12 Q67 14 65 22 Q64 15 57 14Z',
 'M68 13 Q79 12 88 25 Q82 19 75 21 Q70 20 65 25 Q67 18 68 13Z',
 'M67 24 Q76 24 82 36 L91 40 Q80 40 73 32Z',
 'M79 26 Q91 30 92 39 Q94 48 84 52 Q89 45 83 40 Q78 35 79 26Z'
 ]:v===2?[
 'M36 28 Q33 21 41 19 Q46 17 48 22 Q40 18 39 31 L38 38Z',
 'M43 19 Q55 10 66 12 Q59 16 64 23 L78 36 Q59 31 51 21Z',
 'M48 23 Q54 35 69 39 Q79 41 84 48 Q74 43 64 44 Q51 37 48 23Z',
 'M68 13 Q83 16 89 31 Q95 44 84 52 Q90 39 81 32 Q72 23 68 13Z',
 'M73 44 Q83 43 85 52 Q79 61 69 61 L62 57 Q75 55 73 44Z'
 ]:v===3?[
 'M38 31 Q35 22 49 14 Q44 22 47 35 L50 43 Q42 37 38 31Z',
 'M50 13 Q65 8 75 16 Q66 13 61 22 Q55 33 52 38 Q48 31 50 24Z',
 'M75 17 Q80 22 76 31 Q69 40 57 44 Q64 32 72 27 Q76 24 75 17Z',
 'M83 21 Q94 33 87 45 Q82 52 66 56 Q77 47 81 36 Q83 30 83 21Z',
 'M45 43 Q57 49 72 44 Q68 51 53 52 L55 57 Q46 55 45 43Z',
 'M54 54 Q67 60 83 51 Q76 61 61 62Z'
 ]:[
 'M37 30 Q38 16 52 12 Q46 19 48 31 Q51 47 64 57 Q42 43 37 30Z',
 'M53 12 Q62 7 71 12 Q78 19 76 34 Q73 48 66 58 Q68 40 58 28 Q60 45 64 51 Q50 37 53 12Z',
 'M77 16 Q90 22 91 36 Q91 48 74 57 Q85 44 84 32 Q83 24 77 16Z',
 'M34 38 Q39 49 55 52 L62 59 Q41 57 35 48Z',
 'M90 42 Q86 57 69 61 Q80 60 86 54Z',
 'M39 53 Q45 60 59 62 L63 65 Q46 66 40 59Z'
 ];
 return clipped(`suzuha-locks-${d}`,crowns[v],locks.map((p,i)=>path(p,i%3===0?'#87604e':i%3===1?'#966e5a':'#624334','#604333',.65)).join('')
 +line(v<2?'M37 30 Q44 20 52 19 M47 13 Q58 8 63 17 M73 16 Q82 18 86 24 M83 38 L88 42':v===2?'M37 26 Q36 21 41 21 M46 18 Q56 12 63 14 M72 18 Q82 23 86 32 M60 39 L67 42':'M40 25 Q44 17 49 16 M57 12 Q64 9 69 15 M82 23 Q88 30 87 37 M39 45 Q44 51 53 53','#ac816a',.65)
 +line(v<2?'M35 37 Q42 35 47 30 M43 20 Q50 13 57 16 M72 27 Q78 35 85 37 M86 46 Q83 52 79 54':v===2?'M47 19 Q55 25 60 29 M55 35 Q65 40 70 40 M72 48 Q79 49 82 52 M76 56 L71 59':v===3?'M42 23 Q40 31 48 39 M58 15 Q51 25 53 31 M74 22 Q67 34 58 39 M87 32 Q86 44 74 51 M50 49 Q56 54 65 53 M59 58 Q70 62 79 57':'M48 17 Q43 32 57 49 M71 18 Q79 34 68 51 M84 29 Q89 42 75 53 M37 42 Q45 53 57 55 M43 57 Q51 61 60 61 M88 47 Q82 56 71 59','#533b32',.7));
}
function head(v,d){
 let out=v===0?bun(49,63,.85)+bun(77,63,.85):v===1?bun(80,62):'';
 if(v<4)out+=path(faces[v],skin,'#694731',1.1);
 if(v===0)out+=ear(40,53)+ear(87,53,-1);
 if(v===1)out+=ear(79,52,-1);
 if(v===2)out+=ear(63,52,-1);
 if(v===3)out+=ear(46,53,1);
 out+=path(crowns[v],hair)+hairDetail(v,d);
 const streak=[
 'M35 40 Q48 34 54 23 Q50 36 40 43 L37 52 Q33 47 35 40Z M77 30 Q83 41 91 43 L90 50 Q81 46 77 38Z',
 'M33 40 Q44 33 50 23 Q47 35 37 43 L36 52 Q32 47 33 40Z M67 29 Q73 39 86 43 L87 49 Q72 45 69 38Z',
 'M42 28 Q48 39 66 42 Q72 43 73 48 Q63 45 57 45 Q45 40 42 28Z M35 30 Q34 24 38 23 L37 36Z',
 'M34 31 Q36 42 49 45 L56 47 Q43 49 37 42Z',
 'M33 43 Q36 53 43 55 L46 59 Q35 57 33 49Z M93 43 Q90 53 83 55 L80 59 Q91 57 93 49Z'
 ];
 out+=path(streak[v],'#d4c8b9','#8f7d6d',.65)+line(v<2?'M36 42 Q44 37 48 31 M79 39 L86 44':v===2?'M48 38 Q57 43 66 43':v===3?'M37 39 L45 45':'M35 49 L39 54 M91 49 L87 54','#eee2d1',.8);
 if(v===2)out+=ear(63,52,-1)+path('M57 46 Q63 43 66 46 L61 49 L57 55Z',hair,'#564034',.8);
 if(v===3)out+=ear(46,53,1)+path('M45 46 L49 46 L47 56 L45 57Z',hair,'#564034',.8);
 if(v>=2)out+=bun(v===4?63:82,v===4?68:64,v===4?.92:.9);
 if(v>=1)out+=bow(v===4?63:87,v===4?59:57,v===4?1:.8);
 if(v===0){out+=eye(52,49,1.08,1.08)+eye(75,49,1.08,1.08);
  out+=line('M45 37 Q51 34 57 37 M69 37 Q76 34 81 37','#665041',1)+ellipse(63,56,.65,.8,'#d39766','none')+line('M58 61 Q63 65 69 61','#85563a',.9)+line('M56 60 L55 62 M71 60 L72 62','#c68c61',.7);
 }else if(v===1){out+=eye(41,48,.7,1.06)+eye(61,49,1.05,1.07)+line('M36 37 Q40 35 45 37 M54 37 Q61 34 67 38','#665041',1)+ellipse(46,56,.55,.8,'#d39766','none')+line('M43 61 Q48 65 54 61','#85563a',.9)+line('M55 60 L56 62','#c68c61',.7);
 }else if(v===2){out+=eye(41,49,.7,1.05)+line('M36 37 Q41 35 46 38','#665041',1)+line('M36 61 Q39 62 41 60','#85563a',.8)+line('M42 59 L43 60','#c68c61',.6);}
 return `<g data-part="head">${out}</g>`;
}
function handcloth(x){return `<g data-accessory="left-hip-handcloth" transform="translate(${x} 0)">`+path('M0 102 Q6 99 9 103 L12 117 Q7 120 0 118 L-1 109Z',ivory,'#6f5944',.95)+line('M3 103 Q5 109 4 116 M8 106 L9 114','#c5ad8d',.85)+'</g>';}
function sashKnot(x){return path(`M${x-1} 105 L${x-7} 118 L${x-2} 120 L${x+2} 111 L${x+6} 119 L${x+11} 117 L${x+4} 106Z`,'#657785','#344652',.9)+path(`M${x-2} 103 Q${x+1} 101 ${x+4} 103 L${x+4} 108 L${x-2} 108Z`,'#778896','#344652',.9);}
function torso(v,d){
 const shape=v===2?'M56 69 Q68 68 77 77 L78 101 L84 119 Q63 124 43 119 L46 102 L46 82Z':v===1||v===3?'M51 69 Q68 67 81 77 L80 102 L85 119 Q63 124 41 119 L45 102 L43 81Z':'M52 70 Q63 67 75 70 L85 79 L82 102 L86 119 Q63 124 40 119 L44 102 L41 79Z';
 let out=path(shape,cloth);
 if(v<3){out+=path(v===0?'M56 65 L70 65 L72 73 L63 81 L54 73Z':v===1?'M50 66 L65 63 L68 71 L55 81 L49 74Z':'M53 64 L65 61 L69 70 L53 78 L49 74Z',skin,'#805c41',.8);
  out+=path(v===0?'M52 70 L63 81 L72 69 L76 72 L64 87 L60 87 L48 73Z':v===1?'M48 71 L56 80 L66 68 L71 72 L57 87 L52 86 L44 75Z':'M49 72 Q57 65 67 67 L72 71 Q59 73 49 86 L46 82Z',ivory,'#584337',.95);
 }else out+=path(v===4?'M52 70 Q63 73 75 70 L78 74 Q63 78 49 74Z':'M51 70 Q62 69 70 72 L74 76 L50 75Z',cloth,'#554039',.85);
 const bib=v===2?'M48 85 Q57 85 65 87 L66 102 Q56 106 46 101Z':v===1||v===3?'M47 86 L72 86 L74 102 Q61 107 45 102Z':'M48 86 L78 86 L79 103 Q63 108 47 103Z';
 out+=path(bib,apron,'#73604c',1)+clipped(`suzuha-apron-${d}`,bib,path('M44 95 Q52 99 58 97 Q62 95 69 98 L78 96 L80 106 L43 106Z','#d1b99a','none')+path('M49 89 L52 89 L51 98 L49 97Z','#fff1d7','none'));
 out+=v===2?path('M52 73 Q61 69 69 74 L65 88 L60 87 Q63 78 65 76 L48 84 L47 81Z',ivory,'#65513f',.9):v===1||v===3?path('M47 73 L51 72 L53 87 L48 87Z M71 72 L76 74 L72 87 L68 87Z',ivory,'#65513f',.9):path('M46 73 L51 72 L54 87 L49 87Z M75 72 L80 73 L77 87 L72 87Z',ivory,'#65513f',.9);
 out+=line(v===2?'M49 88 L62 90 M52 90 Q53 96 52 100':'M49 89 L76 89 M51 91 L50 101 M75 91 L76 101','#b79e7e',.8);
 const skirt=v===2?'M47 107 L65 108 L67 121 Q55 122 43 119Z':v===1||v===3?'M46 107 L74 107 L80 119 Q63 124 41 119Z':'M45 107 L81 107 L86 119 Q63 124 40 119Z';
 out+=path(skirt,apron,'#64503d',1)+line(v===2?'M48 111 L47 118':'M48 112 L45 118 M77 112 L80 118','#c6ad8e',.8);
 const band=v===2?'M46 101 Q62 104 78 101 L79 108 Q62 113 45 108Z':v===1||v===3?'M45 101 Q61 105 80 101 L81 108 Q63 113 44 108Z':'M44 101 Q63 105 82 101 L83 108 Q63 113 43 108Z';
 out+=path(band,'#667985','#35454f',1)+line(v===2?'M48 104 Q57 108 75 104':'M47 104 Q61 109 79 104','#8c9da4',1)+line('M49 108 Q60 109 68 107','#4c5e6b',.8);
 if(v>=3)out+=sashKnot(v===4?63:72);
 if(['front','front_left','left'].includes(d))out+=handcloth(v===0?74:v===1?70:55);
 if(d==='front_right')out+=handcloth(42);
 return `<g data-part="torso">${out}</g>`;
}
export function suzuhaMarkup(direction,part='combined'){
 const i=DIRECTIONS.indexOf(direction);if(i<0)throw Error(`Unknown direction: ${direction}`);if(!['head','torso','combined'].includes(part))throw Error(`Unknown part: ${part}`);
 const mirror=i>4,v=mirror?8-i:i;
 return `<g data-direction="${direction}"${mirror?' transform="translate(126.464 0) scale(-1 1)"':''}>${part==='head'?'':torso(v,direction)}${part==='torso'?'':head(v,direction)}</g>`;
}
export const buildSuzuhaSheet=(options={})=>buildSheet(options,palette,defs,suzuhaMarkup);
