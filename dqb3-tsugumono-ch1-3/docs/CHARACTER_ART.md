# CH1～CH3のコード生成キャラクター移植

2026-11-02、Storybook Character Studioの人型7人・基本モンスター5種を本編へ反映。

## 本編の読込先

| 対象 | 本編で読む画像（assets/以下） | リグ設定 |
|---|---|---|
| 主人公 | humanoids/hero2_code_{head,torso}_layer_8dir.png（2026-11-07から。以前は adventurer_code_body_8dir.png） | src/content/rig-profiles/hero2.mjs |
| ミナ | humanoids/mina_code_{head,torso}_layer_8dir.png | src/content/rig-profiles/mina.mjs |
| ピノ | humanoids/pino_code_{head,torso}_layer_8dir.png | src/content/rig-profiles/pino.mjs |
| イナホ | humanoids/inaho_code_{head,torso}_layer_8dir.png | src/content/rig-profiles/inaho.mjs |
| ゴンタ | humanoids/gonta_code_{head,torso}_layer_8dir.png | src/content/rig-profiles/gonta.mjs |
| ジンベエ | humanoids/jinbei_code_{head,torso}_layer_8dir.png | src/content/rig-profiles/jinbei.mjs |
| ワタリ | humanoids/watari_code_{head,torso}_layer_8dir.png | src/content/rig-profiles/watari.mjs |
| スライム | nonhumanoids/slime_code_idle_{a,b}_8dir.png | 既存MonsterSprite |
| おおこうもり | nonhumanoids/night_bat_code_idle_{a,b}_8dir.png | 同上 |
| おおねずみ | nonhumanoids/field_rat_code_idle_{a,b}_8dir.png | 同上 |
| どろたぼう | nonhumanoids/dorotabo_code_idle_{a,b}_8dir.png | 同上 |
| イカ | nonhumanoids/squid_code_idle_{a,b}_8dir.png | 同上 |

`{head,torso}`、`{a,b}`はそれぞれ2ファイル。各512×256px、4列×2行。順番は正面・左斜め前・左・左斜め後ろ・背面・右斜め後ろ・右・右斜め前。

参照変更は `src/entities/player.js`・`villagers.js`・`monsters.js`。主人公は合成シート、住民6人は独立した頭・胴をHumanoidRigへ渡します。合成body画像を住民の頭・胴両方へ渡すと襟が重なるため、分離画像を必ずセットで使います。頭の高さ、肩、袖、頭胴の前後位置、胴のUV上端もStudioの設定を移植。ジンベエは頭側面色も白髪に合わせます。

旧画像と3D比較のページは、2026-11-03にこのフォルダから外し、Studioの `references/`（旧画像）と `compare/ch1-3/`（比較ページ）へ移しました。本編は `_code_` 画像だけを読み、Studioフォルダへ実行時依存することもありません。

## 主人公の切り替え（2026-11-07）

主人公シオンを、Studioの新しいデザイン `hero2`（[prototypes/hero2-8dir](../../Storybook_Character_Studio/prototypes/hero2-8dir/README.md)）へ切り替えた。ふわふわの金髪とアホ毛、大きな青い瞳、生成りの服に紺のベスト、左腰の小物入れ、背中の小さな革のホルダーに深緑の職業の書。両編とも同じ画像・リグ設定を使う。

- 読込: `src/entities/player.js` が `assets/humanoids/hero2_code_{head,torso}_layer_8dir.png` を頭・胴に分けて `HumanoidRig` へ渡す（以前の主人公は合成シート1枚）。リグ設定は `src/content/rig-profiles/hero2.mjs`（Studioの写し）。腕の付け方は以前の主人公と同じリグの既定値で、右斜め前の攻撃だけ道具を頭の板の上に描く（`toolOverHead`）。
- 手足の色: 紺の袖 `0x293d75`、素手 `0xf3c9a4`、焦げ茶のズボン `0x3b2a22`、茶色のブーツ `0x8a5428`。頭・胴の裏は `0xe1a432`・`0x293d75`。
- 画像の配置: 胴（チュニック）の中心をセルの u=.494 に描き、横方向は正規化しない（大きな後ろ髪と背中の本で絵全体の中心が胴からずれるため）。`tests/e2e/sheets.test.mjs` は `hero2_code_body_8dir.png` だけ、外接枠の中心の代わりに裾の中心がセル中央にあることを確かめる。
- 以前の主人公の画像 `assets/humanoids/adventurer_code_body_8dir.png` とリグ設定 `rig-profiles/adventurer.mjs` は、Studioの比較ページが読むため残す（ゲームからは読まない）。
- セーブ形式・進行は変えていない。見た目のテストは `tests/e2e/character-art.test.mjs`（主人公を `hero2` として頭・胴の分離層・リグ設定・8方向・歩行・道具の振りを検査）。

