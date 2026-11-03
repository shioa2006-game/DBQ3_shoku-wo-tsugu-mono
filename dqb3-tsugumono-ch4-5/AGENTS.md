# AI開発指示（Codex / Claude Code 共通）

このフォルダは、Vite + three.js + WebGLで実装したブラウザゲーム
「職をつぐ者」の第4～5章（火山島編）です。第1～3章とは独立したゲームとして動作します。

このファイルをAI開発指示の正本とします。Codexはこの`AGENTS.md`を直接読み、
Claude Codeは`CLAUDE.md`からこのファイルを読み込みます。

## 最初に確認するもの

- ゲーム全体、操作方法、構成は`README.md`を確認する。
- ストーリーは[共通の入口](../docs/story/README.md)と[第4章](../docs/story/implemented/chapter4.md)・[第5章](../docs/story/implemented/chapter5.md)を確認する。現在の実装を基準にし、差異は[不整合一覧](../docs/story/inconsistencies.md)へ記録する。
- コードの所在は[実装参照先](../docs/story/reference/ch4-5-implementation.md)を確認する。旧assets内の脚本・実装ガイドは移転案内であり、原文は履歴資料。第6～7章は未実装の計画として区別する。
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

## テストと完了条件

- コード変更後は、最低でも`npm.cmd run test:ci`と`npm.cmd run build`を実行する。
- ストーリー、セーブ、ワールド生成、章間遷移、戦闘などに影響する変更では
  `npm.cmd run test:e2e`も実行する。
- 第4章の変更では`tests/e2e/chapter4.test.mjs`、第5章では
  `tests/e2e/chapter5.test.mjs`の影響を確認する。
- 新機能や不具合修正には、可能な限り対応する回帰テストを追加する。
- ヘッドレス環境では固定sleepを避け、`tests/helpers.mjs`の待機関数を使う。
- テストを実行できない場合は、未確認項目と理由を完了報告に明記する。

## ブラウザ確認

- 公式の`tests/`、CodexのPreview/Browser機能、ユーザーのスクリーンショットを優先する。
- Edge/ChromeをPowerShellから直接起動する独自自動化、CDPの自作、ポート総当たりを行わない。
- `file:///dist/index.html`ではなく、ViteのHTTPサーバー経由で確認する。
- プレビューがhiddenになり描画ループが止まった場合は、その事実を伝え、
  数値検証・コード読解・ユーザー確認へ切り替える。

## 第4～5章固有の注意

- セーブキー`shoku_wo_tsugumono_kazan_save_v1`を不用意に変更しない。
- ワールド生成を変更するときは`GEN_VERSION`と既存セーブへの影響を確認する。
- 第5章の地域開放は`WORLD.GATE_Z`と`flags.bambooPassOpen`の整合性を保つ。
- 章進行ロジックと脚本を混同しない。
  第4章は`src/game/quests4.js`と`src/content/chapter4.js`、
  第5章は`src/game/quests5.js`と`src/content/chapter5.js`を対応させる。
- 第6～7章は将来、親内の別フォルダでこのコードを土台に開発する。
  第4～5章の挙動を将来章の都合だけで変更しない。

## アセット

- 手描き原画は`art_src/`、ゲーム読込用画像は`assets/`に置く。
- 8方向キャラクターシートを追加・変更するときは、既存の正規化手順を使う。

```powershell
node tools/normalize_sheet.mjs art_src/<name>_body_8dir.src.png assets/humanoids/<name>_body_8dir.png
```

- 生画像を`assets/humanoids/`へ直接置いて個別補正で回避しない。
- `tests/e2e/sheets.test.mjs`の検査を通す。
- アイテムアイコンの原本はStudioの `prototypes/item-icons/`。`assets/items/` はStudioの `npm.cmd run export:items -- --preview-game` で更新し、直接編集しない。`tests/e2e/item-icons.test.mjs`（`test:ci` に含む）で全アイテムが画像のアイコンを使うことを確認する。

## 親リポジトリのGitHub運用

- Git管理は親 `DBQ3_shoku-wo-tsugu-mono` の1つだけ。[親のAGENTS.md](../AGENTS.md)と[運用手順](../docs/GITHUB_WORKFLOW.md)に従う。
- このフォルダに `.git` を作らず、旧GitLabへ同期・pushしない。GitHub Pagesの自動公開は未設定。
- 変更対象を指定して親でコミットする。既存の未コミット変更は無断で破棄しない。
- `vite.config.js` の既定baseは従来のローカルURLを維持する。相対URLでの出力は `RELATIVE_ASSET_PATHS=1` を指定する。
- baseや公開設定を変える場合、ローカルのビルド・テストと相対URL出力の両方を確認する。

## 作業完了時

- 変更内容、実行した確認、残る未確認事項を短く報告する。
- ユーザー側で画面確認が必要な場合、確認してほしい場所と期待結果を具体的に示す。
