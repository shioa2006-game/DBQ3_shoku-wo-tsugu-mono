import { path, ellipse, line, defs, eye, ear, rivet, buckle, buildSheet, clipped, DIRECTIONS, LABELS } from '../shared/ch67-art.mjs';
export { DIRECTIONS, LABELS };
const palette={ink:'#393029',skinLight:'#ffcc85',skin:'#efb16c',skinDark:'#be7d41',hairLight:'#dbd5ca',hair:'#b4afa7',hairDark:'#777674',clothLight:'#6b6b68',cloth:'#50504f',clothDark:'#353b3c',apronLight:'#b37a4e',apron:'#97603c',apronDark:'#70462e',ivoryLight:'#f5e7cd',ivory:'#d7c3a3',ivoryDark:'#b69e7c'};
const skin='url(#skin)',hair='url(#hair)',cloth='url(#cloth)',apron='url(#apron)',ivory='url(#ivory)';
// 5方向の原画。右側は反転し、左右非対称の工具だけは身体の左腰に限定する。
const faces=[
 'M37 29 Q40 20 63 21 Q84 22 89 33 L87 53 Q83 64 72 67 Q63 70 53 66 Q40 62 38 52Z',
 'M36 29 Q44 19 65 23 Q84 27 86 42 L79 55 Q68 66 53 68 Q39 67 35 57 L34 42Z',
 'M42 26 Q56 20 73 31 L79 47 Q72 59 60 63 L53 68 L42 67 Q37 65 36 59 L34 55 Q30 54 34 49 L36 46 L36 34Z',
 'M41 35 Q51 23 71 29 L80 54 Q72 65 57 67 Q45 64 42 55Z', ''
];
const crowns=[
 'M34 36 Q31 32 35 28 L33 25 Q37 22 41 21 L39 17 L45 18 L48 12 L52 15 L61 8 L62 12 Q70 10 77 11 L75 14 Q84 16 89 21 L85 22 L93 29 L89 30 L93 36 L88 39 Q65 20 39 35Z',
 'M33 35 Q31 31 35 27 L32 25 L38 22 L38 17 L42 19 L46 12 L50 15 L59 8 L61 12 Q70 10 76 12 L74 15 Q83 18 89 24 L85 25 L92 32 L88 33 L92 40 L87 43 Q70 28 60 26 Q43 23 33 35Z',
 'M34 31 L37 27 L34 25 Q38 21 42 22 L41 16 L46 18 L54 10 L57 14 Q66 11 73 12 L71 15 Q82 18 89 25 L84 26 Q91 31 93 37 L89 37 L93 44 L89 46 L89 53 L84 52 L83 59 L78 56 L76 63 L71 59 L68 63 L63 59 L60 61 L61 43 Q56 32 45 29Z',
 'M38 34 L35 29 L39 26 L39 18 L44 20 L50 12 L54 16 L61 9 L63 13 Q71 10 78 12 L76 16 L88 22 L84 24 L92 31 L88 33 L93 40 L89 43 L89 51 L84 50 L84 57 L79 55 L76 62 L72 59 L67 64 L63 60 L59 63 L54 59 L50 60 L47 55 L43 54 L43 46Z',
 'M34 39 L33 33 L37 29 L34 26 L41 22 L40 17 L46 19 L50 12 L55 16 L64 8 L66 13 L78 12 L76 16 L87 22 L84 24 L92 31 L89 34 L93 40 L89 44 L88 52 L84 51 L82 58 L78 56 L75 63 L70 60 L66 65 L62 62 L57 64 L53 60 L49 61 L45 56 L41 56 L40 50 L36 49Z'
];
function hairMarks(v,d){
 const front=v<2;
 const locks=front?[
  'M35 30 Q40 22 49 20 Q45 23 43 29 L43 25 Q40 29 36 31Z',
  'M42 22 Q48 15 55 16 Q52 19 49 26 L48 22 Q46 27 42 29 Q44 25 42 22Z',
  'M51 18 Q59 11 67 14 Q62 17 59 26 L57 23 L56 29 Q52 26 55 20Z',
  'M63 15 Q72 13 79 18 Q72 17 68 21 Q74 22 77 28 Q70 24 64 23 L66 26 L61 23Z',
  'M76 20 Q85 22 89 30 Q84 28 81 28 L84 34 Q79 30 76 26Z'
 ]:[
  'M37 29 Q42 20 52 18 Q46 23 46 30 L44 26 Q42 32 38 34Z',
  'M45 21 Q51 13 62 15 Q56 19 54 27 L52 23 Q50 29 47 32 Q48 26 45 21Z',
  'M57 17 Q64 11 73 15 Q65 18 65 24 L62 22 L60 29 Q56 25 59 20Z',
  'M69 18 Q80 17 87 27 Q82 23 76 24 Q82 27 84 34 Q76 30 71 28 L74 34 Q66 29 66 24Z',
  'M39 35 Q42 32 48 31 Q44 36 47 42 L43 39 L43 45 Q38 41 39 35Z',
  'M49 31 Q52 27 57 27 Q55 33 59 41 L54 38 L55 46 Q48 41 49 35Z',
  'M61 29 Q68 32 72 41 L67 38 L67 47 Q59 39 61 29Z',
  'M76 33 Q86 36 88 46 L84 42 L85 50 Q79 47 77 42Z',
  'M46 46 Q53 49 56 56 L52 53 L52 58 Q46 55 46 46Z',
  'M58 44 Q65 47 68 55 L64 52 L64 59 Q58 55 58 44Z',
  'M71 45 Q78 49 79 55 L75 53 L73 59 Q70 54 71 45Z'
 ];
 return clipped(`ganzou-locks-${d}`,crowns[v],locks.map((p,i)=>path(p,i%3===0?'#c9c4ba':i%3===1?'#ded8ce':'#a29e98','#a09b94',.45)).join('')
  +line(front?'M40 25 L45 22 M50 19 L55 16 M60 16 L64 14 M72 17 L77 19 M81 24 L85 27':'M42 25 L47 21 M51 21 L56 17 M62 18 L66 15 M75 21 L80 24 M52 34 L54 38 M64 36 L66 41 M80 39 L83 43','#d8d3c9',.65));
}

