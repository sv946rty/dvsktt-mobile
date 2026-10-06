# Toàn Thư (mobile)

React Native app (Expo SDK 57, Expo Router) for reading *Đại Việt sử ký toàn thư* with the Classical
Chinese above the Vietnamese or English translation. It is the phone companion of the web reader in
[sv946rty/dvsktt](https://github.com/sv946rty/dvsktt); the text, alignment and entity data come from there.

Private test build: the Vietnamese translation is not licensed for publication yet. Do not publish the
app or its web export.

## Run it

```bash
npm install
npx expo start          # then scan the QR code with Expo Go (iOS / Android), or press w for the browser
```

Everything used is in Expo Go, so no development build is needed. To try the web version of the same
code: `npm run export:web && npx expo serve`.

## What is in the app

| Tab | |
|---|---|
| Đọc (Read) | Library: continue where you stopped, the work's tree (parts without data are dimmed) |
| Reader | Chinese above the translation per passage. Dock: Cả hai / 中文 / Việt layout, VI / EN, ⋯ actions. Year chips on top, contents (☰), text and display (Aa) |
| Tìm (Search) | Accent-insensitive Vietnamese/English and Chinese (variant-aware); entities and passages |
| Đã lưu (Saved) | Starred passages and your correction notes, kept on the device until accounts exist |
| Tùy chọn (Settings) | Text size, theme, language, and the web reader's display switches |

Gestures in the reader, the same as the web on touch devices:

* tap a name (blue underline): entity card (Overview, In Toàn Thư, Relations, Occurrences, Links)
* tap other text: the clause lights up on both sides and a bar repeats the pair
* tap a Chinese character inside the lit clause: dictionary (Hán-Việt, gloss, thivien / zdic / nomfoundation)
* tap a footnote number: the note opens in a sheet
* long-press a passage, or ⋯ in the dock: save, copy citation, copy link, parallel sources, suggest a correction

Deep link: `dvsktt://reader/ky-nha-dinh?at=E05` (`?ent=person:dinh-bo-linh` opens a card).

## Content

`src/data/<chapter>.json` is generated, never edited by hand. It is built from a checkout of the web repo
with the same render model the website uses (`@dvsktt/core` `buildPassage`), so clause groups and entity
mentions match the web reader exactly:

```bash
# with sv946rty/dvsktt checked out next to this repo and `npm install` run in it
npm run sync-content                 # or DVSKTT_DIR=/path/to/dvsktt npm run sync-content
```

The script fails if any entity mention cannot be placed. Passage ids are permanent; the source text is
never changed here.

## Checks

```bash
npx tsc --noEmit
npx expo lint
npm run export:web && npx expo serve --port 8099 &
node tests/web-smoke.mjs             # 21 checks in a 390×844 phone viewport; CHROMIUM_PATH=… if needed
```

## Layout

```
src/app/            routes (Expo Router): (tabs)/index, search, saved, settings; reader/[chapter]
src/components/     PassageView, EntityCard, DictPanel, Contents, SettingsPanel, Sheet, ui
src/lib/            content (types + indexes), store (prefs, saved, notes; AsyncStorage), theme
src/data/           generated chapter content
scripts/            sync-content.ts
tests/              web-smoke.mjs
```

Deferred (see the design review in the project files): vertical Chinese, ruby readings above characters
(the app shows readings in a grid under each character instead), Wikipedia images, accounts and sync.
