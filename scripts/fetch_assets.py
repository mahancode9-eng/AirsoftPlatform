#!/usr/bin/env python3
"""دانلود عکس‌های واقعی گان‌ها، اتچمنت‌ها و عکس‌های اتمسفریک از Wikimedia Commons.

استفاده:
    python scripts/fetch_assets.py                     # دانلود همه
    python scripts/fetch_assets.py --only m4a1,ak74    # فقط چند آیتم
    python scripts/fetch_assets.py --out backend/uploads/armory

رفتار:
- منابع از assets/manifest.json خوانده می‌شوند.
- اگر آیتم commons_file داشته باشد همان فایل دانلود می‌شود؛ وگرنه در Commons جستجو
  و اولین تصویر مناسب (عرض حداقل MIN_WIDTH) انتخاب می‌شود.
- اگر Pillow نصب باشد خروجی به WebP با حداکثر عرض MAX_WIDTH تبدیل می‌شود (pip install Pillow).
- منبع، لایسنس و صاحب اثر هر فایل در assets/manifest.lock.json ثبت می‌شود (برای رعایت کپی‌رایت حیاتی است).
"""

import argparse
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
UA = "AirsoftPlatformAssetFetcher/1.0 (contact: repo mahancode9-eng/AirsoftPlatform)"
MIN_WIDTH = 500
MAX_WIDTH = 1600
WEBP_QUALITY = 82

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "assets" / "manifest.json"
LOCK_PATH = ROOT / "assets" / "manifest.lock.json"


def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=dict([("User-Agent", UA)]))
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read()


def api_call(params: dict) -> dict:
    params = dict(params)
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    return json.loads(http_get(url).decode("utf-8"))


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def file_info(title: str) -> dict | None:
    """اطلاعات فایل (URL مستقیم، ابعاد، لایسنس) برای یک فایل Commons."""
    if not title.startswith("File:"):
        title = "File:" + title
    data = api_call(
        dict(
            action="query",
            titles=title,
            prop="imageinfo",
            iiprop="url|size|mime|extmetadata",
        )
    )
    pages = data.get("query", dict()).get("pages", dict())
    for page in pages.values():
        infos = page.get("imageinfo")
        if infos:
            info = infos[0]
            info["_title"] = title
            return info
    return None


def search_best_file(query: str) -> dict | None:
    """جستجو در Commons و انتخاب اولین تصویر با عرض کافی."""
    data = api_call(
        dict(
            action="query",
            list="search",
            srsearch=query,
            srnamespace="6",
            srlimit="12",
        )
    )
    hits = data.get("query", dict()).get("search", [])
    for hit in hits:
        title = hit.get("title", "")
        lower = title.lower()
        if not lower.endswith((".jpg", ".jpeg", ".png", ".webp")):
            continue
        info = file_info(title)
        if not info:
            continue
        if int(info.get("width", 0)) >= MIN_WIDTH:
            return info
    return None


def save_image(raw: bytes, out_dir: Path, slug: str, mime: str) -> str:
    """ذخیره به صورت WebP (با Pillow) یا فرمت اصلی."""
    try:
        from PIL import Image  # type: ignore

        img = Image.open(io.BytesIO(raw))
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / float(img.width)
            img = img.resize((MAX_WIDTH, max(1, int(img.height * ratio))))
        out_name = slug + ".webp"
        img.save(out_dir / out_name, "WEBP", quality=WEBP_QUALITY)
        return out_name
    except ImportError:
        ext = ".jpg"
        if "png" in mime:
            ext = ".png"
        elif "webp" in mime:
            ext = ".webp"
        out_name = slug + ext
        (out_dir / out_name).write_bytes(raw)
        return out_name


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch armory assets from Wikimedia Commons")
    parser.add_argument("--out", default=None, help="پوشه خروجی (پیش‌فرض: از manifest)")
    parser.add_argument("--only", default=None, help="فقط این slugها (جداشده با کاما)")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    out_dir = ROOT / (args.out or manifest.get("output_dir", "backend/uploads/armory"))
    out_dir.mkdir(parents=True, exist_ok=True)

    only = set(args.only.split(",")) if args.only else None

    lock: dict = dict(items=dict())
    if LOCK_PATH.exists():
        try:
            lock = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            lock = dict(items=dict())

    ok, failed = 0, []
    for item in manifest["items"]:
        slug = item["slug"]
        if only and slug not in only:
            continue

        info = None
        preferred = item.get("commons_file")
        if preferred:
            info = file_info(preferred)
            if info and int(info.get("width", 0)) < MIN_WIDTH:
                info = None
        if not info:
            info = search_best_file(item.get("search", item.get("name_en", slug)))
        if not info:
            print(f"[FAIL] {slug}: هیچ تصویر مناسبی پیدا نشد")
            failed.append(slug)
            continue

        try:
            raw = http_get(info["url"])
            out_name = save_image(raw, out_dir, slug, info.get("mime", ""))
        except Exception as exc:  # noqa: BLE001
            print(f"[FAIL] {slug}: خطا در دانلود/تبدیل — {exc}")
            failed.append(slug)
            continue

        meta = info.get("extmetadata", dict())
        license_name = strip_html(meta.get("LicenseShortName", dict()).get("value", ""))
        artist = strip_html(meta.get("Artist", dict()).get("value", ""))
        lock["items"][slug] = dict(
            file=out_name,
            kind=item.get("kind", ""),
            source_title=info.get("_title", ""),
            source_page=info.get("descriptionurl", ""),
            direct_url=info.get("url", ""),
            license=license_name,
            artist=artist,
            width=info.get("width", 0),
            height=info.get("height", 0),
        )
        print(f"[OK]   {slug} <- {info.get('_title', '')} ({license_name or 'license?'})")
        ok += 1

    LOCK_PATH.write_text(
        json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nتمام شد: {ok} موفق، {len(failed)} ناموفق. خروجی: {out_dir}")
    if failed:
        print("ناموفق‌ها: " + ", ".join(failed))
        print("برای آن‌ها commons_file دقیق در manifest.json تعریف کنید یا search را تغییر دهید.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
