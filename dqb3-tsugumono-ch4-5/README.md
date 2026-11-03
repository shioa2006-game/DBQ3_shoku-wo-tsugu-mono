# DQB3 職をつぐ者 — 火山島編（第4〜5章）

ドラゴンクエストビルダーズ風ブロックメイクRPG「職をつぐ者」の火山島編。
第4章「鬼火の山」と第5章「眠る竹林の社」を収録する独立ゲームで、
ジパング復興編（`dqb3-tsugumono-ch1-3`）の正史を組み込んだ固定状態から New Game が始まる。

- [共通ストーリー資料・参照ルール](../docs/story/README.md)
- [第4章の実装記録](../docs/story/implemented/chapter4.md) / [第5章の実装記録](../docs/story/implemented/chapter5.md)
- [実装参照先](../docs/story/reference/ch4-5-implementation.md) / [不整合一覧](../docs/story/inconsistencies.md)
- 第6～7章は[未実装の制作計画](../docs/story/planned/chapter6.md)。旧脚本・実装ガイドは移転案内へ置き換え、原文を保存しました。

## 実装状況

- ✅ 第4章「鬼火の山」（CH4_ARRIVAL 〜 CH4_DONE、鍛冶屋の書、炉の防衛戦）
- ✅ 第5章「眠る竹林の社」（CH5_INTRO 〜 CH5_DONE、峠の開通、宿坊・薬草園・外社、
  僧侶の書、瘴気と浄化、穢れ石3か所、双頭ドラゴン「瘴泉竜グロム」討伐、泉の浄化、
  「火山島編・完」エンディングとクリア後の自由建築）

## 起動

```sh
npm install
npm run dev      # http://localhost:5173/dqb3-tsugumono-ch4-5/
```

## 採掘の操作

石のハンマー／鉄のハンマーを持ち、壊したいブロックにカーソルを合わせて、左ボタンを壊れるまで長押しします。攻撃・設置・種まきは左クリックです。ポーズの「そうさ方法」からいつでも確認できます。

## ビルドとテスト

```sh
npm run build    # dist/ へビルド（base: /dqb3-tsugumono-ch4-5/）
npm run test:ci  # 高速サブセット（sheets + smoke + HUDハート + 水中描画 + 水からの脱出 + アイテムアイコン + 設置物の3D）
npm run test:e2e # 全テスト（第4章の通し・ロード復元を含む）
```

[親リポジトリ](../README.md)内の配置で開発してください。設計図の照準判定は [game-shared](../game-shared/) を参照し、ビルド時にこの編の `dist/` に含まれます。公開は[共通トップの手順](../portal/README.md)を参照してください。

テストは playwright-core + ヘッドレス Chromium を使う。ブラウザは
`PW_CHROMIUM_PATH` で明示指定できる（`tests/helpers.mjs` 参照）。

## アイテムアイコン

インベントリ・ホットバー・クラフト一覧・設計図・地面のドロップのアイコンは、Studioの [item-icons](../Storybook_Character_Studio/prototypes/item-icons/README.md) でコードから描いた16×16のドット絵です。本島編と同じ `assets/items/item_icons_16.png`（全編のアイコンを並べた1枚）と、この編のアイテムの位置だけを書いた `item_icons_16.json` を読み込み、2倍の32pxで表示します。画像が読めないときだけ、従来のブロックの模様・emoji（`items.js` の `tile`・`icon`）で表示します。

アイコンを直すときはStudioの `icons.mjs` を編集し、Studioで `npm.cmd run export:items -- --preview-game` を実行します（第1～3章と第4～5章の両方へ書き出します）。ゲーム側の画像を直接編集しないでください。

## 設置物の3D

