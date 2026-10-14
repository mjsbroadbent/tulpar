# Tulpar

Website for **Tulpar**, the Iradi messaging app (chat, channels, Bazar classifieds, Tulpar Pay) made by Tulpar Technologies, and for **Tulparcoin (TLPR)**, the coin Tulpar Pay switches to on 1 January 2027. Part of the Irad worldbuilding project.

Static site, no build step. Deploy on GitHub Pages from the `main` branch root.

| File | What it is |
|---|---|
| `about.html` | About: story, milestones, leadership, investors, offices |
| `letter.html` | "Why we built Tulpar Pay", Jason Ilyasov's founder's letter |
| `careers.html` | Open roles with a team filter |
| `help.html` | Help centre with live search |
| `legal.html` | Privacy policy and terms of service |
| `index.html` | Home: download links, phone mockup, countdown to 1 January 2027, features, numbers, coin teaser, latest news |
| `coin.html` | Tulparcoin: live price chart (1D / 7D / All), claim 100 free TLPR, buy widget, how the supply is shared, roadmap, Tulpar points, FAQ |
| `news.html` | Newsroom, built from `news.js` |
| `news.js` | Press releases and statements (newest first). Add an entry at the top to publish. |
| `site.js` | Shared header and footer, countdown, and the Tulparcoin price engine |
| `styles.css` | All styles |

## Brand

The logo is a white winged horse (the tulpar) leaping left on a turquoise-to-blue gradient tile. `favicon.svg` is the full icon (also `app/icon.svg`), `logo-mark.svg` is the horse alone in brand turquoise, and `site.js` carries an inline copy for the header and footer. `app/icon-192.png` and `app/icon-512.png` are full-bleed squares so phones can mask them. Colours: turquoise `#00728c` (the `--lapis` variable), deep `#054a60`, tile gradient `#00b4b7` to `#00628a`, saffron `#f5b018` for buttons.

## The price

`site.js` follows the prices the *Talas Herald* reported (opened at 4¢ on 22 September 2026, peaked near 7¢, about 3¢ after the 8 October Attelkom block). After 13 October it continues as a seeded drift that pulls back toward about 3.6¢, so every visitor sees the same chart for the same moment, with a small live wobble every few seconds. It always stays between 3¢ and 7¢. Edit `KEYS`, `MIN` and `MAX` to change it.

## Behaviour

- Claiming free coins asks for a phone number (+996 39 for Irad) and any 6-digit code, then confirms.
- Buying by card is declined (Talasbank declines card payments for Tulparcoin); buying with cash gives a code to show at a Tulpar point.

## Languages

English pages are at the root, Iradi copies in `ir/` and Russian copies in `ru/`, with the same file names. The header's language links jump to the same page in another language. Text the scripts generate (header, footer, forms, chart labels, dates) lives in `strings.js`; translated news is in `news.ir.js` and `news.ru.js`. Each translated page has `data-lang="ir"` or `data-lang="ru"` on its `<html>` tag. When you change an English page, change its two copies too.

## The web app (`app/`)

A working, installable web app (PWA) at `/app/`, in English, Iradi and Russian (switch in Profile):

- **Chats:** public rooms and private chats (one-to-one), with replies, reactions (👍❤️😂😮😢🐎), an Iradi sticker pack, polls in rooms, unread badges and optional message alerts while the app is open.
- **QR codes:** everyone has a personal QR code and link (`app/#u=<Tulpar ID>`); scanning it, or entering a Tulpar ID, opens a private chat.
- **Channels:** IradOne and Talas Herald feeds, plus the official Tulpar channel (admins post there).
- **Services:** Bazar, mobile top-up, utilities, Tulpar Taxi, food delivery, Bölüp tölöö (instalments), government services and transfers abroad, all locked to users in Irad (a location check against Irad's outline); and working information pages: weather (Open-Meteo), exchange rates, bus departures from Talas, the Syro-Iradi church calendar, and Irad League and horse-games fixtures.
- **Wallet:** live TLPR price; sending and topping up are locked to Irad.

Chat runs on Firebase (Google sign-in and Cloud Firestore, free Spark plan, no Storage). Until `app/firebase-config.js` is filled in, everything except chat works.

| File | What it is |
|---|---|
| `app/index.html`, `app/app.css`, `app/app.js` | The app |
| `app/i18n.js` | All app text in English, Iradi and Russian |
| `app/stickers/*.svg` | The 16-sticker Iradi pack |
| `app/vendor/` | QR code generator (qrcode-generator, MIT) and scanner (jsQR, Apache-2.0), loaded only when needed |
| `app/firebase-config.js` | Firebase web config |
| `app/sw.js`, `app/manifest.webmanifest`, `app/icon*` | Offline shell, install-to-home-screen, message alerts |
| `firestore.rules` | Security rules to paste into Firebase |

Setup steps are in [SETUP-FIREBASE.md](SETUP-FIREBASE.md). When you change `app/` files, bump `VERSION` in `app/sw.js` so phones pick up the new version. When `firestore.rules` changes, paste it into Firebase again and Publish.
