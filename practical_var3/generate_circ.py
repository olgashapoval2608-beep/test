#!/usr/bin/env python3
"""Генератор схеми avtomat_var3.circ для Logisim Evolution 5.0.0.

Курсова «Синтез цифрового автомата з жорсткою логікою», варіант 3.
Автомат Мілі, 4 стани, T-тригери, базис 2АБО-НІ (21 елемент NOR з 2 входами).

Геометрія портів виміряна в Logisim Evolution 5.0.0 (tools/probe_test.circ + tools/Probe.java):
  NOR Gate (size 50, facing east): вихід (0,0), входи (-60,-20) та (-60,+20)
  T Flip-Flop (appearance logisim_evolution), loc=(x,y):
      T (x-10,y+10), C (x-10,y+50), Q (x+50,y+10), nQ (x+50,y+50), R (x+20,y+60), S (x+20,y)

Запуск:  python3 generate_circ.py  ->  avtomat_var3.circ поруч зі скриптом.
Скрипт сам перевіряє, що проводи різних кіл ніде не торкаються.
"""
from collections import defaultdict
from pathlib import Path
from xml.sax.saxutils import quoteattr

OUT = Path(__file__).with_name("avtomat_var3.circ")

# ---------------------------------------------------------------- розмітка
# Вертикальна шина зліва: x1, nx1, x2, nx2, Q1, nQ1, Q2, nQ2
BUS_ORDER = ["x1", "nx1", "x2", "nx2", "Q1", "nQ1", "Q2", "nQ2"]
BUS_X = {n: 100 + 20 * i for i, n in enumerate(BUS_ORDER)}
# Рівень (y) верхньої горизонталі, якою сигнал приходить на свою лінію шини.
# Зворотні зв'язки Q/nQ – найвище.
TOP_Y = {"Q1": 40, "nQ1": 60, "Q2": 80, "nQ2": 100,
         "nx1": 120, "nx2": 140, "x1": 160, "x2": 180}

C1, C2, C3, C4 = 400, 520, 640, 760   # x виходів елементів у колонках 1..4
IN_DX = 60                             # вхід NOR лежить на 60 лівіше від виходу

B_INV, B_T1, B_T2, B_Y1, B_Y2 = 220, 400, 600, 800, 980   # верх смуг
FF_X = 910                             # x тригерів
PIN_OUT_X = 1200                       # x вихідних пінів
CLK_X, RST_X = 870, 890                # вертикалі C і R біля тригерів
FB_X = {"Q1": 1000, "nQ1": 1020, "Q2": 1040, "nQ2": 1060}  # вертикалі зворотних зв'язків

gates = []      # (label, out_xy, in1_net, in2_net, out_net)
ffs = []        # (label, loc, T_net, Q_net, nQ_net)
pins = []       # (label, loc, is_output, facing, net)
texts = []      # (loc, text)
nets = defaultdict(list)   # net -> list of polylines


def wire(net, *pts):
    nets[net].append(list(pts))


def nor(label, x, y, a, b, out):
    """NOR з виходом у (x,y); входи (x-60,y-20) і (x-60,y+20)."""
    gates.append((label, (x, y), a, b, out))
    return (x - IN_DX, y - 20), (x - IN_DX, y + 20)


def tap(net, pt):
    """Горизонтальний відвід з лінії шини net до входу pt."""
    wire(net, (BUS_X[net], pt[1]), pt)


# ---------------------------------------------------------------- вхідні піни
pins.append(("x1", (40, TOP_Y["x1"]), False, "east", "x1"))
pins.append(("x2", (40, TOP_Y["x2"]), False, "east", "x2"))
wire("x1", (40, TOP_Y["x1"]), (BUS_X["x1"], TOP_Y["x1"]))
wire("x2", (40, TOP_Y["x2"]), (BUS_X["x2"], TOP_Y["x2"]))

# ---------------------------------------------------------------- інвертори входів
B = B_INV
i1, i2 = nor("DD1.1", C1, B + 20, "x1", "x1", "nx1"); tap("x1", i1); tap("x1", i2)
i1, i2 = nor("DD1.2", C1, B + 100, "x2", "x2", "nx2"); tap("x2", i1); tap("x2", i2)
wire("nx1", (C1, B + 20), (420, B + 20), (420, TOP_Y["nx1"]), (BUS_X["nx1"], TOP_Y["nx1"]))
wire("nx2", (C1, B + 100), (440, B + 100), (440, TOP_Y["nx2"]), (BUS_X["nx2"], TOP_Y["nx2"]))


