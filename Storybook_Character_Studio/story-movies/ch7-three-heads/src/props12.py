"""三頭魔竜の襲来「三つ首の影」の小道具：ムービー用に組み立てた三頭魔竜ヴァルガ。

  Varga(parts).draw(p, ...)  正面から見たヴァルガ。胴（Studioの胴のセル）・三本の首・三つの頭（頭／開口頭のセル）・
                             膜の翼・尾。首・翼の色は rig-profile.mjs の値（ゲームの3Dでは首・翼・尾を立体で付ける）。
  頭の並びと高さは rig-profile.mjs の heads（左右の首は横へ±2、上へ5.3。中央は上へ5.6）を、胴の倍率（2.1）を
  128pxのセルの高さとして画面の長さに直したもの。原点は胴の下端の中央。

部品は ../parts/varga.json（../../shared/varga.mjs が Studioの作画コードから書き出したもの）を読む。
id は呼び出し側の接頭辞 p の下に置く（頭・開口頭・胴の定義は同じ id を使うので、さらに h- / o- / b- を付ける）。
"""
import json

from helpers import n
from figures import namespace

INK = "#291516"


class Varga:
    def __init__(self, path):
        with open(path, encoding="utf-8") as f:
            self.data = json.load(f)
        rig = self.data["rig"]
        self.unit = 128 / rig["bodyScale"]             # 3Dの1単位を、胴のセル（128px）の高さに合わせた長さ
        self.kh = rig["headScale"] / rig["bodyScale"]  # 頭のセルの倍率（胴のセルに対して）
        self.rig = rig

    def defs(self, p, open_mouth=False):
        d = self.data["defs"]
        out = namespace(d["body"], f"{p}b-") + namespace(d["head"], f"{p}h-")
        if open_mouth:
            out += namespace(d["open"], f"{p}o-")
        return out.replace("<defs>", "").replace("</defs>", "")

    def head_positions(self, spread=1.0, lift=1.0):
        """三つの頭の中心（左・中央・右）。胴の中心（セルの中心）から上へ up、横へ side。"""
        u = self.unit
        cy = -58                                        # 胴のセルの中心（下端が 0）
        return [(h["side"] * u * spread, cy - h["up"] * u * lift) for h in self.rig["heads"]]

    def draw(self, p, open_mouth=False, spread=1.0, lift=1.0, fire_cls="", wing_cls="", head_cls="", dirs=("front_right", "front", "front_left")):
        """ヴァルガ（原点は胴の下端の中央。胴のセルを128pxで描く大きさ）。
        dirs は画面の左・中央・右の頭の向き（セルの方向名）。開口頭のときは口の前に火の光（fire_cls）。"""
        d = self.data
        r = self.rig
        heads = self.head_positions(spread, lift)
        o = []
        # 尾（左下へ）と翼（胴の後ろ）
        o.append(f'<path d="M20,-30 Q120,-10 190,30 Q240,60 300,52 Q250,74 186,56 Q110,30 10,-6Z" fill="{r["membrane"]}" stroke="{INK}" stroke-width="3"/>')
        for side in (-1, 1):
            s = side
            bones = [(s * 170, -250), (s * 360, -330), (s * 380, -190), (s * 330, -80)]
            wing = (f'M{s * 26},-96 L{s * 170},-250 L{s * 360},-330 Q{s * 330},-260 {s * 380},-190 Q{s * 330},-150 {s * 330},-80 '
                    f'Q{s * 220},-90 {s * 150},-40 Q{s * 90},-56 {s * 30},-60Z')
            g = [f'<path d="{wing}" fill="{r["membrane"]}" stroke="{INK}" stroke-width="3.4" stroke-linejoin="round"/>',
                 f'<path d="M{s * 26},-96 L{s * 170},-250 L{s * 150},-40 Q{s * 90},-56 {s * 30},-60Z" fill="{INK}" opacity=".28"/>',
                 f'<path d="M{s * 170},-250 L{s * 360},-330 Q{s * 330},-260 {s * 380},-190Z" fill="#a0423e" opacity=".35"/>',
                 f'<path d="M{s * 26},-96 L{s * 170},-250" stroke="{r["bone"]}" stroke-width="12" stroke-linecap="round"/>']
            for bx, by in bones[1:]:
                g.append(f'<path d="M{s * 170},-250 L{bx},{by}" stroke="{r["bone"]}" stroke-width="6" stroke-linecap="round"/>')
            g.append(f'<path d="M{s * 170},-250 L{s * 150},-40" stroke="{r["bone"]}" stroke-width="5" stroke-linecap="round"/>')
            o.append(f'<g class="{wing_cls}" style="transform-origin:{s * 26}px -96px">{"".join(g)}</g>')
        # 胴（セル）
        o.append(f'<g transform="translate(-64 -122)">{namespace(d["body"]["front"], f"{p}b-")}</g>')
        # 首（胴の上から、それぞれの頭の下へ）
        for hx, hy in heads:
            bx, by = 0, -112
            cx, cy = hx * .55, (by + hy) / 2 + 30
            neck = f"M{n(bx)},{n(by)} Q{n(cx)},{n(cy)} {n(hx)},{n(hy + 34 * self.kh)}"
            o.append(f'<path d="{neck}" fill="none" stroke="{INK}" stroke-width="30" stroke-linecap="round"/>'
                     f'<path d="{neck}" fill="none" stroke="{r["neck"]}" stroke-width="24" stroke-linecap="round"/>'
                     f'<path d="{neck}" fill="none" stroke="#c65a3e" stroke-width="10" stroke-dasharray="5 9" stroke-linecap="round" opacity=".7"/>')
        # 頭（セル）と、開口のときの口の火の光
        kind = "open" if open_mouth else "head"
        pre = f"{p}o-" if open_mouth else f"{p}h-"
        mouth = {"front": (63, 112), "front_left": (42, 108), "front_right": (84, 108)}   # 開口頭のシートの口の位置（右斜め前は反転）
        for (hx, hy), direction in zip(heads, dirs):
            k = self.kh
            o.append(f'<g class="{head_cls}" style="transform-origin:{n(hx)}px {n(hy)}px">'
                     f'<g transform="translate({n(hx - 64 * k)} {n(hy - 64 * k)}) scale({round(k, 4):g})">{namespace(d[kind][direction], pre)}</g>')
            if open_mouth:
                mx, my = mouth[direction]
                o.append(f'<circle class="{fire_cls}" cx="{n(hx + (mx - 64) * k)}" cy="{n(hy + (my - 64) * k)}" r="{n(18 * k)}" fill="#ffb24a" opacity=".85"/>'
                         f'<circle class="{fire_cls}" cx="{n(hx + (mx - 64) * k)}" cy="{n(hy + (my - 64) * k)}" r="{n(8 * k)}" fill="#fff0b0"/>')
            o.append("</g>")
        return "".join(o)


def roof_corner(p, fill="#5a3a24", edge="#2a1a10", rafter="#8a6440"):
    """手前左上の大屋根の端（軒の反りと垂木の木口）。"""
    return (f'<path d="M-40,-20 L760,-20 L760,96 Q700,104 640,130 Q600,150 560,186 L520,176 Q560,140 600,118 Q640,96 680,90 L-40,90Z" '
            f'fill="{fill}" stroke="{edge}" stroke-width="3"/>'
            f'<path d="M-40,90 L680,90 Q640,96 600,118 Q560,140 520,176" fill="none" stroke="{edge}" stroke-width="10" stroke-linecap="round"/>'
            + "".join(f'<rect x="{x}" y="92" width="9" height="9" fill="{rafter}"/>' for x in range(-20, 640, 22)))
