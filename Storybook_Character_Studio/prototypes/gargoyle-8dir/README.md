# ガーゴイル（第7章の神殿防衛）

[飛行4方向画](../../references/gargoyle-flight-4dir-v1.png)と[着地修正版](../../references/gargoyle-landed-v2.png)を基に、[作画コード](character.mjs)で同じ石の体、角、牙と翼を描く。飛行のA/Bは翼を上げる・下ろす動き。地上のA/Bは翼を左右の肩から腰へ畳んだまま、左右の足を踏み替える動き。着地時に飛行用の2枚から地上用の2枚へ切り替える想定。

Studioで `npm.cmd run export:gargoyle` を実行すると、`output/` に飛行・地上それぞれのA/BのSVG・原画PNG・正規化PNG、比較画像、マニフェストを生成する。各シートは128pxセルを4列×2行で配置する。飛行の高さは表示時のオフセット0.4で表現する。

[比較画面](../../compare/ch4-5/monsters/?c=gargoyle)で飛行・地上、8方向、ポーズを選べる。地上の参照画は左斜め前の1枚を固定表示する。

## 岩砕きのガーゴイル：静止造形・試作01

通常型と共通の作画コードに `buildHeavyGroundSheet` を追加。顔・左右の耳・2本の角・尾を引き継ぎ、胸と肩、前腕を厚くした。両足を開いて接地し、岩の拳を低く構える。畳んだ翼は左右それぞれの肩から腰へ配置する。単純な全身拡大ではなく、同じ表示倍率でも上半身の量感が変わる造形。

[通常型との比較](../../compare/ch4-5/monsters/?c=gargoyle_heavy)では、左が通常型の地上A、右が重装型の静止姿勢。通常型を1倍、重装型を1.3倍で表示して8方向を比べる（2026-11-14調整）。ポーズの自動切り替えは使わない。飛行・歩行・振りかぶり・振り下ろしは未制作で、1.3倍はStudioの確認用の表示設定とし、本編での最終倍率は移植時に確認する。

`npm.cmd run export:gargoyle` で通常型と一緒に再生成する。出力は `output/gargoyle_heavy_ground_code_idle_{a,b}_8dir.{svg,src.png,png}` と `heavy-ground-manifest.json`・`heavy-ground-comparison.png`。既存の `MonsterSprite` 用にA/Bを出力するが、静止試作のため両方は同じ画像。比較ボードの参照は通常型の着地設定画であり、重装型の専用設定画ではない。ゲームへは移植しない。

確認: `npm.cmd test` と `npm.cmd run test:compare -- gargoyle gargoyle-heavy`。
