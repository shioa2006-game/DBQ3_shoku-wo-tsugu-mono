# 「職をつぐ者」向け8方向キャラクター制作

頭・胴をコードで描き、既存ゲームの3D手足と組み合わせる制作フォルダです。キャラクターをここで蓄積・調整し、2026-11-02にCH1～CH3の12種を本編へ移植しました。

| キャラクター | 制作原本・手順 | 出力 | 旧画像との対応（旧画像は比較用に保持） |
|---|---|---|---|
| 主人公 | [adventurer-8dir](adventurer-8dir/README.md) | [PNG](adventurer-8dir/output/adventurer_code_body_8dir.png) | `assets/adventurer_boy_body_8dir.png` |
| ミナ／農家の少女 | [mina-8dir](mina-8dir/README.md) | [頭](mina-8dir/output/mina_code_head_layer_8dir.png)・[胴体](mina-8dir/output/mina_code_torso_layer_8dir.png)・[比較用合成](mina-8dir/output/mina_code_body_8dir.png) | `assets/humanoids/village_girl_body_8dir.png` |
| ピノ／大工見習い | [pino-8dir](pino-8dir/README.md) | [頭](pino-8dir/output/pino_code_head_layer_8dir.png)・[胴体](pino-8dir/output/pino_code_torso_layer_8dir.png)・[比較用合成](pino-8dir/output/pino_code_body_8dir.png) | `assets/humanoids/village_apprentice_body_8dir.png` |
| イナホ／料理見習い | [inaho-8dir](inaho-8dir/README.md) | [頭](inaho-8dir/output/inaho_code_head_layer_8dir.png)・[胴体](inaho-8dir/output/inaho_code_torso_layer_8dir.png)・[比較用合成](inaho-8dir/output/inaho_code_body_8dir.png) | `assets/humanoids/cook_body_8dir.png` |
| ゴンタ／村の若者 | [gonta-8dir](gonta-8dir/README.md) | [頭](gonta-8dir/output/gonta_code_head_layer_8dir.png)・[胴体](gonta-8dir/output/gonta_code_torso_layer_8dir.png)・[比較用合成](gonta-8dir/output/gonta_code_body_8dir.png) | `assets/humanoids/adult_male_villager_body_8dir.png` |
| ジンベエ／村の長老 | [jinbei-8dir](jinbei-8dir/README.md) | [頭](jinbei-8dir/output/jinbei_code_head_layer_8dir.png)・[胴体](jinbei-8dir/output/jinbei_code_torso_layer_8dir.png)・[比較用合成](jinbei-8dir/output/jinbei_code_body_8dir.png) | `assets/humanoids/middle_aged_male_villager_body_8dir.png` |
| ワタリ／船乗り | [watari-8dir](watari-8dir/README.md) | [頭](watari-8dir/output/watari_code_head_layer_8dir.png)・[胴体](watari-8dir/output/watari_code_torso_layer_8dir.png)・[比較用合成](watari-8dir/output/watari_code_body_8dir.png) | `assets/humanoids/sailor_body_8dir.png` |

12種とも本編へ移植済みです。本編は `_code_` 画像を直接読み、住民6人は頭・胴の分離画像、主人公を含む7人は `src/content/rig-profiles/` の設定を使用します。旧画像は専用比較ページ用として残しています。`shared/` は目・鼻・SVG部品・方向順の共通処理です。主人公の共用化では生成SVGが変更前と完全一致することを確認しています。

