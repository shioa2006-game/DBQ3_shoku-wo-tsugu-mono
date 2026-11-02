import { path, ellipse, line, grad } from '../shared/svg.mjs';
import { EYE_OPENINGS, eye, nose } from '../shared/face-parts.mjs';
import { DIRECTIONS, LABELS } from '../shared/sheet-format.mjs';
export { DIRECTIONS, LABELS };

/**
 * Game-facing bust prototype. All artwork below is generated from paths; no
 * source-image pixels, external fonts, image generation or raster tracing.
 * This deliberately uses the game's head/body windows rather than Inkstone's
 * full-body four-direction contract. Left/right share symmetric costume parts.
 */
export const DEFAULT_PALETTE = Object.freeze({
  blue: '#24549a', blueLight: '#427bc4', blueDark: '#142d5b',
  hair: '#edb126', hairLight: '#ffe477', hairDark: '#a26413',
  skin: '#ffcb8b', skinLight: '#ffe0ad', skinDark: '#d98b51',
  scarf: '#d94332', scarfLight: '#ff7350', scarfDark: '#962f30',
  gold: '#d8a743', goldLight: '#ffe391', goldDark: '#8a622c',
  ink: '#28232a', leather: '#61412b', lens: '#3c91c2',
});
function definitions() {
  const gradient = (id, a, b, c, x2 = '75%', y2 = '100%') => `<linearGradient id="${id}" x1="20%" y1="0%" x2="${x2}" y2="${y2}"><stop stop-color="var(--${a})"/><stop offset=".53" stop-color="var(--${b})"/><stop offset="1" stop-color="var(--${c})"/></linearGradient>`;
  return `<defs>${Object.entries(EYE_OPENINGS).map(([name,d])=>`<clipPath id="eye-${name}"><path d="${d}"/></clipPath>`).join('')}${gradient('blue', 'blueLight', 'blue', 'blueDark')}${gradient('hair', 'hairLight', 'hair', 'hairDark')}${gradient('red', 'scarfLight', 'scarf', 'scarfDark')}${gradient('gold', 'goldLight', 'gold', 'goldDark')}
  <radialGradient id="skin" cx="40%" cy="35%" r="75%"><stop stop-color="var(--skinLight)"/><stop offset=".57" stop-color="var(--skin)"/><stop offset="1" stop-color="var(--skinDark)"/></radialGradient>
  <linearGradient id="iris" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#13274e"/><stop offset=".55" stop-color="#176dc0"/><stop offset="1" stop-color="#57c5ed"/></linearGradient>
  <radialGradient id="capCrown" cx="38%" cy="23%" r="85%"><stop stop-color="#427bc4"/><stop offset=".55" stop-color="var(--blue)"/><stop offset="1" stop-color="var(--blueDark)"/></radialGradient>
  <radialGradient id="glass" cx="35%" cy="25%" r="80%"><stop stop-color="#d5f8ff"/><stop offset=".36" stop-color="var(--lens)"/><stop offset=".75" stop-color="#2279a4"/><stop offset="1" stop-color="#154365"/></radialGradient></defs>`;
}

function buckle(x, y, r = 4) {
  return ellipse(x, y, r, r, grad('gold'), 'var(--ink)', .9)
    + ellipse(x, y, r * .56, r * .56, 'var(--leather)', 'var(--goldLight)', .65)
    + line(`M${x},${y-r*.4}v${r*.8}`, 'var(--goldLight)', .8);
}

