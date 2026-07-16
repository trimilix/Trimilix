from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

try:
    import cairosvg
except ImportError as exc:  # pragma: no cover
    raise SystemExit("cairosvg is required: install it before running this script") from exc

ROOT = Path("/home/ubuntu/webdev-static-assets")
OUT = ROOT / "trimilix-logo-package"
MASTER = ROOT / "trimilix-logo-final-a-master.png"

BLACK = "#050505"
DARK = "#111318"
WHITE = "#FFFFFF"
GOLD = "#E7B53B"
GOLD_DARK = "#CF951F"
GOLD_LIGHT = "#F3D06A"


def gold_defs() -> str:
    return f'''<defs>
  <linearGradient id="trimilixGold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{GOLD_LIGHT}"/>
    <stop offset="0.52" stop-color="{GOLD}"/>
    <stop offset="1" stop-color="{GOLD_DARK}"/>
  </linearGradient>
</defs>'''


def symbol_group(*, bar_color: str = WHITE, transform: str = "") -> str:
    return f'''<g id="trimilix-symbol" transform="{transform}">
  <path fill="url(#trimilixGold)" d="M225 100H775L715 190H585V500L520 570L420 630V190H285Z"/>
  <path fill="url(#trimilixGold)" d="M450 605C600 588 748 505 835 350C780 510 635 624 450 650Z"/>
  <path fill="{bar_color}" d="M610 468L660 438V550L610 573Z"/>
  <path fill="{bar_color}" d="M690 382L740 352V505L690 528Z"/>
  <path fill="{bar_color}" d="M770 286L820 256V448L770 471Z"/>
</g>'''


def geometric_wordmark(*, fill_gold: str, fill_rest: str) -> str:
    """Return a font-independent geometric TRIMILIX wordmark as SVG paths."""
    letters = [
        ("T", 72, 'M0 0H72V18H45V120H27V18H0Z'),
        ("R", 84, 'M0 0H38C67 0 82 14 82 39C82 58 71 70 53 75L85 120H62L34 79H18V120H0V0ZM18 18V61H38C55 61 64 53 64 39C64 25 55 18 38 18H18Z'),
        ("I", 18, 'M0 0H18V120H0Z'),
        ("M", 92, 'M0 120V0H19L46 43L73 0H92V120H74V31L46 75L18 31V120Z'),
        ("I", 18, 'M0 0H18V120H0Z'),
        ("L", 70, 'M0 0H18V102H70V120H0Z'),
        ("I", 18, 'M0 0H18V120H0Z'),
        ("X", 84, 'M0 0H22L42 43L62 0H84L53 60L86 120H63L42 78L21 120H-2L31 60Z'),
    ]
    tracking = 31
    total_width = sum(width for _, width, _ in letters) + tracking * (len(letters) - 1)
    cursor = (1000 - total_width) / 2
    paths: list[str] = []
    for index, (_, width, data) in enumerate(letters):
        fill = fill_gold if index < 3 else fill_rest
        paths.append(f'<path fill="{fill}" fill-rule="evenodd" d="{data}" transform="translate({cursor:.2f} 750)"/>')
        cursor += width + tracking
    return "\n  ".join(paths)


def primary_svg(*, background: str | None, light_surface: bool = False) -> str:
    bar_color = DARK if light_surface else WHITE
    rest_color = DARK if light_surface else WHITE
    background_rect = f'<rect width="1000" height="1000" fill="{background}"/>' if background else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-labelledby="title desc">
<title id="title">Trimilix logo</title>
<desc id="desc">Gouden T met drie stijgende balken en groeiboog boven het woord Trimilix.</desc>
{gold_defs()}
{background_rect}
{symbol_group(bar_color=bar_color)}
<g id="trimilix-wordmark">
  {geometric_wordmark(fill_gold="url(#trimilixGold)", fill_rest=rest_color)}
</g>
</svg>
'''


def horizontal_svg(*, background: str | None, light_surface: bool = False) -> str:
    bar_color = DARK if light_surface else WHITE
    rest_color = DARK if light_surface else WHITE
    background_rect = f'<rect width="1600" height="600" fill="{background}"/>' if background else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" role="img" aria-labelledby="title desc">
<title id="title">Trimilix horizontaal logo</title>
<desc id="desc">Gouden T met stijgende balken en groeiboog naast het woord Trimilix.</desc>
{gold_defs()}
{background_rect}
{symbol_group(bar_color=bar_color, transform="translate(-100 -20) scale(0.8)")}
<g id="trimilix-wordmark" transform="translate(500 -630) scale(1.2)">
  {geometric_wordmark(fill_gold="url(#trimilixGold)", fill_rest=rest_color)}
</g>
</svg>
'''


def symbol_svg(*, background: str | None, light_surface: bool = False) -> str:
    bar_color = DARK if light_surface else WHITE
    background_rect = f'<rect width="1000" height="1000" fill="{background}"/>' if background else ""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-labelledby="title desc">
