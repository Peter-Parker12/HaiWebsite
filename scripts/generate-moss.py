#!/usr/bin/env python3
"""
Generates the Terrarium moss illustration set (public/brand/moss/*.svg).

Rules from the brand guideline (09 · Moss, 10 · Golden grid):
  - Moss is drawn as curved shoots with halftone shading: moss-500 body, moss-700 shading, moss-300 new growth.
  - Frames are Fibonacci sizes (8, 13, 21, 34, 55, 89, 144, 233, 377). No gradients, no cartoon moss.
  - The files draw the Growing and Secured states. Open and Dormant are made in code by recolouring.
  - Each element has a cloth version and a -dark version for ink grounds.
Positions come from a seeded generator, so re-running the script gives identical files.
Run:  python3 scripts/generate-moss.py
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'brand', 'moss')

LIGHT = {'body': '#5d7a49', 'shade': '#3f5631', 'tip': '#a3c08c', 'line': '#e6d7bd', 'line_op': 1.0}
DARK = {'body': '#a3c08c', 'shade': '#5d7a49', 'tip': '#e1ead8', 'line': '#faf6f0', 'line_op': 0.35}


def rng(seed):
    a = seed & 0xFFFFFFFF
    def nxt():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return nxt


def f(n):
    return ('%.2f' % n).rstrip('0').rstrip('.')


def svg(w, h, title, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}">'
        f'<title>{title}</title>{body}</svg>\n'
    )


def baseline(w, h, p, x1=0, x2=None):
    x2 = w if x2 is None else x2
    op = '' if p['line_op'] == 1 else f' stroke-opacity="{p["line_op"]}"'
    return f'<line x1="{f(x1)}" y1="{f(h - 0.5)}" x2="{f(x2)}" y2="{f(h - 0.5)}" stroke="{p["line"]}" stroke-width="1"{op}/>'


def cushion(p, secured, seed):
    """A mound of moss: hundreds of curved shoots fanning outward, halftone shading on the shadow side."""
    w, h = 144, 89
    r = rng(seed)
    cx, rx, ry, base = w / 2, w / 2 - 3, h - 5, h - 1
    n_pts = 56
    pts = []
    for i in range(n_pts + 1):
        a = math.pi - math.pi * i / n_pts
        wob = 1 + (r() - 0.5) * 0.07
        pts.append(('M' if i == 0 else 'L') + f'{f(cx + math.cos(a) * rx * wob)} {f(base - math.sin(a) * ry * wob)}')
    silhouette = ' '.join(pts) + ' Z'

    shoots = []
    count = round((0.036 if secured else 0.022) * w * h)
    for _ in range(count):
        a = math.pi * (0.03 + 0.94 * r())
        d = math.sqrt(r())
        x = cx + math.cos(a) * d * rx * 0.97
        y = base - math.sin(a) * d * ry * 0.97
        lift = max(0.0, min(1.0, (base - y) / ry))
        out = math.atan2(y - (base + ry * 0.5), x - cx) + (r() - 0.5) * 0.7
        length = 4 + r() * 5
        tx = x + math.cos(out) * length
        ty = min(y + math.sin(out) * length, base - 0.5)
        bend = (r() - 0.5) * length * 0.6
        mx = (x + tx) / 2 - math.sin(out) * bend
        my = (y + ty) / 2 + math.cos(out) * bend
        fresh = secured and lift > 0.66 and r() > 0.32
        col = p['tip'] if fresh else (p['body'] if r() > 0.5 else p['shade'])
        sw = 0.8 + r() * 0.7
        el = f'<path d="M{f(x)} {f(y)} Q{f(mx)} {f(my)} {f(tx)} {f(ty)}" stroke="{col}" stroke-width="{f(sw)}" fill="none" stroke-linecap="round"/>'
        if fresh:
            el += f'<circle cx="{f(tx)}" cy="{f(ty)}" r="{f(0.7 + r() * 0.6)}" fill="{col}"/>'
        shoots.append((y, el))
    shoots.sort(key=lambda t: t[0])  # upper shoots first, so lower ones overlap them

    dots = []
    sp = 4.2
    gy = sp / 2
    while gy < base:
        gx = sp / 2
        while gx < w:
            ex, ey = (gx - cx) / rx, (base - gy) / ry
            if ex * ex + ey * ey <= 0.9:
                t = 0.6 * (gx / w) + 0.4 * (gy / base)
                if t >= 0.52:
                    rad = min(1.5, (t - 0.5) * 3.4)
                    if rad > 0.35:
                        dots.append(f'<circle cx="{f(gx)}" cy="{f(gy)}" r="{f(rad)}"/>')
            gx += sp
        gy += sp

    body = (
        baseline(w, h, p)
        + f'<path d="{silhouette}" fill="{p["shade"]}" opacity="0.9"/>'
        + ''.join(el for _, el in shoots)
        + f'<g fill="{p["shade"]}" opacity="0.5">' + ''.join(dots) + '</g>'
        + f'<path d="{silhouette}" fill="none" stroke="{p["shade"]}" stroke-opacity="0.55" stroke-width="0.8" stroke-dasharray="6 2 1 2" stroke-linecap="round"/>'
    )
    return svg(w, h, 'Secured moss cushion' if secured else 'Growing moss cushion', body)


def sporophyte(p, seed):
    """A slender curved seta topped with a capsule and a pale cap, rising from a small tuft."""
    w, h = 21, 55
    r = rng(seed)
    parts = [baseline(w, h, p, 0, w)]
    for i in range(9):  # tuft at the foot
        x = 10.5 + (i - 4) * 1.7 + (r() - 0.5)
        lean = (i - 4) * 0.9
        col = p['body'] if i % 2 else p['shade']
        parts.append(f'<path d="M{f(x)} {h - 1} Q{f(x + lean * 0.4)} {h - 4} {f(x + lean)} {f(h - 6 - r() * 2)}" stroke="{col}" stroke-width="1" fill="none" stroke-linecap="round"/>')
    x, y, ht, lean = 10.5, h - 3, h - 17, 2.5
    tx, ty = x + lean, y - ht
    parts.append(
        f'<path d="M{f(x)} {f(y)} C{f(x + lean * 0.1)} {f(y - ht * 0.45)} {f(x + lean * 0.95)} {f(y - ht * 0.65)} {f(tx)} {f(ty)}" '
        f'fill="none" stroke="{p["body"]}" stroke-width="1.4" stroke-linecap="round"/>'
    )
    tilt = math.degrees(math.atan2(lean, ht))
    parts.append(
        f'<g transform="rotate({f(tilt)} {f(tx)} {f(ty)})">'
        f'<ellipse cx="{f(tx)}" cy="{f(ty - 4.6)}" rx="3" ry="5" fill="{p["shade"]}"/>'
        f'<path d="M{f(tx - 1.6)} {f(ty - 7.4)} Q{f(tx - 2.5)} {f(ty - 4.6)} {f(tx - 1.6)} {f(ty - 1.8)}" stroke="{p["tip"]}" stroke-width="0.8" fill="none" stroke-linecap="round"/>'
        f'<ellipse cx="{f(tx)}" cy="{f(ty - 9.2)}" rx="2.1" ry="1.5" fill="{p["tip"]}"/>'
        f'</g>'
    )
    return svg(w, h, 'Sporophyte', ''.join(parts))


def carpet_edge(p, seed):
    """A strip of short shoots growing along a base line, in patches."""
    w, h = 377, 34
    r = rng(seed)
    parts = [baseline(w, h, p)]
    x = 4.0
    while x < w - 3:
        env = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(x / 41.0 + seed)) * (0.7 + 0.3 * r())
        for _ in range(3):
            sx = x + r() * 5
            ht = (4 + r() * (h - 12)) * env + 3
            lean = (r() - 0.5) * 4
            lift = ht / (h - 6)
            col = p['tip'] if lift > 0.62 and r() > 0.55 else (p['body'] if r() > 0.45 else p['shade'])
            parts.append(
                f'<path d="M{f(sx)} {h - 1} Q{f(sx + lean)} {f(h - 1 - ht / 2)} {f(sx + lean * 1.5)} {f(h - 1 - ht)}" '
                f'stroke="{col}" stroke-width="{f(1 + r() * 0.6)}" fill="none" stroke-linecap="round"/>'
            )
        x += 5.0
    return svg(w, h, 'Carpet edge', ''.join(parts))


def protonema(p, seed):
    """Branching filaments with a node at every fork and a bright tip at each end."""
    w, h = 233, 144
    r = rng(seed)
    lines, nodes, tips = [], [], []

    def branch(x, y, ang, length, depth):
        x2 = x + math.cos(ang) * length
        y2 = y + math.sin(ang) * length
        if y2 > h - 2:  # keep growth above the base line
            return
        lines.append(f'<line x1="{f(x)}" y1="{f(y)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{p["body"]}" stroke-width="1" stroke-linecap="round"/>')
        if depth == 0:
            tips.append(f'<circle cx="{f(x2)}" cy="{f(y2)}" r="2.2" fill="{p["tip"]}"/>')
            return
        nodes.append(f'<circle cx="{f(x2)}" cy="{f(y2)}" r="1.6" fill="{p["shade"]}"/>')
        for turn in (-1, 1):
            if r() > 0.18:
                branch(x2, y2, ang + turn * (0.35 + r() * 0.45), length * (0.68 + r() * 0.14), depth - 1)

    for x0, ang in ((34, -1.15), (89, -1.5), (144, -1.35), (200, -1.9)):
        branch(x0, h - 2, ang, 34 + r() * 13, 5)
    return svg(w, h, 'Protonema network', baseline(w, h, p) + ''.join(lines) + ''.join(nodes) + ''.join(tips))


def spore_field(p, seed):
    """A dot gradient: dots shrink away from the bottom-right corner. Corner texture, never full-bleed."""
    w, h = 233, 144
    r = rng(seed)
    parts = []
    cols, rows = 21, 13
    for i in range(cols):
        for j in range(rows):
            x = (i + 0.5) * w / cols + (r() - 0.5) * 3
            y = (j + 0.5) * h / rows + (r() - 0.5) * 3
            d = math.hypot((w - x) / w, (h - y) / h)  # 0 at the corner, ~1.4 at the far corner
            rad = max(0.0, 3.1 - d * 3.4)
            if rad < 0.5 or r() < d * 0.35:
                continue
            fill = p['tip'] if rad > 2.4 and r() > 0.5 else (p['body'] if r() > 0.35 else p['shade'])
            parts.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rad)}" fill="{fill}"/>')
    return svg(w, h, 'Spore field', ''.join(parts))


def write(name, content):
    path = os.path.join(OUT, name)
    with open(path, 'w') as fh:
        fh.write(content)
    print('wrote', os.path.normpath(path))


os.makedirs(OUT, exist_ok=True)
for suffix, pal in (('', LIGHT), ('-dark', DARK)):
    write(f'cushion{suffix}.svg', cushion(pal, False, 8))            # Growing
    write(f'cushion-secured{suffix}.svg', cushion(pal, True, 13))    # Secured
    write(f'sporophyte{suffix}.svg', sporophyte(pal, 3))
    write(f'carpet-edge{suffix}.svg', carpet_edge(pal, 5))
    write(f'protonema-network{suffix}.svg', protonema(pal, 21))
    write(f'spore-field{suffix}.svg', spore_field(pal, 34))

with open(os.path.join(OUT, 'README.txt'), 'w') as fh:
    fh.write(
        'Terrarium moss illustrations\n'
        'Curved shoots on a base line: moss-500 body, moss-700 shading, moss-300 new growth, halftone shading. Fibonacci frames.\n\n'
        'cushion.svg            Growing state (medium moss)          cushion-secured.svg   Secured state (dense, new tips)\n'
        'sporophyte.svg         One secured resource; pin on a map   carpet-edge.svg       Divider, loading line, row of done tasks\n'
        'protonema-network.svg  Matching: creators to sponsors       spore-field.svg       Hero corner texture\n'
        '-dark files            Same artwork for ink grounds.\n\n'
        'Open (sparse, terracotta tips) and Dormant (flat grey) are drawn in code by recolouring the cushion.\n'
        'Rules: moss means a need has been met; at most 10% of a screen; one Secured element per screen;\n'
        'never behind text smaller than 18px; never as wallpaper or a border around every card.\n'
        'Regenerate with: python3 scripts/generate-moss.py\n'
    )
print('done')
