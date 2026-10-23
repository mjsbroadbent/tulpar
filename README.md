# Tulpar

Website for **Tulpar**, the Iradi messaging app (chat, channels, Bazar classifieds, Tulpar Pay) made by Tulpar Technologies, and for **Tulparcoin (TLPR)**, the coin Tulpar Pay switches to on 1 January 2027. Part of the Irad worldbuilding project.

Static site, no build step. Deploy on GitHub Pages from the `main` branch root.

| File | What it is |
|---|---|
| `about.html` | About: story, milestones, leadership, investors, offices |
| `letter.html` | "Why we built Tulpar Pay", Jason Ilyasov's founder's letter |
| `careers.html` | Open roles with a team filter |
| `help.html` | Help centre with live search |
| `buttons.html` | "Add Tulpar to your website": how businesses link to their channel (`https://tulparapp.com/app/#sub=<handle>`), with copyable button, icon and text-link code and icon rules |
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

A working, installable web app (PWA) at `/app/`, in English, Iradi and Russian (switch in Profile). It opens on a start-up screen: sign in with Google, choose a name, then an offer to install the app (Android/desktop prompt, or Add to Home Screen steps on iPhone).

- **Chats:** public rooms and private chats (one-to-one), with replies, reactions (👍❤️😂😮😢🐎), an Iradi sticker pack, polls in rooms, unread badges and optional message alerts while the app is open.
- **QR codes:** everyone has a personal QR code and link (`app/#u=<Tulpar ID>`); scanning it, or entering a Tulpar ID, opens a private chat.
- **Discover** (the landing tab, "For you"): one timeline of every channel's posts, newest first with a light boost for channels you subscribe to, official channels and well-liked posts; tabs For you / News / Sport / Business; pull to refresh on phones. Posts have the channel's avatar, name and official tick, @handle, time, text with #hashtags and @mentions (a mention opens that channel), an optional photo, a link card, quoted posts, threads, and reply / repost / like / save / share. Replies open the matching public room (channels post; people talk in rooms). Jason Ilyasov's Head Start column and the team's pieces are long-form posts by @tulpar that open in the reader.
- **Channels:** the channels you subscribe to (avatar row, a combined timeline, the list with suggestions, your saved posts) and a search box that finds channels by handle (`@talasfilms` or `talasfilms`) or name in any of the three languages. Every channel has a profile (banner, avatar, name, @handle, bio, site, joined, subscribers, Subscribe, its posts); `app/#@talasfilms` opens it directly, `#post=<id>` opens one post, `#tag=KaraAk` a hashtag. New users start with @iradone, @talasherald and @tulpar. Channels are businesses, news outlets, sport, institutions and culture only, never private people; visitors subscribe, they don't create channels. The official Tulpar chat channel is behind @tulpar's profile (admins post there), and its messages, IradOne's and the Herald's live feeds show as those channels' newest posts. On wide screens the tab bar moves to the left and a column on the right has search, channels to subscribe and trending hashtags.
- **Services:** Bazar, mobile top-up, utilities, Tulpar Taxi, food delivery, Bölüp tölöö (instalments), government services and transfers abroad, all locked to users in Irad (a location check against Irad's outline); and working information pages: weather (Open-Meteo), exchange rates, bus departures from Talas, the Syro-Iradi church calendar, the Irad League (table, last results, next fixtures and the cup final, read from the league site's `data/season-2026.json`, `clubs.json` and `cup-2026.json` at mjsbroadbent.github.io/irad-league with an 8-second timeout; on failure the card says results are unavailable) and horse-games fixtures.
- **Wallet:** live TLPR price; sending and topping up are locked to Irad.

Chat runs on Firebase (Google sign-in and Cloud Firestore, free Spark plan, no Storage). Until `app/firebase-config.js` is filled in, everything except chat works.

| File | What it is |
|---|---|
| `app/index.html`, `app/app.css`, `app/app.js` | The app |
| `app/i18n.js` | All app text in English, Iradi and Russian |
| `app/seed.js` | Room history (6–13 October 2026) shown before live messages in each room; edit freely |
| `app/feed.js` | Discover, Channels, channel profiles and posts |
| `app/feed/accounts.json` | The channels (see below) |
| `app/feed/posts.json` | The starter posts, 9–23 October 2026 (Irad Time) |
| `app/feed/avatars/` | Channel avatars: the brand marks and the sites' own icons |
| `app/discover.js` | Head Start and team articles (long-form posts by @tulpar, opened in the reader) |
| `app/stickers/*.svg` | The 16-sticker Iradi pack |
| `app/vendor/` | QR code generator (qrcode-generator, MIT) and scanner (jsQR, Apache-2.0), loaded only when needed |
| `app/firebase-config.js` | Firebase web config |
| `app/sw.js`, `app/manifest.webmanifest`, `app/icon*` | Offline shell, install-to-home-screen, message alerts |
| `firestore.rules` | Security rules to paste into Firebase |

