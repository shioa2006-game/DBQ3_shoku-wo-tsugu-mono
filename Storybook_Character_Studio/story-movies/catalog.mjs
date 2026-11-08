// SVGストーリームービーの一覧データ。Studioの /story-movies/ （index.html）がこれを読んで表示する。
// 物語の内容・入る場所・長さ・優先度・作る順番の正本は、親リポジトリの docs/story/planned/story-movies.md。
// 計画を変えたらここも直す（tests/node/story-movies.test.mjs が計画資料の表・作る順番と照合する）。
// 新しいムービーを作ったら、story-movies/<slug>/index.html を置き、status を 'prototype' にして thumb を指定する。

/** 制作の状態。 */
export const STATUS = {
  planned: { label: '未制作' },
  prototype: { label: 'Studioで試作済み' },
  game: { label: 'ゲームに組み込み済み' },
};

/** 一覧の区分（物語の順で並べるときの見出し）。 */
export const SAGAS = [
  { id: 'zipangu', title: 'ジパング復興編', note: '第1～3章（dqb3-tsugumono-ch1-3）' },
  { id: 'volcano', title: '火山島編', note: '第4～5章（dqb3-tsugumono-ch4-5）' },
  { id: 'common', title: '両編で繰り返し使うもの', note: '型を1つ作り、差し替えて使う' },
];

/** 作る順番（計画資料の「作る順番の提案」と同じ）。0 はすでに試作済み。 */
export const BUILD_STEPS = [
  { step: 0, label: '試作済み' },
  { step: 1, label: '編の終わりと始まりを対で', note: 'ジパング復興編の終わりと火山島編の始まり。2つのゲームをつなぐ' },
  { step: 2, label: '火山島編の終わり', note: 'プロローグの神殿と呼応させる' },
  { step: 3, label: '書の復活の型', note: '1つ作れば5回使える。先に5冊の書の意匠を決める' },
  { step: 4, label: 'ジパング復興編の章の結び', note: '中くらいの長さの2本を続けて作る' },
];

/**
 * 採用したムービー（物語の順）。
 * id: 計画資料の番号 / slug: Studio内のフォルダ名（story-movies/<slug>/） / length・priority: 計画資料の表と同じ表記
 * tone: 未制作のときの見本の色（夜・朝などの雰囲気だけ） / thumb: 試作済みのとき一覧に出す静止画（場面・ミリ秒）
 */
