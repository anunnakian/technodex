const params = new URLSearchParams(window.location.search);
const slugId = params.get("id");

const tabs = document.querySelectorAll("[data-tab-value]");
const tabInfos = document.querySelectorAll("[data-tab-info]");

function activateTab(tab) {
  const target = document.querySelector(tab.dataset.tabValue);
  tabInfos.forEach((tabInfo) => tabInfo.classList.remove("active"));
  tabs.forEach((t) => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });
  target.classList.add("active");
  tab.classList.add("active");
  tab.setAttribute("aria-selected", "true");
}

tabs[0]?.classList.add("active");
tabs[0]?.setAttribute("aria-selected", "true");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activateTab(tab);
    }
  });
});

let _nextSlug = null;

// ── Constants ──────────────────────────────────────────────────────────────
const RAW_JSON = "https://raw.githubusercontent.com/anunnakian/technodex/main/data/frameworks.json";

const STATUS_META = {
  active:            { label: "Active",      color: "#15803d", bg: "#f0fdf4", dot: "#22c55e", pulse: true,  shields: "brightgreen" },
  deprecated:        { label: "Deprecated",  color: "#b91c1c", bg: "#fef2f2", dot: "#ef4444", pulse: false, shields: "red"         },
  "maintenance-only":{ label: "Maintenance", color: "#c2410c", bg: "#fff7ed", dot: "#f97316", pulse: false, shields: "orange"      },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function statusMeta(s) {
  return STATUS_META[s] || { label: s, color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af", pulse: false, shields: "lightgrey" };
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function healthSignal(fw) {
  const { current_status, version_updated_at } = fw;
  if (current_status === "deprecated") {
    return { label: "End of life", color: "#b91c1c", icon: "🔴" };
  }
  if (current_status === "maintenance-only") {
    return { label: "Maintenance mode — no new features", color: "#c2410c", icon: "🟠" };
  }
  const days = daysSince(version_updated_at);
  if (days === null) return { label: "Status: Active", color: "#15803d", icon: "🟢" };
  if (days <= 30)  return { label: "Recently updated", color: "#15803d", icon: "🟢" };
  if (days <= 180) return { label: "Actively maintained", color: "#15803d", icon: "🟢" };
  if (days <= 365) return { label: "Receiving updates", color: "#4d7c0f", icon: "🟡" };
  return { label: `Last updated ${Math.floor(days / 30)} months ago`, color: "#b45309", icon: "🟡" };
}

function buildVersionBadgeUrl(slug, name) {
  const query = `$[?(@.slug=="${slug}")].latest_stable_version`;
  return `https://img.shields.io/badge/dynamic/json?url=${encodeURIComponent(RAW_JSON)}&query=${encodeURIComponent(query)}&label=${encodeURIComponent(name)}&color=blue&prefix=v`;
}

function buildStatusBadgeUrl(status, name) {
  const meta = statusMeta(status);
  const text = encodeURIComponent(meta.label.toLowerCase());
  return `https://img.shields.io/badge/status-${text}-${meta.shields}`;
}

// ── Fetch ──────────────────────────────────────────────────────────────────
const fetchFrameworkDetails = async () => {
  try {
    const res = await fetch("./data/frameworks.json");
    const allFrameworks = await res.json();
    const fw = allFrameworks.find(f => f.slug === slugId);

    if (!fw) {
      document.getElementById("framework-details").innerHTML =
        '<p style="padding:2rem;text-align:center">Framework not found. <a href="./index.html">Back to homepage</a></p>';
      return;
    }

    displayFrameworkDetails(fw, allFrameworks);
  } catch (err) {
    console.error("Failed to load framework data:", err);
    document.getElementById("framework-details").innerHTML =
      '<p style="padding:2rem;text-align:center">Error loading framework data. <a href="./index.html">Back to homepage</a></p>';
  }
};

// ── Render ─────────────────────────────────────────────────────────────────
const displayFrameworkDetails = (fw, allFrameworks) => {
  const {
    name = "Unknown",
    logo_url,
    primary_category = "Other",
    current_status = "unknown",
    initial_release_year,
    description,
    latest_stable_version,
    website_or_repo,
    license,
    tags = [],
    notable_use_cases = [],
    related_frameworks = [],
    version_updated_at,
  } = fw;

  const currentIdx = allFrameworks.findIndex(f => f.slug === fw.slug);
  const nextFw = allFrameworks[currentIdx + 1];
  _nextSlug = nextFw ? nextFw.slug : null;

  const meta = statusMeta(current_status);
  const health = healthSignal(fw);
  const days = daysSince(version_updated_at);

  // ── Hero ──────────────────────────────────────────────
  document.getElementById("framework-details").innerHTML = `
    <button class="previousBtn" onclick="backButton()" aria-label="Back to homepage">
      <i class="fas fa-chevron-left" aria-hidden="true"></i>
    </button>
    ${nextFw
      ? `<button class="nextBtn" onclick="nextFramework()" aria-label="Next framework">
           <i class="fas fa-chevron-right" aria-hidden="true"></i>
         </button>`
      : ""}
    <div class="names">
      <span class="japaneseName">${primary_category}</span>
      <div class="name">${name}</div>
      <span class="status-badge-detail" style="background:${meta.bg};color:${meta.color}">
        <span class="status-dot-detail${meta.pulse ? " pulse" : ""}" style="background:${meta.dot}"></span>
        ${meta.label}
      </span>
      ${latest_stable_version
        ? `<span class="version-tag">v${latest_stable_version}</span>`
        : ""}
      <span class="health-signal" style="color:${health.color}">
        ${health.icon} ${health.label}${days !== null ? ` <span class="health-date">(${version_updated_at})</span>` : ""}
      </span>
    </div>
    <div class="top">
      <div class="image">
        <img class="imgFront"
             src="${logo_url || "./assets/images/placeholder.png"}"
             alt="${name} logo"
             onerror="this.src='./assets/images/placeholder.png'">
      </div>
    </div>
  `;

  // ── Tab 1: Overview ───────────────────────────────────
  const useCaseTags = notable_use_cases
    .map((u) => `<span class="tag">${u}</span>`)
    .join("");

  document.getElementById("tab_1").innerHTML = `
    <div class="overview">
      <p>${description || "No description available."}</p>
      ${useCaseTags
        ? `<div class="use-cases">
             <span class="use-cases-label">Use Cases</span>
             ${useCaseTags}
           </div>`
        : ""}
    </div>
  `;

  // ── Tab 2: Details ────────────────────────────────────
  const tagPills = tags.length
    ? `<div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`
    : "";

  const versionBadgeUrl = buildVersionBadgeUrl(fw.slug, name);
  const statusBadgeUrl  = buildStatusBadgeUrl(current_status, name);
  const mdVersion  = `![${name} version](${versionBadgeUrl})`;
  const mdStatus   = `![${name} status](${statusBadgeUrl})`;
  const htmlVersion = `<img alt="${name} version" src="${versionBadgeUrl}">`;
  const htmlStatus  = `<img alt="${name} status" src="${statusBadgeUrl}">`;

  document.getElementById("tab_2").innerHTML = `
    <div class="about">
      <div class="about-row">
        <span class="about-label">Status</span>
        <span class="status-badge-detail" style="background:${meta.bg};color:${meta.color}">
          <span class="status-dot-detail${meta.pulse ? " pulse" : ""}" style="background:${meta.dot}"></span>
          ${meta.label}
        </span>
      </div>
      <div class="about-row">
        <span class="about-label">Released</span>
        <span class="about-value">${initial_release_year || "Unknown"}</span>
      </div>
      <div class="about-row">
        <span class="about-label">Latest Version</span>
        <span class="about-value">${latest_stable_version || "N/A"}</span>
      </div>
      ${version_updated_at ? `
      <div class="about-row">
        <span class="about-label">Version updated</span>
        <span class="about-value">${version_updated_at}${days !== null ? ` · ${days <= 1 ? "today" : days + " days ago"}` : ""}</span>
      </div>` : ""}
      <div class="about-row">
        <span class="about-label">License</span>
        <span class="about-value">${license || "Unknown"}</span>
      </div>
      <div class="about-row">
        <span class="about-label">Category</span>
        <span class="about-value">${primary_category}</span>
      </div>
      ${tagPills
        ? `<div class="about-row">
             <span class="about-label">Tags</span>
             ${tagPills}
           </div>`
        : ""}
      ${website_or_repo
        ? `<div class="about-row">
             <span class="about-label">Website</span>
             <a href="${website_or_repo}" target="_blank" rel="noopener noreferrer" class="about-link">
               View Project →
             </a>
           </div>`
        : ""}
    </div>

    <div class="embed-section">
      <div class="embed-title">Embed badges</div>
      <div class="embed-previews">
        <img src="${versionBadgeUrl}" alt="version badge" class="embed-preview-img">
        <img src="${statusBadgeUrl}"  alt="status badge"  class="embed-preview-img">
      </div>
      <div class="embed-snippets">
        <div class="embed-snippet-label">Markdown</div>
        <div class="embed-snippet-row">
          <code class="embed-code">${escHtml(mdVersion)}</code>
          <button class="embed-copy-btn" data-copy="${escAttr(mdVersion)}">Copy</button>
        </div>
        <div class="embed-snippet-row">
          <code class="embed-code">${escHtml(mdStatus)}</code>
          <button class="embed-copy-btn" data-copy="${escAttr(mdStatus)}">Copy</button>
        </div>
        <div class="embed-snippet-label" style="margin-top:10px">HTML</div>
        <div class="embed-snippet-row">
          <code class="embed-code">${escHtml(htmlVersion)}</code>
          <button class="embed-copy-btn" data-copy="${escAttr(htmlVersion)}">Copy</button>
        </div>
        <div class="embed-snippet-row">
          <code class="embed-code">${escHtml(htmlStatus)}</code>
          <button class="embed-copy-btn" data-copy="${escAttr(htmlStatus)}">Copy</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll(".embed-copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.copy).then(() => {
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });

  // ── Tab 3: Related ────────────────────────────────────
  const relatedHTML = related_frameworks.length
    ? related_frameworks
        .map((relName) => {
          const relFw = allFrameworks.find(
            (f) => f.name.toLowerCase() === relName.toLowerCase()
          );
          return relFw
            ? `<a href="details.html?id=${relFw.slug}" class="related-chip"><span>${relName}</span></a>`
            : `<div class="related-chip"><span>${relName}</span></div>`;
        })
        .join("")
    : `<p style="padding:20px 4px;color:#6b7280;font-size:0.875rem;">No related frameworks listed.</p>`;

  document.getElementById("tab_3").innerHTML = `
    <div class="evolution">${relatedHTML}</div>
  `;
};

// ── Escape helpers ─────────────────────────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escAttr(s) {
  return s.replace(/"/g,"&quot;");
}

// ── Navigation ─────────────────────────────────────────────────────────────
const nextFramework = () => {
  if (_nextSlug) window.location.href = `details.html?id=${_nextSlug}`;
};

const backButton = () => {
  window.location.href = "./index.html";
};

fetchFrameworkDetails();

window.addEventListener("load", function () {
  document.querySelector("body").classList.add("loaded");
});
