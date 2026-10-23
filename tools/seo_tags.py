#!/usr/bin/env python3
"""Adds search and link-preview tags to every page, between <!--SEO--> markers
(safe to run again after editing pages), and writes sitemap.xml.

    python3 tools/seo_tags.py

Each page gets its canonical address, English/Russian alternates (Iradi has no
language code search engines accept, so the ir/ pages are left out of hreflang)
and Open Graph / Twitter tags using its own title and description."""
import html, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://tulparapp.com/"
PAGES = ["index.html", "about.html", "careers.html", "coin.html", "help.html", "legal.html", "letter.html", "news.html", "buttons.html"]
LOCALE = {"": "en_GB", "ru/": "ru_RU", "ir/": "ky_KG"}

def url(prefix, page):
    return SITE + prefix + ("" if page == "index.html" else page)

sitemap = []
for prefix in ("", "ru/", "ir/"):
    for page in PAGES:
        f = ROOT / prefix / page
        if not f.exists():
            continue
        s = f.read_text(encoding="utf-8")
        s = re.sub(r"\n?\s*<!--SEO-->.*?<!--/SEO-->", "", s, flags=re.S)
        title = html.unescape(re.search(r"<title>(.*?)</title>", s, re.S).group(1).strip())
        m = re.search(r'<meta name="description" content="([^"]*)"', s)
        desc = html.unescape(m.group(1)) if m else title
        e = lambda t: html.escape(t, quote=True)
        alts = "".join(f'\n  <link rel="alternate" hreflang="{lang}" href="{url(p, page)}">'
                       for lang, p in (("en", ""), ("ru", "ru/"), ("x-default", "")) if (ROOT / p / page).exists())
        block = (f'\n  <!--SEO-->\n  <link rel="canonical" href="{url(prefix, page)}">'
                 + (alts if prefix != "ir/" else "")
                 + f'\n  <meta property="og:type" content="website">\n  <meta property="og:site_name" content="Tulpar">'
                 f'\n  <meta property="og:title" content="{e(title)}">\n  <meta property="og:description" content="{e(desc)}">'
                 f'\n  <meta property="og:url" content="{url(prefix, page)}">\n  <meta property="og:locale" content="{LOCALE[prefix]}">'
                 f'\n  <meta property="og:image" content="{SITE}images/og.jpg">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">'
                 f'\n  <meta name="twitter:card" content="summary_large_image">\n  <!--/SEO-->')
        s = s.replace("</title>", "</title>" + block, 1) if "</title>\n" not in s else re.sub(r"(<title>.*?</title>)", lambda mm: mm.group(1) + block, s, count=1, flags=re.S)
        f.write_text(s, encoding="utf-8")
        sitemap.append(url(prefix, page))

(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                  + "".join(f"  <url><loc>{u}</loc></url>\n" for u in sitemap) + "</urlset>\n", encoding="utf-8")
print(len(sitemap), "pages tagged")
