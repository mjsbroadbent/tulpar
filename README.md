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

## The price

`site.js` follows the prices the *Talas Herald* reported (opened at 4¢ on 22 September 2026, peaked near 7¢, about 3¢ after the 8 October Attelkom block). After 13 October it continues as a seeded drift that pulls back toward about 3.6¢, so every visitor sees the same chart for the same moment, with a small live wobble every few seconds. It always stays between 3¢ and 7¢. Edit `KEYS`, `MIN` and `MAX` to change it.

## Behaviour

- Claiming free coins asks for a phone number (+996 39 for Irad) and any 6-digit code, then confirms.
- Buying by card is declined (Talasbank declines card payments for Tulparcoin); buying with cash gives a code to show at a Tulpar point.

## Languages

English pages are at the root, Iradi copies in `ir/` and Russian copies in `ru/`, with the same file names. The header's language links jump to the same page in another language. Text the scripts generate (header, footer, forms, chart labels, dates) lives in `strings.js`; translated news is in `news.ir.js` and `news.ru.js`. Each translated page has `data-lang="ir"` or `data-lang="ru"` on its `<html>` tag. When you change an English page, change its two copies too.

## The web app (`app/`)

A working, installable web app (PWA) at `/app/`: real public chat rooms, the IradOne and Talas Herald channels, a wallet showing the live TLPR price, and Bazar and Tulpar Pay locked to people in Irad (a location check against Irad's outline). Chat runs on Firebase (Google sign-in and Cloud Firestore, free tier). Until `app/firebase-config.js` is filled in, everything except chat works and the rooms say chat is being set up.

| File | What it is |
|---|---|
| `app/index.html`, `app/app.css`, `app/app.js` | The app |
| `app/firebase-config.js` | Your Firebase web config (empty until set up) |
| `app/sw.js`, `app/manifest.webmanifest`, `app/icon*` | Offline shell and install-to-home-screen |
| `firestore.rules` | Security rules to paste into Firebase |

Setup steps are in [SETUP-FIREBASE.md](SETUP-FIREBASE.md). When you change `app/` files, bump `VERSION` in `app/sw.js` so phones pick up the new version.
