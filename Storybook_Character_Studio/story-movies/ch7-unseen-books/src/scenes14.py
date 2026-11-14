"""ダーマ再興編・完「まだ見ぬ書へ」の6場面のSVG。

  1. 再開した神殿    朝の再建した神殿（直った姿）。入口でスズハが訪れた人を迎え、大屋根の上でアサギが手を上げ、
                     ガンゾウが切り石を運んでくる。
  2. ダーマの船出    直した桟橋から手を振るスズハ・アサギ・ガンゾウの後ろ姿と、船の上の六人（舵輪のワタリ、ミナ・ピノ・
                     シオン・ベルク・ゴンタ）。左奥に、山の肩に神殿の立つダーマの島。
  3. ジパング        船が寄った桟橋。ピノが船から歩いてきて、イナホ・ジンベエが迎える。奥に実った田・食堂の湯気・山の上の社。
  4. 火山島          船が寄った桟橋。ベルクが船から歩いてきて、ナギ・カヤ・ロク・ヨモギが迎える。奥に火山、鍛冶場の火、
                     竹の丘の社。
  5. その先の海      晴れた朝の海。シオン・ミナ・ゴンタと舵輪のワタリ、シオンの背の職業の書の光を乗せた船が、右へ進む。
  6. 水平線          大きな空と海。陸の見えない水平線へ、書の光を乗せた小さな帆が進む。タイトル「ダーマ再興編・完」の後に
                     「職をつぐ者」「完」。

船はM4・M5・M7と同じもの（../../ch3-departure/src/props.py）。ジパングの小屋・食堂・社・田はM4、火山島はM5
（../../ch4-arrival/src/props5.py）、鍛冶場・社・鳥居はM7（../../ch5-return/src/props7.py）、再建した神殿は共通部品
（../../shared/temple.py）。次に探す書の種類・数と、次の行き先の土地は描かない（⑥の水平線に陸を置かない）。
座標は viewBox="0 0 1600 900"。乱数は場面ごとの固定シード。位置が動くアニメーションには .mv を付け、モーション軽減時に止める。
"""
import math
import os
import random

from helpers import n, lobes_union, SPARK
from figures import Cast, place
import props as P          # 船・小屋・食堂・社・田（../../ch3-departure/src/props.py）
import scenes as M4        # 空・海の部品と朝の色（../../ch3-departure/src/scenes.py）
import props5 as V         # 火山（../../ch4-arrival/src/props5.py）
import props7 as Q7        # 鍛冶場・家・社・鳥居・竹（../../ch5-return/src/props7.py）
import temple as T         # 再建した神殿（../../shared/temple.py）
import props14 as Q

