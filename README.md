# Tulpar

Website for **Tulpar**, the Iradi messaging app (chat, channels, Bazar classifieds, Tulpar Pay) made by Tulpar Technologies, and for **Tulparcoin (TLPR)**, the coin Tulpar Pay switches to on 1 January 2027. Part of the Irad worldbuilding project.

Static site, no build step. Deploy on GitHub Pages from the `main` branch root.

| File | What it is |
|---|---|
| `index.html` | Home: download links, phone mockup, countdown to 1 January 2027, features, numbers, coin teaser, latest news |
| `coin.html` | Tulparcoin: live price chart (1D / 7D / All), claim 100 free TLPR, buy widget, how the supply is shared, roadmap, Tulpar points, FAQ |
| `news.html` | Newsroom, built from `news.js` |
| `news.js` | Press releases and statements (newest first). Add an entry at the top to publish. |
| `site.js` | Shared header and footer, countdown, and the Tulparcoin price engine |
| `styles.css` | All styles |

## The price

`site.js` follows the prices the *Talas Herald* reported (opened at 4¢ on 22 September 2026, peaked near 7¢, about 3¢ after the 8 October Attelkom block). After 13 October it continues as a seeded drift that pulls back toward about 3.6¢, so every visitor sees the same chart for the same moment, with a small live wobble every few seconds. It always stays between 3¢ and 7¢. Edit `KEYS`, `MIN` and `MAX` to change it.

## Behaviour

- Claiming free coins asks for a phone number (+996 39 for Irad) and any 6-digit code, then confirms.
- Buying by card is declined (Talasbank declines card payments for Tulparcoin); buying with cash gives a code to show at a Tulpar point.