# ---------------------------------------------------------------- смуги T1 і T2 (однакова форма)
def t_band(B, g, src, out):
    """g – 5 позначень; src – (p1a,p1b,p2a,p2b,p3a); out – (n1,n2,n3,n4,T)."""
    n1, n2, n3, n4, nt = out
    s1a, s1b, s2a, s2b, s3a = src
    i1, i2 = nor(g[0], C1, B + 20, s1a, s1b, n1); tap(s1a, i1); tap(s1b, i2)
    i1, i2 = nor(g[1], C1, B + 100, s2a, s2b, n2); tap(s2a, i1); tap(s2b, i2)
    i1, i2 = nor(g[2], C2, B + 40, n1, s3a, n3); tap(s3a, i2)
    wire(n1, (C1, B + 20), i1)
    i1, i2 = nor(g[3], C3, B + 40, n3, n3, n4)
    wire(n3, (C2, B + 40), (550, B + 40))
    wire(n3, (550, i1[1]), (550, i2[1]))
    wire(n3, (550, i1[1]), i1)
    wire(n3, (550, i2[1]), i2)
    i1, i2 = nor(g[4], C4, B + 60, n4, n2, nt)
    wire(n4, (C3, B + 40), i1)
    wire(n2, (C1, B + 100), (670, B + 100), (670, i2[1]), i2)


# T1 = NOR(a4, a2); a1=NOR(Q1,x1), a2=NOR(nQ1,nQ2), a3=NOR(x2,a1), a4=NOR(a3,a3)
# Увага: у DD2.1 перший вхід x2, другий a1 – у списку з'єднань; тут a1 подано на верхній вхід,
# x2 – на нижній. NOR комутативний, тож логіка та з'єднання ідентичні.
t_band(B_T1, ["DD1.3", "DD1.4", "DD2.1", "DD2.2", "DD2.3"],
       ("Q1", "x1", "nQ1", "nQ2", "x2"), ("a1", "a2", "a3", "a4", "T1"))
# T2 = NOR(b4, b2); b1=NOR(Q2,x2), b2=NOR(nQ2,nx2), b3=NOR(x1,b1), b4=NOR(b3,b3)
t_band(B_T2, ["DD2.4", "DD3.1", "DD3.2", "DD3.3", "DD3.4"],
       ("Q2", "x2", "nQ2", "nx2", "x1"), ("b1", "b2", "b3", "b4", "T2"))

# ---------------------------------------------------------------- смуга y1
B = B_Y1
i1, i2 = nor("DD4.1", C1, B + 20, "Q2", "x1", "c1"); tap("Q2", i1); tap("x1", i2)
i1, i2 = nor("DD4.2", C1, B + 100, "Q1", "x2", "c2"); tap("Q1", i1); tap("x2", i2)
i1, i2 = nor("DD4.3", C2, B + 60, "c1", "c2", "y1")
wire("c1", (C1, B + 20), (430, B + 20), (430, i1[1]), i1)
wire("c2", (C1, B + 100), (440, B + 100), (440, i2[1]), i2)
wire("y1", (C2, B + 60), (PIN_OUT_X, B + 60))
pins.append(("y1", (PIN_OUT_X, B + 60), True, "west", "y1"))

# ---------------------------------------------------------------- смуга y2
B = B_Y2
i1, i2 = nor("DD4.4", C1, B + 20, "x1", "nx2", "d1"); tap("x1", i1); tap("nx2", i2)
i1, i2 = nor("DD5.1", C1, B + 100, "nx1", "x2", "d2"); tap("nx1", i1); tap("x2", i2)
i1, i2 = nor("DD5.2", C1, B + 180, "Q1", "Q2", "d3"); tap("Q1", i1); tap("Q2", i2)
i1, i2 = nor("DD5.3", C2, B + 60, "d1", "d2", "d4")
wire("d1", (C1, B + 20), (430, B + 20), (430, i1[1]), i1)
wire("d2", (C1, B + 100), (440, B + 100), (440, i2[1]), i2)
i1, i2 = nor("DD5.4", C3, B + 60, "d4", "d4", "d5")
wire("d4", (C2, B + 60), (550, B + 60))
wire("d4", (550, i1[1]), (550, i2[1]))
wire("d4", (550, i1[1]), i1)
wire("d4", (550, i2[1]), i2)
i1, i2 = nor("DD6.1", C4, B + 80, "d5", "d3", "y2")
wire("d5", (C3, B + 60), i1)
wire("d3", (C1, B + 180), (670, B + 180), (670, i2[1]), i2)
wire("y2", (C4, B + 80), (PIN_OUT_X, B + 80))
pins.append(("y2", (PIN_OUT_X, B + 80), True, "west", "y2"))