HEAD = M4.HEAD
CAST = Cast(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts", "cast.json"))
morning = M4.morning
SUN_RIM = (("#fff3cf", 1.1, -.7, .9),)


def figure_set(specs, prefix, tone=morning, rims=SUN_RIM):
    """specs: (人物id, 向き, 腕, 場面の位置, 倍率, 胸から上だけか[, 手に持つ絵])。返り値は (defs, [描画])。"""
    defs, out = [], []
    for spec in specs:
        cid, direction, arms, at, scale, bust = spec[:6]
        extra = spec[6] if len(spec) > 6 else ""
        f = CAST.figure(cid, direction, f"{prefix}{cid}-{direction}-", arms=arms, legs=not bust, tone=tone, rims=rims, arms_over=True)
        defs.append(f.defs)
        out.append(place(f.rim, at, scale, f.foot) + place(f.body + extra, at, scale, f.foot))
    return "".join(defs), out


def crew_markup(specs, prefix, wave_cls, tone=morning, rims=(("#fff6dc", .9, -.6, .8),)):
    """船の上の人（船の座標。腰から下は舷側に隠れる）。返り値は (defs, 描画)。"""
    defs, out = figure_set([(cid, "front", arms, at, s, True) for cid, arms, at, s in specs], prefix, tone, rims)
    return defs, "".join(out).replace('class="wave"', f'class="{wave_cls}"')


SHIP_CSS = """
.{p}wave{{transform-box:fill-box;transform-origin:50% 50%}}
.is-active .{p}wave{{animation:{p}wave 1s ease-in-out infinite alternate}}
.is-active .{p}ship{{animation:{p}bob 2.6s ease-in-out infinite alternate}}
.is-active .{p}sh-flag{{animation:{p}flag .8s ease-in-out infinite alternate}}
.{p}sh-flag{{transform-box:fill-box;transform-origin:0% 50%}}
.is-active .{p}gl{{animation:{p}gl 1.9s ease-in-out infinite}}
.is-active .{p}wv{{animation:{p}wv 3s ease-in-out infinite alternate}}
.is-active .{p}cl{{animation:{p}drift 8s linear both}}
@keyframes {p}wave{{from{{transform:rotate(-14deg)}}to{{transform:rotate(10deg)}}}}
@keyframes {p}bob{{from{{transform:translateY(-3px) rotate(-.6deg)}}to{{transform:translateY(3px) rotate(.6deg)}}}}
@keyframes {p}flag{{from{{transform:skewY(-6deg) scaleX(.9)}}to{{transform:skewY(6deg)}}}}
@keyframes {p}gl{{0%,100%{{opacity:.2}}50%{{opacity:1}}}}
@keyframes {p}wv{{from{{transform:translateX(-12px)}}to{{transform:translateX(12px)}}}}
@keyframes {p}drift{{from{{transform:translateX(-36px)}}}}
"""


def ship_css(p):
    return SHIP_CSS.format(p=p)


# ---------------------------------------------------------------------------
# 場面1：再開した神殿
# ---------------------------------------------------------------------------
S1_CSS = """
.is-active .s1-come{animation:s1-come 5.4s cubic-bezier(.3,.6,.5,1) both}
.is-active .s1-carry{animation:s1-carry 4.6s cubic-bezier(.3,.6,.5,1) both}
.is-active .s1-step{animation:s1-step .5s ease-in-out infinite alternate}
.s1-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s1-wave{animation:s1-wave .9s ease-in-out infinite alternate}
.is-active .s1-cl{animation:s1-drift 8s linear both}
.is-active .s1-gull{animation:s1-gull 5.4s linear both}
.is-active .s1-glow{animation:s1-glow 2s ease-in-out infinite alternate}
@keyframes s1-come{from{transform:translateX(-170px)}to{transform:translateX(0)}}
@keyframes s1-carry{from{transform:translateX(320px)}to{transform:translateX(0)}}
@keyframes s1-step{from{transform:translateY(0)}to{transform:translateY(-5px)}}
@keyframes s1-wave{from{transform:rotate(-16deg)}to{transform:rotate(10deg)}}
@keyframes s1-drift{from{transform:translateX(-40px)}}
@keyframes s1-gull{from{transform:translate(0,0)}to{transform:translate(-220px,-30px)}}
@keyframes s1-glow{from{opacity:.45}to{opacity:.9}}
"""
S1_TEMPLE_AT, S1_TEMPLE_SCALE = (800, 800), 1.45


def s1_at(x, y):
    """再建した神殿の座標（プロローグの座標）を、場面1の座標へ。"""
    k = S1_TEMPLE_SCALE
    return (S1_TEMPLE_AT[0] + (x - 800) * k, S1_TEMPLE_AT[1] + (y - 592) * k)


def scene1():
    R = random.Random(1401)
    o = [HEAD.format(label="朝の再建した神殿。入口でスズハが訪れた人を迎え、大屋根の上でアサギが手を上げ、ガンゾウが切り石を運んでくる")]
    o.append(f"<style>{S1_CSS}</style>")
    f0 = CAST.figure("ganzou", "front", "s1-tmp-", arms=("front", "front"))
    (lx, ly), (rx, _) = f0.shoulders
    stone = Q.stone_block((lx + rx) / 2, ly + 21)
    people = [("suzuha", "front", ("front", "front"), s1_at(800, 516), 1.2, False),
              ("asagi", "front", ("down", "high"), s1_at(520, 236), 1.0, False),
              ("ganzou", "front", ("front", "front"), (1410, 858), 1.4, False, stone)]
    fdefs, figs = figure_set(people, "s1-")
    o.append("<defs>" + M4.sky_defs("s1-", "#6fb2e4", "#a8d5ef", "#f6ecd4", 520) + fdefs
             + '<radialGradient id="s1-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd77a" stop-opacity=".8"/>'
             '<stop offset="1" stop-color="#ffd77a" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s1-ground" x1="0" y1="780" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#d6c9aa"/><stop offset="1" stop-color="#bfae8a"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    o.append('<circle cx="1420" cy="120" r="300" fill="url(#s1-sunglow)"/>')
    o.append(M4.clouds(R, [(40, 70, 420, 22), (1040, 40, 460, 24)], cls="s1-cl mv"))
    o.append('<g class="s1-gull mv">' + P.gulls("", ((1180, 150, 1.0, 0), (1240, 120, .8, 0), (1280, 170, .9, 0))) + "</g>")
    o.append('<path d="M-20,780 L1620,780 L1620,900 L-20,900Z" fill="url(#s1-ground)"/>'
             '<path d="M-20,780 L1620,780" stroke="#a8946e" stroke-width="3"/>'
             + "".join(f'<path d="M-20,{y} L1620,{y}" stroke="#b09c78" stroke-width="2" opacity=".6"/>' for y in (812, 852)))
    # 再建した神殿（直った姿。入口の奥に授職の灯）
    o.append(T.place_remains(T.temple_rebuilt("s1-t-", R, T.REBUILT_DAY), S1_TEMPLE_AT, S1_TEMPLE_SCALE))
    gx, gy = s1_at(800, 474)
    o.append(f'<circle class="s1-glow" cx="{n(gx)}" cy="{n(gy)}" r="70" fill="url(#s1-warm)"/>')
    suzuha, asagi, ganzou = figs
    # 大屋根の上のアサギ（足元に葺き板と道具箱）
    ax, ay = s1_at(520, 236)
    o.append(f'<path d="M{n(ax + 40)},{n(ay - 4)} L{n(ax + 120)},{n(ay - 22)} L{n(ax + 124)},{n(ay - 10)} L{n(ax + 44)},{n(ay + 8)}Z" '
             f'fill="#a8744a" stroke="#3e3226" stroke-width="2.6"/>'
             f'<path d="M{n(ax - 96)},{n(ay)} L{n(ax - 54)},{n(ay)} L{n(ax - 54)},{n(ay - 22)} L{n(ax - 96)},{n(ay - 22)}Z" '
             f'fill="#7c5730" stroke="#3e3226" stroke-width="2.6"/>')
    o.append(asagi.replace('class="wave"', 'class="s1-wave"'))
    o.append(suzuha)
    # 訪れた人（後ろ姿。石段へ歩いていく）
    o.append('<g class="s1-come mv">'
             f'<g transform="translate(640 788) scale(.8)"><g class="s1-step mv">{Q.traveler("#6a7a5a", "#55644a", True)}</g></g>'
             f'<g transform="translate(730 796) scale(.76)"><g class="s1-step mv" style="animation-delay:-.25s">{Q.traveler("#7a5a6a", "#664a58", False, "#9a7a4a")}</g></g>'
             '</g>')
    # 切り石を運ぶガンゾウ（右から）
    o.append(f'<g class="s1-carry mv">{ganzou}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：ダーマの船出
# ---------------------------------------------------------------------------
S2_CSS = ship_css("s2-") + """
.is-active .s2-shipgo{animation:s2-go 5.6s cubic-bezier(.4,0,.8,1) both}
@keyframes s2-go{from{transform:translateX(-20px)}to{transform:translateX(150px)}}
"""
S2_SHIP_AT, S2_SHIP_SCALE = (1040, 664), 1.32
# 船の上の六人（船の座標）：舵輪のワタリは船尾楼、五人は甲板
S2_CREW = (("watari", ("helm", "helm"), (-176, -112), 1.0), ("mina", ("wave", "down"), (-90, -64), 1.0),
           ("pino", ("down", "wave"), (-36, -64), 1.0), ("hero2", ("down", "high"), (20, -64), 1.0),
           ("belk", ("hip", "wave"), (78, -64), 1.0), ("gonta", ("high", "hip"), (138, -64), 1.0))
# 桟橋で見送る三人（後ろ姿）
S2_BACKS = (("suzuha", ("down", "wave"), 150, 3.1), ("asagi", ("high", "down"), 380, 3.1), ("ganzou", ("down", "wave"), 600, 3.1))


def scene2():
    R = random.Random(1402)
    o = [HEAD.format(label="直した桟橋から手を振って見送るスズハ・アサギ・ガンゾウの後ろ姿。船の上で手を振るミナ・ピノ・シオン・ベルク・ゴンタと、"
                           "舵輪を握るワタリ。左奥に、山の肩に神殿の立つダーマの島")]
    o.append(f"<style>{S2_CSS}</style>")
    cdefs, crew = crew_markup(S2_CREW, "s2-c-", "s2-wave")
    bdefs, backs = figure_set([(cid, "back", arms, (x, 884), s, True) for cid, arms, x, s in S2_BACKS], "s2-b-",
                              rims=(("#fff3cf", 0, -1.1, .85),))
    o.append("<defs>" + M4.sky_defs("s2-", "#6fb0e2", "#acd7f0", "#f7eed8", 440) + M4.sea_defs("s2-", 430) + P.ship_defs("s2-sh-")
             + cdefs + bdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append(M4.clouds(R, [(700, 150, 420, 22), (1180, 100, 380, 20), (980, 300, 260, 14)], cls="s2-cl mv"))
    o.append(Q.dharma_isle("s2-t-", R))
    o.append('<rect x="0" y="430" width="1600" height="470" fill="url(#s2-sea)"/>')
    o.append(M4.glints(R, "s2-gl", 0, 1600, 440, 560, 34, "#ffffff"))
    o.append(f'<g class="s2-wv mv">{M4.waves(R, 0, 1600, 470, 760, 30, opacity=.5)}</g>')
    ship = P.ship_full("s2-sh-", crew=crew)
    sx, sy = S2_SHIP_AT
    o.append(f'<g class="s2-shipgo mv"><g class="s2-ship mv" style="transform-origin:{sx}px {sy}px">'
             f'<g transform="translate({sx} {sy}) scale({S2_SHIP_SCALE})">{ship}</g></g>'
             f'<path d="M{sx - 330},{sy + 18} Q{sx},{sy + 34} {sx + 360},{sy + 16}" fill="none" stroke="#1d4f78" stroke-width="16" opacity=".35"/></g>')
    o.append(f'<path d="M0,{sy + 8} L1600,{sy + 8} L1600,900 L0,900Z" fill="url(#s2-sea)" opacity=".5"/>')
    o.append(M4.waves(R, 0, 1600, sy + 20, 860, 22, opacity=.55))
    o.append(Q7.new_pier(846))
    for markup in backs:
        o.append(markup.replace('class="wave"', 'class="s2-wave"'))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：ジパング（ピノが降りる）
# ---------------------------------------------------------------------------
S3_CSS = ship_css("s3-") + """
.is-active .s3-walk{animation:s3-walk 3.2s cubic-bezier(.3,.6,.5,1) both}
.is-active .s3-step{animation:s3-step .4s ease-in-out 8 alternate}
.is-active .s3-smoke{animation:s3-smoke 3.6s linear infinite}
.s3-smoke{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s3-flagwave{animation:s3-flag .9s ease-in-out infinite alternate}
.s3-flagwave{transform-box:fill-box;transform-origin:0% 50%}
@keyframes s3-walk{from{transform:translateX(-300px)}to{transform:translateX(0)}}
@keyframes s3-step{from{transform:translateY(0)}to{transform:translateY(-8px)}}
@keyframes s3-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.8}100%{transform:translate(18px,-80px) scale(1.6);opacity:0}}
"""
S3_FEET, S3_SCALE = 836, 2.7
S3_PEOPLE = (("pino", ("down", "wave"), 560), ("inaho", ("front", "wave"), 830), ("jinbei", ("down", "down"), 1080))


def scene3():
    R = random.Random(1403)
    o = [HEAD.format(label="ジパングの桟橋に船が寄る。ピノが船から歩いてきて、イナホ・ジンベエが迎える。奥に実った田、食堂の湯気、山の上の社")]
    o.append(f"<style>{S3_CSS}</style>")
    fdefs, figs = figure_set([(cid, "front", arms, (x, S3_FEET), S3_SCALE, False) for cid, arms, x in S3_PEOPLE], "s3-")
    pier_defs, pier = Q.pier("s3-", 572, 560, 1040, 60, 1540)
    o.append("<defs>" + M4.sky_defs("s3-", "#78b8e6", "#b4dbf1", "#f8efd8", 560) + M4.sea_defs("s3-", 556, 900) + P.ship_defs("s3-sh-")
             + pier_defs
             + '<radialGradient id="s3-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5b4630" stop-opacity=".45"/>'
             '<stop offset="1" stop-color="#5b4630" stop-opacity="0"/></radialGradient>' + fdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append('<circle cx="1360" cy="110" r="320" fill="url(#s3-sunglow)"/>')
    o.append(M4.clouds(R, [(60, 120, 480, 26), (980, 90, 520, 28)], cls="s3-cl mv"))
    # 山と社（遠景）、左の丘の実った田
    o.append('<path d="M700,560 C820,470 920,330 1010,250 C1040,226 1070,214 1100,214 C1140,222 1180,262 1230,320 C1300,400 1400,470 1600,520 L1600,560Z" '
             'fill="#8dbba0" stroke="#4f7a5e" stroke-width="2"/>')
    o.append(f'<g transform="translate(1100 236)">{P.shrine(.5)}</g>')
    o.append('<path d="M-20,560 C80,470 220,420 380,416 C520,414 660,460 800,540 L800,560Z" fill="#9ccaa0" stroke="#4f7a5e" stroke-width="2"/>')
    for x, y, w, tilt in ((120, 470, 150, -14), (290, 444, 150, -4), (110, 506, 170, -10), (300, 482, 170, -2), (470, 470, 140, 10)):
        o.append(P.paddy(x, y, w, 26, tilt, ripe=1.0))
    o.append(f'<g transform="translate(250 450)">{P.scarecrow(.9)}</g>')
    # 村：小屋・食堂（湯気）・のぼり旗・木
    for x, y, s in [(700, 528, .8), (1250, 524, .85)]:
        o.append(f'<g transform="translate({x} {y})">{P.hut(s=s)}</g>')
    o.append(f'<g transform="translate(1440 530)">{P.kitchen("s3-", s=.9)}</g>')
    o.append(P.smoke("s3-smoke mv", 1488, 404, 1.2))
    o.append(f'<g transform="translate(1340 534)">{P.banner("s3-", 90, "#c23b2a", 1.0)}</g>')
    for x, y in [(860, 500), (1170, 500), (1560, 500)]:
        o.append(P.round_tree(R, x, y, 30))
    # 浜と海、船着き場に寄った船
    o.append('<path d="M-20,548 C400,536 1200,536 1620,546 L1620,574 L-20,574Z" fill="#efdcab"/>')
    o.append('<rect x="0" y="566" width="1600" height="334" fill="url(#s3-sea)"/>')
    o.append(M4.glints(R, "s3-gl", 0, 1600, 580, 690, 30, "#ffffff"))
    o.append(f'<g class="s3-wv mv">{M4.waves(R, 0, 1600, 600, 890, 28, opacity=.45)}</g>')
    o.append(f'<g class="s3-ship mv" style="transform-origin:400px 610px"><g transform="translate(400 610) scale(.5)">'
             f'{P.ship_full("s3-sh-", crew=P.tiny_crew())}</g></g>')
    # 桟橋と三人
    o.append(pier)
    pino, inaho, jinbei = [m.replace('class="wave"', 'class="s3-wave"') for m in figs]
    for cid, arms, x in S3_PEOPLE[1:]:
        o.append(f'<ellipse cx="{x}" cy="{S3_FEET + 4}" rx="86" ry="15" fill="url(#s3-shadow)"/>')
    o.append(inaho + jinbei)
    o.append(f'<g class="s3-walk mv"><g class="s3-step mv">'
             f'<ellipse cx="{S3_PEOPLE[0][2]}" cy="{S3_FEET + 4}" rx="86" ry="15" fill="url(#s3-shadow)"/>'
             f'{pino}</g></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面4：火山島（ベルクが降りる）
# ---------------------------------------------------------------------------
S4_CSS = ship_css("s4-") + """
.is-active .s4-walk{animation:s4-walk 3.2s cubic-bezier(.3,.6,.5,1) both}
.is-active .s4-step{animation:s4-step .4s ease-in-out 8 alternate}
.is-active .s4-smoke{animation:s4-smoke 3.9s linear infinite}
.s4-smoke{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s4-fire{animation:s4-fire .9s ease-in-out infinite alternate}
.is-active .s4-puff{animation:s4-puff 3s ease-in-out infinite alternate}
.s4-puff{transform-box:fill-box;transform-origin:50% 50%}
@keyframes s4-walk{from{transform:translateX(-300px)}to{transform:translateX(0)}}
@keyframes s4-step{from{transform:translateY(0)}to{transform:translateY(-7px)}}
@keyframes s4-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.75}100%{transform:translate(20px,-80px) scale(1.6);opacity:0}}
@keyframes s4-fire{from{opacity:.6}to{opacity:1}}
@keyframes s4-puff{from{transform:scale(.97)}to{transform:scale(1.04)}}
"""
S4_FEET, S4_SCALE = 850, 2.1
S4_PEOPLE = (("belk", ("hip", "wave"), 380), ("nagi", ("front", "front"), 620), ("kaya", ("down", "wave"), 850),
             ("roku", ("hip", "hip"), 1080), ("yomogi", ("front", "down"), 1310))


def scene4():
    R = random.Random(1404)
    o = [HEAD.format(label="火山島の桟橋に船が寄る。ベルクが船から歩いてきて、ナギ・カヤ・ロク・ヨモギが迎える。奥に火山、鍛冶場の火、竹の丘の社")]
    o.append(f"<style>{S4_CSS}</style>")
    fdefs, figs = figure_set([(cid, "front", arms, (x, S4_FEET), S4_SCALE, False) for cid, arms, x in S4_PEOPLE], "s4-")
    pier_defs, pier = Q.pier("s4-", 574, 540, 1060, 20, 1580)
    o.append("<defs>" + M4.sky_defs("s4-", "#6fb0e2", "#acd7f0", "#f6ecd4", 520) + M4.sea_defs("s4-", 562, 900) + V.volcano_defs("s4-v-")
             + P.ship_defs("s4-sh-") + pier_defs
             + '<radialGradient id="s4-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3b2a1c" stop-opacity=".4"/>'
             '<stop offset="1" stop-color="#3b2a1c" stop-opacity="0"/></radialGradient>' + fdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append(M4.clouds(R, [(60, 120, 420, 22), (1020, 90, 420, 22)], cls="s4-cl mv"))
    o.append(f'<g class="s4-plume mv">{V.plume(R, "s4-puff mv", 760, 200, 120, 70, dark="#9a948f", light="#e6e2dc", lean=-.5, puffs=9)}</g>')
    o.append(V.volcano("s4-v-", R, 760, 540, 1060, 340, ridge_color="#7d767a", lava=False))
    # 右の竹の丘と社（鳥居と小さな社）
    o.append('<path d="M1100,546 C1220,486 1400,466 1620,478 L1620,560 L1100,560Z" fill="#6fa35a"/>')
    for x in range(1190, 1600, 48):
        base = 526 - (x - 1190) * .1
        o.append(f'<path d="M{x},{n(base)} l3,-74 M{x + 16},{n(base - 2)} l2,-62" stroke="#3f6e3a" stroke-width="7" stroke-linecap="round"/>')
    o.append(Q7.hokora(1450, 492, .55) + Q7.torii(1350, 510, 70, 62))
    # 町並みと鍛冶場（火と煙）
    o.append('<path d="M-20,528 C300,520 1200,520 1620,530 L1620,552 L-20,552Z" fill="#8f7c5e"/>')
    for x, w, roof in ((90, 120, "#4f5a66"), (250, 110, "#6a4f3a"), (1000, 110, "#4f5a66"), (1160, 100, "#6a4f3a")):
        o.append(Q7.town_house(x, 538, w, 64, roof=roof, s=.75))
    o.append(Q7.forge("s4-", 500, 540, .95, fire_cls="s4-fire", smoke_cls="s4-smoke mv"))
    # 黒い浜と海、船着き場に寄った船
    o.append('<path d="M-20,546 C400,540 1200,540 1620,546 L1620,566 L-20,566Z" fill="#4a4442"/>')
    o.append('<rect x="0" y="562" width="1600" height="338" fill="url(#s4-sea)"/>')
    o.append(M4.glints(R, "s4-gl", 0, 1600, 572, 700, 26, "#ffffff"))
    o.append(f'<g class="s4-wv mv">{M4.waves(R, 0, 1600, 590, 890, 26, opacity=.45)}</g>')
    o.append(f'<g class="s4-ship mv" style="transform-origin:250px 600px"><g transform="translate(250 600) scale(.46)">'
             f'{P.ship_full("s4-sh-", crew=P.tiny_crew())}</g></g>')
    o.append(pier)
    figs = [m.replace('class="wave"', 'class="s4-wave"') for m in figs]
    belk = figs[0]
    for cid, arms, x in S4_PEOPLE[1:]:
        o.append(f'<ellipse cx="{x}" cy="{S4_FEET + 4}" rx="76" ry="13" fill="url(#s4-shadow)"/>')
    o.append("".join(figs[1:]))
    o.append(f'<g class="s4-walk mv"><g class="s4-step mv">'
             f'<ellipse cx="{S4_PEOPLE[0][2]}" cy="{S4_FEET + 4}" rx="76" ry="13" fill="url(#s4-shadow)"/>'
             f'{belk}</g></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面5：その先の海
# ---------------------------------------------------------------------------
S5_CSS = ship_css("s5-") + """
.is-active .s5-shipgo{animation:s5-go 6.8s cubic-bezier(.35,0,.65,1) both}
.s5-bk{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s5-bk{animation:s5-bk 1.6s ease-in-out infinite alternate}
.is-active .s5-spark{animation:s5-spark 1.2s ease-in-out infinite alternate}
.s5-spark{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s5-gull{animation:s5-gull 6.8s linear both}
@keyframes s5-go{from{transform:translateX(-120px)}to{transform:translateX(120px)}}
@keyframes s5-bk{from{opacity:.55;transform:scale(.9)}to{opacity:1;transform:scale(1.1)}}
@keyframes s5-spark{from{opacity:.4;transform:scale(.7) rotate(0)}to{opacity:1;transform:scale(1.15) rotate(20deg)}}
@keyframes s5-gull{from{transform:translate(0,0)}to{transform:translate(260px,-40px)}}
"""
S5_SHIP_AT, S5_SHIP_SCALE = (820, 690), 1.36
S5_CREW = (("watari", ("helm", "helm"), (-176, -112), 1.0), ("mina", ("wave", "down"), (-66, -64), 1.0),
           ("hero2", ("down", "high"), (40, -64), 1.0), ("gonta", ("high", "hip"), (146, -64), 1.0))
S5_BOOK = (60, -118)       # シオンの背の職業の書の光（船の座標。人物より奥に置き、肩の後ろからのぞかせる）


def scene5():
    R = random.Random(1405)
    o = [HEAD.format(label="晴れた朝の海。シオン・ミナ・ゴンタと舵輪のワタリ、シオンの背の職業の書の光を乗せた船が、陸の見えない海を右へ進む")]
    o.append(f"<style>{S5_CSS}</style>")
    cdefs, crew = crew_markup(S5_CREW, "s5-c-", "s5-wave")
    bx, by = S5_BOOK
    crew = f'<g transform="translate({bx} {by})">{Q.book_light("s5-bk mv", "s5-spark mv")}</g>' + crew
    o.append("<defs>" + M4.sky_defs("s5-", "#5aa4dc", "#a6d4ef", "#f8f0dc", 450) + M4.sea_defs("s5-", 440, 900, "#94c8e2", "#2a6fa5")
             + P.ship_defs("s5-sh-") + cdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s5-sky)"/>')
    o.append('<circle cx="1420" cy="170" r="320" fill="url(#s5-sunglow)"/><circle cx="1420" cy="170" r="54" fill="#fffbea"/>')
    o.append(M4.clouds(R, [(60, 150, 440, 24), (720, 90, 380, 20), (240, 320, 300, 16)], cls="s5-cl mv"))
    o.append('<g class="s5-gull mv">' + P.gulls("", ((420, 230, 1.0, 0), (480, 200, .8, 0), (530, 250, .9, 0))) + "</g>")
    o.append('<rect x="0" y="440" width="1600" height="460" fill="url(#s5-sea)"/>'
             '<path d="M1160,441 L1680,441" stroke="#fff6d8" stroke-width="3" opacity=".7"/>')
    o.append(M4.glints(R, "s5-gl", 900, 1600, 448, 640, 46, "#fff8de"))
    o.append(f'<g class="s5-wv mv">{M4.waves(R, 0, 1600, 470, 780, 32, opacity=.5)}</g>')
    ship = P.ship_full("s5-sh-", crew=crew)
    sx, sy = S5_SHIP_AT
    o.append(f'<g class="s5-shipgo mv"><g class="s5-ship mv" style="transform-origin:{sx}px {sy}px">'
             f'<g transform="translate({sx} {sy}) scale({S5_SHIP_SCALE})">{ship}</g></g>'
             f'<path d="M{sx - 340},{sy + 18} Q{sx},{sy + 34} {sx + 370},{sy + 16}" fill="none" stroke="#1d4f78" stroke-width="16" opacity=".35"/>'
             f'<path d="M{sx - 560},{sy + 22} Q{sx - 440},{sy + 12} {sx - 330},{sy + 18}" fill="none" stroke="#f2f8ff" stroke-width="5" opacity=".7" stroke-linecap="round"/></g>')
    o.append(f'<path d="M0,{sy + 8} L1600,{sy + 8} L1600,900 L0,900Z" fill="url(#s5-sea)" opacity=".5"/>')
    o.append(M4.waves(R, 0, 1600, sy + 20, 880, 22, opacity=.55))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面6：水平線（タイトル）
# ---------------------------------------------------------------------------
S6_CSS = """
.is-active .s6-ship{animation:s6-ship 8s cubic-bezier(.3,0,.7,1) both}
.s6-glint{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s6-glint{animation:s6-glint 2.2s ease-in-out infinite}
.is-active .s6-gl{animation:s6-gl 2s ease-in-out infinite}
.is-active .s6-cl-a{animation:s6-drift 8s linear both}
.is-active .s6-cl-b{animation:s6-drift2 8s linear both}
.is-active .s6-rays{animation:s6-rays 8s linear both}
@keyframes s6-ship{from{transform:translateX(-80px)}to{transform:translateX(90px)}}
@keyframes s6-glint{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
@keyframes s6-gl{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes s6-drift{from{transform:translateX(-40px)}}
@keyframes s6-drift2{from{transform:translateX(30px)}}
@keyframes s6-rays{from{transform:rotate(-4deg)}to{transform:none}}
"""
S6_HORIZON = 600


def scene6():
    R = random.Random(1406)
    o = [HEAD.format(label="大きな空と海。陸の見えない水平線へ、書の光を乗せた小さな帆の船が進む")]
    o.append(f"<style>{S6_CSS}</style>")
    hz = S6_HORIZON
    o.append("<defs>" + M4.sky_defs("s6-", "#4f97d4", "#9ccdee", "#fdf0d2", hz) +
             '<radialGradient id="s6-cumulus" cx=".5" cy=".3" r=".75"><stop offset=".55" stop-color="#ffffff"/>'
             '<stop offset="1" stop-color="#d6e6f2"/></radialGradient>' + M4.sea_defs("s6-", hz, 900, "#9ccbe2", "#2a6fa5") +
             '<linearGradient id="s6-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="0"/>'
             '<stop offset="1" stop-color="#fff6d8" stop-opacity=".5"/></linearGradient>'
             f'<clipPath id="s6-sky-clip"><rect width="1600" height="{hz + 1}"/></clipPath></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s6-sky)"/>')
    sun = (1220, hz - 150)
    rays = " ".join(f"M{sun[0]},{sun[1]} L{n(sun[0] + math.cos(a - .03) * 1300)},{n(sun[1] + math.sin(a - .03) * 1300)} "
                    f"L{n(sun[0] + math.cos(a + .03) * 1300)},{n(sun[1] + math.sin(a + .03) * 1300)}Z"
                    for a in [math.radians(d) for d in range(-172, -8, 14)])
    o.append(f'<g clip-path="url(#s6-sky-clip)"><g class="s6-rays mv" style="transform-origin:{sun[0]}px {sun[1]}px">'
             f'<path d="{rays}" fill="url(#s6-ray)" opacity=".3"/></g></g>')
    o.append(f'<circle cx="{sun[0]}" cy="{sun[1]}" r="420" fill="url(#s6-sunglow)"/><circle cx="{sun[0]}" cy="{sun[1]}" r="62" fill="#fffbea"/>')
    big = [(220, 500, 90), (310, 460, 110), (430, 485, 92), (520, 510, 70), (150, 535, 60), (380, 535, 80)]
    o.append('<g class="s6-cl-a mv">' + lobes_union(big, "#c6dcec", 6, "url(#s6-cumulus)") + "</g>")
    o.append('<g class="s6-cl-b mv">' + M4.clouds(R, [(1110, 470, 360, 18), (-40, 300, 300, 18)]) + "</g>")
    # 海（水平線に陸を置かない）
    o.append(f'<rect x="0" y="{hz}" width="1600" height="{900 - hz}" fill="url(#s6-sea)"/>'
             f'<path d="M{sun[0] - 280},{hz + 2} L{sun[0] + 280},{hz + 2}" stroke="#fff6d8" stroke-width="3" opacity=".8"/>')
    o.append(M4.glints(R, "s6-gl", sun[0] - 400, sun[0] + 380, hz + 8, 840, 70, "#fff8de", (8, 22)))
    o.append(M4.waves(R, 0, 1600, hz + 24, 890, 30, opacity=.45))
    # 小さな船（右の水平線へ）と、背に負う書の光
    o.append('<g class="s6-ship mv">'
             f'<path d="M880,{hz + 36} Q940,{hz + 42} 1000,{hz + 34}" fill="none" stroke="#f2f8ff" stroke-width="3" opacity=".8" stroke-linecap="round"/>'
             f'<g transform="translate(1020 {hz + 34}) scale(.15)">{P.ship_silhouette("#3d4a5e", "#fbf6e8")}</g>'
             f'<g transform="translate(1023 {hz + 2})"><path class="s6-glint" d="{SPARK}" fill="#ffe7a0" transform="scale(.9)"/></g></g>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3, scene4, scene5, scene6]