function torso(view) {
  const widths = [24, 22, 16, 22, 24], w = widths[view], l = 63 - w, r = 63 + w;
  let s = path(`M${l+5} 78 Q63 72 ${r-5} 78 Q${r+1} 86 ${r} 103 L${r-1} 117 Q63 124 ${l+1} 117 L${l} 100 Q${l-1} 86 ${l+5} 78Z`, grad('blue'));
  // Fine hem and jacket panel seams also exist on the rear.
  s += path(`M${l+1} 111 Q63 117 ${r-1} 111 L${r-1} 117 Q63 123 ${l+1} 117Z`, 'var(--leather)');
  s += line(`M${l+2} 116 Q63 122 ${r-2} 116`, 'var(--gold)', 1.15);
  if (view <= 1) {
    const c = view === 0 ? 63 : 54;
    s += path(`M${c-4} 82 L${c-4} 112 L${c+4} 113 L${c+4} 82Z`, 'var(--blueDark)', 'var(--gold)', .85);
    s += line(`M${l+8} 88 Q${l+5} 99 ${l+7} 109 M${r-7} 87 Q${r-4} 99 ${r-6} 109`, 'var(--blueDark)', 1);
    for (const y of [92, 103]) for (const x of [c-9, c+10]) {
      s += ellipse(x, y, 1.8, 2, grad('gold'), 'var(--goldDark)', .7);
    }
    s += path(`M${l+4} 99 L${c-7} 101 L${c-7} 108 L${l+4} 106Z`, 'var(--blueDark)', 'var(--gold)', .8);
    s += path(`M${c+9} 101 L${r-4} 98 L${r-4} 106 L${c+9} 108Z`, 'var(--blueDark)', 'var(--gold)', .8);
    s += buckle(c, 115, 4.4);
    // The near shoulder stays inside the body's UV window; arms are supplied by the game.
    if (view === 1) s += path('M75 81 Q87 82 86 94 L79 97 Q75 87 70 86Z', grad('blue'), 'var(--gold)', 1);
  } else if (view === 2) {
    s += path('M62 81 Q75 80 77 93 L69 96 Q66 86 60 86Z', grad('blue'), 'var(--gold)', 1);
    s += line('M65 97 L64 112 M50 85 L49 110', 'var(--blueDark)', 1.3);
    s += buckle(50, 115, 2.6);
  } else {
    s += line(`M63 86 L63 112 M${l+7} 85 Q${l+4} 99 ${l+7} 111 M${r-7} 85 Q${r-4} 99 ${r-7} 111`, 'var(--blueDark)', 1.1);
    s += line(`M${l+9} 100 Q63 106 ${r-9} 100`, 'var(--blueLight)', .9);
    s += path('M59 112 H67 V119 H59Z', grad('blue'), 'var(--gold)', .8);
  }
  return s;
}

function scarf(view) {
  if (view >= 3) {
    const x = view === 3 ? 69 : 63;
    // Collar, gathered folds and two hanging ends are separate cloth surfaces.
    // Rear-quarter perspective compresses the far fold, without moving the knot
    // onto the hair. The knot and folds remain below the shared head/body seam.
    const far = view === 3 ? .78 : 1;
    return `<g transform="translate(${x} 0)">`
      + path('M-24 73 Q0 68 22 74 L20 82 Q0 88-23 81Z', grad('red'), '#6d2625', 1.1)
      + path('M-22 76 Q0 81 20 76 L20 82 Q0 87-22 81Z', '#a82d2a', '#752124', .8)
      + line('M-21 74 Q-5 72 7 75 M10 75 L19 77', '#ff7851', 1.15)
      // Narrow gathered folds stay tucked behind the longer pointed ends.
      + `<g transform="scale(${far} 1)">`
      + path('M-3 79 Q-14 75-22 78 L-19 84 Q-11 85-3 82Z', grad('red'), '#6d2625', 1.05)
      + line('M-20 79 Q-13 82-7 80', '#9a2629', 1.1)
      + '</g>'
      + path('M3 79 Q14 75 22 78 L19 84 Q11 85 3 82Z', grad('red'), '#6d2625', 1.05)
      + line('M20 79 Q13 82 7 80', '#9a2629', 1.1)
      // Each end opens out from the knot, then tapers to a single folded tip.
      + path('M-3 80 C-14 81-21 86-18 101 Q-9 96-5 90 Q-2 86 1 84Z', grad('red'), '#702325', 1.1)
      + path('M3 80 C14 81 21 86 18 101 Q9 96 5 90 Q2 86-1 84Z', grad('red'), '#702325', 1.1)
      + path('M-4 83 Q-13 86-16 97 Q-17 90-12 86Z', '#f95f43', 'none')
      + path('M4 83 Q13 86 16 97 Q17 90 12 86Z', '#ef563e', 'none')
      + path('M-5 84 Q-11 87-10 92 Q-6 88-4 86Z', '#95242a', 'none')
      + path('M5 84 Q11 87 10 92 Q6 88 4 86Z', '#95242a', 'none')
      + line('M-18 98 L-18 101 Q-10 96-6 91 M18 98 L18 101 Q10 96 6 91', '#97262a', .9)
      // The short centre wrap remains visible between the ends below the knot.
      + path('M-3 85 L3 85 L4 91 Q0 93-4 91Z', grad('red'), '#702325', .8)
      + line('M-3 89 H3', '#862329', .8)
      + path('M-4 77 Q0 75 4 78 L4 84 Q0 87-4 84Z', grad('red'), '#702325', 1.1)
      + path('M1 77 Q-1 81 2 85 L3 84 L3 78Z', '#9b2928', 'none')
      + line('M-2 78 L-2 83', '#ff8157', 1.05)
      + '</g>';
  }
  const left = view === 2 ? 45 : 40, right = view === 2 ? 76 : 86;
  return path(`M${left} 71 Q61 78 ${right} 70 L${right-2} 82 Q61 91 ${left+2} 81Z`, grad('red'))
    + path(`M${left+3} 76 Q59 85 ${right-3} 75 L${right-4} 81 Q61 89 ${left+5} 82Z`, 'var(--scarf)', 'var(--scarfDark)', .9)
    + line(`M${left+4} 74 Q60 81 ${right-4} 73`, 'var(--scarfLight)', 1.5)
    + (view === 2 ? path('M75 76 Q87 77 83 91 L77 87 L73 93 L71 82Z', grad('red')) : '');
}


