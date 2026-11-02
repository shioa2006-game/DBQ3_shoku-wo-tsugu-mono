# Ch1–3 修正・検証台帳

> 過去の検証記録です。2026-11-02以降のGit運用は親の `docs/GITHUB_WORKFLOW.md` を参照してください。旧GitLabへの同期は行いません。外部の診断画像は統合時のバックアップへ退避済みです。

更新日: 2026-09-05

正本: [対応計画・受入条件](plan.md)

## 現在の状態

- 対象10件の修正・検証が完了。高速テスト3/3、最終全回帰21/21、単独ビルド成功。
- 作業開始時HEAD: `44a52f571849993ce9d7d5b6b90b83393a904ed3`
- 修正・テストの確定HEAD: `4ae0084`
- 全回帰はこのコミットと同じコード・テストの作業ツリーで実施。実行中にコミットへ整理したため、実行開始時のBUILD_IDと最終SHAは異なる。
- 公開状態: ローカルコミットのみ。push・Pages公開は未実施。
- Ch4–5: コード修正は未着手。独自差分への適応が必要。
- D03/D04/D08/D12/D13/D15/D16/D17/D18/D19は今回の修正に含めていない。

## コミットと移植の単位

| コミット | 内容 |
|---|---|
| `cb81332` | ユーザー決定と対応計画 |
| `5da894a` | D01: 戦闘中・勝利会話中の復帰、raid-saveテスト |
| `4a4669c` | D02/D05: きのこ再生、未受領報酬、保存、resourcesテスト |
| `0952a8d` | D07: 端数HPのハート表示と画像証跡 |
| `5534a4b` | D01/D02/D05: コミット分割時にずれた挿入位置を、検証した作業ツリーの正しい実行位置へ整合 |
| `0b6b5ea` | D09/D10/D11: 成長、命中、占有判定、mechanics・blueprintテスト |
| `4ae0084` | D06/D14/D20: wheel、説明、実入力テスト、story/routing判定整理 |

**移植は必ず `4ae0084` の最終ファイル／この台帳の仕様を参照する。**
D01/D02/D05の初期コミットだけを抜き出さず、`5534a4b` の位置整合も含める。分割時の中間コミットは検証基準にしない。
関連箇所が分岐しているCh4–5へは、上記を一括cherry-pickせず必要部分を適応する。
共通保存と共通テストが重なる項目は同じコミットへまとめたが、ID別の受入条件は以下で区別する。

## ID別の確定仕様・検証

### D01: Ch3防衛戦の保存・復帰

- 修正: `main.applyLoad`、`quests3.onRaidEnd`。
- 戦闘中の保存は `CH3_RITE` へ戻す。既存の `riteDone` は維持し、供物の再消費を求めない。
- 勝利確定時に `flags.ch3RaidWon=true` を会話より先に設定する。勝利会話中の保存はロード時に `CH3_FAREWELL` へ進める。
- Ch1/Ch2の準備復帰、Ch3勝利後の会話とエンディングは維持。
- `raid-save.test.mjs`: 戦闘前、Ch1/2/3戦闘中の手動保存、実際の防衛勝利コールバックからの会話中オートセーブ、勝利後を実ブラウザで保存・リロード。ワタリの再挑戦選択肢を操作し、防衛再開と儀式済みフラグを確認。
- `chapter3.test.mjs`: 勝利会話から別れ・出航・CH3_DONE・再ロードまで既存通し検証。
- Ch4–5では既存のnormalizeAfterLoad／restoreStateを優先し、不足する境界だけ検証・修正する。

### D02: きのこの再生

- 新規: `src/systems/mushrooms.js`。接続: mainの生成・New Game・世界変更・simulate・ロード、save.js。
- 元の自然きのこ地点だけを対象に、採取から**シミュレーション時間300秒（1ゲーム日）**で再生。
- メニュー中の世界停止に従う。オフラインの経過時間は加算しない。
- 空気セルかつ草地／土の上で、人物・敵に占有されていないときだけ生える。建材・水・耕地を上書きしない。
- 期限後に塞がれていても予約を消さず、空いた後に再判定する。新しい採取地点へ増殖しない。
- 再生予約は座標と残秒数を保存。同一版ロードで保持し、New Gameで初期化。
- `quality-resources.test.mjs`: 全自然きのこの採取・1個ずつのドロップ、半日経過の保存と再ロード、建材・人・水・耕地の保護、解放後の再生、2回目の採取と300秒待機、New Gameを確認。
- Ch4–5はMOSS上の竹林に適応する必要がある。Ch1–3のGRASS/DIRT条件をそのままコピーしない。
- 実時間で300秒待ち続ける試験ではなく、ブラウザ内の実システムへ明示的にdtを与える時間検証。

### D05: 満杯時の報酬保証