function head(v,d){
 let out='';
 if(v>1)out+=path('M82 48 Q91 51 93 58 L89 64 L85 59 L83 66 L79 63 L80 53Z','#5a4030','#332b26',1.1)+line('M83 53 L87 59 M83 54 L82 62','#89664c',1);
 if(v<4)out+=path(faces[v],skin);
 if(v<2){out+=ear(v===0?37:81,52,v===0?1:-1);if(v===0)out+=ear(89,52,-1);}
 if(v===3)out+=ear(44,51,1);
 if(v===4)out+=ear(37,51,1)+ear(89,51,-1);
 // こめかみを覆う短い毛束。耳の後ろまで毛をつなげる。
 if(v<2)out+=path(v===0?'M35 30 L42 30 L43 43 L40 42 L41 50 L37 46 L34 41Z M84 29 L90 34 L90 43 L86 48 L86 41 L83 44Z':'M34 29 L38 30 L37 42 L35 45 L32 40Z M73 29 L88 37 L84 48 L80 51 L80 43 L76 48 L77 37Z',hair,'#655f56',.9);
 out+=path(crowns[v],hair)+hairMarks(v,d);
 const band=[
 'M34 32 Q61 15 91 33 L92 41 Q64 24 34 41Z',
 'M33 32 Q54 17 82 34 L90 42 L87 48 Q60 26 33 40Z',
 'M35 29 Q57 26 87 47 L87 54 Q59 34 35 35Z',
 'M35 30 Q58 47 88 49 L87 56 Q59 52 37 37Z',
 'M34 41 Q63 56 91 41 L89 48 Q63 63 36 48Z'
 ];
 // 額の帯の上に前髪を少量重ね、銀髪と鉢巻きを独立して編集できるようにする。
 out+=path(band[v],'#644a39','#3d3029',1.1)+line(v<2?'M38 32 Q57 24 74 30':v===2?'M42 31 Q66 37 82 48':'M40 44 Q61 55 84 49','#8a6b52',.8);
 if(v<2)out+=path(v===0?'M37 29 L43 23 L42 28 L49 20 L47 27 L54 20 L54 27 L57 22 L58 14 L65 15 Q60 24 59 28 Q57 31 55 26 L55 22 L48 29 L49 24 L41 32 L42 28 L36 32Z':'M34 30 L39 23 L39 28 L47 21 L45 28 L52 19 L54 26 L57 22 L60 20 L67 28 L66 23 L75 29 L72 24 L79 28 L73 20 Q57 12 44 22Z',hair,'#8b8780',.8);
 if(v===2)out+=ear(64,51,-1)+path('M56 36 L63 41 L59 48 L56 53 L55 43 L53 47Z',hair,'#77736b',.7);
 if(v===3)out+=ear(44,51,1);
 if(v>=3){
  const x=v===4?63:86,y=v===4?53:50;
  out+=path(`M${x-2} ${y+1}q-5 6 -7 14l5 3 5-11 5 11 5-3q-2-10-8-15Z`,'#634735','#362c26',1)+path(`M${x-2} ${y}q3-2 5 0l-1 6-5 0Z`,'#76563e','#392f28',1);
  return `<g data-part="head">${out}</g>`;
 }
 if(v===0){out+=eye(51,46,1.03,1.04)+eye(75,46,1.03,1.04);
  out+=path('M43 37 L44 33 Q52 33 58 37 L58 40 Q50 38 43 38Z',hair,'#777168',.7)+path('M68 37 Q76 32 82 33 L83 38 Q75 37 68 40Z',hair,'#777168',.7);
  out+=line('M62 53 Q63 54 65 53','#ba814a',.8)+line('M44 52 L47 53 M79 53 L82 52','#c58b54',.7);
  out+=path('M40 56 Q45 63 52 63 L54 66 L59 64 L63 66 L67 64 L71 66 L74 63 Q82 62 86 55 L84 62 Q76 69 63 69 Q48 68 42 62Z',hair,'#81796d',.7);
  out+=path('M51 57 Q55 54 63 56 Q70 54 75 58 L76 61 Q70 60 64 59 L62 59 Q56 61 50 61Z',hair,'#938a7c',.65)+line('M59 63 Q63 64 67 63','#805737',.85);
 }else if(v===1){out+=eye(41,46,.7,1.02)+eye(61,46,1.02,1.03);
  out+=path('M35 35 Q41 34 46 38 L46 40 L35 38Z',hair,'#777168',.7)+path('M52 37 Q61 33 68 34 L69 38 Q61 38 52 40Z',hair,'#777168',.7);
  out+=line('M46 51 L44 54 L47 55','#ad7543',.85)+line('M68 53 L71 52','#c58b54',.7);
  out+=path('M35 57 Q39 64 46 64 L49 66 L53 64 L57 65 Q70 63 78 57 L76 62 Q66 68 52 69 Q40 69 36 63Z',hair,'#81796d',.7)+path('M39 57 Q43 54 48 56 Q56 55 61 58 L62 61 Q55 60 49 59 Q42 61 38 61Z',hair,'#938a7c',.65)+line('M45 63 Q49 64 53 63','#805737',.85);
 }else{out+=eye(40,46,.66,1)+path('M35 36 Q40 33 48 34 L49 38 Q41 37 35 40Z',hair,'#777168',.7);
  out+=path('M36 59 Q39 64 45 64 L49 63 L51 64 L61 60 L60 63 L51 67 L42 68 Q37 67 36 63Z',hair,'#81796d',.7)+path('M34 55 Q41 54 46 57 L47 60 L42 59 L35 59Z',hair,'#938a7c',.7)+line('M38 62 L42 62','#805737',.8);
 }
 return `<g data-part="head">${out}</g>`;
}
function tools(x){return `<g data-accessory="left-hip-chisels" transform="translate(${x} 0)">`+[0,5.5].map((a,i)=>path(`M${a} ${91+i}h4v7l-1 2v13q-1 2-2 0v-13l-1-2Z`,'#858987','#302e29',.9)+line(`M${a+1} ${92+i}v5`,'#c4c6be',.7)).join('')+path('M-1 103h12v4q-6 1-12 0Z','#6c462e','#382b23',.8)+'</g>';}
function torso(v,d){
 const shape=v===2?'M56 68 Q67 67 77 76 L79 101 L84 119 Q64 124 43 119 L47 101 L47 80Z':v===1||v===3?'M53 68 Q72 68 82 78 L81 102 L85 119 Q63 124 41 119 L45 102 L43 80Z':'M52 68 Q63 65 75 68 L86 78 L83 102 L87 119 Q63 124 39 119 L43 102 L40 78Z';
 let out=path(shape,cloth);
 if(v<3){out+=path(v===0?'M55 65 L71 65 L74 72 L63 81 L52 72Z':v===1?'M51 65 L66 63 L68 71 L55 81 L48 72Z':'M54 63 L66 59 L70 69 L53 79 L49 73Z',skin,'#634631',.9);
  out+=path(v===0?'M52 69 L63 78 L72 68 L77 72 L65 86 L61 86 L48 73Z':v===1?'M49 70 L56 78 L67 68 L72 71 L57 86 L52 85 L45 74Z':'M50 71 L66 64 L72 69 Q59 72 50 84 L47 81Z',ivory,'#3e352c',1);
 }
 else out+=path(v===4?'M51 68 Q63 72 75 68 L78 72 Q63 77 48 72Z':'M52 68 Q63 67 70 71 L75 75 L51 73Z',ivory,'#3e352c',.9);
 const bib=v===2?'M49 84 Q57 85 63 84 Q67 95 77 98 L80 114 Q64 119 46 115Z':v===1||v===3?'M47 84 L72 84 Q73 95 79 98 L82 115 Q63 120 44 115 L47 99Z':'M48 84 L78 84 Q79 94 83 98 L84 115 Q63 121 42 115 L44 98 Q48 94 48 84Z';
 out+=path(bib,apron,'#493427',1.05)+clipped(`ganzou-apron-${d}`,bib,path('M40 95 Q52 101 62 97 Q74 91 84 98 L85 116 L42 118Z','#75492e','none')+path('M44 91 Q55 87 78 91 L78 96 Q67 92 58 97 Q48 99 44 96Z','#ad7247','none'));
 const straps=v===2?['M54 71 Q63 68 69 73 L63 86 L59 86 Q62 77 64 74Z']:v===1||v===3?['M50 71 L54 73 L52 86 L47 86Z','M73 72 L78 75 L73 87 L68 87Z']:['M47 71 L52 70 L54 87 L49 87Z','M75 70 L80 71 L77 87 L72 87Z'];
 out+=straps.map(p=>path(p,apron,'#51392a',.9)).join('');
 out+=v===2?rivet(61,86):v===1||v===3?rivet(50,86)+rivet(71,86):rivet(51,86)+rivet(75,86);
 out+=line(v===2?'M48 94 Q56 90 64 97 M52 89 L51 94':'M49 94 Q61 91 75 97 M51 89 L50 94 M77 89 L77 94','#bd8254',.9);
 out+=path(v===2?'M47 112 Q64 117 81 112 L84 119 Q63 124 43 119Z':v===1||v===3?'M45 112 Q63 117 82 112 L85 119 Q63 124 41 119Z':'M43 112 Q63 118 84 112 L87 119 Q63 124 39 119Z',apron,'#453225',1.1);
 out+=path(v===2?'M47 101 Q63 104 79 100 L80 107 Q63 111 46 108Z':v===1||v===3?'M45 101 Q63 105 81 101 L82 108 Q63 112 44 108Z':'M43 101 Q63 105 83 101 L84 108 Q63 112 42 108Z','#503828','#302820',1.1);
 if(v<3)out+=buckle(v===0?63:v===1?55:49,105,v===2?7:10);
 if(['front','front_left','left','back_left'].includes(d))out+=tools(v===0?76:v===1?73:v===2?61:43);
 if(d==='front_right')out+=tools(43);
 return `<g data-part="torso">${out}</g>`;
}
export function ganzouMarkup(direction,part='combined'){
 const i=DIRECTIONS.indexOf(direction);if(i<0)throw Error(`Unknown direction: ${direction}`);if(!['head','torso','combined'].includes(part))throw Error(`Unknown part: ${part}`);
 const mirror=i>4,v=mirror?8-i:i;
 return `<g data-direction="${direction}"${mirror?' transform="translate(126.464 0) scale(-1 1)"':''}>${part==='head'?'':torso(v,direction)}${part==='torso'?'':head(v,direction)}</g>`;
}
export const buildGanzouSheet=(options={})=>buildSheet(options,palette,defs,ganzouMarkup);
