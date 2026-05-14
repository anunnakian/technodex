# Card Redesign — Design Spec
**Date:** 2026-05-14
**Status:** Approved

---

## Overview

Redesign the framework cards (front and back faces) to a modern, soft "Soft Elevated" style. The flip interaction is preserved unchanged. Only visual treatment changes — no content is added or removed except the framework name added to the back face.

---

## Design Direction: Soft Elevated

### Core principles
- **White card surface** on a light gray page background
- **Dynamic category-color stripe** (4px, solid) along the top edge — color from existing `--cat-*` variables
- **Layered soft shadows** (3 levels: near, mid, far/diffuse)
- **Category-tinted logo circle** — soft fill using the category color at ~7% opacity instead of flat gray
- **Category badge** replaced from icon-on-solid-color to **text label on tinted background** (e.g. "WEB", "DATA")
- **Border radius:** 20px on cards (up from 16px)

---

## Front Face

| Element | Current | New |
|---|---|---|
| Card shadow | 1 layer `--shadow-md` | 3 layers: `0 1px 2px rgba(0,0,0,0.04)`, `0 4px 16px rgba(0,0,0,0.08)`, `0 16px 48px rgba(0,0,0,0.07)` |
| Card radius | 16px | 20px |
| Top stripe | none | 4px solid `--cat-{slug}` color via CSS `[data-category]::before` |
| Logo circle bg | `#f3f4f6` flat gray | per-category CSS class `.img-container--{slug}` with `rgba` tint at 7% |
| Logo circle size | 88px | 74px |
| Logo image size | 64px | 48px |
| Category badge | Icon image on solid category-color bg | Uppercase text label ("WEB") on `rgba(cat-color, 0.10)` bg, category-colored text |
| Version pill | Gray `#f3f4f6` | Unchanged |
| Status badge | Already soft-tinted | Unchanged |

---

## Back Face

| Element | Current | New |
|---|---|---|
| Top stripe | none | Same 4px solid stripe as front face |
| Framework name | Absent | First element: `0.85rem bold`, `var(--text-primary)` |
| Description | 4-line clamp, `0.8rem` | 3-line clamp, `0.72rem` (name takes vertical space) |
| Divider | None | 1px `#f1f5f9` line after description |
| Stat rows | `Label:` + value inline | Two-column: uppercase label left (`0.68rem #94a3b8`), value right (`0.72rem #334155`) |
| Tags | Unchanged | Unchanged |
| View Project | `<span>` with FA icon | `↗ View Project` text, pushed to bottom with `margin-top: auto` |

---

## Implementation — `css/main.css`

**Card shell:**
- `.card`: shadow → 3-layer, `border-radius: 20px`
- `.front, .back`: `border-radius: 20px`

**Stripe** — CSS data-attribute approach, no JS color logic needed:
```css
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  border-radius: 20px 20px 0 0;
  background: var(--cat-default);
}
[data-category="web"]::before    { background: var(--cat-web); }
[data-category="data"]::before   { background: var(--cat-data); }
/* …one rule per category slug… */
```

**Logo circle** — per-category CSS classes for tinted bg (avoids needing rgb variants of CSS vars):
```css
.img-container { width: 74px; height: 74px; }
.image         { width: 48px; height: 48px; }
.img-container--web      { background: rgba(59,130,246,0.07); }
.img-container--data     { background: rgba(139,92,246,0.07); }
/* …one rule per category slug… */
```

**Category badge** — replace icon markup with text label:
```css
.framework__category__bg {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.framework__category__bg.web  { background: rgba(59,130,246,0.10); color: #3b82f6; }
/* …one rule per category slug… */
/* Remove the .framework__category__bg img rule entirely */
```

**Back face additions:**
```css
.back-name    { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); width: 100%; margin-bottom: 4px; }
.back-divider { width: 100%; height: 1px; background: #f1f5f9; margin: 6px 0; }
```

**Back face stat rows:**
```css
.stat-item        { justify-content: space-between; }
.stat-item .label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
.stat-item .value { font-size: 0.72rem; color: #334155; text-align: right; }
```

**Back face description:**
```css
.description p { -webkit-line-clamp: 3; }
```

---

## Implementation — `js/main.js`

**1. Set `data-category` on the card div** (drives the stripe via CSS):
```js
card.dataset.category = primary_category.toLowerCase().replace(/[^a-z0-9]/g, '-');
```

**2. Apply logo tint class on `.img-container`:**
```js
// replace static class with:
<div class="img-container img-container--${primary_category.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
```

**3. Replace category badge** — swap `<img>` inside `.framework__category__bg` with a text label:
```js
<div class="framework__category__bg ${slug}">
  ${primary_category.toUpperCase()}
</div>
```

**4. Add name + divider to back face:**
```js
<div class="back side" aria-hidden="true">
  <div class="framework-info">
    <div class="back-name">${name}</div>           // ← new
    <div class="description"><p>…</p></div>
    <div class="back-divider"></div>               // ← new
    <div class="stats">…</div>
    …
```

**5. Replace "View Project" link** (currently `<span>`) with `↗ View Project` text — no FA icon dependency:
```js
<div class="links">
  <span class="repo-link">↗ View Project</span>
</div>
```

---

## Files Changed

| File | Changes |
|---|---|
| `css/main.css` | Shadow, radius, stripe rules, logo tint classes, category badge text style, back-name, back-divider, stat-item layout |
| `js/main.js` | `data-category` attr, logo tint class, category badge text, back name + divider |

No changes to `details.html`, `details.js`, `details.css`, or `data/`.

---

## Out of Scope

- Detail page redesign
- Dark mode
- Card size / grid changes
- Search result item redesign
