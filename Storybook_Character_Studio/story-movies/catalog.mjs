// SVGストーリームービーの一覧データ。Studioの /story-movies/ （index.html）がこれを読んで表示する。
// 物語の内容・入る場所・長さ・優先度・作る順番の正本は、親リポジトリの計画資料（PLAN_DOCS）：
// 第1～5章は docs/story/planned/story-movies.md、第6～7章は docs/story/planned/chapter6-7-movies.md。
// 計画を変えたらここも直す（tests/node/story-movies.test.mjs が計画資料の表・作る順番と照合する）。
// 新しいムービーを作ったら、story-movies/<slug>/index.html を置き、status を 'prototype' にして thumb を指定する。
// ゲームへ組み込んだら（game-targets.mjs に書き出し先を足し、npm.cmd run sync:movies で写す）status を 'game' にする。

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
  { id: 'dharma', title: 'ダーマ再興編', note: '第6～7章（dqb3-tsugumono-ch6-7）' },
  { id: 'common', title: '両編で繰り返し使うもの', note: '型を1つ作り、差し替えて使う' },
];

/** 作る順番（計画資料の「作る順番の提案」と同じ）。0 はすでに試作済み。第6～7章の計画の 1～3 番は、ここでは 5～7。 */
export const BUILD_STEPS = [
  { step: 0, label: '試作済み' },
  { step: 1, label: '編の終わりと始まりを対で', note: 'ジパング復興編の終わりと火山島編の始まり。2つのゲームをつなぐ' },
  { step: 2, label: '火山島編の終わり', note: 'プロローグの神殿と呼応させる' },
  { step: 3, label: '書の復活の型', note: '1つ作れば5回使える。先に5冊の書の意匠を決める' },
  { step: 4, label: 'ジパング復興編の章の結び', note: '中くらいの長さの2本を続けて作る' },
  { step: 5, label: 'ダーマ再興編の始まりと終わり', note: '第6～7章。島・神殿跡・再建した神殿・船をここでそろえる' },
  { step: 6, label: 'ダーマ再興編の第6章の結び', note: 'M10の島とM14の神殿を使い回す。三つ首の影は輪郭だけ' },
  { step: 7, label: 'ヴァルガが登場する2本', note: 'Studioでヴァルガの作画ができてから作る' },
];

/**
 * 計画資料（親リポジトリ内の場所）と、そこに載っている区分。stepOffset は計画の作る順の番号に足す数。
 * 見送ったもの（DECLINED）は第1～5章の計画だけにある。
 */
export const PLAN_DOCS = [
  { doc: 'docs/story/planned/story-movies.md', sagas: ['zipangu', 'volcano', 'common'], stepOffset: 0 },
  { doc: 'docs/story/planned/chapter6-7-movies.md', sagas: ['dharma'], stepOffset: 4 },
];

/**
 * 採用したムービー（物語の順）。
 * id: 計画資料の番号 / slug: Studio内のフォルダ名（story-movies/<slug>/） / length・priority: 計画資料の表と同じ表記
 * tone: 未制作のときの見本の色（夜・朝などの雰囲気だけ） / thumb: 試作済みのとき一覧に出す静止画（場面・ミリ秒）
 */
