# save as fetch_logos.py
import asyncio, aiohttp, json, os, io, re
from PIL import Image
from slugify import slugify
from tqdm.asyncio import tqdm_asyncio

SRC_FILE   = "framework.json"
OUT_DIR    = "logos"
SIZE       = (148, 148)
CONCURRENT = 20

os.makedirs(OUT_DIR, exist_ok=True)

async def fetch_resize(session, name, url):
    if not url:                             # no logo => skip
        return f"{name}: no url"
    fname = f"{slugify(name)}.png"
    path  = os.path.join(OUT_DIR, fname)
    if os.path.exists(path):                # already done
        return f"{name}: cached"

    try:
        async with session.get(url, timeout=20) as r:
            r.raise_for_status()
            raw = await r.read()
        img = Image.open(io.BytesIO(raw)).convert("RGBA")
        img.thumbnail(SIZE, Image.LANCZOS)

        # optional: autocrop transparent/white border
        bg = Image.new("RGBA", img.size, (255, 255, 255, 0))
        diff = Image.alpha_composite(bg, img).getbbox()
        if diff:
            img = img.crop(diff)
        # pad to exact SIZE
        result = Image.new("RGBA", SIZE, (255, 255, 255, 0))
        result.paste(img, ((SIZE[0]-img.width)//2, (SIZE[1]-img.height)//2))
        result.save(path, optimize=True)
        return f"{name}: OK"
    except Exception as e:
        return f"{name}: {e}"

async def main():
    tasks = []
    async with aiohttp.ClientSession() as session:
        with open(SRC_FILE) as f:
            for line in f:
                rec = json.loads(line)
                if (rec["logo_url"]):
                    tasks.append(fetch_resize(session, rec["name"], rec["logo_url"]))
        for msg in await tqdm_asyncio.gather(*tasks, limit=CONCURRENT):
            print(msg)

if __name__ == "__main__":
    asyncio.run(main())