# ---------------------------------------------------------------- тригери і зворотні зв'язки
def ff_block(label, B, tnet, q, nq):
    fy = B + 50                       # T-вхід (fy+10) на рівні виходу Tn (B+60)
    ffs.append((label, (FF_X, fy), tnet, q, nq))
    t_in, c_in = (FF_X - 10, fy + 10), (FF_X - 10, fy + 50)
    q_out, nq_out = (FF_X + 50, fy + 10), (FF_X + 50, fy + 50)
    r_in = (FF_X + 20, fy + 60)
    # T: з виходу DD2.3/DD3.4 на тригер + відгалуження на контрольний пін
    wire(tnet, (C4, t_in[1]), t_in)
    wire(tnet, (800, t_in[1]), (800, B + 20), (PIN_OUT_X, B + 20))
    pins.append((tnet, (PIN_OUT_X, B + 20), True, "west", tnet))
    # C і R
    wire("C", c_in, (CLK_X, c_in[1]))
    wire("R", r_in, (r_in[0], r_in[1] + 20), (RST_X, r_in[1] + 20))
    # Q: на контрольний пін і вгору на шину
    wire(q, q_out, (PIN_OUT_X, q_out[1]))
    pins.append((q, (PIN_OUT_X, q_out[1]), True, "west", q))
    wire(q, (FB_X[q], q_out[1]), (FB_X[q], TOP_Y[q]), (BUS_X[q], TOP_Y[q]))
    # nQ: вгору на шину
    wire(nq, nq_out, (FB_X[nq], nq_out[1]), (FB_X[nq], TOP_Y[nq]), (BUS_X[nq], TOP_Y[nq]))
    return c_in[1], r_in[1] + 20


c7, r7 = ff_block("DD7", B_T1, "T1", "Q1", "nQ1")
c8, r8 = ff_block("DD8", B_T2, "T2", "Q2", "nQ2")

# спільні C і R: вертикалі донизу до вхідних пінів
CP_Y, RP_Y = 1240, 1280
wire("C", (CLK_X, c7), (CLK_X, CP_Y), (820, CP_Y))
wire("R", (RST_X, r7), (RST_X, RP_Y), (820, RP_Y))
pins.append(("C", (820, CP_Y), False, "east", "C"))
pins.append(("R", (820, RP_Y), False, "east", "R"))

# ---------------------------------------------------------------- лінії шини (вертикалі)
# Кожна лінія йде від свого верхнього рівня до найнижчого відводу.
for net in BUS_ORDER:
    ys = [TOP_Y[net]]
    for poly in nets[net]:
        for (x, y) in poly:
            if x == BUS_X[net]:
                ys.append(y)
    wire(net, (BUS_X[net], min(ys)), (BUS_X[net], max(ys)))
    texts.append(((BUS_X[net], 26 - 18 * (BUS_ORDER.index(net) % 2)), net))  # підписи в шаховому порядку

# підписи смуг (лише текст, не елементи схеми)
for y, t in [(B_INV - 25, "інвертори входів"), (B_T1 - 25, "T1"), (B_T2 - 25, "T2"),
             (B_Y1 - 25, "y1"), (B_Y2 - 25, "y2")]:
    texts.append(((C1 - 30, y), t))

# ================================================================ перевірка геометрії


def segments_of(net):
    segs = []
    for poly in nets[net]:
        for p, q in zip(poly, poly[1:]):
            if p == q:
                continue
            assert p[0] == q[0] or p[1] == q[1], f"діагональ у колі {net}: {p}-{q}"
            segs.append((p, q))
    return segs


def on_seg(pt, seg, interior=False):
    (x1, y1), (x2, y2) = seg
    x, y = pt
    if x1 == x2 == x:
        lo, hi = sorted((y1, y2))
        return lo < y < hi if interior else lo <= y <= hi
    if y1 == y2 == y:
        lo, hi = sorted((x1, x2))
        return lo < x < hi if interior else lo <= x <= hi
    return False


# порти компонентів за колами
port_pts = defaultdict(list)          # net -> [points]
all_ports = []                        # (point, net)
for label, (x, y), a, b, out in gates:
    for pt, n in [((x, y), out), ((x - IN_DX, y - 20), a), ((x - IN_DX, y + 20), b)]:
        port_pts[n].append(pt); all_ports.append((pt, n))
for label, (x, y), t, q, nq in ffs:
    for pt, n in [((x - 10, y + 10), t), ((x - 10, y + 50), "C"), ((x + 50, y + 10), q),
                  ((x + 50, y + 50), nq), ((x + 20, y + 60), "R"), ((x + 20, y), f"{label}.S(вільний)")]:
        port_pts[n].append(pt); all_ports.append((pt, n))
for label, pt, is_out, facing, n in pins:
    port_pts[n].append(pt); all_ports.append((pt, n))

