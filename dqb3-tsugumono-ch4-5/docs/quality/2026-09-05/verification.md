# Ch4–5 共通品質修正・検証記録

> 過去の検証記録です。2026-11-02以降のGit運用は親の `docs/GITHUB_WORKFLOW.md` を参照してください。旧GitLabへの同期は行いません。外部の診断画像は統合時のバックアップへ退避済みです。

作業日: 2026-09-05（JST）
状態: 対象10件の適応・全回帰・ローカルコミット完了。
適用台帳: [porting.md](porting.md)

## 基準と範囲

- 移植開始時: `fcbfe0a6a3f1cfe69ea7832eba354e5674c083a8`
- 参照したCh1–3最終コード: `4ae00846deedfc45d64931e8e07432952c47ddf4`
- 参照資料: Ch1–3 `9f6b2a8dab4d71c0bbb7af272ba7a6c2af040ee1` / `docs/quality/2026-09-05/verification.md`
- 今回の最終コード／テストSHA: 519ae9db1e738fb9b0771fb8c8b3c6cb513807a4
- Ch1–3のpushはユーザーの「反映しました」とローカルの追跡状態一致を確認。GitLab CI・公開画面は別途未確認。
- 今回の変更先はCh4–5のみ。Ch1–3は変更せず、Ch6–7は対象外。
- D03旧版セーブ互換は要件外。更新後はNew Game。同一版保存と章間進行を検証し、保存キー・ワールド生成世代・地形生成は変更していない。
- D04カメラ仕様、およびD08/D12/D13/D15/D16/D17/D18/D19は変更しない。

## 確定した適応内容

### D01 戦闘・終幕と保存

既存のCH4_DEFENSE→CH4_BOOK、未討伐CH5_DRAGON→CH5_INNER_SHRINEを維持。
勝利会話中はquests.busyによってautosaveが抑止され、Escapeによる保存メニューも開かない。
そのため「勝利フラグだけ保存され、泉の設計図がない」という静的な懸念は通常操作では再現しなかった。Ch3固有の勝利フラグは移植していない。
勝利会話完了後は泉の設計図を同一版セーブから復元できた。

移植先固有の不足を2点修正した。

1. DragonHeadにモンスターの停止時描画インターフェースがなく、グロム戦でポーズを開くと `m.syncVisual is not a function`。
   頭は当たり判定だけを持ち、描画はDragonRigが所有するため、頭側に時間を進めないsyncVisualを実装した。
2. 終幕ではdialogue.open=false、quests.busy=true。従来はEscapeで保存メニューを開けた。
   泉は浄化済み・設計図完了・stage=CH5_DRAGONという途中保存からは終幕の完了コールバックを再開できない。
   手動保存メニューを開く条件にもquests.busyの確認を加えた。通常の戦闘中手動保存は引き続き可能。

回帰: `raid-save.test.mjs`、`dragon-pause.test.mjs`。
戦前、戦中保存、再戦、勝利会話の保存抑止、勝利後保存、泉の完成会話、終幕、CH5_DONEのロードまで検証。
Ch4完了から翌朝のCh5開始、ゴンタの鉄の剣、ナギの一体復元、峠開放を確認。
戦闘の勝敗はfixtureで発火させており、実時間で全波を攻略したテストではない。

Ch1–3への追加反映判断: DragonHeadは存在しない。Ch3終幕前のCH3_FAREWELLはワタリとの再会話で終幕を再開できる実装を確認したため、今回見つかったCh5の進行停止対策を理由にCh1–3へ変更を追加していない。

### D05 受け取り待ち報酬

`Game.giveItems/collectPendingRewards`と保存データにpendingRewardsを追加。
Inventory.addの部分成功を実数量差分で記録し、空きができたらメニュー中も残量だけ受領する。
New Gameで受け取り待ちをリセット。通常収納・クラフトの仕組みは変更しない。

火山穀物の種6個、ベルクの山刀1本、薬草園の薬草8個について、実際の章コールバック→満杯→保存→ロード→空き作成→受領を確認。
カヤ・ベルクとの再会話で二重付与されない。設計図完成の一度限りの通知は既存BlueprintManagerが維持する。
複数報酬の部分受領、収納による空き作成、複数回回収、全受領後の再ロードも確認した。

グロムの黒鱗は従来、保存対象外の地面ドロップだった。討伐の証を満杯・未拾得のまま保存しても残せるよう、同じ受け取り待ち対応のgiveItemsへ変更。
黒鱗の個数・役割は変えず、地面で拾う操作を省く。満杯→勝利会話→保存→ロード→1個受領を検証した。
回帰: `quality-resources.test.mjs`、既存chapter5。