## ボス・動作

- 書喰いのスライム: スライム共用、倍率2.6、色0xff8f8f。
- 泥田の主: どろたぼう共用、倍率2.4、色0xd08a6a。
- クラーケン: イカ共用、倍率2.8、色0x6a4a7a。
- クラーケンの触手: 既存の4節の先細り円柱メッシュ。画像スプライトは非表示。

戦闘能力・当たり判定・セーブ形式・章の進行条件は変更しません。飛行モンスターは既存の本編高度制御を使用し、比較画面専用の上下動を重ねません。羽ばたき・触腕はA/B画像の切替で表示します。

## 今後の更新

1. 原本は隣の `Storybook_Character_Studio/prototypes/*-8dir/` で編集。
2. Studioの対象 `export:* -- --preview-game` で正規化済み画像と原画を本リポジトリへ同期。このコマンドで更新される `_code_` 画像は、現在は本編も使用します。
3. リグ設定を変えた場合はStudioの `rig-profile.mjs` を本編の `src/content/rig-profiles/<id>.mjs` にも同期。Studioの比較ページはStudioの `rig-profile.mjs` を直接読むので、比較ページで確かめたあと本編の写しの同期を忘れないこと。Studioの `prototypes/shared/game-targets.mjs` に各キャラクターの書き出し先を書き、Studioのテスト（`tests/node/game-targets.test.mjs`）が本編の画像・原画・リグ設定との一致を確かめる。
   `src/entities/rig.js` は第4～5章と同じ内容に保つ（2026-11-03に統一）。第4～5章の移植は [第4～5章の記録](../../dqb3-tsugumono-ch4-5/docs/CHARACTER_ART.md)。
4. 層を個別に再正規化しない。頭・胴は制作時の合成シートと共通の基準点を使う。モンスターの飛行用余白も完成出力のまま移植。
5. 本編の検証は `npm.cmd run test:ci` と `npm.cmd run test:e2e`。3D比較のブラウザーテストはStudioの `npm.cmd run test:compare`（`tests/compare/ch1-3/`）。

`tests/e2e/character-art.test.mjs` は実際のPlayer/Villager/Monsterから全種を生成し、画像読込、分離層、調整値、8方向、歩行、剣・ハンマー、A/B切替、ボス倍率・色、触手を検査します。`texture-retry.test.mjs` は片方の層の読込失敗からの復旧を検査します。

任意の撮影では `BASE_URL=http://127.0.0.1:5175/builder_sprite_lab/` と `CHARACTER_ART_SCREENSHOTS=1` を設定して `node tests/e2e/character-art.test.mjs` を実行します。`work/character-migration/` に本編の実際のキャラクターから作った8方向の確認画像を保存します（Git対象外）。テストは独立したブラウザーのセーブ領域を使います。

## 移植時の検証結果（2026-11-02）

- Studioの正規化PNG・原画PNG計58ファイルとゲーム側がバイト単位で一致。7人のリグ設定値も一致。
- `npm.cmd run test:ci`: ビルドと高速3件が通過。
- `TEST_CONCURRENCY=1` で `npm.cmd run test:e2e`: ビルドと全22件が通過。CH1・CH2・CH3の通し、ボス戦、セーブ復元、画像再試行、水中表示、移植したキャラクターの検査を含む。
- Studioの `npm.cmd test`: 全17件が通過。
- 本編の実際のキャラクターから人型7人、基本モンスター5種、ボス3体・触手の8方向画像を撮影し確認。

ローカル本編への反映です。公開サイトへのpush・デプロイは行っていません。
