import urllib.request
import os
from PIL import Image, ImageDraw, ImageFilter

os.makedirs('public/avatars', exist_ok=True)

players = {
    "rohn": {
        "name": "Just Rohn",
        "url": "https://i.ytimg.com/vi/a6IGtNxVAGM/hqdefault.jpg",
        "crop": (280, 50, 480, 250),
        "tint": (212, 175, 55)
    },
    "delux": {
        "name": "Delux",
        "url": "https://i.ytimg.com/vi/XWkrat_kXCw/hqdefault.jpg",
        "crop": (260, 50, 480, 250),
        "tint": (59, 130, 246)
    },
    "dread": {
        "name": "nonsonodread",
        "url": "https://i.ytimg.com/vi/-VpgGrDbnx0/hqdefault.jpg",
        "crop": (300, 40, 480, 220),
        "tint": (16, 185, 129)
    },
    "masseo": {
        "name": "ilMasseo",
        "url": "https://i.ytimg.com/vi/xC_YNHOFDE4/hqdefault.jpg",
        "crop": (280, 40, 480, 240),
        "tint": (245, 158, 11)
    },
    "gabbo": {
        "name": "GaBBo",
        "url": "https://i.ytimg.com/vi/VydxAl_uxBI/hqdefault.jpg",
        "crop": (280, 40, 480, 240),
        "tint": (239, 68, 68)
    },
    "mollu": {
        "name": "Mollu",
        "url": "https://i.ytimg.com/vi/1SoHXNKL53o/hqdefault.jpg",
        "crop": (280, 40, 480, 240),
        "tint": (236, 72, 153)
    },
    "jtaz": {
        "name": "JTaz",
        "url": "https://i.ytimg.com/vi/K6XbosbFIjg/hqdefault.jpg",
        "crop": (280, 40, 480, 240),
        "tint": (139, 92, 246)
    },
    "marzaa": {
        "name": "Just Marzaa",
        "url": "https://i.ytimg.com/vi/pehCX9kJwbI/hqdefault.jpg",
        "crop": (280, 40, 480, 240),
        "tint": (249, 115, 22)
    },
    "chape": {
        "name": "Yung Chape",
        "url": "https://i.ytimg.com/vi/K7ObaKsIbM0/hqdefault.jpg",
        "crop": (280, 40, 480, 240),
        "tint": (6, 182, 212)
    },
    "fava": {
        "name": "Fava",
        "url": "https://i.ytimg.com/vi/6Gg12l2y3G4/hqdefault.jpg",
        "crop": (280, 40, 480, 240),
        "tint": (132, 204, 22)
    }
}

size = (256, 256)

for key, p in players.items():
    try:
        temp_thumb = f"/tmp/thumb_{key}.jpg"
        req = urllib.request.Request(p['url'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp, open(temp_thumb, 'wb') as f:
            f.write(resp.read())
        
        img = Image.open(temp_thumb).convert("RGBA")
        
        w, h = img.size
        c = p['crop']
        left = max(0, min(w - 50, c[0]))
        top = max(0, min(h - 50, c[1]))
        right = min(w, max(left + 50, c[2]))
        bottom = min(h, max(top + 50, c[3]))
        
        cropped = img.crop((left, top, right, bottom))
        cropped = cropped.resize(size, Image.Resampling.LANCZOS)
        
        mask = Image.new("L", size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((6, 6, size[0]-7, size[1]-7), fill=255)
        mask = mask.filter(ImageFilter.SMOOTH_MORE)
        
        result = Image.new("RGBA", size, (0, 0, 0, 0))
        result.paste(cropped, (0, 0), mask)
        
        # Draw gold rim
        rim_draw = ImageDraw.Draw(result)
        rim_draw.ellipse((6, 6, size[0]-7, size[1]-7), outline=(212, 175, 55, 230), width=4)
        
        out_path = f"public/avatars/{key}.png"
        result.save(out_path, "PNG")
        print(f"✓ Generated avatar for {p['name']} -> {out_path}")
    except Exception as e:
        print(f"✗ Fallback for {p['name']}: {e}")
        img = Image.new("RGBA", size, (14, 20, 17, 255))
        draw = ImageDraw.Draw(img)
        draw.ellipse((8, 8, size[0]-9, size[1]-9), fill=(24, 34, 29, 255), outline=(212, 175, 55, 220), width=4)
        initials = "".join([part[0] for part in p['name'].split()][:2]).upper()
        draw.text((size[0]//2, size[1]//2), initials, fill=(240, 240, 240), anchor="mm")
        img.save(f"public/avatars/{key}.png", "PNG")
