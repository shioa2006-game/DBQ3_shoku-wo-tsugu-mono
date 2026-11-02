# CH1～CH3のコード生成キャラクター移植

2026-11-02、Storybook Character Studioの人型7人・基本モンスター5種を本編へ反映。

## 本編の読込先

| 対象 | 本編で読む画像（assets/以下） | リグ設定 |
|---|---|---|
| 主人公 | humanoids/adventurer_code_body_8dir.png | src/content/rig-profiles/adventurer.mjs |
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

旧画像は専用比較ページの参照画像として保持。本編は `_code_` 画像を直接読むので、旧ファイルを上書きする必要はありません。本編がStudioフォルダやprototypesフォルダへ実行時依存することもありません。

## ボス・動作

- 書喰いのスライム: スライム共用、倍率2.6、色0xff8f8f。
- 泥田の主: どろたぼう共用、倍率2.4、色0xd08a6a。
- クラーケン: イカ共用、倍率2.8、色0x6a4a7a。
- クラーケンの触手: 既存の4節の先細り円柱メッシュ。画像スプライトは非表示。

戦闘能力・当たり判定・セーブ形式・章の進行条件は変更しません。飛行モンスターは既存の本編高度制御を使用し、比較画面専用の上下動を重ねません。羽ばたき・触腕はA/B画像の切替で表示します。

## 今後の更新

1. 原本は隣の `Storybook_Character_Studio/prototypes/*-8dir/` で編集。
2. Studioの対象 `export:* -- --preview-game` で正規化済み画像と原画を本リポジトリへ同期。このコマンドで更新される `_code_` 画像は、現在は本編も使用します。
3. リグ設定を変えた場合はStudioの `rig-profile.mjs` を本編の `src/content/rig-profiles/<id>.mjs` にも同期。比較ページ側のコピーだけ更新して終わらないこと。
4. 層を個別に再正規化しない。頭・胴は制作時の合成シートと共通の基準点を使う。モンスターの飛行用余白も完成出力のまま移植。
5. 本編の検証は `npm.cmd run test:ci` と `npm.cmd run test:e2e`。専用比較は従来の `tests/authoring/`。

`tests/e2e/character-art.test.mjs` は実際のPlayer/Villager/Monsterから全種を生成し、画像読込、分離層、調整値、8方向、歩行、剣・ハンマー、A/B切替、ボス倍率・色、触手を検査します。`texture-retry.test.mjs` は片方の層の読込失敗からの復旧を検査します。

任意の撮影では `BASE_URL=http://127.0.0.1:5175/builder_sprite_lab/` と `CHARACTER_ART_SCREENSHOTS=1` を設定して `node tests/e2e/character-art.test.mjs` を実行します。`work/character-migration/` に本編の実際のキャラクターから作った8方向の確認画像を保存します（Git対象外）。テストは独立したブラウザーのセーブ領域を使います。

## 移植時の検証結果（2026-11-02）

- Studioの正規化PNG・原画PNG計58ファイルとゲーム側がバイト単位で一致。7人のリグ設定値も一致。
- `npm.cmd run test:ci`: ビルドと高速3件が通過。
- `TEST_CONCURRENCY=1` で `npm.cmd run test:e2e`: ビルドと全22件が通過。CH1・CH2・CH3の通し、ボス戦、セーブ復元、画像再試行、水中表示、移植したキャラクターの検査を含む。
- Studioの `npm.cmd test`: 全17件が通過。
- 本編の実際のキャラクターから人型7人、基本モンスター5種、ボス3体・触手の8方向画像を撮影し確認。

ローカル本編への反映です。公開サイトへのpush・デプロイは行っていません。