ゲーム側の `prototypes/adventurer/` 、`prototypes/mina/`、`prototypes/pino/`、`prototypes/inaho/`、`prototypes/gonta/`、`prototypes/jinbei/`、`prototypes/watari/` は実際のリグとの比較用です。現在の開発サーバーでは [主人公](http://127.0.0.1:5175/builder_sprite_lab/prototypes/adventurer/)／[ミナ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/mina/)／[ピノ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/pino/)／[イナホ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/inaho/)／[ゴンタ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/gonta/)／[ジンベエ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/jinbei/)／[ワタリ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/watari/) から確認できます。

## 移植後も揃えて更新するもの

1. 各キャラクターの正規化済みPNGと元のキャラクターID・画像パスの対応。
2. 本編と一致した方向順、セル寸法、頭・胴のUV窓、手足の色とキャラクター別のリグ設定。全員の `rig-profile.mjs` を画像と合わせて移植し、リグの方向別頭高さ `headLiftByDirection` 対応も引き継ぎます。
3. 比較画面での8方向と動作確認、および本編での表示確認。

本編で使う画像とリグ設定の同期方法は、ゲーム側 `docs/CHARACTER_ART.md` に記録しています。制作時は [共通ガイド](../docs/CHARACTER_AUTHORING.md) に沿って確認してください。

第1〜3章の主人公と住民6人は、全員の初回試作が揃いました。第4〜5章の新規住民は未制作です。モンスターはスライム・おおこうもり・おおねずみ・どろたぼう・イカの初回試作が揃いました。

## モンスター

| 対象 | 原本・手順 | 出力 | 旧画像との対応（旧画像は比較用に保持） |
|---|---|---|---|
| スライム | [slime-8dir](slime-8dir/README.md) | [A](slime-8dir/output/slime_code_idle_a_8dir.png)・[B](slime-8dir/output/slime_code_idle_b_8dir.png) | `assets/nonhumanoids/slime_idle_a_8dir.png`・`slime_idle_b_8dir.png` |
| おおこうもり | [night-bat-8dir](night-bat-8dir/README.md) | [A](night-bat-8dir/output/night_bat_code_idle_a_8dir.png)・[B](night-bat-8dir/output/night_bat_code_idle_b_8dir.png) | `assets/nonhumanoids/night_bat_idle_a_8dir.png`・`night_bat_idle_b_8dir.png` |
| おおねずみ | [field-rat-8dir](field-rat-8dir/README.md) | [A](field-rat-8dir/output/field_rat_code_idle_a_8dir.png)・[B](field-rat-8dir/output/field_rat_code_idle_b_8dir.png) | `assets/nonhumanoids/field_rat_idle_a_8dir.png`・`field_rat_idle_b_8dir.png` |
| どろたぼう | [dorotabo-8dir](dorotabo-8dir/README.md) | [A](dorotabo-8dir/output/dorotabo_code_idle_a_8dir.png)・[B](dorotabo-8dir/output/dorotabo_code_idle_b_8dir.png) | `assets/nonhumanoids/dorotabo_idle_a_8dir.png`・`dorotabo_idle_b_8dir.png` |
| イカ | [squid-8dir](squid-8dir/README.md) | [A](squid-8dir/output/squid_code_idle_a_8dir.png)・[B](squid-8dir/output/squid_code_idle_b_8dir.png) | `assets/nonhumanoids/squid_idle_a_8dir.png`・`squid_idle_b_8dir.png` |

[スライムの比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/slime/)で8方向・2ポーズを確認します。全身シート2枚とマニフェストの表示条件を揃えて移植します。元ゲームの「書喰いのスライム」も同じ画像を拡大・着色して使うため、本編の倍率・着色でボス表示も確認しました。

[おおこうもりの比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/night-bat/)で全8方向・羽ばたき2ポーズを確認できます。

[おおねずみの比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/field-rat/)で8方向・2ポーズと接地位置を確認できます。

[どろたぼうの比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/dorotabo/)で8方向・泥が沈む2ポーズを確認できます。共用画像を使うボス「泥田の主」も本編の倍率・着色で確認しました。

[イカの比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/squid/)で腕の2ポーズと浮遊を確認できます。共用画像のクラーケンも本編の拡大・着色で表示を確認しました。

## アイテムアイコン

| 対象 | 原本・手順 | 出力 | 今の表示 |
|---|---|---|---|
| 第1～3章のアイテム50件 | [item-icons](item-icons/README.md) | [アトラス](item-icons/output/item_icons_16.png)・[確認画像](item-icons/output/preview.png)・[マニフェスト](item-icons/output/manifest.json) | ゲームの `itemIcon()` がブロックの模様かemojiを描画 |

試作02で全50件を作画しました。[比較ページ](item-icons/index.html)で今のemojiと並べて確認できます。2026-11-03に第1～3章へ移植しました（`--preview-game` の出力を本編が読み込みます）。第4～5章は未移植です。

## CH1～3を優先する制作順と残り

ユーザーの方針により、CH4以降へ進む前にCH1～3のキャラクターを完成させます。下表はゲームの `src/entities/monsters.js` の定義と、現在の本編への反映状況です。

| 対象 | 章 | 状態・必要な作業 |
|---|---|---|
| 主人公・ミナ・ピノ・イナホ・ゴンタ・ジンベエ・ワタリ | 1～3 | 7人とも画像とリグ設定を本編へ反映済み |
| スライム | 1 | 本編へ反映済み。目の上端と眉の重なりを調整済み |
| おおこうもり (`bat`) | 1 | 本編へ反映済み。翼の接続と比較画面の上下動を調整済み |
| おおねずみ (`field_rat`) | 2 | 本編へ反映済み。横向きの目の位置と見える足を調整済み |
| どろたぼう (`dorotabo`) | 2 | 本編へ反映済み。8方向・通常／沈み込む2枚 |
| イカ (`squid`) | 3 | 本編へ反映済み。8方向・触腕2ポーズ。浮遊は本編の高度制御を使用 |
| 書喰いのスライム (`boss`) | 1 | スライム共用。倍率2.6・色0xff8f8fで表示確認済み |
| 泥田の主 (`paddy_boss`) | 2 | どろたぼう共用。倍率2.4・色0xd08a6aで表示確認済み |
| クラーケン (`kraken`) | 3 | イカ共用。倍率2.8・色0x6a4a7aで表示確認済み |
| 触手 (`kraken_arm`) | 3 | 本体の2D画像とは別に4節の先細り3D円柱メッシュ。既存の表現を維持し、表示を確認済み |

固有のモンスター原画は計5種で、全5種の初回試作が揃いました。CH1～3の未制作の基本シートはありません。2026-11-02に本編の画像参照と人型7人のリグ設定を切り替えました。ボス3体の拡大・着色、8方向・歩行・装備動作も本編クラスで検証しています。今後の見た目の調整もStudio原本から同期します。