<title id="title">Trimilix beeldmerk</title>
<desc id="desc">Gouden T met drie stijgende balken en een groeiboog.</desc>
{gold_defs()}
{background_rect}
{symbol_group(bar_color=bar_color, transform="translate(-85 35) scale(1.17)")}
</svg>
'''


def write_svg(name: str, content: str) -> Path:
    path = OUT / name
    path.write_text(content, encoding="utf-8")
    return path


def svg_to_png(svg_path: Path, output_name: str, size: int, height: int | None = None) -> Path:
    output_path = OUT / output_name
    cairosvg.svg2png(
        url=str(svg_path),
        write_to=str(output_path),
        output_width=size,
        output_height=height or size,
    )
    return output_path


def svg_to_pdf(svg_path: Path, output_name: str) -> Path:
    output_path = OUT / output_name
    cairosvg.svg2pdf(url=str(svg_path), write_to=str(output_path))
    return output_path


def build() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    primary_black = write_svg("trimilix-logo-primary-on-black.svg", primary_svg(background=BLACK))
    primary_transparent = write_svg(
        "trimilix-logo-primary-transparent-dark-surfaces.svg",
        primary_svg(background=None),
    )
    primary_light = write_svg(
        "trimilix-logo-primary-light-surfaces.svg",
        primary_svg(background=WHITE, light_surface=True),
    )

    horizontal_black = write_svg(
        "trimilix-logo-horizontal-on-black.svg",
        horizontal_svg(background=BLACK),
    )
    horizontal_transparent = write_svg(
        "trimilix-logo-horizontal-transparent-dark-surfaces.svg",
        horizontal_svg(background=None),
    )
    horizontal_light = write_svg(
        "trimilix-logo-horizontal-light-surfaces.svg",
        horizontal_svg(background=WHITE, light_surface=True),
    )

    symbol_black = write_svg("trimilix-symbol-on-black.svg", symbol_svg(background=BLACK))
    symbol_transparent = write_svg(
        "trimilix-symbol-transparent-dark-surfaces.svg",
        symbol_svg(background=None),
    )
    symbol_light = write_svg(
        "trimilix-symbol-light-surfaces.svg",
        symbol_svg(background=WHITE, light_surface=True),
    )
    favicon_svg = write_svg("trimilix-favicon.svg", symbol_svg(background=BLACK))

    svg_to_png(primary_black, "trimilix-logo-primary-on-black-2048.png", 2048)
    svg_to_png(primary_transparent, "trimilix-logo-primary-transparent-2048.png", 2048)
    svg_to_png(primary_light, "trimilix-logo-primary-light-2048.png", 2048)
    svg_to_png(horizontal_black, "trimilix-logo-horizontal-on-black-2400x900.png", 2400, 900)
    svg_to_png(
        horizontal_transparent,
        "trimilix-logo-horizontal-transparent-2400x900.png",
        2400,
        900,
    )
    svg_to_png(horizontal_light, "trimilix-logo-horizontal-light-2400x900.png", 2400, 900)
    svg_to_png(symbol_black, "trimilix-symbol-on-black-1024.png", 1024)
    svg_to_png(symbol_transparent, "trimilix-symbol-transparent-1024.png", 1024)
    svg_to_png(symbol_light, "trimilix-symbol-light-1024.png", 1024)

    favicon_pngs: list[Path] = []
    for size in (512, 192, 180, 64, 32, 16):
        favicon_pngs.append(svg_to_png(favicon_svg, f"trimilix-favicon-{size}.png", size))

    icon_source = Image.open(OUT / "trimilix-favicon-512.png").convert("RGBA")
    icon_source.save(
        OUT / "trimilix-favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    svg_to_pdf(primary_black, "trimilix-logo-primary-on-black.pdf")
    svg_to_pdf(primary_light, "trimilix-logo-primary-light.pdf")
    svg_to_pdf(horizontal_black, "trimilix-logo-horizontal-on-black.pdf")
    svg_to_pdf(horizontal_light, "trimilix-logo-horizontal-light.pdf")
    svg_to_pdf(symbol_black, "trimilix-symbol-on-black.pdf")

    if MASTER.exists():
        shutil.copy2(MASTER, OUT / "trimilix-approved-raster-master.png")

    manifest = {
        "brand": "Trimilix",
        "direction": "A — Refined Legacy",
        "primary_layout": "stacked",
        "supported_layouts": ["stacked", "horizontal", "symbol_only"],
        "small_format_rule": "Use symbol only for app icons, favicons and social avatars.",
        "colors": {
            "black": BLACK,
            "dark": DARK,
            "white": WHITE,
            "gold": GOLD,
            "gold_light": GOLD_LIGHT,
            "gold_dark": GOLD_DARK,
        },
        "files": sorted(path.name for path in OUT.iterdir()),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    (OUT / "README.md").write_text(
        """# Trimilix logo asset package

The approved identity is **A — Refined Legacy**. Use the stacked logo as the primary brand signature and video end card. Use the horizontal logo where vertical space is limited, especially website headers. Use only the T + growth-bars + rising-arc symbol for app icons, favicons and small social avatars.

| Context | Recommended file |
|---|---|
| Dark website header | `trimilix-logo-horizontal-transparent-dark-surfaces.svg` |
| Dark video end card | `trimilix-logo-primary-transparent-dark-surfaces.svg` |
| Black locked background | `trimilix-logo-primary-on-black.svg` |
| White document or print background | `trimilix-logo-primary-light-surfaces.svg` |
| App icon or favicon | `trimilix-favicon.svg` or the matching PNG/ICO |
| Social avatar | `trimilix-symbol-on-black-1024.png` |

Keep clear space around the logo equal to at least half the height of the letter T in the wordmark. Do not add taglines inside small formats, recolor individual bars, distort the proportions, or place the transparent dark-surface variant on a light background.

The SVG wordmark is converted to vector outlines, so no external font installation is required.
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    build()
