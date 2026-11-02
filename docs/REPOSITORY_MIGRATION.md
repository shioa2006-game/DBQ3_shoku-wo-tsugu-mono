# 2026-11-02 親GitHubリポジトリへの統合

## 方針

ユーザーの依頼により、コピーしたCH1～3・CH4～5・Character Studioの個別Git管理を終了し、親 `DBQ3_shoku-wo-tsugu-mono` を1つのリポジトリとしました。

接続先は `https://github.com/shioa2006-game/DBQ3_shoku-wo-tsugu-mono.git`。統合時点で空のリポジトリであることを確認し、現在のファイルから初回コミットを作成します。サブモジュールや履歴マージは使いません。別の場所にあるオリジナルや、元のリモートリポジトリには変更を加えていません。

## 統合前の保全

バックアップ先（この開発PC、親リポジトリの外）:

```text
C:\DevelopmentEnvironment\DBQ3_repository_backups\2026-11-02-parent-unification\
```

| コピー側の旧リポジトリ | 最終HEAD | 保存した履歴 |
|---|---|---|
| dqb3-tsugumono-ch1-3 | d50fdff7cc63d556e503c609cda3caa6762fc1d0 | dqb3-tsugumono-ch1-3.bundle |
| dqb3-tsugumono-ch4-5 | d6b89b191dacde42c26b3efefd0e50d9ac543635 | dqb3-tsugumono-ch4-5.bundle |
| Storybook_Character_Studio | 7ca62adb9f72b140144a198a5d18db56e5274719 | Storybook_Character_Studio.bundle |

3つとも作業ツリーがcleanであることを確認してから `git bundle create --all` で保存し、`git bundle verify` で完全な履歴として検証しました。各bundleのSHA-256とHEADは外部の `manifest.json` に記録しています。旧Git設定、親の共通資料・過去の診断記録、今回の移植確認画像も同じ場所へ保存しました。バックアップはGitHubへ登録しません。

履歴の参照・復元は、現在の作業フォルダとは別の空き場所へcloneします。例:

```powershell
git clone -b main C:\DevelopmentEnvironment\DBQ3_repository_backups\2026-11-02-parent-unification\Storybook_Character_Studio.bundle C:\DevelopmentEnvironment\Studio-history-inspection
```

過去のStudio整理記録にあるコミットも、このbundle内で参照できます。

## 整理したもの

- コピー側の3つの `.git`。親の `.git` だけで全フォルダを管理。
- 旧GitLabの `.gitlab-ci.yml` 2件、旧push手順書・GitLab運用手順書。
- 子フォルダの `.gitignore` 3件。親に共通の除外設定を集約。
- CH1～3の `prototypes/` 以下の検証PNG 58枚、約22MiB。比較ページのHTML・JS・リグ設定は保持。今後の撮影結果もGitから除外。
- 親の `quality-audit-ch1-3-2026-09-05/` とCH1～3の `work/`。必要な過去証跡は外部バックアップで参照。
- 両ゲームの `dist/` は検証後に削除。必要なときにビルドで再作成。

`node_modules/` は現在の開発環境に必要なのでローカルに保持し、Gitから除外します。制作原本、Studioの出力画像、ゲームの `assets/`・`art_src/`、旧画像による比較機能、テスト、修正メモは保持します。

## 更新した運用

親README・AGENTS・GitHub運用手順を追加し、子の現行運用指示を更新しました。過去の検証記録は履歴として残し、旧GitLab手順を現行の指示と混同しない注記を追加しています。第6～7章は同じ親内の未実装フォルダとしてREADMEだけを置きます。

Viteのローカルbaseは維持し、GitLab固有の判定を汎用の `RELATIVE_ASSET_PATHS=1` に変更しました。GitHubへのソース保存とWeb公開は別です。自動公開・GitHub Actionsは設定していません。

## 統合時の検証

- CH1～3: `test:ci` のビルドと高速3件が通過。
- CH4～5: `test:ci` のビルドと高速5件が通過。
- Studio: `npm test` の17件が通過。作画再現とローカルリンクも確認。
- 両ゲームの `RELATIVE_ASSET_PATHS=1` ビルドが成功し、生成HTMLのJS参照が `./assets/` であることを確認。
- 子フォルダが通常ファイルとして登録され、サブモジュールのgitlink（mode 160000）がないことを確認。
- 認証情報の既知パターンと不要な登録パスを検査。依存ライブラリ・ビルド結果・履歴バックアップ・端末設定は登録対象外。

今回はリポジトリ構成・文書・ビルド設定の整理で、ゲームの章進行・戦闘・セーブ処理には変更を加えていません。統合では高速回帰を実行し、全章の通しテストは再実行していません。