### D02 自然きのこの再生

Ch1–3のMushroomSystemを導入。自然生成時の採取地点だけ、シミュレーション300秒で再生。
Ch4–5の竹林の苔土B.MOSSに対応し、元のGRASS/DIRTも許容。加えて、その自然地点の生成時の支持ブロックも許容する。採取地やレシピを新設しない。
再生予約の残時間を同一版セーブに保存する。

自然きのこ22地点はすべて竹林だが、21地点がMOSS上、1地点(30,6,76)が石上。きのこ生成後の外社跡の床生成で、支持ブロックが石になることを確認した。
全地点を採取し、採取数と予約数／ドロップ数の一致、全22地点の再生を検証。MOSSだった場所を新たな石床に変えた場合には再生しないことも確認した。
建物・人物・耕地・水による再生延期、障害除去後の再試行、再採取して300秒待つ2周期目、人工配置地点が予約されないこと、New Gameで予約なしを確認。
時間はシステムupdateに与えて進めた。実時間で5分待つ耐久試験ではない。
回帰: `quality-resources.test.mjs`。
Ch1–3の自然きのこは生成コードを実行して全14地点が草原上と確認。今回の外社の石床適応を戻す必要はない。

### D06 ホイール持ち越し

canvasかつゲーム入力有効時のwheelだけ採用。モーダル開閉後に入力可否を再評価し、フレーム末に未消費wheelを破棄。
もちもの、収納、職業の書、会話、ポーズ、ヘルプ、選択肢、終幕、タイトルの各オーバーレイでwheelを送るテストを追加。
通常canvas上のホットバー切り替えと実キーE→wheel→Eも確認する。
オーバーレイ個別試験の開閉はfixture、wheel自体はPlaywrightの実入力。
回帰: `quality-input.test.mjs`、既存pause。

### D07 HP端数

HP1を25%充填で示し、HP0から区別。HP2/3も50%/75%に対応。
全状態で同じtext-presentationハート文字、24px枠、3px間隔を維持。
最大HPが4の倍数でない場合も残りを表現し、title/aria-labelにHP数値を設定。
旧half色のテストは新しい空枠＋白い充填の表現に更新。疑似要素の実際の色・clip-pathも検証する。
回帰: `hud-hearts.test.mjs`、`quality-mechanics.test.mjs`。
画像: [HP1](evidence/D07/hp1.png)。ポーズ中のスクリーンショットを目視確認。暗転越しに左端の部分充填を確認した。

### D09 火山穀物の成長

成長段階ごとに70秒ぶんを消費し、超過分だけを次段階へ渡す。
段階変更や再植付で古い進捗を引き継がない。住民による加速と大きいdtを維持。
69秒→中間段階→直後も中間→さらに約70秒→成熟、加速、再植付を検証。
収穫で火山穀物2個と任意の種を得る既存経路、火山穀物と薬草から粥を作る既存レシピも確認。
回帰: `quality-mechanics.test.mjs`、種まきの実入力は`quality-input.test.mjs`。

### D10 攻撃間隔と共闘

プレイヤーの1スイングに1つのobjectを発行し、対象のWeakSetでその一撃の二重加算を拒否。
別スイングと味方の一撃は敵の被弾表示中でも受け入れる。
Entityだけでなく、独立クラスDragonHeadとGame→Combatの引数受渡しを変更。
住民AIも一撃ごとに識別子を渡す。主人公・住民への被弾無敵、復帰猶予、装甲サソリの正面軽減は維持。

火山トカゲ、装甲サソリ、左右各頭への独立スイング、同一スイング重複、0.42秒後の命中を検証。
両方の頭で実際のゴンタAIとGameのcontext経由の攻撃を発生させ、与ダメージを確認。
実マウスでの主人公の連続攻撃は移動だけを固定した通常敵を対象とした。
双頭の片側破壊→両側破壊→勝利は既存chapter5が検証する。
回帰: `quality-mechanics.test.mjs`、`quality-input.test.mjs`、chapter5。

### D11 設計図の占有

fillGhostCellで範囲・空気／水・人物／魔物の占有を確認し、その後だけ素材消費と配置を行う。
主人公、NPC、通常敵、左右の頭を占有者にして、拒否時に素材が減らないことを検証。
空いたセルへの一度の配置と、完成済みセルへ再度呼んでも減らないことを確認。
既存blueprintテストの水中ゴーストへの実マウス配置、誤ブロックの拒否も維持。
設計図優先の入力分岐（D12）は変更しない。

### D14 検証の実入力と事後条件

