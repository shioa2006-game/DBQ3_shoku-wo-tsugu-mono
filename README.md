# 職をつぐ者 — 全章・キャラクター制作

第1～3章、第4～5章、将来の第6～7章とCharacter Studioを、1つのGitHubリポジトリで管理します。

正本: https://github.com/shioa2006-game/DBQ3_shoku-wo-tsugu-mono

| フォルダ | 内容 |
|---|---|
| [dqb3-tsugumono-ch1-3](dqb3-tsugumono-ch1-3/README.md) | 本島編。制作した人型7人・基本モンスター5種を本編へ移植済み |
| [dqb3-tsugumono-ch4-5](dqb3-tsugumono-ch4-5/README.md) | 火山島編。第4～5章の独立ゲーム |
| [dqb3-tsugumono-ch6-7](dqb3-tsugumono-ch6-7/README.md) | ダーマ再興編の予定地。ゲーム実装は未作成 |
| [Storybook_Character_Studio](Storybook_Character_Studio/README.md) | 8方向キャラクターの制作原本・生成画像・制作ガイド |
| [dqb3_game_plan.md](dqb3_game_plan.md) | 全体企画 |
| [docs](docs/GITHUB_WORKFLOW.md) | GitHub運用と統合記録 |
| archive | 過去の修正メモ |

各ゲームの起動・依存関係・セーブ領域は独立しています。フォルダ間の相対参照を保つため、現在の名前と配置で利用してください。

## 初回セットアップと起動

Node.jsはゲームの依存ライブラリが要求するバージョンを使用します。各フォルダのlockfileで依存関係を固定しています。Windowsでは `npm.cmd` を使用します。

```powershell
npm.cmd --prefix dqb3-tsugumono-ch1-3 ci
npm.cmd --prefix dqb3-tsugumono-ch4-5 ci

# 実行したいゲームを選ぶ。両方を同時に動かす場合は別ターミナルで実行。
npm.cmd --prefix dqb3-tsugumono-ch1-3 run dev
npm.cmd --prefix dqb3-tsugumono-ch4-5 run dev

# キャラクター制作画面
npm.cmd --prefix Storybook_Character_Studio start
```

Viteが表示するURLを開いてください。CH1～3のURLパスは `/builder_sprite_lab/`、CH4～5は `/dqb3-tsugumono-ch4-5/` です。3D比較にはCH1～3の開発サーバーを使用します。

## 確認

```powershell
npm.cmd --prefix dqb3-tsugumono-ch1-3 run test:ci
npm.cmd --prefix dqb3-tsugumono-ch4-5 run test:ci
npm.cmd --prefix Storybook_Character_Studio test
```

ゲームのテストは対応するChromium/Chrome/Edgeが必要です。解決方法は各 `tests/helpers.mjs` を参照してください。ゲーム2本のテストサーバーは同じ既定ポートを使うので、上記は順番に実行します。章進行・戦闘・セーブ等の変更では対象ゲームの `test:e2e` も実行します。

## Gitと公開

Git操作はこの親フォルダで行います。子フォルダは通常のディレクトリで、個別の `.git` やサブモジュールはありません。GitLabや元のStudioリポジトリへは同期しません。

[日常のGitHub運用](docs/GITHUB_WORKFLOW.md) / [2026-11-02の統合・整理記録](docs/REPOSITORY_MIGRATION.md)

GitHubへのpushはソースの保存です。GitHub Pagesへの自動公開やGitHub Actionsは、この統合では設定していません。