function goggle(x, y, rx, ry, rotation = 0) {
  return `<g transform="rotate(${rotation} ${x} ${y})">`
    + ellipse(x, y, rx+1.1, ry+1.1, '#63472e', 'var(--ink)', 1)
    + ellipse(x, y, rx, ry, grad('gold'), 'var(--goldLight)', .75)
    + ellipse(x, y, rx-2, ry-2, grad('glass'), 'var(--ink)', .95)
    + path(`M${x-rx*.52} ${y-ry*.25} Q${x-rx*.1} ${y-ry*.7} ${x+rx*.35} ${y-ry*.48}`, 'none', '#e0faff', 1.4)
    + ellipse(x+rx*.32, y+ry*.4, .7, .7, '#9be8f5', 'none') + '</g>';
}

function hairBack(view) {
  const shapes = [
    'M37 32 Q29 38 27 42 L23 39 Q24 47 33 49 Q29 54 22 54 Q26 60 35 59 L28 66 Q35 69 41 65 L37 74 Q47 73 49 67 L60 73 L75 68 Q81 76 89 73 L86 65 Q96 69 102 63 Q94 63 91 57 Q101 57 104 50 Q95 52 93 44 L98 42 Q88 35 86 32Z',
    'M39 32 Q31 36 29 42 L25 39 Q25 47 34 49 Q37 52 39 57 L43 64 L45 72 L57 68 L70 74 Q79 70 84 75 L84 67 Q95 71 101 64 Q94 63 90 57 Q101 58 104 51 Q94 50 92 42 L96 40 L86 32Z',
    'M41 31 Q34 38 30 43 L35 44 L29 52 Q37 55 43 49 L43 61 L53 67 Q58 73 66 71 L69 76 Q78 72 81 66 Q89 72 97 66 Q87 61 88 57 Q99 60 103 53 Q93 52 90 44 L96 41 Q88 36 83 31Z',
    'M35 37 Q28 46 29 54 L24 57 Q31 61 37 58 Q31 64 29 66 Q37 70 43 64 L40 75 Q49 73 52 67 L55 78 Q62 74 64 68 L72 77 L76 68 Q81 75 88 74 L86 66 Q96 71 102 65 Q93 62 91 56 Q101 55 102 51 L91 40Z',
    'M34 38 Q29 48 31 55 L24 58 Q30 62 36 59 Q33 65 29 67 Q39 70 43 64 L40 75 Q49 74 52 67 L56 78 Q62 75 64 68 L72 77 L76 68 Q81 75 88 74 L85 65 Q94 70 101 64 Q93 61 90 55 L98 53 L90 39Z',
  ];
  return path(shapes[view], grad('hair'), '#593c1c', 1.35);
}

// Large curved locks have a shaded underside and a tapering bright ridge.
// Their silhouettes fan outward; rear locks are deliberately shorter.
function lock(shape, ridge, crease = '') {
  return path(shape, grad('hair'), '#765019', .9)
    + path(ridge, '#fff095', 'none')
    + (crease ? line(crease, '#b87518', .7) : '');
}