- 修正: `main.giveItems / collectPendingRewards / frame / applyLoad`、save.js。
- 所持品へ入った分と残った分を分け、残量を `pendingRewards: [[itemId, count], ...]` として保存。
- 空きを作ると自動受領。メニューで収納・整理している間も受領する。未受領／受領時に通知する。
- 所持品追加の部分成功をcount差分で扱い、同じ残量を重複配布しない。消えるドロップへの退避ではない。
- `quality-resources.test.mjs`: 全満杯・一部スタック・複数アイテム・収納で空きを作る操作・受領前後のロード・繰り返し回収を検証。
- 実際の畑完成会話で種もみ10個が未受領になり、FARMINGへ進んでも受取権が残ること、再度の完成通知で二重付与されないこと、再ロード後の受領を確認。
- Ch4–5の山刀・火山穀物の種・薬草にも同じ保証を適応する。

### D06: modalのwheel入力持ち越し防止

- 修正: `core/input.js`、`main.handleInput`。
- ゲーム入力が有効で、canvasを対象とするwheelだけ蓄積する。
- グローバルキーでmodalを開閉した後に入力状態を再評価。消費されなかったwheelはフレーム末にも破棄。
- メニュー内の通常スクロールはpreventDefaultせず維持。
- `quality-input.test.mjs`: inventory／storage／book／dialogue／pause／helpのスクロール、実際のE→wheel→E、通常canvas上のwheel選択を検証。

### D07: HP1と端数の表示

- 修正: `UI.setHp`、`.heart.partial`。
- 同じ文字・24px枠を維持し、1ハート4HPに対して充填幅を25%単位で表示。小数HPも充填率に反映。
- HP0は空、HP1は一部充填。HPの数値はaria-labelとtitleにも設定。
- `quality-mechanics.test.mjs`: HP0/1/2/3/4/25/26、最大HP26の最後の半分、全セル幅24pxを確認。
- [HP1の画像](evidence/D07/hp1.png)を目視し、残量が空ハートと区別されることを確認。画像は960×540・ポーズ中。
- Ch4–5の同一文字・固定寸法の既存改善を維持して適応する。状態クラス／色の旧assertは新しい充填表現に合わせる必要がある。

### D09: 作物の中間成長

- 修正: `FarmingSystem.onWorldChange / update`。
- CROP1→2→3の各段階で70秒分の進捗を消費する。次段階へ引き継ぐのは超過分のみ。
- 大きいdtや住民加速でも段階ごとの必要量を消費し、収穫・植え直しで進捗をリセット。
- `quality-mechanics.test.mjs`: 69秒・70秒直後・次フレーム・2段階目終了、大きいdt、住民加速、植え直し。
- 途中進捗のセーブ永続化は追加していない。今回の対象は瞬時成長の不具合。
- Ch4–5の火山穀物の種類・収穫物は変えず、状態遷移部分を適応する。

### D10: 主人公と味方の命中競合

- 修正: `Entity.takeDamage`、`CombatSystem.hurtMonster`、mainの攻撃／ctxファサード、Villagerの攻撃呼出。
- 主人公と住民は**1回の振りごとに固有のobjectを生成**し、対象へ渡す。
- 敵はWeakSetで同じ一撃の二重加算を拒否。別の一撃は敵の被弾表示中でも受理する。
- 攻撃CD0.42秒、被弾表示0.6秒は維持。人物への接触ダメージ保護、タグなしダメージの従来規則も維持。
- クラーケンの触手シールド／潜航中の無効化はCombatSystemで引き続き判定。
- `quality-mechanics.test.mjs`: 味方2→主人公7、同じ攻撃の再送、0.42秒後の別攻撃、シールド／潜航／露出、主人公の連続被弾保護。
- `quality-input.test.mjs`: 実クリックで対象HP30→28→26。次の攻撃CD終了を待ち、被弾表示が残る敵にも2回目が命中。
- テスト用に敵の移動だけ固定し、入力・照準・攻撃・ダメージ経路は実装を通す。全ボスの手動バランス評価は未実施。
- Ch4–5はEntityを継承しないDragonHeadの独自takeDamageにも同じ契約を適応する必要がある。

### D11: 設計図配置の占有判定

- 修正: `main.fillGhostCell`。
- world内の空気／水セルを対象に、`placeBlockedByEntity`を通してから素材を消費する。
- 人物・敵の占有中、既存ブロック／完成済みセルへの再配置では消費しない。
- `quality-mechanics.test.mjs`: 主人公・NPC・敵の占有、解消後の配置、同一セルへの二重配置で素材数を検証。
- `blueprint.test.mjs`: 実クリック、水中橋脚、材料不足、障害物、完成を確認。一括充填のfixtureは人物と地形を避けた空き区画へ修正。
- D12の武器と設計図の優先順位は変更していない。

### D14: テストの失敗検出

- `story.test.mjs`を章進行の状態注入テストとして明記。
- クリック種まき失敗の許容警告、敵HPが変わらなくても既存dropで合格するassertを除去。
- 実操作は `quality-input.test.mjs` で独立して必須検証。素材／対象セル／対象HPで判定し、操作前の値を渡した同じassertは失敗することも確認。
- マウスの座標は対象をカメラへ投影し、実際のraycastが対象セルと一致してから操作。カメラ位置の収束を待ち、固定座標総当たりをしない。
- `routing.test.mjs`の救出fixtureは水中座標に加えinWater=trueも設定する。従来はwaterT=20が最初の陸上扱いの更新でリセットされ得た。待機timeoutの単純延長はしていない。
- Ch4–5へは章テストを丸ごとコピーせず、操作と事後条件の対応、章固有の戦闘・報酬へ適応する。

