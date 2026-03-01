# Architectural Patterns — Technodex

Patterns that appear across multiple files. Check here before making structural changes to data flow, navigation, or UI interactions.

---

## 1. Single JSON Source, Two Consumers

`data/frameworks.json` is a flat array consumed identically by both pages:

- **Homepage** (`js/main.js:8`) — fetches the full array, iterates every element to build cards
- **Detail page** (`js/details.js:22`) — fetches the same array, reads one element at `allFrameworks[id]`

The array **index** is the only identifier linking the two pages. There are no slugs or stable IDs used for routing.

**Consequence:** Never reorder entries in `frameworks.json` without also updating any bookmarked or shared `?id=` URLs.

---

## 2. Index-Based Navigation

Navigation between pages passes the array index as a query parameter, not a name or slug.

- Card click → `details.html?id=${index}` (`js/main.js:94`)
- Next button → `details.html?id=${id + 1}` (`js/details.js:188`)
- Back button → `window.history.back()` (`js/details.js:192`)
- Related tab → `findIndex(f => f.name.toLowerCase() === relName.toLowerCase())` (`js/details.js:168`)

The Related tab is the one place where a name lookup converts back to an index. If a framework name changes in the JSON, related links across other entries break silently.

---

## 3. Data Attribute Search Index

Rather than searching the DOM or re-querying the JSON, all searchable content is pre-joined into a single lowercase string on a `data-search` attribute at card creation time.

Built in `js/main.js:99-107`:
```
[name, primary_category, current_status, description, latest_stable_version, license, ...tags]
  .join(" ").toLowerCase()
```

Filtered in `js/main.js:135-143` via `String.prototype.includes()` on every keyup. This is O(n) substring matching — fast enough for the current dataset size but will degrade with thousands of entries.

---

## 4. Category → CSS Class Mapping

Dynamic coloring for the category icon badge uses a consistent sanitization transform applied in both JS and CSS:

- **JS** (`js/main.js:48`): `primary_category.toLowerCase().replace(/[^a-z0-9]/g, '-')`
- **CSS** (`css/main.css:238-251`): `.framework__category__bg.web`, `.framework__category__bg.data`, etc.

Adding a new category requires **both**:
1. A new CSS rule in `css/main.css` after line 251
2. A corresponding icon PNG in `assets/images/icons/<category>.png`

The same sanitization pattern is reused for status badges: `current_status.replace(/[^a-z0-9]/g, '-')` → `badge-{sanitized-status}` (`js/main.js:54`, `css/main.css:358-375`).

---

## 5. CSS Variable Theming

All colors, radii, and shadows are defined as custom properties on `:root` (`css/main.css:9-36`). Components reference variables, not raw values:

- `--accent` (#3b82f6) — interactive elements, focus rings, loader ring, scroll buttons
- `--text-primary` / `--text-secondary` — all text
- `--shadow-sm/md/lg` — layered elevation system used consistently across cards and buttons
- `--cat-*` — one variable per framework category, consumed by `.framework__category__bg` rules

Dark mode exists only for the footer (`css/main.css:589-616`, selector `[data-theme="dark"]`). The toggle mechanism is not yet implemented in JS.

---

## 6. Card Flip (3D CSS Transform)

The hover flip is pure CSS — no JS involved.

- `.cardContainer` sets `perspective: 1000px` (`css/main.css:105`)
- `.card` uses `transform-style: preserve-3d` and `transition: transform 0.45s ease`
- `.back` is pre-rotated `rotateY(180deg)` and uses `backface-visibility: hidden`
- Hover on `.cardContainer` rotates `.card` to `rotateY(180deg)`, revealing the back

Touch devices override this entirely (`css/main.css:126-135`): the hover media query is `(hover: none)`, so `.back` stays hidden and no flip occurs. The card click handler (which navigates to the detail page) fires on touch instead.

---

## 7. Data Attribute Tab System

The tab system on the detail page is driven entirely by data attributes — no IDs hardcoded in JS.

- Tab triggers: `[data-tab-value="#tab_1"]` spans (`details.html:21-24`)
- Tab content: `[data-tab-info]` divs with IDs `tab_1`, `tab_2`, `tab_3` (`details.html:27-33`)
- JS (`js/details.js:4-18`): queries both attribute selectors, click handler removes/adds `.active` class

To add a fourth tab: add a `<span data-tab-value="#tab_4">` and a `<div id="tab_4" data-tab-info>` in `details.html`, then populate it in `displayFrameworkDetails()` in `js/details.js`.

---

## 8. Staggered Async Rendering

Cards are not rendered all at once. After the JSON fetch resolves, `js/main.js:12-16` inserts one card every 150ms using `await new Promise(r => setTimeout(r, 150))`. This creates a perceived progressive load rather than a large DOM insertion. The spinner hides immediately after the fetch, before rendering begins.

---

## 9. Two-Phase Page Loader (Details Page Only)

`details.html` has a full-screen preloader overlay (`details.html:37-42`) that persists until JS adds `.loaded` to `<body>`.

- CSS (`css/details.css:561-661`): defines split-curtain animation and ring spinner, hidden by `.loaded` class transitions
- JS (`js/details.js:197-199`): `window.addEventListener("load", () => body.classList.add("loaded"))`

The `load` event fires after all resources (including images) finish loading, so the preloader covers any image flash. The homepage has no equivalent — it uses the inline `.lds-ring` spinner instead.

---

## 10. Relative Path Convention

Every asset reference across all files uses `./`-prefixed relative paths. No absolute paths, no root-relative paths (`/`). This allows the site to be served from any subdirectory or opened directly as a file.

- HTML links/scripts: `./css/main.css`, `./js/main.js`, `./assets/icons/default/icon.png`
- JS fetches: `./data/frameworks.json`
- JSON `logo_url` values: `./assets/images/tech/<name>.png`
- Fallback in JS: `'./assets/images/placeholder.png'` (`js/main.js:41`, `js/details.js:89-91`)

Any new asset or data reference must follow this convention.
