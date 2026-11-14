# AI開発指示（Codex / Claude Code 共通）

このフォルダは、Vite + three.js + WebGLで実装したブラウザゲーム
「職をつぐ者」の第6～7章（ダーマ再興編）です。第1～3章・第4～5章とは独立したゲームとして動作します。

このファイルをAI開発指示の正本とします。Codexはこの`AGENTS.md`を直接読み、
Claude Codeは`CLAUDE.md`からこのファイルを読み込みます。

## 最初に確認するもの

- ゲーム全体、操作方法、構成は`README.md`を確認する。
- 設計（マップ・進行・敵・防衛・ヴァルガ戦・セーブ）は[docs/DESIGN.md](docs/DESIGN.md)。数値を変えたら、この資料も合わせる。
- ストーリーは[共通の入口](../docs/story/README.md)と[第6章](../docs/story/implemented/chapter6.md)・[第7章](../docs/story/implemented/chapter7.md)を確認する。現在の実装を基準にし、差異は[不整合一覧](../docs/story/inconsistencies.md)へ記録する。
- 制作時の依頼文は[docs/IMPLEMENTATION_BRIEF.md](docs/IMPLEMENTATION_BRIEF.md)（2026-11-14。守るストーリーの決定と、任された設計の範囲）。
- 実装前に`package.json`のscriptsと、変更対象に対応する`tests/e2e/*.test.mjs`を確認する。

## 最優先ルール

- ユーザーから「コード修正しないでください」と指示された場合、コード・アセット・設定を変更しない。
- ユーザーが提示したスクリーンショットや動作結果は一次情報として扱う。
- 既知の不具合を最初から調べ直さず、提示された事実と現在のコードから原因を絞る。
- 指示にない大規模リファクタリング、依存関係の更新、セーブ形式の破壊的変更を行わない。
- 秘密鍵、パスフレーズ、アクセストークン、個人情報をコミットしない。

## 開発コマンド

WindowsではPowerShellの実行ポリシーの影響を避けるため、原則`npm.cmd`を使う。

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run test:ci
npm.cmd run test:e2e
```

- 通常の起動は`start-dev.bat`または`npm.cmd run dev`を使う。
- `dist/`と`node_modules/`は生成物なのでコミットしない。
- 既存のdev serverが動いている場合は再利用し、無断で停止しない。
- テストのプレビューは既定でポート4176（既存2編は4174）。`TEST_PORT`で変えられる。`TEST_ONLY=chapter7,smoke`のように名前の一部で絞れる。

## テストと完了条件

- コード変更後は、最低でも`npm.cmd run test:ci`（ビルドを含む）を実行する。
- ストーリー、セーブ、ワールド生成、防衛、ヴァルガ戦などに影響する変更では`npm.cmd run test:e2e`も実行する。
- 第6章の変更では`tests/e2e/chapter6.test.mjs`、第7章では`chapter7.test.mjs`、敗北と再挑戦は`defeat-retry.test.mjs`・`varuga-retry.test.mjs`、資材とレシピは`shortage.test.mjs`、全体のつながりは`full-run.test.mjs`の影響を確認する。
- 物語で必ず要る設計図のブロックは、採り直せる素材（木・石・わら など）だけで作れるように保つ。数に限りのある鉄を使うものを、必須の建築・修理に入れない（`shortage.test.mjs`が確かめる）。
- 新機能や不具合修正には、可能な限り対応する回帰テストを追加する。
- ヘッドレス環境では固定sleepを避け、`tests/helpers.mjs`の待機関数を使う。戦いの経過を決まった時間で確かめるときは`pauseLoop(page, true)`で実時間のループを止め、`fastForward`で進める。
- `game-shared/`やStudioの共通部品を変えたら、既存2編（`test:ci`、影響が大きければ`test:e2e`）とStudio（`npm.cmd test`）も通す。既存2編のテストは同じ既定ポートを使うので順番に実行する。
- テストを実行できない場合は、未確認項目と理由を完了報告に明記する。

## ブラウザ確認

- 公式の`tests/`、CodexのPreview/Browser機能、ユーザーのスクリーンショットを優先する。
- Edge/ChromeをPowerShellから直接起動する独自自動化、CDPの自作、ポート総当たりを行わない。
- `file:///dist/index.html`ではなく、ViteのHTTPサーバー経由で確認する。
- プレビューがhiddenになり描画ループが止まった場合は、その事実を伝え、数値検証・コード読解・ユーザー確認へ切り替える。

## 第6～7章固有の注意