すべての設置物（ジパング復興編と共通のたいまつ・わらのベッド・鳥居・木の扉・作業台・職業の祭壇・とげ罠・柵・収納箱・かまど・ちゃぶ台・舵輪・職業の旗・作物・わら草・きのこ・魚のかげと、この編だけの坑道灯・炭焼き窯・炉・金床・水桶・鉄鍋・穢れ石・清めの香草・祈り柱）は、Studioの [props-3d](../Storybook_Character_Studio/prototypes/props-3d/README.md) の原本から書き出した `src/world/prop-models.js` で作ります。基本形状に黒い輪郭線を付け、木・石・わらの面にはブロックの模様を貼っています。とげ罠は鉄のとげ（ジパング復興編は石）、実った作物は赤金色の火山穀物の穂です。坑道灯の中の鬼火は、敵の鬼火と同じ紫の縁と橙の芯です（ゲームの灯りも橙）。魚のかげは水面のすぐ上のマスに置くので、`src/world/mesher.js` はその下にも水面を描きます（描かないと水面に穴があき、砂の底が見える）。

形を直すときはStudioの `models.mjs` を編集し、Studioで `npm.cmd run export:props -- --preview-game` を実行します（第1～3章と第4～5章の両方へ書き出します）。`prop-models.js` は直接編集しないでください。今の本編の形と新しい形は、この編の開発サーバーの `/dqb3-tsugumono-ch4-5/prototypes/props-3d/` で並べて比べられます。

## 主要な技術メモ

| 項目 | 値 |
|---|---|
| ワールド | `64×112×32`（北: 火山・鉱山町 / z52-63: 峠 / 南: 竹林・源泉盆地） |
| セーブキー | `shoku_wo_tsugumono_kazan_save_v1`（本島編とは独立） |
| 生成世代 | `GEN_VERSION=1`（generate() を変えたら必ず上げる） |
| 峠の進入制御 | `WORLD.GATE_Z` の座標制限 + `flags.bambooPassOpen`（第5章で開通） |
| 章の分離 | 進行=`src/game/quests4.js` / 脚本=`src/content/chapter4.js` |
| 固定New Game | `src/game/newgame.js`（本島編の正史・最低限装備） |
| 音 | 効果音=`src/game/sfx.js`（WebAudio合成） / BGM=`src/game/bgm.js`（通常・ボスの2曲をクロスフェード。`M`キーでまとめてON/OFF） |

## 第4章で追加した主な要素

- 人物: ベルク（鍛冶屋）・ロク（鉱夫兼炭焼き）・カヤ（町へ帰る住民）・ナギ（章末）・スミ/テル（背景住民）
- 施設: 海岸拠点・鉱山入口・炭焼き窯・鍛冶場（炉/金床/水桶）・火山灰畑・鉱山町の食堂
- 素材: 鉄鉱石・木炭・鉄・鉄の金具・鬼火のかけら・火山穀物（種/収穫物）
- 道具: 鉄のハンマー（tier2）・鉄鍋（消費しない固有調理設備）・鉄の剣・鉄の胸あて
- 敵: 鬼火・鉄甲サソリ（正面装甲）・火山トカゲ＋色替え2種（火喰いこうもり・灰どろたぼう）
- 章ボス: 炉喰らいの大鬼火（鬼火の拡大・色替え、黒い爪痕＝「無銘の主」の伏線）

## 第5章で追加した主な要素

- 人物: ヨモギ（薬草の知恵）。ナギは社守り→火山島最初の僧侶へ
- 施設: 竹林の門（峠の開通）・宿坊・薬草園・外社・泉の祭壇/水門/導水路
- システム: 瘴気と浄化（`src/systems/purification.js`）— 継続ダメージ、薬草の煎じ湯
  による軽減、穢れ石3か所の「戦闘→柱の立て直し→ナギの浄化」サイクル、泉の浄化
- ドラゴン基盤: `src/entities/dragon.js`（共通リグ）/ `dragon-configs.js` /
  `src/game/dragon-battle.js` — 頭部・胴体の8方向シート＋3D首/尾。第6〜7章の
  ヴァルガへ移植できる構造
- 章ボス: 瘴泉竜グロム（左右の翼を持ち、低空を漂う双頭竜。左右の頭を独立に破壊して討伐）
- 素材: 竹材・薬草・清めの香草・薬草の煎じ湯・火山穀物の粥・鉄の山刀・無銘の黒鱗