# 1) розбиття проводів у точках з'єднання всередині кола
final_segs = {}
for net in nets:
    segs = segments_of(net)
    cuts = {p for s in segs for p in s} | set(port_pts[net])
    out = []
    for s in segs:
        pts = sorted({s[0], s[1]} | {c for c in cuts if on_seg(c, s, interior=True)})
        out += list(zip(pts, pts[1:]))
    final_segs[net] = sorted(set(tuple(sorted(s)) for s in out))

# 2) кожен порт підключений до проводу свого кола
for pt, n in all_ports:
    if n.endswith("(вільний)"):
        continue
    assert any(pt in s for s in final_segs.get(n, [])), f"порт {pt} кола {n} не підключено"

# 3) жодної точки дотику між різними колами
errors = []
for na, sa in final_segs.items():
    pts_a = {p for s in sa for p in s}
    for pt, n in all_ports:
        if n != na:
            for s in sa:
                if on_seg(pt, s):
                    errors.append(f"порт {n}@{pt} лежить на проводі {na} {s}")
    for nb, sb in final_segs.items():
        if nb <= na:
            continue
        pts_b = {p for s in sb for p in s}
        for p in pts_a:
            for s in sb:
                if on_seg(p, s):
                    errors.append(f"{na}@{p} торкається {nb} {s}")
        for p in pts_b:
            for s in sa:
                if on_seg(p, s):
                    errors.append(f"{nb}@{p} торкається {na} {s}")
# 4) зв'язність кожного кола (усі сегменти й порти – одна компонента)
for net, segs in final_segs.items():
    parent = {}

    def f(p):
        parent.setdefault(p, p)
        while parent[p] != p:
            parent[p] = parent[parent[p]]; p = parent[p]
        return p
    for a, b in segs:
        parent[f(a)] = f(b)
    roots = {f(p) for s in segs for p in s}
    if len(roots) != 1:
        errors.append(f"коло {net} розірване на {len(roots)} частини")
assert not errors, "\n".join(errors)

# ================================================================ запис .circ


def hdl_label(label):
    """Logisim Evolution 5 приймає лише мітки виду [A-Za-z][A-Za-z0-9_]*,
    тому DD1.1 записується як DD1_1 (інакше програма сама додасть хеш: DD1_1_06610899)."""
    return label.replace(".", "_")


def a(name, val):
    return f'      <a name="{name}" val={quoteattr(str(val))}/>\n'


xml = ['<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n',
       '<project source="5.0.0" version="1.0">\n',
       '  This file is intended to be loaded by Logisim-evolution v5.0.0(https://github.com/logisim-evolution/).\n\n',
       '  <lib desc="#Wiring" name="0"/>\n',
       '  <lib desc="#Gates" name="1"/>\n',
       '  <lib desc="#Memory" name="4"/>\n',
       '  <lib desc="#Base" name="8"/>\n',
       '  <options>\n    <a name="gateUndefined" val="ignore"/>\n    <a name="simlimit" val="1000"/>\n'
       '    <a name="simrand" val="0"/>\n  </options>\n',
       '  <main name="avtomat_var3"/>\n',
       '  <circuit name="avtomat_var3">\n',
       '    <a name="circuit" val="avtomat_var3"/>\n']
for label, (x, y), *_ in gates:
    xml.append(f'    <comp lib="1" loc="({x},{y})" name="NOR Gate">\n'
               + a("inputs", 2) + a("size", 50) + a("label", hdl_label(label)) + '    </comp>\n')
for label, (x, y), *_ in ffs:
    xml.append(f'    <comp lib="4" loc="({x},{y})" name="T Flip-Flop">\n'
               + a("appearance", "logisim_evolution") + a("trigger", "rising")
               + a("label", label) + '    </comp>\n')
for label, (x, y), is_out, facing, n in pins:
    body = a("facing", facing) + a("label", label) + a("appearance", "classic")
    if is_out:
        body += a("output", "true") + a("labelloc", "east")
    else:
        body += a("tristate", "false") + a("labelloc", "west")
    xml.append(f'    <comp lib="0" loc="({x},{y})" name="Pin">\n' + body + '    </comp>\n')
for (x, y), t in texts:
    xml.append(f'    <comp lib="8" loc="({x},{y})" name="Text">\n' + a("text", t) + '    </comp>\n')
for net in sorted(final_segs):
    for (p, q) in final_segs[net]:
        xml.append(f'    <wire from="({p[0]},{p[1]})" to="({q[0]},{q[1]})"/>\n')
xml.append('  </circuit>\n</project>\n')
OUT.write_text("".join(xml), encoding="utf-8")

nseg = sum(len(s) for s in final_segs.values())
print(f"{OUT.name}: NOR={len(gates)}, T-FF={len(ffs)}, піни={len(pins)}, сегментів проводів={nseg}")
print("Геометрична перевірка: OK (кола не перетинаються, усі порти підключені)")