- セーブキー`shoku_wo_tsugumono_dharma_save_v1`を不用意に変更しない。既存2編のキーには触れない（`save-coexist.test.mjs`）。
- ワールド生成（`src/world/world.js`の`generate*`）を変更するときは`GEN_VERSION`と既存セーブへの影響を確認する。
- 章進行ロジックと脚本を混同しない。第6章は`src/game/quests6.js`と`src/content/chapter6.js`、第7章は`src/game/quests7.js`と`src/content/chapter7.js`を対応させる。住民の居場所は各章の`homes()`が進行とフラグから決める（セーブしない）。
- 戦い（大岩ガニ・3波・ヴァルガ）は、合図のときに「開始直前の状態」を保存し、敗北・中断ロードでそこへ戻す（`main.js`の`saveCheckpoint`/`restoreCheckpoint`/`saveNow`）。戦いの最中のステージをそのままセーブしない。
- 防衛の数値（敵の体力・門と防壁の耐久・ボウガン・とげ罠）を変えたら、[docs/DESIGN.md](docs/DESIGN.md)の「8. 第7章の防衛」の釣り合いの記録も確かめ直す。道の口（z51）が唯一の通り道になるよう、両脇の土手に足場（木・ブロック）を作らない。
- ストーリーの決定（章名、敵8種、ヴァルガの名乗りと最期、要石の祭壇と授職の継承、最後の出航、書の内部ID`builder`）は[依頼文](docs/IMPLEMENTATION_BRIEF.md)と[計画資料](../docs/story/planned/chapter6-7-scenario.md)のとおりに保つ。筋を変える必要があるときは、作業を止めてユーザーに確認する。
- 既存2編（`dqb3-tsugumono-ch1-3`・`dqb3-tsugumono-ch4-5`）の動作・セーブ・相対パスを、この編の都合で変更しない。

## アセット

- 人物・敵・ヴァルガ・ムービー・設置物の3D・アイテムアイコンの原本はStudio（`../Storybook_Character_Studio/`）。ゲーム側の画像・`src/world/prop-models.js`・`src/content/rig-profiles/`・`assets/movies/`を直接編集しない。
  - 人物と敵: Studioで書き出し、`npm.cmd run sync:games`で写す（書き出し先は`prototypes/shared/game-targets.mjs`）。
  - ヴァルガ: `src/entities/varuga-motion.mjs`・`varuga-rig.js`・`dragon-configs.js`の造形と動作は、Studioの`prototypes/varuga-8dir/`と同じ内容に保つ（Studioの`tests/node/varuga.test.mjs`が確かめる）。戦いの数値（`battle`）と、戦い用の重ね（`varuga-battle-rig.js`）だけがゲーム側のもの。
  - ムービー5本: Studioの`story-movies/`で生成し、`npm.cmd run sync:movies`で写す。名前とファイルの対応は`src/content/movies.js`。
  - 設置物の3D: Studioの`prototypes/props-3d/models.mjs`を直し、`npm.cmd run export:props -- --preview-game`。
  - アイテムアイコン: Studioの`prototypes/item-icons/icons.mjs`を直し、`npm.cmd run export:items -- --preview-game`（3つの編の共通画像を書き換えるので、既存2編の`test:ci`も通す）。
- `src/entities/rig.js`は既存2編と同じ内容に保ち（Studioのテストが一致を確かめる）、この編だけを直さない。
- 8方向シートの検査は`tests/e2e/sheets.test.mjs`。移植の記録は[docs/CHARACTER_ART.md](docs/CHARACTER_ART.md)。

## 親リポジトリのGitHub運用

- Git管理は親 `DBQ3_shoku-wo-tsugu-mono` の1つだけ。[親のAGENTS.md](../AGENTS.md)と[運用手順](../docs/GITHUB_WORKFLOW.md)に従う。
- このフォルダに `.git` を作らない。変更対象を指定して親でコミットする。既存の未コミット変更は無断で破棄しない。
- この編は公開の対象（共通トップのカード、`tools/build-portal.mjs`、`.github/workflows/pages.yml`。2026-11-14にユーザーの確認を得て追加）。`main` へpushすると、このフォルダの変更もGitHub Pagesへ公開されるので、pushはユーザーが頼んだときだけ行う。公開前に、公開処理がこの編の `tests/e2e/blueprint.test.mjs` を相対URLで実行する。
- `vite.config.js` の既定baseは `/dqb3-tsugumono-ch6-7/`。相対URLでの出力は `RELATIVE_ASSET_PATHS=1` を指定する。

## 作業完了時

- 変更内容、実行した確認、残る未確認事項を短く報告する。
- ユーザー側で画面確認が必要な場合、確認してほしい場所と期待結果を具体的に示す。