function sideLocks(view) {
  if (view >= 3) return '';
  // In three-quarter views the far cheek hides the lower side locks. Keeping
  // their frontal silhouette here makes alternating hair/skin teeth at the jaw.
  const left = view === 1 ?
    lock('M37 35 Q33 46 24 43 Q26 51 38 48 L43 39Z','M36 38 Q32 45 28 45 Q34 47 38 42Z') : view === 0 ?
    lock('M37 35 Q33 46 24 43 Q26 51 38 48 L43 39Z','M36 38 Q32 45 28 45 Q34 47 38 42Z')
    + lock('M38 46 Q34 55 24 55 Q31 62 40 56 L44 47Z','M38 49 Q32 56 29 56 Q35 57 40 52Z')
    + lock('M42 55 Q39 64 31 65 Q38 69 45 61 L47 55Z','M42 57 Q38 64 35 65 Q41 64 44 59Z') : '';
  return left
    + lock('M86 38 Q90 49 101 48 Q97 56 86 50 L81 41Z','M87 41 Q93 50 98 50 Q91 52 85 44Z')
    + lock('M86 49 Q91 59 100 62 Q90 68 81 56Z','M87 53 Q91 61 96 62 Q89 62 85 56Z')
    + lock('M80 57 Q84 68 91 71 Q82 75 75 64Z','M80 60 Q84 68 87 70 Q81 69 78 64Z');
}

function face(view) {
  if (view === 4) return '';
  if (view === 3) return path('M35 43 Q28 54 36 63 L45 67 L49 45Z', grad('skin'))
    + ellipse(44, 55, 5.1, 7.2, grad('skin')) + line('M43 52 Q39 54 43 59', 'var(--skinDark)', 1);
  let s = '';
  if (view === 0) {
    s += ellipse(36, 58, 4.2, 6, grad('skin')) + ellipse(90, 58, 4.2, 6, grad('skin'));
    s += path('M37 39 Q63 29 89 39 C91 48 89 58 86 64 C82 71 73 76 63 76.5 C53 76 44 71 40 64 C36 57 35 47 37 39Z', grad('skin'));
    s += path('M38 41 Q64 33 88 42 L85 51 Q62 43 39 52Z', '#c98740', 'none', 0, 'opacity=".28"');
    s += path('M86 55 Q85 69 68 75.5 Q80 72 85 64Z', '#c97943', 'none', 0, 'opacity=".3"');
    s += eye(50, 58) + eye(76, 58, { nose:-1 });
    s += line('M43 46 Q48 43 55 46 M71 46 Q78 43 83 46', '#6c401f', 1.5);
    s += nose(63.5, 65.8);
    s += line('M57.5 69.6 C60 72 66 72 69.5 69.4', '#7d3924', 1.05);
    s += ellipse(43, 67, 3.1, 1.2, '#f19b62', 'none', 0, 'opacity=".45"') + ellipse(83, 67, 3.1, 1.2, '#f19b62', 'none', 0, 'opacity=".45"');
  } else if (view === 1) {
    // The nose is inside the face in this view; the far cheek is a continuous
    // convex contour, with no profile-nose notch or angular jaw steps.
    s += path('M36 39 Q58 31 81 42 L82 59 C80 68.8 73.5 73.3 63 75.6 C55.3 77.5 46.2 76 41 72.2 C37.5 69.5 36 65.5 36 61 Q35.7 55 36 51 Q35.3 44 36 39Z', grad('skin'));
    s += path('M37 41 Q56 33 80 43 L79 51 Q56 44 36 52Z', '#c98740', 'none', 0, 'opacity=".25"');
    s += path('M79 60 Q78 70 63 75 Q73 73 79 66Z', '#d58c53', 'none', 0, 'opacity=".24"');
    s += ellipse(81, 57, 4.7, 6.6, grad('skin')) + line('M82 54 Q77 53 79 60', 'var(--skinDark)', 1);
    s += eye(43, 57, { width:.64, view:'far' }) + eye(64, 58.5, { nose:-1, view:'near' });
    s += line('M38 47 Q42 44 47 47 M57 47 Q63 44 70 47', '#6c401f', 1.4);
    s += nose(47.7, 66, -1);
    s += line('M47.4 69.6 C50 71.2 55.5 71.3 58.5 68.8', '#7d3924', 1.05);
    s += ellipse(73, 67, 3.2, 1.2, '#f19b62', 'none', 0, 'opacity=".45"');
  } else {
    // A small rounded nose leads into a soft cheek and continuous chin/jaw arc.
    // Avoid the former alternating straight steps at the nose, lips and chin.
    s += path('M39 39 Q57 32 76 43 L78 60 C73 64 69 67 64 71 C58 75 51 77 44 76.2 C40 75.7 37.4 72.8 36.5 69.7 Q35.5 68 35.7 66.5 C35.8 65.7 33.3 65 32 63.5 Q30.8 62.5 32.2 61.3 Q34.4 59.7 35.5 57 C36.7 53.5 35.9 49 37 46Z', grad('skin'));
    s += path('M73 62 Q64 73 47 75.4 Q59 75.5 66 69Z', '#ce8753', 'none', 0, 'opacity=".26"');
    s += eye(44, 57, { width:.77, nose:-1, view:'side' });
    s += line('M38 47 Q44 44 49 47', '#6c401f', 1.4);
    s += line('M36.5 68.7 Q39.3 69.4 41.6 67.8', '#945437', .8);
    s += ellipse(48.5, 67, 2.8, 1.25, '#efac78', 'none', 0, 'opacity=".32"');
    s += ellipse(70, 57, 4.8, 6.8, grad('skin')) + line('M72 54 Q66 52 68 61', 'var(--skinDark)', 1.05);
  }
  // Reduce the profile around its ear/chin anchor, preserving the neck seam.
  // Three-quarter cheeks need less height as well as width. Keep the jaw at
  // the scarf and move facial features together, without scaling the scarf.
  if (view === 1) return `<g transform="translate(68 75.5) scale(.90 .88) translate(-68 -75.5)">${s}</g>`;
  return view === 2 ? `<g transform="translate(70 76) scale(.90 .94) translate(-70 -76)">${s}</g>` : s;
}

