# 🎲 Board Game Collection

A fast, single-file web app for browsing a board game collection with cover art, logging plays (BGStats-style), and tracking expansions, removed games, and crowdfunding pre-orders. Runs entirely in the browser — no server, no build step.

## Use it

Open `index.html` (double-click locally, or visit the GitHub Pages URL). Everything is one file.

- **Import** your collection: paste your BoardGameGeek collection XML (from `boardgamegeek.com/xmlapi2/collection?username=YOU&own=1`, while logged in). BGG's live API needs a token now, but exporting your *own* collection does not.
- **＋ Add** games not on BGG — search the games list (load BGG's free games CSV once) or add manually.
- **Log plays**, mark games **Removed** (sold/gifted) or **Pending** (crowdfunding), and **Group** expansions under their base game.
- **☁ Google Sheet sync** (⋯ menu) pushes your collection to a Google Sheet you own — see `google-apps-script.gs` for the one-time setup.

## Where your data lives

Your collection and play log are stored in the **browser** (localStorage + IndexedDB for the games list), *per site*. The `index.html` file is just the app.

- **Back up regularly**: ⋯ → *Download backup (.json)*. That file is your portable copy — *Restore* it anywhere (it also carries your sync URL and prefs).
- Moving between the local file and the hosted URL? They're separate origins with separate storage — use *Download backup* → *Restore* (or Google Sheet *Pull*) to bring your data across.

## Files

- `index.html` — the whole app.
- `google-apps-script.gs` — optional Google Sheet sync backend (paste into Apps Script).
