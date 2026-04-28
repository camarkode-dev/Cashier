from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
FONT_PATH = Path(r"C:\Windows\Fonts\impact.ttf")

BG = "#1D2026"
PATTERN = "#2A2D33"
HOUSE = "#FFFDF9"
ORANGE = "#FF9A4E"
SHADOW = "#14171C"


def build_mark(size: int = 1024) -> Image.Image:
    image = Image.new("RGBA", (size, size), BG)
    scale = size / 320

    def pt(x: float, y: float) -> tuple[int, int]:
        return (round(x * scale), round(y * scale))

    pattern = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pattern_draw = ImageDraw.Draw(pattern)
    for y in (48, 112, 176, 240, 304):
        points = [
            pt(-28, y),
            pt(26, y - 42),
            pt(93, y - 42),
            pt(145, y),
            pt(198, y + 42),
            pt(264, y + 42),
            pt(319, y),
        ]
        pattern_draw.line(points, fill=PATTERN, width=round(14 * scale), joint="curve")
    pattern.putalpha(72)
    image.alpha_composite(pattern)

    house = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    house_draw = ImageDraw.Draw(house)
    house_width = round(20 * scale)
    house_draw.line(
        [pt(67, 258), pt(67, 117), pt(161, 41), pt(253, 121)],
        fill=HOUSE,
        width=house_width,
        joint="curve",
    )
    house_draw.line([pt(69, 259), pt(223, 259)], fill=HOUSE, width=house_width)
    radius = house_width // 2
    for x, y in (pt(67, 258), pt(253, 121), pt(69, 259), pt(223, 259)):
        house_draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=HOUSE)
    image.alpha_composite(house)

    def make_letter(letter: str, font_size: int, skew: float, rotation: float) -> Image.Image:
        canvas = Image.new("RGBA", (round(180 * scale), round(180 * scale)), (0, 0, 0, 0))
        letter_draw = ImageDraw.Draw(canvas)
        font = ImageFont.truetype(str(FONT_PATH), font_size)
        bbox = letter_draw.textbbox((0, 0), letter, font=font, stroke_width=round(7 * scale))
        origin = (
            (canvas.width - (bbox[2] - bbox[0])) // 2 - bbox[0],
            (canvas.height - (bbox[3] - bbox[1])) // 2 - bbox[1],
        )

        shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.text(
            (origin[0] + round(7 * scale), origin[1] + round(6 * scale)),
            letter,
            font=font,
            fill=SHADOW,
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=round(2.2 * scale)))

        letter_draw.text(
            origin,
            letter,
            font=font,
            fill=ORANGE,
            stroke_width=round(7 * scale),
            stroke_fill=SHADOW,
        )

        merged = Image.alpha_composite(shadow, canvas)
        shear_offset = int(abs(skew) * merged.height)
        sheared = merged.transform(
            (merged.width + shear_offset, merged.height),
            Image.AFFINE,
            (1, skew, 0 if skew < 0 else -shear_offset, 0, 1, 0),
            resample=Image.BICUBIC,
        )
        return sheared.rotate(rotation, resample=Image.BICUBIC, expand=True)

    letters = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    letters.alpha_composite(make_letter("A", round(126 * scale), -0.18, -3), pt(78, 102))
    letters.alpha_composite(make_letter("H", round(128 * scale), -0.10, 1), pt(160, 102))
    image.alpha_composite(letters)

    return image


def save_resized(source: Image.Image, relative_path: str, size: int) -> None:
    target = PUBLIC_DIR / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    source.resize((size, size), Image.LANCZOS).save(target)


def main() -> None:
    base = build_mark(1024)
    save_resized(base, "icon.png", 512)
    save_resized(base, "icon-192.png", 192)
    save_resized(base, "icon-512.png", 512)
    save_resized(base, "maskable-icon.png", 512)
    save_resized(base, "apple-icon.png", 180)
    save_resized(base, "apple-touch-icon.png", 180)
    save_resized(base, "badge-72.png", 72)
    save_resized(base, "icons/icon.png", 512)
    save_resized(base, "logo-mark.png", 512)

    favicon = base.resize((256, 256), Image.LANCZOS)
    favicon.save(PUBLIC_DIR / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])


if __name__ == "__main__":
    main()
