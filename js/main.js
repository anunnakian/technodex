// ── State ──────────────────────────────────────────────────────────────────
const state = {
  all: [],           // raw data from JSON
  filtered: [],      // after category + sort applied
  category: 'all',
  sort: 'default',
  search: '',
  favorites: new Set(JSON.parse(localStorage.getItem('tdx_favs') || '[]')),
  compare: [],       // up to 3 slugs
  renderedCount: 0,
};

const NEW_DAYS = 30; // version updated within this many days counts as "new"

// ── DOM refs ───────────────────────────────────────────────────────────────
const frameworkGrid  = document.getElementById('framework-grid');
const loader         = document.querySelector('.lds-ring');
const resultsEl      = document.getElementById('search-results');
const filterBar      = document.getElementById('filterBar');
const sortSelect     = document.getElementById('sortSelect');
const compareTray    = document.getElementById('compareTray');
const compareSlots   = document.getElementById('compareSlots');
const compareBtn     = document.getElementById('compareBtn');
const compareClearBtn= document.getElementById('compareClearBtn');
const compareModal   = document.getElementById('compareModal');
const compareModalClose = document.getElementById('compareModalClose');
const compareModalContent = document.getElementById('compareModalContent');

const PAGE_SIZE = 20;

// ── Sentinel / IntersectionObserver ───────────────────────────────────────
const sentinel = document.createElement('div');
sentinel.id = 'scroll-sentinel';
frameworkGrid.after(sentinel);

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) renderNextBatch();
}, { rootMargin: '300px' });


// ── URL state ──────────────────────────────────────────────────────────────
function readURL() {
  const p = new URLSearchParams(location.search);
  state.category = p.get('cat') || 'all';
  state.sort     = p.get('sort') || 'default';
  state.search   = p.get('q') || '';
  const cmp = p.get('compare');
  if (cmp) state.compare = cmp.split(',').filter(Boolean).slice(0, 3);
}

function writeURL() {
  const p = new URLSearchParams();
  if (state.category !== 'all')     p.set('cat',     state.category);
  if (state.sort     !== 'default') p.set('sort',    state.sort);
  if (state.search)                 p.set('q',       state.search);
  if (state.compare.length)         p.set('compare', state.compare.join(','));
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

// ── Fetch ──────────────────────────────────────────────────────────────────
async function fetchFrameworks() {
  loader.classList.add('ring-active');
  const res = await fetch('./data/frameworks.json');
  state.all = await res.json();
  loader.classList.remove('ring-active');

  readURL();
  buildFilterBar();
  syncFilterUI();
  applyFilters();
  observer.observe(sentinel);

  if (state.compare.length) {
    updateCompareTray();
    if (state.compare.length >= 2) openCompareModal();
  }
}

// ── Category filter bar ────────────────────────────────────────────────────
function buildFilterBar() {
  const cats = [...new Set(state.all.map(fw => fw.primary_category))].sort();
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      writeURL();
      syncFilterUI();
      applyFilters();
    });
    filterBar.appendChild(btn);
  });

  document.querySelector('.filter-btn[data-category="all"]').addEventListener('click', () => {
    state.category = 'all';
    writeURL();
    syncFilterUI();
    applyFilters();
  });
}

function syncFilterUI() {
  filterBar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === state.category);
  });
  sortSelect.value = state.sort;
  if (state.search) document.getElementById('searchbar').value = state.search;
}

// ── Sort ───────────────────────────────────────────────────────────────────
sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  writeURL();
  applyFilters();
});

function sortFrameworks(arr) {
  const copy = [...arr];
  switch (state.sort) {
    case 'az':        return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':        return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'year-asc':  return copy.sort((a, b) => (a.initial_release_year || 9999) - (b.initial_release_year || 9999));
    case 'year-desc': return copy.sort((a, b) => (b.initial_release_year || 0) - (a.initial_release_year || 0));
    case 'status':    return copy.sort((a, b) => (a.current_status || '').localeCompare(b.current_status || ''));
    default:          return copy;
  }
}

// ── Apply filters + re-render ──────────────────────────────────────────────
function applyFilters() {
  let result = state.all;

  if (state.category !== 'all') {
    result = result.filter(fw =>
      fw.primary_category.toLowerCase().replace(/[^a-z0-9]/g, '-') === state.category
    );
  }

  state.filtered = sortFrameworks(result);
  state.renderedCount = 0;
  frameworkGrid.innerHTML = '';

  const countEl = document.getElementById('toolCount');
  if (countEl) {
    countEl.textContent = state.filtered.length === state.all.length
      ? `${state.all.length} tools`
      : `${state.filtered.length} of ${state.all.length}`;
  }

  renderNextBatch();
}