function fringe(view) {
  if (view >= 3) {
    return lock('M36 50 Q37 61 28 64 Q36 69 45 61 L46 50Z','M38 54 Q37 62 33 64 Q41 62 42 55Z')
      + lock('M44 50 Q39 65 41 73 Q50 69 54 57Z','M46 54 Q43 64 44 68 Q49 64 49 56Z','M48 59 Q46 68 43 71')
      + lock('M53 52 Q49 68 55 76 Q61 70 64 59Z','M56 56 Q53 65 56 71 Q59 66 59 58Z')
      + lock('M63 53 Q61 67 71 75 Q73 65 75 56Z','M66 57 Q64 64 70 70 L70 58Z','M71 60 L72 70')
      + lock('M75 51 Q72 63 83 72 Q83 65 87 58Z','M77 54 Q75 62 81 67 L82 57Z')
      + lock('M86 49 Q86 61 97 64 Q90 68 82 59Z','M87 52 Q88 60 93 63 Q86 61 85 55Z');
  }
  if (view === 0) return lock('M37 34 Q31 43 35 58 Q41 53 44 42Z','M38 37 Q34 46 36 52 Q39 44 41 39Z')
    + lock('M43 33 Q43 47 38 53 Q49 52 53 39Z','M46 36 Q46 45 42 49 Q49 45 49 38Z')
    + lock('M51 33 Q46 39 48 44 Q49 47 51 48 Q52 41 60 38 L63 33Z','M53 35 Q48 40 50 44 Q52 39 57 37Z','M54 38 Q51 41 51 44')
    + lock('M62 32 Q58 41 63 52 Q71 49 73 38 L69 33Z','M64 35 Q62 42 65 47 Q68 41 69 36Z')
    + lock('M73 33 Q73 41 79 47 Q83 43 82 37Z','M76 35 Q76 40 79 43 L79 37Z')
    + lock('M86 34 Q94 45 88 62 Q86 58 86 52 Q90 44 82 37Z','M88 38 Q92 46 88 54 Q89 46 86 40Z');
  if (view === 1) return lock('M37 33 Q31 43 34 53 Q41 46 43 36Z','M37 37 Q34 44 35 48 L40 38Z')
    + lock('M44 33 Q40 40 42 47 Q49 44 54 38Z','M46 36 Q43 40 44 43 L50 38Z')
    + lock('M54 33 Q49 41 51 48 L53 52 Q55 44 63 39 L65 34Z','M56 36 Q52 41 53 46 Q55 41 60 38Z','M56 40 L53 47')
    + lock('M65 33 Q65 41 72 46 Q77 42 76 38 L73 34Z','M68 36 Q68 41 72 43 L72 37Z')
    + lock('M79 35 Q90 45 79 64 Q76 59 78 53 Q85 45 75 37Z','M81 39 Q86 46 80 56 Q83 46 78 40Z');
  return lock('M38 33 Q32 41 33 50 Q41 47 45 37Z','M39 36 Q35 42 36 46 L42 38Z')
    + lock('M47 33 Q41 40 43 47 Q50 44 54 40Z','M48 36 Q44 40 45 43 L51 39Z')
    + lock('M57 34 Q50 44 54 56 Q62 51 65 42Z','M58 38 Q54 45 57 51 L61 42Z','M58 44 L57 51')
    + lock('M67 35 Q76 42 66 53 L65 64 Q77 58 79 49 Q80 39 73 36Z','M70 39 Q75 45 69 53 L68 59 Q76 50 75 44Z');
}

