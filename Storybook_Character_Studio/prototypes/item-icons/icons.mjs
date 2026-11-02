// アイテムアイコンの作画原本。1アイコン = 16×16のドット絵。
// 色はゲームの設置物・道具の色（props.js / rig.js / blocks.js）に合わせる。光は左上から。
import { PixelIcon, ICON_SIZE } from './pixel.mjs';
import { CUBES } from './cubes.mjs';

export const OUTLINE = '#2b1d14';

// 文字→色。全アイコン共通にして、同じ素材は同じ色になるようにする。
export const PALETTE = Object.freeze({
  W: '#5f3d1c', w: '#8a5a2c', p: '#c99c5f', P: '#e2bb80', // 木（濃・中・板材・明）
  S: '#96793a', s: '#c2a557', y: '#e6cd7e', // わら
  G: '#5f6569', g: '#8b9196', h: '#b8bec2', // 石
  n: '#3f444b', t: '#6d747c', // 鉄・羽釜
  C: '#8f4f24', c: '#c97b3f', o: '#eaa66a', // 銅
  D: '#a8862c', d: '#d9b545', // 金具
  R: '#8c2a1e', r: '#c23b2a', // 赤
  E: '#cdc4ae', e: '#f2ecdc', // 白・生成り
  V: '#356b2b', v: '#4c9440', // 緑
  F: '#ff7a2f', f: '#ffd35c', // 炎
  b: '#1f1a17', // 黒
  U: '#26447a', u: '#3a62a8', // 藍染め
  M: '#7a5232', m: '#b07c4f', a: '#d6aa78', // けもの皮
  J: '#6b3e1c', j: '#c98a45', l: '#f0d7a0', // 焼き魚
  k: '#7cc158', // 若葉
  I: '#3022ab', i: '#5548ed', q: '#9795ff', // スライム（Studioのスライムと同じ紫）
  K: '#4e3b6b', x: '#8850a3', X: '#ae71bf', // こうもりの翼
  B: '#263759', N: '#3d537b', // こうもりの体（紺）
  Q: '#4f7393', O: '#8fb3cc', // 生のさかな
  A: '#3f7fd0', H: '#8cc4f2', // 水・祭壇の光
  L: '#7a5a42', z: '#a98364', T: '#c9a383', // ねん土
  Z: '#3b2f4a', Y: '#8a7aa8', // イカスミ
});

// 16行×16文字の全面ドット絵。
function art(rows) {
  if (rows.length !== ICON_SIZE || rows.some((r) => r.length !== ICON_SIZE)) {
    throw Error(`Icon art must be ${ICON_SIZE}x${ICON_SIZE}: ${rows.map((r) => r.length).join(',')}`);
  }
  return (ic) => ic.grid(rows, PALETTE);
}

const C = PALETTE;

// 汁物のお椀（きのこ汁・イカスミ汁で共用）。soup は汁の色、bits は具の [x, y, 色]。
function soupBowl(ic, soup, soupDark, bits) {
  ic.grid([
    '.....e...e......',
    '......e...e.....',
    '................',
    '...RRRRRRRRRR...',
    '..R..........R..',
    '..R..........R..',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrRR..',
    '...rrrrrrrrRR...',
    '....rrrrrrRR....',
    '.....bbbbbb.....',
  ], C, 0, 2);
  ic.rect(3, 6, 10, 2, soup);
  ic.rect(9, 7, 4, 1, soupDark);
  for (const [x, y, color] of bits) ic.px(x, y, color);
}

// 斜めに持つ道具の柄。左下が握り。
const handle = (ic, x0, y0, x1, y1, color, r = 0.6) => ic.stroke(x0, y0, x1, y1, r, r, color);

