#!/usr/bin/env python3
"""
Generates the Terrarium moss illustration set (public/brand/moss/*.svg).

Rules from the brand guideline (09 · Moss, 10 · Golden grid):
  - Moss is dots on a base line: moss-500 body, moss-700 shading, moss-300 new growth.
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
    w, h = 144, 89
    n = 260 if secured else 150  # dense enough to read as a mound, not scattered dots
    r = rng(seed)
    parts = [baseline(w, h, p)]
    for _ in range(n):
        a = math.pi * (0.04 + 0.92 * r())
        d = math.sqrt(r())
        x = w / 2 + math.cos(a) * d * (w / 2 - 6)
        y = h - 2 - math.sin(a) * d * (h - 8)
        lift = 1 - (h - y) / h
        rad = 1.5 + r() * 1.8
        if secured and lift > 0.7 and r() > 0.4:
            fill = p['tip']
        else:
            fill = p['body'] if r() > 0.5 else p['shade']
        parts.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rad)}" fill="{fill}"/>')
    name = 'Secured moss cushion' if secured else 'Growing moss cushion'
    return svg(w, h, name, ''.join(parts))


def sporophyte(p, seed):
    w, h = 21, 55
    r = rng(seed)
    parts = [baseline(w, h, p, 0, w)]
    parts.append(f'<path d="M10.5 54 C10.5 40 11.5 26 10.5 14" fill="none" stroke="{p["body"]}" stroke-width="1.4" stroke-linecap="round"/>')
    parts.append(f'<ellipse cx="10.5" cy="9" rx="3.6" ry="5.4" fill="{p["shade"]}"/>')
    parts.append(f'<circle cx="11.4" cy="7" r="1.2" fill="{p["tip"]}"/>')
    for _ in range(9):  # a small cushion at the foot
        x = 10.5 + (r() - 0.5) * 17
        y = 53 - r() * 6 * (1 - abs(x - 10.5) / 10)
        parts.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(1.4 + r() * 1.4)}" fill="{p["body"] if r() > 0.4 else p["shade"]}"/>')
    return svg(w, h, 'Sporophyte', ''.join(parts))


def carpet_edge(p, seed):
    w, h = 377, 34
    r = rng(seed)
    parts = [baseline(w, h, p)]
    x = 4.0
    while x < w - 3:
        # A slow wave makes the edge grow in patches instead of a flat strip.
        env = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(x / 41.0 + seed)) * (0.7 + 0.3 * r())
        for _ in range(3):
            y = h - 2 - r() * (h - 8) * env
            lift = 1 - (h - y) / h
            rad = 1.6 + r() * 2.0
            fill = p['tip'] if lift > 0.62 and r() > 0.55 else (p['body'] if r() > 0.45 else p['shade'])
            parts.append(f'<circle cx="{f(x + r() * 5)}" cy="{f(y)}" r="{f(rad)}" fill="{fill}"/>')
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
        'Dots on a base line: moss-500 body, moss-700 shading, moss-300 new growth. Fibonacci frames.\n\n'
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
