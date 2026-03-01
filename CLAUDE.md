# Technodex

A static, Pokedex-style directory of software frameworks and tools. Users browse cards on the homepage, flip them for quick details, and click through to a full detail page. Deployed on GitHub Pages at technodex.fr.

---

## Tech Stack

- **HTML/CSS/JS** — vanilla, no bundlers, no package managers, no build step
- **Data** — single JSON array (`data/frameworks.json`) loaded client-side
- **Fonts** — Inter via Google Fonts; custom display fonts in `assets/fonts/`
- **Icons** — Font Awesome 5 (CDN); category icons in `assets/images/icons/`
- **Python utility** — `scripts/fetch_logos.py` (logo downloader; not part of deployment)
- **Hosting** — GitHub Pages, custom domain via `CNAME`

---

## Key Directories

| Path | Purpose |
|---|---|
| `index.html` | Homepage — card grid entry point |
| `details.html` | Detail page — loaded with `?id=<array-index>` |
| `css/main.css` | Homepage styles: grid, cards, badges, footer |
| `css/details.css` | Detail page styles: tabs, hero, preloader |
| `js/main.js` | Fetch JSON, render cards, search, scroll buttons |
| `js/details.js` | Parse `?id`, render hero + 3 tabs, navigation |
| `data/frameworks.json` | Source of truth — array of framework objects |
| `assets/images/tech/` | Per-framework logo PNGs/SVGs |
| `assets/images/icons/` | Per-category icon PNGs (used on card fronts) |
| `scripts/` | Dev utilities only; not served |

---

## Running the Project

There is no build step. Open `index.html` directly in a browser **or** serve from a local HTTP server (required for the `fetch()` call to `data/frameworks.json`):

```
# Python
python -m http.server 8080

# Node
npx serve .
```

Navigate to `http://localhost:8080`.

---

## Adding a Framework Entry

1. Add an object to `data/frameworks.json` — see schema at `data/frameworks.json:1`
2. Place the logo at `assets/images/tech/<slug>.png` (148×148px PNG preferred)
3. Ensure `logo_url` is `"./assets/images/tech/<slug>.png"` or `null` for placeholder
4. `primary_category` must match an existing icon in `assets/images/icons/` and a CSS class in `css/main.css:238-251`

To bulk-fetch logos from URLs: edit `scripts/framework.json` and run `python scripts/fetch_logos.py` from the repo root.

---

## Data Schema

Each entry in `data/frameworks.json` (`data/frameworks.json:1`):

| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name |
| `primary_category` | string | Maps to icon + CSS color class |
| `current_status` | string | `active` / `deprecated` / `maintenance-only` |
| `logo_url` | string\|null | Relative path or null for placeholder |
| `tags` | string[] | Searchable; first 3 shown on card back |
| `notable_use_cases` | string | Comma-separated; shown in Overview tab |
| `related_frameworks` | string | Comma-separated names; cross-linked in Related tab |

---

## Key Constraints

- All asset and data paths must be **relative** (`./`-prefixed) — no absolute paths anywhere
- `?id=` in the URL is a **zero-based array index** into `frameworks.json`, not a stable ID — reordering the array breaks existing links
- The `search_pokemon` function name in `js/main.js:135` is a legacy artifact; don't rename without updating `index.html:29`

---

## Additional Documentation

| File | When to check |
|---|---|
| `.claude/docs/architectural_patterns.md` | Before modifying JS logic, navigation, search, or the card/tab systems |
