import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_mahi_icon():
    os.makedirs("assets", exist_ok=True)
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # 1. Soft ambient drop shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([36, 46, size - 36, size - 26], radius=110, fill=(0, 0, 0, 95))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    img = Image.alpha_composite(img, shadow)

    # 2. Main green squircle base
    squircle_mask = Image.new("L", (size, size), 0)
    sm_draw = ImageDraw.Draw(squircle_mask)
    sm_draw.rounded_rectangle([40, 40, size - 40, size - 40], radius=110, fill=255)

    # Base gradient: Vibrant Emerald Green (#16A34A to #15803D to #166534)
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(40, size - 40):
        ratio = (y - 40) / float(size - 80)
        # Gradient from bright emerald #22C55E (34, 197, 94) to deep forest #15803D (21, 128, 61)
        r = int(34 + ratio * (21 - 34))
        g = int(197 + ratio * (128 - 197))
        b = int(94 + ratio * (61 - 94))
        g_draw.line([(40, y), (size - 40, y)], fill=(r, g, b, 255))
    
    # Radial lighting from top center
    radial = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rad_draw = ImageDraw.Draw(radial)
    rad_draw.ellipse([60, -20, size - 60, size // 2 + 100], fill=(74, 222, 128, 120))
    radial = radial.filter(ImageFilter.GaussianBlur(25))
    grad = Image.alpha_composite(grad, radial)

    # Apply squircle mask
    base_card = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    base_card.paste(grad, (0, 0), squircle_mask)
    img = Image.alpha_composite(img, base_card)

    # 3. Outer rim highlight
    rim = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(rim)
    r_draw.rounded_rectangle([42, 42, size - 42, size - 42], radius=108, outline=(255, 255, 255, 110), width=4)
    img = Image.alpha_composite(img, rim)

    # 4. Glossy specular glass curve on upper half (soft transparency)
    gloss = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gloss)
    g_draw.ellipse([45, 20, size - 45, 220], fill=(255, 255, 255, 35))
    # Intersect with squircle
    for px in range(size):
        for py in range(size):
            if squircle_mask.getpixel((px, py)) == 0:
                gloss.putpixel((px, py), (0, 0, 0, 0))
    img = Image.alpha_composite(img, gloss)

    # 5. Pure White 3D Play Triangle in center
    tx_start = 215
    tx_end = 345
    ty_top = 165
    ty_mid = 256
    ty_bot = 347

    # Triangle drop shadow
    tri_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ts_draw = ImageDraw.Draw(tri_shadow)
    ts_draw.polygon([(tx_start, ty_top + 6), (tx_end, ty_mid + 6), (tx_start, ty_bot + 6)], fill=(0, 0, 0, 110))
    tri_shadow = tri_shadow.filter(ImageFilter.GaussianBlur(8))
    img = Image.alpha_composite(img, tri_shadow)

    # Solid pure white triangle with subtle bevel
    tri = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    t_draw = ImageDraw.Draw(tri)
    t_draw.polygon([(tx_start, ty_top), (tx_end, ty_mid), (tx_start, ty_bot)], fill=(255, 255, 255, 255))
    img = Image.alpha_composite(img, tri)

    # 6. "4K" Glossy Badge at bottom-right
    b_x1, b_y1 = 320, 355
    b_x2, b_y2 = 445, 415
    
    badge_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bs_draw = ImageDraw.Draw(badge_shadow)
    bs_draw.rounded_rectangle([b_x1, b_y1 + 4, b_x2, b_y2 + 4], radius=16, fill=(0, 0, 0, 120))
    badge_shadow = badge_shadow.filter(ImageFilter.GaussianBlur(6))
    img = Image.alpha_composite(img, badge_shadow)

    badge = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(badge)
    b_draw.rounded_rectangle([b_x1, b_y1, b_x2, b_y2], radius=16, fill=(15, 23, 42, 240), outline=(255, 255, 255, 180), width=3)
    
    # Try finding font or draw crisp 4K text
    try:
        font = ImageFont.truetype("arialbd.ttf", 38)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 38)
        except:
            font = ImageFont.load_default()
    
    b_draw.text((345, 363), "4K", fill=(255, 255, 255, 255), font=font)
    img = Image.alpha_composite(img, badge)

    # Save high-res PNG
    png_path = os.path.join("assets", "mahi_4k_icon.png")
    img.save(png_path, format="PNG")
    print(f"[OK] Saved PNG icon: {png_path}")

    # Generate multi-size Windows ICO
    ico_path = os.path.join("assets", "mahi_4k_icon.ico")
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format="ICO", sizes=icon_sizes)
    print(f"[OK] Saved Windows ICO: {ico_path} with sizes {icon_sizes}")

if __name__ == "__main__":
    create_mahi_icon()