// ── Render batch ───────────────────────────────────────────────────────────
function renderNextBatch() {
  if (state.search) return;
  if (state.renderedCount >= state.filtered.length) return;
  const batch = state.filtered.slice(state.renderedCount, state.renderedCount + PAGE_SIZE);
  batch.forEach(createFrameworkCard);
  state.renderedCount += batch.length;
  if (state.renderedCount >= state.filtered.length) observer.disconnect();
  else observer.observe(sentinel);
}

// ── "What's new" detection ─────────────────────────────────────────────────
function isNew(fw) {
  const ts = fw.version_updated_at;
  if (!ts) return false;
  const days = (Date.now() - new Date(ts).getTime()) / 86400000;
  return days <= NEW_DAYS;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function healthSignal(fw) {
  const { current_status, version_updated_at } = fw;
  if (current_status === 'deprecated') {
    return { label: 'End of life',          color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444', pulse: false };
  }
  if (current_status === 'maintenance-only') {
    return { label: 'Maintenance',   color: '#c2410c', bg: '#fff7ed', dot: '#f97316', pulse: false };
  }
  const days = daysSince(version_updated_at);
  if (days === null) return { label: 'Active',       color: '#15803d', bg: '#f0fdf4', dot: '#22c55e', pulse: true  };
  if (days <= 30)    return { label: 'Just updated', color: '#15803d', bg: '#f0fdf4', dot: '#22c55e', pulse: true  };
  if (days <= 180)   return { label: 'Active',       color: '#15803d', bg: '#f0fdf4', dot: '#22c55e', pulse: true  };
  if (days <= 365)   return { label: 'Slowing down', color: '#4d7c0f', bg: '#f7fee7', dot: '#84cc16', pulse: false };
  return { label: `${Math.floor(days / 30)}mo stale`, color: '#b45309', bg: '#fffbeb', dot: '#f59e0b', pulse: false };
}

// ── Card creation ──────────────────────────────────────────────────────────
function createFrameworkCard(fw) {
  const {
    name                 = 'Unknown',
    logo_url,
    primary_category     = 'Other',
    current_status       = 'unknown',
    initial_release_year,
    description,
    latest_stable_version,
    license,
    tags                 = [],
    website_or_repo
  } = fw;

  const catSlug = primary_category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cardId  = fw.slug || name.toLowerCase().replace(/\s+/g, '-');
  const h       = healthSignal(fw);

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';

  // "What's new" badge
  if (isNew(fw)) {
    const badge = document.createElement('span');
    badge.className = 'new-badge';
    badge.textContent = 'New';
    wrapper.appendChild(badge);
  }

  // Card link + card
  const cardLink = document.createElement('a');
  cardLink.href = `details.html?id=${fw.slug}`;
  cardLink.setAttribute('aria-label', name);
  cardLink.classList.add('cardContainer');
  cardLink.dataset.search = name.toLowerCase();

  const card = document.createElement('div');
  card.className = 'card';
  card.id = cardId;
  card.dataset.category = catSlug;

  card.innerHTML = `
    <div class="front side">
      <div class="img-container">
        <img class="image" src="${logo_url || './assets/images/placeholder.png'}" alt="${name} logo" onerror="this.src='./assets/images/placeholder.png';this.onerror=null;">
      </div>
      <div class="number"><span>${latest_stable_version || 'N/A'}</span></div>
      <h3 class="name" title="${name}">${name}</h3>
      <div class="category">
        <div class="framework__category__bg ${catSlug}">${primary_category.toUpperCase()}</div>
      </div>
      <div class="status-indicator">
        <span class="status-badge" style="background:${h.bg};color:${h.color}">
          <span class="status-dot${h.pulse ? ' pulse' : ''}" style="background:${h.dot}"></span>${h.label}
        </span>
      </div>
    </div>

    <div class="back side" aria-hidden="true">
      <div class="framework-info">
        <div class="back-name">${name}</div>
        <div class="description">
          <p>${description || 'No description available'}</p>
        </div>
        <div class="back-bottom">
          <div class="back-divider"></div>
          <div class="stats">
            <div class="stat-item">
              <span class="label">Released</span>
              <span class="value">${String(initial_release_year || '????')}</span>
            </div>
            <div class="stat-item">
              <span class="label">Version</span>
              <span class="value">${latest_stable_version || 'N/A'}</span>
            </div>
            <div class="stat-item">
              <span class="label">License</span>
              <span class="value">${license || 'Unknown'}</span>
            </div>
          </div>
          ${tags.length ? `<div class="tags">${tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
          ${website_or_repo ? `<div class="links"><span class="repo-link">↗ View Project</span></div>` : ''}
        </div>
      </div>
    </div>
  `;

  cardLink.appendChild(card);
  wrapper.appendChild(cardLink);

  // Action buttons (favorite + compare)
  const actions = document.createElement('div');
  actions.className = 'card-actions';

  // Favorite button
  const favBtn = document.createElement('button');
  favBtn.className = 'card-action-btn fav-btn';
  favBtn.setAttribute('aria-label', 'Add to favorites');
  favBtn.innerHTML = '<i class="fas fa-star" aria-hidden="true"></i>';
  favBtn.title = 'Favorite';
  if (state.favorites.has(fw.slug)) {
    favBtn.classList.add('favorited');
    favBtn.setAttribute('aria-pressed', 'true');
  }
  favBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(fw.slug, favBtn);
  });

  // Compare button
  const cmpBtn = document.createElement('button');
  cmpBtn.className = 'card-action-btn compare-add-btn';
  cmpBtn.setAttribute('aria-label', 'Add to comparison');
  cmpBtn.innerHTML = '<i class="fas fa-balance-scale" aria-hidden="true"></i>';
  cmpBtn.title = 'Compare';
  if (state.compare.includes(fw.slug)) {
    cmpBtn.classList.add('in-compare');
    cmpBtn.setAttribute('aria-pressed', 'true');
  }
  cmpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(fw, cmpBtn);
  });

  actions.appendChild(favBtn);
  actions.appendChild(cmpBtn);
  wrapper.appendChild(actions);

  frameworkGrid.appendChild(wrapper);
}

// ── Favorites ──────────────────────────────────────────────────────────────
function toggleFavorite(slug, btn) {
  if (state.favorites.has(slug)) {
    state.favorites.delete(slug);
    btn.classList.remove('favorited');
    btn.setAttribute('aria-pressed', 'false');
  } else {
    state.favorites.add(slug);
    btn.classList.add('favorited');
    btn.setAttribute('aria-pressed', 'true');
  }
  localStorage.setItem('tdx_favs', JSON.stringify([...state.favorites]));
}

// ── Comparison ─────────────────────────────────────────────────────────────
function toggleCompare(fw, btn) {
  const idx = state.compare.findIndex(s => s === fw.slug);
  if (idx !== -1) {
    state.compare.splice(idx, 1);
    btn.classList.remove('in-compare');
    btn.setAttribute('aria-pressed', 'false');
  } else {
    if (state.compare.length >= 3) return;
    state.compare.push(fw.slug);
    btn.classList.add('in-compare');
    btn.setAttribute('aria-pressed', 'true');
  }
  updateCompareTray();
}

function updateCompareTray() {
  writeURL();
  const count = state.compare.length;
  compareTray.hidden = count === 0;
  compareBtn.disabled = count < 2;

  compareSlots.innerHTML = '';
  state.compare.forEach(slug => {
    const fw = state.all.find(f => f.slug === slug);
    if (!fw) return;
    const slot = document.createElement('div');
    slot.className = 'compare-slot';
    slot.innerHTML = `
      <img src="${fw.logo_url || './assets/images/placeholder.png'}" alt="${fw.name}" onerror="this.src='./assets/images/placeholder.png';this.onerror=null;">
      <span>${fw.name}</span>
      <button class="compare-slot-remove" aria-label="Remove ${fw.name}">✕</button>
    `;
    slot.querySelector('.compare-slot-remove').addEventListener('click', () => {
      removeFromCompare(slug);
    });
    compareSlots.appendChild(slot);
  });
}

function removeFromCompare(slug) {
  state.compare = state.compare.filter(s => s !== slug);
  // Update pressed state on any visible button
  document.querySelectorAll('.compare-add-btn').forEach(btn => {
    const wrapper = btn.closest('.card-wrapper');
    const link = wrapper && wrapper.querySelector('a.cardContainer');
    if (link && link.href.includes(`id=${slug}`)) {
      btn.classList.remove('in-compare');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
  updateCompareTray();
}

compareClearBtn.addEventListener('click', () => {
  state.compare = [];
  document.querySelectorAll('.compare-add-btn.in-compare').forEach(btn => {
    btn.classList.remove('in-compare');
    btn.setAttribute('aria-pressed', 'false');
  });
  updateCompareTray();
});

compareBtn.addEventListener('click', openCompareModal);

function openCompareModal() {
  const fws = state.compare.map(slug => state.all.find(f => f.slug === slug)).filter(Boolean);
  if (fws.length < 2) return;

  compareModalContent.style.gridTemplateColumns = `160px repeat(${fws.length}, 1fr)`;

  const rows = [
    { label: 'Category',  key: fw => fw.primary_category },
    { label: 'Status',    key: fw => fw.current_status },
    { label: 'Released',  key: fw => String(fw.initial_release_year || '—') },
    { label: 'Version',   key: fw => fw.latest_stable_version || '—' },
    { label: 'License',   key: fw => fw.license || '—' },
    { label: 'Tags',      key: fw => (fw.tags || []).slice(0, 4).join(', ') || '—' },
  ];

  let html = '';

  // Header row — label placeholder + one col per fw
  html += `<div class="compare-header-col label-col"></div>`;
  fws.forEach(fw => {
    html += `
      <div class="compare-header-col">
        <img src="${fw.logo_url || './assets/images/placeholder.png'}" alt="${fw.name}" onerror="this.src='./assets/images/placeholder.png';this.onerror=null;">
        <div class="compare-header-name">${fw.name}</div>
      </div>`;
  });

  // Data rows — each row is a label cell + one value cell per fw (all flat grid children)
  rows.forEach(row => {
    html += `<div class="compare-row-label">${row.label}</div>`;
    fws.forEach(fw => {
      html += `<div class="compare-row-val">${row.key(fw)}</div>`;
    });
  });

  compareModalContent.innerHTML = html;
  compareModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

compareModalClose.addEventListener('click', closeCompareModal);
compareModal.addEventListener('click', (e) => {
  if (e.target === compareModal) closeCompareModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !compareModal.hidden) closeCompareModal();
});

function closeCompareModal() {
  compareModal.hidden = true;
  document.body.style.overflow = '';
}

// ── Search ─────────────────────────────────────────────────────────────────
function search_frameworks() {
  const input = document.getElementById('searchbar').value.toLowerCase().trim();
  state.search = input;
  writeURL();

  if (!input) {
    frameworkGrid.style.display = '';
    resultsEl.style.display = 'none';
    return;
  }

  frameworkGrid.style.display = 'none';

  const matches = state.all.filter(fw =>
    fw.name.toLowerCase().includes(input) ||
    (fw.tags || []).some(t => t.toLowerCase().includes(input))
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = `<p class="search-no-results">No results for "<strong>${input}</strong>"</p>`;
  } else {
    resultsEl.innerHTML = matches.map(fw => `
      <a href="details.html?id=${fw.slug}" class="search-result-item">
        <img class="search-result-logo" src="${fw.logo_url || './assets/images/placeholder.png'}" alt="${fw.name} logo" onerror="this.src='./assets/images/placeholder.png'">
        <span class="search-result-name">${fw.name}</span>
        <span class="search-result-category">${fw.primary_category}</span>
        <span class="badge badge-sm badge-${fw.current_status.replace(/[^a-z0-9]/g, '-')}">${fw.current_status}</span>
      </a>
    `).join('');
  }

  resultsEl.style.display = 'block';
}

// ── Scroll buttons ─────────────────────────────────────────────────────────
window.addEventListener('scroll', function () {
  const top  = document.getElementById('scrollToTopBtn');
  const down = document.getElementById('scrollToDownBtn');
  const show = window.scrollY > 100;
  top.style.display  = show ? 'block' : 'none';
  down.style.display = show ? 'block' : 'none';
});

document.getElementById('scrollToTopBtn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('scrollToDownBtn').addEventListener('click', () => {
  window.scrollTo({ top: 999999, behavior: 'smooth' });
});

// ── Boot ───────────────────────────────────────────────────────────────────
fetchFrameworks();