### Channels and posts

**Accounts** (`app/feed/accounts.json`): each `{handle, name {en, ir?, ru?}, kind, avatar, banner, bio {en, ir, ru}, url?, verified, followers, joined}`. `kind` is `news`, `sport`, `business`, `government`, `culture` or `service`; the Discover tabs filter on it (News: news and government; Sport; Business: business and service; culture shows in For you). `avatar` is a path under `app/` (or null for coloured initials); `banner` is the profile's colour; `joined` is `YYYY-MM`. To add a channel, add an entry with a short, lowercase, unique handle, drop its avatar in `app/feed/avatars/` and bump `VERSION` in `app/sw.js`.

The channels (48): news `@iradone` `@iradonesport` `@iradodin` `@talasherald` `@iradtimes`; government `@iradgov` `@bankofirad` `@archives` `@eirad`; services `@tulpar` `@iradenergo` `@pochtasy` `@temirjolu` `@kartalar`; sport `@iradleague` `@tulpartalas` `@neftchi` `@temirjolchu` `@attelkomtalas` `@dastgoh` `@universitet` `@surma` `@fciyikjanyl` `@karabuura` `@narynfk` `@jarysh`; business `@nurgaz` `@talasbank` `@attelkom` `@bereke` `@jildiz` `@shipa` `@torgoy` `@akbata` `@chuybank` `@iradstrakh` `@jilmay` `@talassut` `@akyel` `@aigyr` `@iradiya`; culture `@tsu` `@talasfilms` `@talasfilmarchive` `@filmsociety` `@palaceofart` `@kochaudio` `@arshakitep`.

**Posts** (`app/feed/posts.json` and the day's file): each `{id, handle, time, text {en, ir?, ru?}, image?, link? {url, title, site, desc?, image?}, quote?, thread?, article?, stats {replies, reposts, likes}}`. `time` is ISO with the offset (`2026-10-23T09:00+06:00`); a post shows only once its time has come. `image` is a photo already on an in-world site, by URL (e.g. `https://iradone.com/photos/...`); `quote` is another post's id (shown as a quoted post); `thread` is the id of the same channel's earlier post it continues (shown under "Show this thread"); `article` is a Discover article id. Text gets #hashtags, @mentions of known handles and links automatically. To add seed posts, add entries (any order) with a new unique id; keep every fact to canon and to what the outlets printed.

**The day's posts** come from `https://iradone.com/data/tulpar-feed.json` (same post format, `{updated, posts}`), fetched with an 8-second timeout and merged after the seed; if it fails the seed is used alone. It is written every morning and keeps the last 14 days. The app also merges IradOne's `news/index.json`, the Herald's `feed.xml` and the official Tulpar chat channel as those channels' newest posts (a post whose link is already in the feed is not repeated).

**Per-user state:** subscriptions, likes, reposts and saved posts are kept on the device (`tp_feed` in localStorage) and, when signed in, in `users/{uid}/private/feed` in Firestore (only the owner can read or write it; see `firestore.rules`). Until the new rules are published the app keeps them on the device only.

Setup steps are in [SETUP-FIREBASE.md](SETUP-FIREBASE.md). When you change `app/` files, bump `VERSION` in `app/sw.js` so phones pick up the new version. When `firestore.rules` changes, paste it into Firebase again and Publish.

## Search engines

`python3 tools/seo_tags.py` adds the canonical address, English/Russian `hreflang` alternates and share tags (image `images/og.jpg`) to every page between `<!--SEO-->` markers, and writes `sitemap.xml`. Run it again after adding or retitling a page.

## Android app (APK)

`.github/workflows/android.yml` builds an Android app that opens the web app full screen (a Trusted Web Activity made
with Bubblewrap's library, `android/build-twa.cjs`), signs it and commits it as `download/tulpar.apk`, which the home
page's APK button links to. Run it from the Actions tab (Android APK → Run workflow) after a change to the app's
name, icon or colours; content changes reach the app through the site without a rebuild.

- Secrets: `TULPAR_KEYSTORE_B64` (the release keystore, base64) and `TULPAR_KEYSTORE_PASSWORD` (store and key
  password; alias `tulpar`). Keep a copy of the keystore elsewhere: every update must be signed with the same key.
- Package `com.tulparapp.app`. `.well-known/assetlinks.json` carries the key's SHA-256 fingerprint so Android trusts
  the site and hides the browser bar; change it only if the key changes. (`.nojekyll` lets Pages serve the folder.)
- Installing: Android asks once to allow installs from the browser, and Play Protect warns about an unknown
  developer ("Install anyway").