// id → 描画関数。ここにあるものが「作画済み」。
export const ICONS = {
  ...CUBES,
  chest: art([
    '................',
    '................',
    '................',
    '...PPPPPPPPPP...',
    '..WpWppppppWpW..',
    '..WpWppppppWpW..',
    '..WWWWWddWWWWW..',
    '..WwWwwddwwWwW..',
    '..WwWwwDDwwWwW..',
    '..WwWwwwwwwWwW..',
    '..WwWwwwwwwWwW..',
    '..WwWwwwwwwWwW..',
    '..WWWWWWWWWWWW..',
    '................',
    '................',
    '................',
  ]),
  table: art([
    '................',
    '................',
    '................',
    '................',
    '................',
    '....PPPPPPPP....',
    '..PPpeepppppPP..',
    '.PpppEEppeepppP.',
    '.ppppppppEEpppp.',
    '..pppppppppppp..',
    '...WwwwwwwwwW...',
    '....W......W....',
    '....W......W....',
    '................',
    '................',
    '................',
  ]),
  kamado: art([
    '................',
    '.......WW.......',
    '.....WppppW.....',
    '....nttttttn....',
    '...nthttttttn...',
    '..nttttttttttn..',
    '.bbbbbbbbbbbbbb.',
    '.hhhhhhhhhhhhhh.',
    '.ggggGggggGgggg.',
    '.GGGGGGGGGGGGGG.',
    '.ggGggbbbbggGgg.',
    '.gggggbffbggggg.',
    '.GGGGGbFfbGGGGG.',
    '.gggggbFFbggggg.',
    '................',
    '................',
  ]),
  scarecrow: art([
    '................',
    '.......ss.......',
    '.....ssyyss.....',
    '...SssssssssS...',
    '..SSSSSSSSSSSS..',
    '.....eeeeee.....',
    '.....ebeebe.....',
    '.....eeEEee.....',
    '.swwuuuuuuuuwws.',
    '....uuUuuUuu....',
    '....ssssssss....',
    '....uuruuuuu....',
    '.....uUuuUu.....',
    '.......ww.......',
    '.......ww.......',
    '................',
  ]),
  bed: art([
    '................',
    '................',
    '................',
    '................',
    '................',
    '..eeee..........',
    '.yeeeeySyyyySyy.',
    '.sEEEEsSssssSss.',
    '.yyyyyySyyyySyy.',
    '.ssssssSssssSss.',
    '.SSSSSSSSSSSSSS.',
    '.SsssssSssssSss.',
    '.SSSSSSSSSSSSSS.',
    '................',
    '................',
    '................',
  ]),
  fence: art([
    '................',
    '................',
    '..pw........pw..',
    '..pw........pw..',
    '..pwpppppppppw..',
    '..pwWWWWWWWWpw..',
    '..pw........pw..',
    '..pw........pw..',
    '..pw........pw..',
    '..pwpppppppppw..',
    '..pwWWWWWWWWpw..',
    '..pw........pw..',
    '..pw........pw..',
    '..WW........WW..',
    '................',
    '................',
  ]),
  hide: art([
    '................',
    '.......mm.......',
    '..m...mmmm...m..',
    '..mm.mmmmmm.mm..',
    '...mmmmmmmmmm...',
    '....mmmaammm....',
    '....mmaaaamm....',
    '....mmaaaamm....',
    '....mMaaaaMm....',
    '...mmmmaammmm...',
    '..mm.mmmmmm.mm..',
    '..m...mMMm...m..',
    '.......mm.......',
    '.......M........',
    '................',
    '................',
  ]),
  copper: art([
    '................',
    '................',
    '................',
    '......hhhh......',
    '....hhhggghh....',
    '...hhggocgggg...',
    '..hhggcccggGGg..',
    '..hgggcCggoGGg..',
    '.hggGgggggccGgG.',
    '.gggGGggoccCGGG.',
    '.gGgggGGgCCGGGG.',
    '..GGgggGGGGGGG..',
    '...GGGGGGGGGG...',
    '................',
    '................',
    '................',
  ]),
  seed(ic) {
    // 種もみ: 殻つきの籾を5粒。粒どうしは輪郭線1本ぶん離す。
    const grain = ['.y.', 'yys', 'ySs', 'ySs', 'ssS', '.S.'];
    for (const [x, y] of [[1, 2], [6, 1], [12, 2], [3, 8], [9, 8]]) ic.grid(grain, C, x, y);
  },
  club(ic) {
    // こん棒: 本編の手持ちモデル（鋲つきの太い棍棒、細い握り、柄頭）に合わせる。
    ic.stroke(3, 12, 11.2, 3.8, 0.9, 2.4, C.W);
    ic.stroke(2.7, 11.7, 10.6, 3.3, 0.5, 1.7, C.w);
    ic.stroke(4.5, 9.5, 9.4, 3.2, 0.2, 0.6, C.p);
    ic.stroke(2.2, 12.8, 4.4, 10.6, 0.7, 0.7, C.M);
    ic.px(2, 13, C.J);
    for (const [x, y] of [[9, 3], [12, 6], [10, 7]]) ic.px(x, y, C.n);
  },
  sword_copper(ic) {
    // 銅の剣: 銅の刃・金の鍔・赤い柄（本編の手持ちモデルと同じ配色）。
    for (let t = 0; t < 8; t += 1) {
      const x = 6 + t, y = 9 - t;
      if (t < 7) {
        ic.px(x, y - 1, C.o);
        ic.px(x + 1, y, C.C);
      }
      ic.px(x, y, t === 7 ? C.o : C.c);
    }
    for (const [x, y, k] of [[3, 8, 'D'], [4, 9, 'd'], [5, 10, 'd'], [6, 11, 'd'], [7, 12, 'D']]) ic.px(x, y, C[k]);
    ic.px(4, 11, C.r);
    ic.px(3, 12, C.R);
    ic.px(2, 13, C.r);
    ic.px(1, 14, C.d);
  },
  grilled_fish(ic) {
    // 焼き魚: 長皿にのせた塩焼き。焼き色・焦げ目・皿で生のさかなと描き分ける。
    ic.grid(['.eeeeeeeeeeeeee.', '.EeeeeeeeeeeeeE.', '..EEEEEEEEEEEE..'], C, 0, 9);
    ic.ellipse(6.5, 7, 4.8, 2.4, C.j);
    ic.ellipse(6.8, 8.3, 3.4, 0.8, C.l);
    ic.grid(['..jJ', '.jj.', 'jj..', '.jj.', '..jJ'], C, 11, 5);
    for (const [x, y] of [[5, 5], [6, 6], [8, 5], [9, 6]]) ic.px(x, y, C.J);
    ic.px(3, 6, C.b);
  },

  // --- 設置物 -------------------------------------------------------------------
  spikes: art([
    // とげ罠: 本編の設置物と同じく、濃い木の板に円錐のとげ。
    '................',
    '................',
    '................',
    '.......hg.......',
    '.......hg.......',
    '..hg..hhgG..hg..',
    '..hg..hhgG..hg..',
    '.hhgG.hhgG.hhgG.',
    '.hhgG.hhgG.hhgG.',
    '.wwwwwwwwwwwwww.',
    '.wwwwwwwwwwwwww.',
    '.WWWWWWWWWWWWWW.',
    '................',
    '................',
    '................',
    '................',
  ]),
  torch: art([
    '................',
    '........f.......',
    '.......ff.......',
    '......fFf.......',
    '......FffF......',
    '.....FFffFF.....',
    '......SssS......',
    '......SssS......',
    '.......pw.......',
    '.......pw.......',
    '.......pw.......',
    '.......pw.......',
    '.......pw.......',
    '.......pw.......',
    '.......WW.......',
    '................',
  ]),
  door: art([
    '................',
    '...WWWWWWWWWW...',
    '...WPpwPpwPpW...',
    '...WPpwPpwPpW...',
    '...WwwwwwwwwW...',
    '...WPpwPpwPpW...',
    '...WPpwPpwPpW...',
    '...WPpwPpwPdW...',
    '...WPpwPpwPdW...',
    '...WPpwPpwPpW...',
    '...WPpwPpwPpW...',
    '...WwwwwwwwwW...',
    '...WPpwPpwPpW...',
    '...WPpwPpwPpW...',
    '...WWWWWWWWWW...',
    '................',
  ]),
  workbench: art([
    // 作業台: 天板に石の金づちとのこぎり。
    '................',
    '................',
    '................',
    '..ghG...........',
    '..ghGwwww.Whhhg.',
    '..ghG.....WGgGg.',
    '.PPPPPPPPPPPPPP.',
    '.pppppppppppppp.',
    '.WWWWWWWWWWWWWW.',
    '.WW..........WW.',
    '.WW..........WW.',
    '.WWwwwwwwwwwwWW.',
    '.WW..........WW.',
    '.WW..........WW.',
    '................',
    '................',
  ]),
  altar: art([
    // 職業の祭壇: 石の二段の台、白い布、青く光る玉。
    '................',
    '.......HH.......',
    '......HeHA......',
    '......HHAA......',
    '.......AA.......',
    '.....eeeeee.....',
    '.....EEEEEE.....',
    '....hhhhhhhh....',
    '....ggggggGG....',
    '....ggggggGG....',
    '..hhhhhhhhhhhh..',
    '..ggggggggggGG..',
    '..ggggggggggGG..',
    '..GGGGGGGGGGGG..',
    '................',
    '................',
  ]),
  torii: art([
    // 鳥居: 反った笠木、島木、額束、貫、2本の柱。
    '................',
    '.bb..........bb.',
    '.bbbbbbbbbbbbbb.',
    '..rrrrrrrrrrrr..',
    '...rR..rR..rR...',
    '.rrrrrrrrrrrrrr.',
    '...rR......rR...',
    '...rR......rR...',
    '...rR......rR...',
    '...rR......rR...',
    '...rR......rR...',
    '...rR......rR...',
    '...rR......rR...',
    '...rR......rR...',
    '...WW......WW...',
    '................',
  ]),
  helm(ic) {
    // 舵輪: 木の輪、8本のスポークと取っ手、銅のハブ（本編の設置物と同じ配色）。
    const cx = 7.5, cy = 7.5;
    for (let k = 0; k < 8; k += 1) {
      const ang = (k * Math.PI) / 4;
      ic.line(Math.round(cx), Math.round(cy), Math.round(cx + Math.cos(ang) * 6.4), Math.round(cy + Math.sin(ang) * 6.4), C.p);
    }
    for (let y = 1; y <= 14; y += 1) {
      for (let x = 1; x <= 14; x += 1) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= 3.9 && d <= 5.3) ic.px(x, y, x + y < 14 ? C.w : C.W);
      }
    }
    ic.rect(7, 7, 2, 2, C.c);
    ic.px(7, 7, C.o);
  },

  // --- 素材 ---------------------------------------------------------------------
  straw(ic) {
    // わら: 真ん中を縄で縛った束。
    for (let y = 2; y <= 13; y += 1) {
      const w = 2.2 + Math.abs(y - 7.5) * 0.55;
      for (let x = Math.ceil(7.5 - w); x <= Math.floor(7.5 + w); x += 1) {
        ic.px(x, y, ['y', 's', 's', 'S'][(x + (y > 7 ? 1 : 0)) % 4] === 'y' ? C.y : (x % 4 === 3 ? C.S : C.s));
      }
    }
    for (const x of [4, 7, 10]) ic.px(x, 1, C.y);
    ic.rect(5, 7, 6, 2, C.W);
    ic.rect(5, 7, 6, 1, C.w);
  },
  jelly: art([
    '................',
    '................',
    '................',
    '................',
    '......iiii......',
    '....iiqqiiii....',
    '...iiqeqiiiii...',
    '..iiiqqiiiiiII..',
    '..iiiiiiiiiiII..',
    '.iiiiiiiiiiiIII.',
    '.iiiiiiiiiiIIII.',
    '.IiiiiiiiiIIIII.',
    '..IIIIIIIIIIII..',
    '................',
    '................',
    '................',
  ]),
  wing(ic) {
    // こうもりのはね: 骨の間の膜が波形に垂れる片翼（Studioのおおこうもりと同じ紫）。
    // 肩（左）から手首（上）へ腕の骨、手首から指の骨が4本広がる。
    ic.polygon([[1.4, 7], [6, 1.6], [14.4, 2.4], [11.4, 5.4], [14, 8.8], [10, 8.4], [10.8, 13.2], [7.4, 10], [4.4, 12.8], [3, 9.4]], C.x);
    ic.polygon([[3, 6.6], [6, 2.6], [11, 3], [6.4, 6]], C.X);
    ic.line(1, 7, 6, 2, C.K);
    for (const [x, y] of [[14, 2], [13, 8], [10, 12], [5, 12]]) ic.line(6, 2, x, y, C.K);
    ic.px(6, 2, C.B);
  },
  rice: art([
    // 米: 枡に盛った白米。
    '................',
    '................',
    '................',
    '................',
    '......eeee......',
    '....eeEeeEee....',
    '...eEeeeEeeEe...',
    '..eeeEeeeeEeee..',
    '..PPPPPPPPPPPP..',
    '..pppppppppppW..',
    '..pppppppppppW..',
    '..pppppppppppW..',
    '..pppppppppppW..',
    '..WWWWWWWWWWWW..',
    '................',
    '................',
  ]),
  clay: art([
    // ねん土: 指で押したくぼみのある、しっとりした塊。
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....zzzzz......',
    '...zzTTzzzzz....',
    '..zzTTTzzzzzL...',
    '..zTTzzzLzzzzL..',
    '.zzzzzzLLzzzzzL.',
    '.zzzzzzzzzzzzLL.',
    '.LzzzzzzzzzzLLL.',
    '..LLLLLLLLLLLL..',
    '................',
    '................',
    '................',
  ]),
  fish(ic) {
    // さかな: 青い背と白い腹の生の魚。焼き魚と向きをそろえる。
    ic.ellipse(6.5, 7.5, 5, 2.6, C.Q);
    ic.ellipse(6.2, 6.4, 3.6, 1, C.O);
    ic.ellipse(6.8, 8.9, 3.8, 0.9, C.e);
    ic.grid(['..QQ', '.QQ.', 'QQ..', '.QQ.', '..QQ'], C, 11, 5);
    ic.grid(['.QQ', 'QQ.'], C, 6, 3);
    ic.px(3, 7, C.b);
    ic.px(3, 6, C.e);
  },
  mushroom: art([
    // きのこ: 本編の設置物と同じ、赤い傘に白い軸。
    '................',
    '................',
    '....rrrr........',
    '..rrerrrrr......',
    '.rrrrrrerrR.....',
    '.rerrrrrrRR.....',
    '.RRRRRRRRRR.....',
    '....eeE.........',
    '....eeE...rrr...',
    '....eeE..rerrR..',
    '...eeeEE.RRRRR..',
    '...eeeEE...eE...',
    '...EEEEE...eE...',
    '...........EE...',
    '................',
    '................',
  ]),
  rope(ic) {
    // ロープ: 輪にまとめた縄と、垂れた両端。より目を斜めの縞で表す。
    const twist = (x, y) => ((x + y) % 3 === 0 ? C.S : (x + y) % 3 === 1 ? C.s : C.y);
    for (const [x0, x1] of [[6, 7], [8, 9]]) {
      for (let y = 10; y <= 14; y += 1) for (let x = x0; x <= x1; x += 1) ic.px(x + (x0 > 7 ? Math.floor((y - 10) / 3) : -Math.floor((y - 10) / 3)), y, twist(x, y));
    }
    for (let y = 1; y <= 12; y += 1) {
      for (let x = 1; x <= 14; x += 1) {
        const d = Math.hypot((x - 7.5) / 6.4, (y - 6.4) / 5.2);
        if (d >= 0.6 && d <= 1) ic.px(x, y, twist(x, y));
      }
    }
    ic.rect(6, 10, 4, 1, C.W); // 結び目
    // 外側の巻きから出た縄の端を、巻きの上へ渡す。
    ic.stroke(3.2, 4.6, 7.4, 7.4, 0.8, 0.8, C.s);
    ic.line(3, 5, 7, 8, C.y);
  },
  sailcloth: art([
    // 帆布: たたんで重ねた白い布を、わら縄で縛る。
    '................',
    '................',
    '................',
    '..eeeeeeeeeeee..',
    '..eeeeeeesseeeE.',
    '..EEEEEEESSEEEE.',
    '..eeeeeeesseeee.',
    '..eeeeeeesseeeE.',
    '..EEEEEEESSEEEE.',
    '..eeeeeeesseeee.',
    '..eeeeeeesseeeE.',
    '..EEEEEEESSEEEE.',
    '................',
    '................',
    '................',
    '................',
  ]),
  squid_ink: art([
    // イカスミ: 墨のしずく。真っ黒だと暗い枠に沈むので、紫がかった黒に光を入れる。
    '................',
    '................',
    '.......Z........',
    '......YZb.......',
    '......YZb.......',
    '.....YZZbb......',
    '....ZYZZbbb.....',
    '...ZYYZZbbbb....',
    '...ZYZZZbbbb....',
    '..ZZZZZbbbbbb...',
    '..ZZZZbbbbbbb...',
    '..ZZZbbbbbbbb...',
    '...ZZbbbbbbb....',
    '....bbbbbbb.....',
    '......bbb.......',
    '................',
  ]),
  fitting(ic) {
    // 銅の金具: 鋲穴のあるL字の金具と船釘。
    ic.grid([
      'ocC.......',
      'ocC.......',
      'obC.......',
      'ocC.......',
      'ocC.......',
      'obC.......',
      'ocC.......',
      'oooooooooo',
      'occbcccbcC',
      'CCCCCCCCCC',
    ], C, 2, 2);
    ic.line(8, 7, 12, 3, C.c);
    ic.px(12, 3, C.o);
    ic.px(13, 2, C.o);
    ic.px(13, 3, C.C);
  },

  // --- 道具・防具 -------------------------------------------------------------------
  // ハンマー2種は頭を横、柄を縦にしたT字。斜めにすると石の頭が斧に見えるため。
  hammer_wood: art([
    // 木のハンマー: 円柱の頭の木槌。両端に濃い輪（本編の手持ちモデルと同じ）。
    '................',
    '................',
    '..wPPPPPPPPPPw..',
    '..wppppppppppw..',
    '..wppppppppppw..',
    '..wppppppppppw..',
    '..WWWWWWWWWWWW..',
    '.......pw.......',
    '.......pw.......',
    '.......pw.......',
    '.......pw.......',
    '.......pw.......',
    '.......MM.......',
    '.......MM.......',
    '.......JJ.......',
    '................',
  ]),
  hammer_stone: art([
    // 石のハンマー: 角ばった石の頭を、わら縄で柄に縛る。
    '................',
    '................',
    '..hhhhhhhhhhhG..',
    '..hggggggggGGG..',
    '..hggGgggggggG..',
    '..gggggggggGGG..',
    '..GGGGssssGGGG..',
    '......sSSs......',
    '.......wW.......',
    '.......wW.......',
    '.......wW.......',
    '.......wW.......',
    '.......wW.......',
    '.......wW.......',
    '.......WW.......',
    '................',
  ]),
  sword_stone(ic) {
    // 石の剣: 灰色の石刃、木の鍔、黒い柄（本編の手持ちモデルと同じ配色）。
    for (let t = 0; t < 8; t += 1) {
      const x = 6 + t, y = 9 - t;
      if (t < 7) {
        ic.px(x, y - 1, C.h);
        ic.px(x + 1, y, C.G);
      }
      ic.px(x, y, t === 7 ? C.h : C.g);
    }
    for (const [x, y] of [[3, 8], [4, 9], [5, 10], [6, 11], [7, 12]]) ic.px(x, y, C.w);
    ic.px(4, 11, C.W);
    ic.px(3, 12, C.b);
    ic.px(2, 13, C.W);
    ic.px(1, 14, C.w);
  },
  cape: art([
    // こうもりのマント: 紺の外側、紫の裏地、金の留め具、すそはこうもりの翼の形。
    '................',
    '................',
    '....xx....xx....',
    '....xNNddNBx....',
    '.....NNddBB.....',
    '....NNNxxBBB....',
    '...NNNNxxBBBB...',
    '...NNNNxxBBBB...',
    '..NNNNNxxBBBBB..',
    '..NNNNNxxBBBBB..',
    '.NNNNNNxxBBBBBB.',
    '.NNNNNNxxBBBBBB.',
    '.NN.NNNxxBBB.BB.',
    '.N...NN..BB...B.',
    '................',
    '................',
  ]),

  // --- 食べ物 -------------------------------------------------------------------
  herb(ic) {
    // やくそう: 若葉の茎。
    ic.line(7, 14, 7, 9, C.V);
    ic.line(7, 9, 9, 3, C.V);
    for (const [x0, y0, x1, y1] of [[7, 11, 2.6, 8.6], [7, 9, 12, 6.8], [8, 6, 3.8, 3], [9, 4, 11.6, 1.6]]) {
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      ic.stroke(x0, y0, mx, my, 0.5, 1.5, C.v);
      ic.stroke(mx, my, x1, y1, 1.5, 0.3, C.v);
      ic.line(Math.round(x0), Math.round(y0), Math.round(mx), Math.round(my), C.V);
      ic.px(Math.round((mx + x1) / 2), Math.round((my + y1) / 2) - 1, C.k);
    }
  },
  onigiri: art([
    '................',
    '................',
    '.......ee.......',
    '......eeee......',
    '.....eeeeee.....',
    '.....eeEeeE.....',
    '....eeeeeeEE....',
    '....eEeeeeeE....',
    '...eeeeeEeeEE...',
    '..eeeebbbbeeEE..',
    '..eEeebnbbeeEE..',
    '.eeeeebbbbeEeEE.',
    '.eeeeebbbbeeeEE.',
    '..EEEEbbbbEEEE..',
    '................',
    '................',
  ]),
  mushroom_soup(ic) {
    // きのこ汁: 赤い漆のお椀に味噌汁、きのこの具。
    soupBowl(ic, C.j, C.J, [[4, 6, C.r], [5, 6, C.e], [8, 7, C.a], [10, 6, C.r], [11, 6, C.e], [6, 7, C.v]]);
  },
  feast: art([
    // ごちそう膳: 朱塗りの膳に、ご飯・焼き魚・汁のお椀。
    '................',
    '................',
    '................',
    '................',
    '...ee...........',
    '..eeee....bbbb..',
    '..eeEe....bjjb..',
    '..uuuujjj.rrrr..',
    '..uUUujjJjrrrR..',
    '...uu.eeee.rR...',
    '.RRRRRRRRRRRRRR.',
    '.rrrrrrrrrrrrrr.',
    '.RRRRRRRRRRRRRR.',
    '..b..........b..',
    '................',
    '................',
  ]),
  squid_soup(ic) {
    // イカスミ汁: 黒い汁に白いイカの具。
    soupBowl(ic, C.Z, C.b, [[4, 6, C.e], [5, 6, C.e], [8, 7, C.e], [9, 7, C.E], [11, 6, C.e], [7, 6, C.Y]]);
  },
};

// 描画済みアイコンをRGBAで返す。
export function renderIcon(id) {
  const draw = ICONS[id];
  if (!draw) throw Error(`No icon art for ${id}`);
  const ic = new PixelIcon();
  draw(ic);
  ic.outline(OUTLINE);
  return ic;
}