既存chapter4/chapter5を状態注入による章進行テストと明記。
quality-inputは対象ブロックへの投影・カメラ収束・実raycast一致後、mouse down/up/clickを送る。
採掘対象消滅と素材1個、指定耕地への苗と種1個消費、選んだ敵のHP減少を必須条件とする。
種まき前のセル値、攻撃前と同じHPでは同じassertが失敗する負例を確認する。
既存の地面ドロップが攻撃成功を偽装しない。
既存blueprintテストも、固定800ms/200msではなく、カメラ収束・実raycast一致→実クリック→対象ブロック変化／入力フレーム消費の待機へ変更。判定と素材消費のassertは維持した。

追加の5本: raid-save / dragon-pause / quality-resources / quality-mechanics / quality-input。
既存の失敗を緩いassertで迂回しない。

### D20 長押し説明

海岸拠点の最初の素材採取会話・建築目標、廃鉱の落石説明、常設ヘルプ、READMEで左ボタン長押しを明示。
石・鉄のハンマーの双方に当てはまる説明。入力方式や採掘ゲージは追加しない。
実入力では石のハンマーで指定した木を壊し、木材が1個出ることを確認。
画像: [ヘルプ](evidence/D20/help.png)。960×640で文言の表示と他の操作説明との収まりを目視確認。

## 検証ログ

環境: Windows / Node v24.13.1 / npm.cmd / 公式testsのplaywright-coreとヘッドレスChromium（SwiftShader）。
Ch1–3のサーバーは停止しない。対象devは `http://127.0.0.1:5174/dqb3-tsugumono-ch4-5/`。
全回帰は公式runnerがpreviewポート4174で配信。ブラウザ・localStorageはテスト専用。

| 段階 | コマンド／試験 | 結果 |
|---|---|---|
| 修正前 | npm.cmd run test:ci | 5/5 PASS |
| D01の初期追加試験 | raid-save | グロム戦のポーズ復帰で停止 |
| D01の絞込再現 | dragon-pause | FAIL: m.syncVisual is not a function |
| syncVisual修正後 | dragon-pause | PASS |
| D01の続き | raid-save | 終幕にポーズが重なり、クリックを遮る。初版assertが入力処理前を読んだため、フレーム消費待ちへ改善 |
| D01と試験待機修正後 | raid-save | PASS、CH5_DONEロードまで |
| 共通修正の個別試験 | quality-resources / quality-mechanics / quality-input | 各PASS |
| 共通適応後 | npm.cmd run test:ci | 5/5 PASS |
| 最終 | npm.cmd run test:ci | 5/5 PASS（石床適応後の最新コード） |
| 全回帰初回 | npm.cmd run test:e2e | 20/21 PASS。追加した「全地点MOSS」前提でresourcesがFAIL |
| 石床地点の絞込 | quality-resources | 前提修正後も全22地点の再生assertがFAIL。支持条件適応後はPASS |
| 全回帰2回目 | npm.cmd run test:e2e | 20/21 PASS。resourcesは成功、既存blueprintが固定待機による照準不一致でFAIL |
| blueprint絞込 | blueprint | raycast待ちだけでは収束前の一時的一致が起きてFAIL。カメラ収束と再raycastを合わせた待機後はPASS |
| 最終 | npm.cmd run test:e2e | 21/21 PASS（3回目、全件成功） |
| 最終 | npm.cmd run build | PASS（57 modules、JS 778.63 kB / gzip 214.74 kB） |

個別試験後にchoice/ending/titleのwheel確認、人工きのこ非再生、HUD充填CSS確認を補強し、最終全回帰で再検証済み。
新規試験ではconsole error/pageerrorを収集。既知の大きなバンドル警告やD19の警告は今回の改修対象外。

実行ログ: [test:ci](evidence/test-ci.txt) / [build](evidence/build.txt) / [最終test:e2e](evidence/test-e2e.txt)。
最終コード・テストは上記SHAと一致。全回帰の21件と各所要時間はtest-e2e.txt末尾に記録した。

## 未確認・公開

- 全章を通常の採取量・戦闘時間で手動攻略したわけではない。章進行・戦闘の勝敗はfixtureを併用した。
- 鉄ハンマーによる長時間の採掘、全装備・全方向・全敵の実戦バランス、長時間耐久、低性能実機は未確認。
- 旧版セーブの移行、全破損パターン、保存容量上限は今回の受入範囲外。
- スクリーンショットはWindowsのテストブラウザ。macOS/mobile等の外観は未確認。
- 今回のCh4–5のpush、GitLab CI、Pages公開確認は未実施。ローカルコミット後、ユーザーがpushし、自動パイプラインPassedとPagesでNew Game／Continueを確認する。