function cap(view) {
  const rear = view >= 3;
  // The rear is viewed from above: a deep crown hides most of the nape hair.
  // Keeping the old frontal crown here made the rear look like a flat cap + bob.
  if (rear) {
    const tilt = view === 3 ? 'rotate(15 63 33)' : '';
    return `<g transform="${tilt}">`
      + path('M32 31 Q30 15 49 9 Q70 3 86 17 Q100 30 91 48 Q83 62 61 63 Q37 61 32 46Z', grad('capCrown'), '#182542', 1.5)
      + path('M34 44 Q43 58 62 58 Q81 57 91 45 L89 51 Q80 62 61 63 Q41 61 35 52Z', '#193866', '#152842', 1.1)
      + line('M39 21 Q48 12 58 11 Q73 10 83 21', '#5284bf', 1)
      + line('M59 16 Q68 32 65 55 M59 16 Q72 17 88 29 M59 16 Q49 25 37 29 M59 16 Q44 36 45 48 M59 16 Q74 34 85 44 M59 16 L49 10 M59 16 L73 10', '#1d4278', .9)
      + line('M37 48 Q60 66 88 49', '#527fb1', .85)
      + ellipse(59, 16, 1.6, 1.1, '#3566a3', '#224371', .6)
      + '</g>'
      + (view === 3 ? path('M30 31 L36 29 L40 40 L34 42Z', grad('gold')) + goggle(33,31,2.7,6,-15) : '');
  }
  if (view === 2) {
    // The side crown wraps down behind the skull. The sloping lower edge,
    // rolled hem and curved panel seams describe its depth above the ear.
    return path('M32 29 C30 19 39 11 51 8 C67 4 82 12 91 23 C97 29 102 37 103 43 Q104 49 96 52 Q91 60 83 58 Q68 54 55 45 L38 35Z', grad('capCrown'), '#182542', 1.5)
      + path('M38 22 Q46 12 60 11 Q77 12 87 26 Q71 16 57 17 Q45 18 38 26Z', '#6ca8df', 'none', 0, 'opacity=".25"')
      + path('M40 32 Q61 37 81 49 Q92 55 101 46 L97 52 Q91 60 83 58 Q62 50 43 39Z', '#1b3968', '#182c4a', 1)
      + line('M55 12 Q68 18 79 34 Q87 44 97 47 M55 12 Q47 19 43 30 M55 12 Q73 12 88 24 M55 12 L51 8 M55 12 Q60 25 65 38', '#1d4278', 1)
      + line('M62 15 Q74 23 80 33 M44 18 Q49 14 54 13', '#5284bf', .75)
      + ellipse(55, 12, 1.5, 1, '#3566a3', '#224371', .6)
      + path('M32 26 Q54 30 88 49 L84 55 Q59 41 32 34Z', 'var(--leather)', 'var(--ink)', 1.1)
      + line('M35 29 Q58 34 85 51', 'var(--gold)', .75)
      + line('M84 57 Q91 58 97 52', '#527fb1', .85)
      + path('M29 32 Q40 32 54 40 Q42 43 28 40 L23 37Z', grad('blue'), 'var(--ink)', 1.1)
      + goggle(31, 26, 4.5, 7.4, -16)
      + path('M64 37 L71 41 L69 48 L62 44Z', grad('gold'), 'var(--ink)', .85)
      + line('M66 40 L65 44', 'var(--leather)', 1.2);
  }
  let s = path(view === 1
    ? 'M30 30 Q29 13 51 8 C70 4 86 14 94 27 Q102 38 98 46 Q94 53 85 49 Q67 43 42 39Z'
    : 'M30 30 Q30 11 53 7 Q77 4 92 18 Q101 27 95 36 Q77 43 42 39Z', grad('blue'), '#182542', 1.5);
  s += path(view === 1 ? 'M35 22 Q43 12 58 11 Q77 10 88 27 Q66 16 35 28Z'
    : 'M35 21 Q43 11 59 10 Q77 8 87 20 Q66 15 35 27Z', '#6ca8df', 'none', 0, 'opacity=".32"');
  if (view === 1) s += path('M65 34 Q83 42 98 42 Q99 52 88 50 L78 45Z', '#193866', '#182c4a', .9);
  s += line(view === 1 ? 'M58 10 Q64 21 66 30 M58 10 Q80 18 94 36 M58 10 Q44 16 37 28 M58 10 Q79 10 89 25' : 'M58 8 Q59 18 63 27 M79 12 Q77 23 85 32 M38 17 Q44 23 39 32', '#1b497e', 1.05);
  const band = view === 0 ? 'M31 28 Q62 19 95 28 L94 35 Q64 27 32 36Z'
    : 'M31 26 Q62 24 94 40 L90 48 Q61 31 31 34Z';
  s += path(band, 'var(--leather)', 'var(--ink)', 1.1);
  s += line(view === 0 ? 'M34 31 Q62 23 92 31' : 'M35 30 Q64 29 91 43', 'var(--gold)', .75);
  // Visor follows the face direction; it is not a rotated copy of the front cap.
  s += path(view === 0 ? 'M34 35 Q62 29 92 35 Q83 43 63 40 Q44 44 34 35Z'
    : 'M30 33 Q48 30 70 37 Q62 43 43 41 L27 38Z', grad('blue'), 'var(--ink)', 1.1);
  if (view === 0) {
    s += line('M57 27 Q63 24 69 27', 'var(--gold)', 2.8);
    s += goggle(46, 26, 9.3, 9.3, -13) + goggle(80, 26, 9.3, 9.3, 13);
  } else {
    s += line('M42 27 L52 29', 'var(--gold)', 2.7);
    s += goggle(35, 25, 5.4, 8.1, -14) + goggle(62, 28, 9.5, 9.1, 13);
    s += path('M82 37 L88 40 L87 46 L81 43Z', grad('gold'), 'var(--ink)', .8)
      + line('M84 40 L84 43', 'var(--leather)', 1.2);
  }
  return s;
}