### D20: 採掘の長押し説明

- 修正: README、Ch1導入会話・木材収集目標、UI.showHelp。
- ハンマーを持って木へ向け、左ボタンを押し続けることを明示。攻撃／配置のクリックと区別。
- `quality-input.test.mjs`: 初回目標とヘルプ文言、実際のmouse down/upによる木の破壊と木材1個を確認。
- [操作説明の画像](evidence/D20/help.png)を960×640で目視確認。試験用の平地を背景に、長押しとクリックの説明が枠内に収まる。画像取得時にも実入力テストを再実行し成功。
- 新しい操作方式・採掘ゲージ・カメラ変更は追加していない。

## 試験経過と結果

| 実施 | 結果 | 備考 |
|---|---|---|
| 追加raid-save | PASS | テスト作成時のevaluate引数不足を修正後、全ケース成功。ゲームのRuntime Errorではない |
| 追加resources | PASS | 部分受領、永続化、再生。後から実際の畑完成イベントも追加し、単独再検証成功 |
| 追加mechanics | PASS | 成長・命中・配置・HP。画像取得・目視も実施 |
| 追加input | PASS | 初回はカメラ移動中に照準がずれて採掘待ちがtimeout。fixtureでカメラ収束と照準一致を待つようにして成功 |
| npm.cmd run test:ci | 3/3 PASS | sheets、smoke、underwater-visuals |
| 全回帰1回目 | 20/21 PASS | blueprintの一括充填が新しい安全条件を満たさず失敗 |
| blueprint単独再実行 | PASS | fixtureの人物・地形を整理。空き区画の完成と水中配置を確認 |
| 全回帰2回目 | 21/21 PASS | 修正したblueprint fixtureと、実際の畑報酬テストを含む |
| npm.cmd run build（最終単独実行） | PASS | コード確定HEAD 4ae0084からビルド。46 modules、JS 745.24kB / gzip 203.40kB |

最初の全回帰失敗を単独成功で消していない。全回帰2回目は修正したfixtureと拡張したresourcesテストも含む21件。
既存のTexture／Clock警告、500kB超のビルド警告は今回の対象外。意図的に画像ロードを失敗させるtexture-retryは通常のmissing assetと区別する。

## 確認の範囲

- ブラウザテストは公式tests/のChromium（ソフトウェアWebGL）。ゲームをHTTPで起動。
- 操作検証ではmouse down/up/click/wheelとキーボードを使用。検証準備として座標・素材・敵の配置を設定する。
- 時間・占有・ダメージの境界検証はブラウザ内の実関数を直接呼び、通し攻略とは区別する。
- 同一版セーブを試験用ブラウザ内で生成・保存・再ロード。ユーザーのセーブやCh4–5コードは変更していない。
- 全編の自力攻略、全敵との手動共闘、異なるOS/GPU、長時間負荷、音の聴感評価、GitLab Pages上の確認は未実施。

## Ch4–5への引継ぎ

Ch4–5の `docs/quality/2026-09-05/porting.md` に、今回の最終コードSHAと仕様を追記する。
最終成果物の基準は `4ae0084`。その後の文書・証跡コミットはコード変更を含まない。
D01は既存復帰処理の検証、D02はMOSS、D05は山刀等、D07は既存HUDテスト、D09は火山穀物、D10はDragonHeadが特に重要。

## 最終全回帰の一覧

実行日: 2026-09-05。並列数2。最終ソースSHA: `4ae00846deedfc45d64931e8e07432952c47ddf4`。

```text
--- 結果 ---
PASS  bgm.test.mjs  (10.9s)
PASS  blueprint.test.mjs  (15.2s)
PASS  chapter2.test.mjs  (55.7s)
PASS  chapter3.test.mjs  (144.7s)
PASS  inventory.test.mjs  (14.0s)
PASS  jobs.test.mjs  (32.2s)
PASS  pause.test.mjs  (20.2s)
PASS  quality-input.test.mjs  (21.7s)
PASS  quality-mechanics.test.mjs  (12.2s)
PASS  quality-resources.test.mjs  (22.7s)
PASS  raid-save.test.mjs  (23.4s)
PASS  routing.test.mjs  (11.3s)
PASS  saveload.test.mjs  (23.4s)
PASS  sheets.test.mjs  (0.2s)
PASS  smoke.test.mjs  (11.1s)
PASS  story.test.mjs  (144.7s)
PASS  texture-retry.test.mjs  (25.4s)
PASS  trees.test.mjs  (10.1s)
PASS  underwater-visuals.test.mjs  (12.9s)
PASS  water.test.mjs  (16.5s)
PASS  worldversion.test.mjs  (27.9s)

全 21 件 PASS
```