export const MOVIES = [
  {
    id: 'M0', slug: 'prologue', title: 'プロローグ「職をつぐ者」', saga: 'zipangu', status: 'prototype', buildStep: 0,
    when: '第1～3章・開始', place: '「はじめから」の後、第1章の導入会話の前', length: '大・31秒', priority: null,
    summary: '勇者の勝利から、魔物の再来、ダーマ神殿の崩壊、職業の書を背負ったシオンの脱出、ジパングへの漂着まで。',
    scenes: ['平和の終わり', '異変', 'ダーマ神殿の崩壊', 'シオンの脱出', 'ジパングへの漂着とタイトル'],
    cast: ['シオン'],
    tone: ['#1b2440', '#e9a54a'],
    thumb: { scene: 5, t: 6600 },
    links: [{ label: '制作メモ', href: 'prologue/README.md' }, { label: '絵コンテ', href: 'prologue/reference/storyboard.md' }],
  },
  {
    id: 'M1', slug: 'ch1-shrine', title: '第1章の結び「小さな社」', saga: 'zipangu', status: 'planned', buildStep: 4,
    when: '第1章・章末', place: '社の祭壇で祈った後（文字の章末を置き換え）', length: '中・15秒', priority: 'B',
    summary: '最初の章を締めくくり、シオンが「職をつぐ者」と呼ばれる場面を印象づける。今の章末の文とプロローグの重なりも解消する。',
    scenes: ['夜の北の山の社。祭壇に職業の書と農民の書が並び、灯りがともる', '社を見上げる島の人々', '朝の村の全景（小屋・畑・旗）', '「職をつぐ旅は、ここから続いていく」'],
    cast: ['シオン', 'ミナ', 'ピノ', 'ゴンタ', 'ジンベエ'],
    tone: ['#18223f', '#f0c35a'],
  },
  {
    id: 'M9', slug: 'ch2-harvest', title: '第2章の結び「収穫祭の夜」', saga: 'zipangu', status: 'planned', buildStep: 4,
    when: '第2章・章末', place: '田んぼ防衛戦の勝利会話の後（章末の演出を新しく足す）', length: '中・約18秒', priority: 'B',
    summary: '「食卓が戻る」収穫祭で第2章を締めくくり、沖の嵐で第3章の海と船へつなぐ。ワタリの漂着とクラーケンの全身は見せない。',
    scenes: ['守った田（月夜に実った稲が揺れる）', '収穫祭（かまどの火と、膳を囲む人々）', '二冊の書（農民と料理人の紋が浮かぶ）', '荒れる沖（稲光、波にもまれる小船の影、海中の巨大な影）', '「職をつぐ旅は、まだ続く。」'],
    cast: ['シオン', 'ミナ', 'イナホ', 'ゴンタ', 'ジンベエ', 'ピノ'],
    tone: ['#141d3a', '#e8823e'],
  },
  {
    id: 'M4', slug: 'ch3-departure', title: '旅立ち「ジパング復興編・完」', saga: 'zipangu', status: 'prototype', buildStep: 1,
    when: '第3章・結末', place: 'ワタリに旅立ちを告げた後（文字の結末を置き換え。クリア後の再演でも再生）', length: '大・30～35秒', priority: 'A',
    summary: '第1～3章の総まとめと、島からの船出。第2章の結びの荒れた夜の海と対になる、晴れた朝の海へ。火山島編（M5）へつなぐ。',
    scenes: ['復興した島（田・食堂・灯台・社）を朝の光で見渡す', '島に残るピノ・イナホ・ジンベエ', '船に乗る四人と、桟橋で見送る人々', '灯台の光の先、水平線へ進む帆', 'タイトル「ジパング復興編・完」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ', 'ピノ', 'イナホ', 'ジンベエ'],
    tone: ['#5b9cc8', '#f6dc8c'],
    thumb: { scene: 3, t: 3600 },
    links: [{ label: '制作メモ', href: 'ch3-departure/README.md' }, { label: '絵コンテ', href: 'ch3-departure/reference/storyboard.md' }],
  },
  {
    id: 'M5', slug: 'ch4-arrival', title: '火山島編の始まり「海を越えて」', saga: 'volcano', status: 'prototype', buildStep: 1,
    when: '第4～5章・開始', place: '「はじめから」の後、第4章の導入会話の前', length: '大・25～30秒', priority: 'A',
    summary: '別のゲームとして始まる火山島編の入口。プロローグとM4の絵を思い出の額にしてこれまでの旅を短く振り返り、火山島への到着を見せる。',
    scenes: ['これまでの旅①：神殿から逃れた見習い（プロローグの絵を額に）', 'これまでの旅②：ジパングの復興と、島に残る三人（M4の絵を額に）',
      '長い航海。夕暮れから夜へ、空になった樽と船上の四人', '灰の匂いの風と、煙を上げる黒い島影', '焼けた船着き場。タイトル「火山島編」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ'],
    tone: ['#3b3a40', '#d8663a'],
    thumb: { scene: 4, t: 4200 },
    links: [{ label: '制作メモ', href: 'ch4-arrival/README.md' }, { label: '絵コンテ', href: 'ch4-arrival/reference/storyboard.md' }],
  },
  {
    id: 'M7', slug: 'ch5-return', title: '帰るべき場所へ「火山島編・完」', saga: 'volcano', status: 'planned', buildStep: 2,
    when: '第5章・結末', place: '清めの泉の完成後（文字の結末を置き換え）', length: '大・30～35秒', priority: 'A',
    summary: '第4～5章を締めくくり、旧ダーマ神殿へ戻る決意を見せる。夜の海の向こうに、プロローグと同じ形の崩れた神殿の影。',
    scenes: ['澄んだ水が戻る清めの泉', '町の人々', '船出する四人', '夜の海の向こうに、崩れた神殿の影', 'タイトル「火山島編・完」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ', 'ベルク', 'ナギ', 'ヨモギ', 'ロク', 'カヤ', 'スミ', 'テル'],
    tone: ['#1c3346', '#8fd0c4'],
  },
  {
    id: 'M2', slug: 'book-revival', title: '書の復活（共通の型）', saga: 'common', status: 'planned', buildStep: 3,
    when: '第1～5章（5回）', place: '農民・料理人・船乗り・鍛冶屋・僧侶の書が復活するとき（復活の小窓を置き換え）', length: '小・6～8秒', priority: 'B',
    summary: '職が戻る瞬間を、毎回同じ型で見せる。書の色・紋章・道具の絵だけを差し替える。先にStudioで5冊の書の意匠（表紙の色・紋章）を決める。',
    scenes: ['白紙の書が開く', 'ページに光の文字が戻る', 'その職の道具が光の中に浮かぶ（鍬・鍋・舵・槌・薬草など）', '書の名前を表示する'],
    cast: [],
    tone: ['#20392d', '#e6c46a'],
  },
];

/** 見送った案（計画資料の「見送ったもの」と同じ）。 */
export const DECLINED = [
  { id: 'M3', title: '強敵の出現', note: 'クラーケン・瘴泉竜グロムとの戦闘の直前' },
  { id: 'M6', title: '黒い爪痕', note: '鍛冶屋の書の復活の直後の伏線' },
  { id: 'M8', title: '章の幕開け（章タイトル）', note: '第2・3・5章の開始' },
];

/** 計画資料（親リポジトリ内の場所。Studioのサーバーでは開けない）。 */
export const PLAN_DOC = 'docs/story/planned/story-movies.md';