export function heroMarkup(direction) {
  const index = DIRECTIONS.indexOf(direction);
  if (index < 0) throw new Error(`Unknown direction: ${direction}`);
  const mirror = index > 4;
  const view = mirror ? 8 - index : index;
  // Side tufts belong behind the cheek/ear silhouette. Only scalp-rooted bangs
  // and temple locks sit in front: no detached locks over the eye or cheek.
  const headArt = hairBack(view) + sideLocks(view) + face(view) + fringe(view) + cap(view);
  const head = view === 2 ? `<g transform="translate(63 76) scale(.94 .96) translate(-63 -76)">${headArt}</g>` : headArt;
  const art = torso(view) + scarf(view) + head;
  return `<g ${mirror ? 'transform="translate(126 0) scale(-1 1)"' : ''}>${art}</g>`;
}

export function buildHeroSheet({ cellSize = 128, palette = {} } = {}) {
  if (!Number.isInteger(cellSize) || cellSize < 128 || cellSize > 1024) throw new Error('cellSize must be an integer from 128 to 1024');
  const colors = { ...DEFAULT_PALETTE, ...palette };
  for (const [key, value] of Object.entries(colors)) if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid color: ${key}`);
  const style = Object.entries(colors).map(([k,v]) => `--${k}:${v}`).join(';');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize*4}" height="${cellSize*2}" viewBox="0 0 512 256" style="${style}">${definitions()}${DIRECTIONS.map((d,i) => `<g transform="translate(${i%4*128} ${Math.floor(i/4)*128})">${heroMarkup(d)}</g>`).join('')}</svg>`;
}