export const MOVIES = [
  {
    id: 'M0', slug: 'prologue', title: 'プロローグ「職をつぐ者」', saga: 'zipangu', status: 'game', buildStep: 0,
    when: '第1～3章・開始', place: '「はじめから」の後、第1章の導入会話の前', length: '大・31秒', priority: null,
    summary: '勇者の勝利から、魔物の再来、ダーマ神殿の崩壊、職業の書を背負ったシオンの脱出、ジパングへの漂着まで。',
    scenes: ['平和の終わり', '異変', 'ダーマ神殿の崩壊', 'シオンの脱出', 'ジパングへの漂着とタイトル'],
    cast: ['シオン'],
    tone: ['#1b2440', '#e9a54a'],
    thumb: { scene: 5, t: 6600 },
    links: [{ label: '制作メモ', href: 'prologue/README.md' }, { label: '絵コンテ', href: 'prologue/reference/storyboard.md' }],
  },
  {
    id: 'M1', slug: 'ch1-shrine', title: '第1章の結び「小さな社」', saga: 'zipangu', status: 'game', buildStep: 4,
    when: '第1章・章末', place: '社の祭壇で祈った後（文字の章末を置き換え）', length: '中・15秒', priority: 'B',
    summary: '最初の章を締めくくり、シオンが「職をつぐ者」と呼ばれる場面を印象づける。今の章末の文のうち第1章の行だけを使い、プロローグとの重なりを解消した。',
    scenes: ['夜の社。祭壇に職業の書と農民の書が並び、石灯籠に灯りがともる', '社を見上げるミナ・ピノ・ゴンタ・ジンベエ（後ろ姿）',
      '朝の村の全景（小屋・田と畑・柵・旗）', '「職をつぐ旅は、ここから続いていく」とタイトル「第1章・完」'],
    cast: ['ミナ', 'ピノ', 'ゴンタ', 'ジンベエ'],
    tone: ['#18223f', '#f0c35a'],
    thumb: { scene: 1, t: 3500 },
    links: [{ label: '制作メモ', href: 'ch1-shrine/README.md' }, { label: '絵コンテ', href: 'ch1-shrine/reference/storyboard.md' }],
  },
  {
    id: 'M9', slug: 'ch2-harvest', title: '第2章の結び「収穫祭の夜」', saga: 'zipangu', status: 'game', buildStep: 4,
    when: '第2章・章末', place: '田んぼ防衛戦の勝利会話の後（章末の演出を新しく足す）', length: '中・約18秒', priority: 'B',
    summary: '「食卓が戻る」収穫祭で第2章を締めくくり、沖の嵐で第3章の海と船へつなぐ。ワタリの漂着とクラーケンの全身は見せない。',
    scenes: ['守った田：月夜、泥の跡の残る田で実った稲が揺れる', '収穫祭：食堂の前で膳を囲む五人と、料理を運ぶイナホ',
      '二冊の書：シオンの背中の職業の書が光り、農民と料理人の書が浮かぶ', '荒れる沖：稲光と波にもまれる船の影。一瞬だけ海の中の巨大な影',
      '結び：嵐が遠くで続く暗い海。タイトル「第2章・完」'],
    cast: ['シオン', 'ミナ', 'イナホ', 'ゴンタ', 'ジンベエ', 'ピノ'],
    tone: ['#141d3a', '#e8823e'],
    thumb: { scene: 2, t: 3500 },
    links: [{ label: '制作メモ', href: 'ch2-harvest/README.md' }, { label: '絵コンテ', href: 'ch2-harvest/reference/storyboard.md' }],
  },
  {
    id: 'M4', slug: 'ch3-departure', title: '旅立ち「ジパング復興編・完」', saga: 'zipangu', status: 'game', buildStep: 1,
    when: '第3章・結末', place: 'ワタリに旅立ちを告げた後（文字の結末を置き換え。クリア後の再演でも再生）', length: '大・30～35秒', priority: 'A',
    summary: '第1～3章の総まとめと、島からの船出。第2章の結びの荒れた夜の海と対になる、晴れた朝の海へ。火山島編（M5）へつなぐ。',
    scenes: ['復興した島（田・食堂・灯台・社）を朝の光で見渡す', '島に残るピノ・イナホ・ジンベエ', '船に乗る四人と、桟橋で見送る人々', '灯台の光の先、水平線へ進む帆', 'タイトル「ジパング復興編・完」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ', 'ピノ', 'イナホ', 'ジンベエ'],
    tone: ['#5b9cc8', '#f6dc8c'],
    thumb: { scene: 3, t: 3600 },
    links: [{ label: '制作メモ', href: 'ch3-departure/README.md' }, { label: '絵コンテ', href: 'ch3-departure/reference/storyboard.md' }],
  },
  {
    id: 'M5', slug: 'ch4-arrival', title: '火山島編の始まり「海を越えて」', saga: 'volcano', status: 'game', buildStep: 1,
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
    id: 'M7', slug: 'ch5-return', title: '帰るべき場所へ「火山島編・完」', saga: 'volcano', status: 'game', buildStep: 2,
    when: '第5章・結末', place: '清めの泉の完成後（文字の結末を置き換え）', length: '大・30～35秒', priority: 'A',
    summary: '第4～5章を締めくくり、旧ダーマ神殿へ戻る決意を見せる。夜の海の向こうに、屋根を失い二本の柱だけが立つ神殿跡の影（M10と同じ形）。',
    scenes: ['澄んだ水が戻る清めの泉と、火の戻った鉱山町', '町の人々（ベルク・ナギ・ヨモギと、ロク・カヤ・スミ・テル）',
      '夕日の海へ船出する四人と、桟橋で見送る人々', '夜の海の向こうに、崩れた神殿の影。タイトル「火山島編・完」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ', 'ベルク', 'ナギ', 'ヨモギ', 'ロク', 'カヤ', 'スミ', 'テル'],
    tone: ['#1c3346', '#8fd0c4'],
    thumb: { scene: 2, t: 7000 },
    links: [{ label: '制作メモ', href: 'ch5-return/README.md' }, { label: '絵コンテ', href: 'ch5-return/reference/storyboard.md' }],
  },
  {
    id: 'M10', slug: 'ch6-arrival', title: 'ダーマ再興編の始まり「始まりの場所」', saga: 'dharma', status: 'game', buildStep: 5,
    when: '第6章・開始', place: '「はじめから」の後、第6章の導入会話（着岸・スズハとの出会い）の前', length: '大・25～30秒', priority: 'A',
    summary: '別のゲームとして始まるダーマ再興編の入口。三枚の思い出の額でこれまでの旅を振り返り、M7の夜の海の続きの夜明けから、旧ダーマ神殿の島への着岸までを見せる。',
    scenes: ['これまでの旅：神殿からの脱出・ジパングの復興・清めの泉（三枚の思い出の額）', '夜明けの海。日が昇り、船の上の四人',
      '船首の四人の後ろ姿と、海から山へ続く島', '山腹の神殿跡。屋根を失い、二本の柱だけが立つ', '古い桟橋への着岸。タイトル「ダーマ再興編」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ'],
    tone: ['#3a5a7a', '#f2c98a'],
    thumb: { scene: 4, t: 4200 },
    links: [{ label: '制作メモ', href: 'ch6-arrival/README.md' }, { label: '絵コンテ', href: 'ch6-arrival/reference/storyboard.md' }],
  },
  {
    id: 'M11', slug: 'ch6-roof-light', title: '第6章の結び「大屋根の灯」', saga: 'dharma', status: 'game', buildStep: 6,
    when: '第6章・章末', place: '神殿の完成と最初の授職を祝った後、第7章へ移る前', length: '中・15～20秒', priority: 'B',
    summary: '神殿の完成と最初の授職の喜びで第6章を締めくくり、最後に海の向こうから来る三つ首の影とガーゴイルの群れを、輪郭だけで短く見せる。',
    scenes: ['授職の灯がともる祭壇と、アサギの大工の印を刻んだ選択の柱', '共同台所の前の祝いの夜', '海岸から望む、灯のともった大屋根',
      '遠い咆哮。月の沖を横切る三つ首の影とガーゴイルの群れ（輪郭だけ）', 'タイトル「第6章・完」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ', 'ピノ', 'スズハ', 'アサギ', 'ガンゾウ'],
    tone: ['#1e2a4a', '#f0b862'],
    thumb: { scene: 2, t: 3600 },
    links: [{ label: '制作メモ', href: 'ch6-roof-light/README.md' }, { label: '絵コンテ', href: 'ch6-roof-light/reference/storyboard.md' }],
  },
  {
    id: 'M12', slug: 'ch7-three-heads', title: '三頭魔竜の襲来「三つ首の影」', saga: 'dharma', status: 'game', buildStep: 7,
    when: '第7章・中盤', place: 'ガーゴイル軍の3波を退けた後、初襲来の戦闘の直前', length: '小・6～8秒', priority: 'B',
    summary: '軍勢を率いる竜が自ら海を越えて現れ、ダーマを焼いたのは自分だと名乗る。戦いの結果は見せない。',
    scenes: ['海の向こうの空が暗くなり、水平線から三つ首の竜が飛んでくる', '三つの頭が大屋根を見下ろし、火を噴く構えをとる', '竜が自ら名を告げる'],
    cast: ['ヴァルガ'],
    tone: ['#2a1d2e', '#c8462e'],
    thumb: { scene: 2, t: 2200 },
    links: [{ label: '制作メモ', href: 'ch7-three-heads/README.md' }, { label: '絵コンテ', href: 'ch7-three-heads/reference/storyboard.md' }],
  },
  {
    id: 'M13', slug: 'ch7-flame-holds', title: '最終決戦の決着「灯は消えず」', saga: 'dharma', status: 'game', buildStep: 7,
    when: '第7章・終盤', place: '三つ目の頭を倒した直後、戦後の修復の前', length: '中・10～20秒', priority: 'B',
    summary: '三つの頭を倒した決着と、傷ついた神殿の奥で祭壇の灯がともり続けていることを見せる。',
    scenes: ['三つ目の頭が倒れ、竜の巨体が黒い霧へ崩れる', '煙が晴れ、傷ついた屋根と壁の奥で祭壇の灯がともり続ける。朝の光が選択の柱の印を照らす',
      '朝の光の中の対空ボウガンの射台と傷の残る神殿、集まる仲間と住民。タイトル「灯は消えず」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ', 'ピノ', 'ベルク', 'スズハ', 'アサギ', 'ガンゾウ', 'ヴァルガ'],
    tone: ['#3a3440', '#f6d38a'],
    thumb: { scene: 2, t: 4200 },
    links: [{ label: '制作メモ', href: 'ch7-flame-holds/README.md' }, { label: '絵コンテ', href: 'ch7-flame-holds/reference/storyboard.md' }],
  },
  {
    id: 'M14', slug: 'ch7-unseen-books', title: 'ダーマ再興編・完「まだ見ぬ書へ」', saga: 'dharma', status: 'game', buildStep: 5,
    when: '第7章・結末', place: 'スズハへの継承の後、ピノとベルクも乗せた最後の出航', length: '大・30～35秒', priority: 'A',
    summary: 'ダーマ再興編とこれまでの旅を締めくくる。ピノをジパング、ベルクを火山島へ送り届け、世界中の職業の書を探す旅へ。',
    scenes: ['再開した神殿', '桟橋から出る船', 'ジパングでピノが降りる', '火山島でベルクが降りる', '四人と職業の書だけを乗せて、その先の海へ',
      '水平線。タイトル「ダーマ再興編・完」と「職をつぐ者」「完」'],
    cast: ['シオン', 'ミナ', 'ゴンタ', 'ワタリ', 'ピノ', 'ベルク', 'スズハ', 'アサギ', 'ガンゾウ', 'イナホ', 'ジンベエ', 'ナギ', 'ロク', 'カヤ', 'ヨモギ'],
    tone: ['#5b9cc8', '#ffe7a8'],
    thumb: { scene: 2, t: 2600 },
    links: [{ label: '制作メモ', href: 'ch7-unseen-books/README.md' }, { label: '絵コンテ', href: 'ch7-unseen-books/reference/storyboard.md' }],
  },
  {
    id: 'M2', slug: 'book-revival', title: '書の復活（共通の型）', saga: 'common', status: 'game', buildStep: 3,
    when: '第1～5章（5回）', place: '農民・料理人・船乗り・鍛冶屋・僧侶の書が復活するとき（復活の小窓を置き換え）', length: '小・6～8秒', priority: 'B',
    summary: '職が戻る瞬間を、毎回同じ型で見せる。書の色・紋章・道具の絵だけを差し替える。5冊の書の意匠（表紙の色・紋章）はこの試作で案を作った（shared/books.py）。',
    scenes: ['白紙の書が開く', 'ページに光の文字が戻る', 'その職の道具が光の中に浮かぶ（鍬・鍋・舵輪・槌・薬草）', '書の名前を表示する'],
    cast: [],
    tone: ['#20392d', '#e6c46a'],
    thumb: { scene: 1, t: 6000 },
    links: [{ label: '制作メモ', href: 'book-revival/README.md' }, { label: '絵コンテ', href: 'book-revival/reference/storyboard.md' }],
  },
];

/** 見送った案（計画資料の「見送ったもの」と同じ）。 */
export const DECLINED = [
  { id: 'M3', title: '強敵の出現', note: 'クラーケン・瘴泉竜グロムとの戦闘の直前' },
  { id: 'M6', title: '黒い爪痕', note: '鍛冶屋の書の復活の直後の伏線' },
  { id: 'M8', title: '章の幕開け（章タイトル）', note: '第2・3・5章の開始' },
];

/** 第1～5章の計画資料（親リポジトリ内の場所。Studioのサーバーでは開けない）。第6～7章も含めた一覧は PLAN_DOCS。 */
export const PLAN_DOC = PLAN_DOCS[0].doc;
