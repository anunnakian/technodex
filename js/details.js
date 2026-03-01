const params = new URLSearchParams(window.location.search);
const slugId = params.get("id");

const tabs = document.querySelectorAll("[data-tab-value]");
const tabInfos = document.querySelectorAll("[data-tab-info]");

// Mark first tab span as active on load
tabs[0]?.classList.add("active");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = document.querySelector(tab.dataset.tabValue);
    tabInfos.forEach((tabInfo) => tabInfo.classList.remove("active"));
    tabs.forEach((t) => t.classList.remove("active"));
    target.classList.add("active");
    tab.classList.add("active");
  });
});

let _nextSlug = null;

const fetchFrameworkDetails = async () => {
  try {
    const res = await fetch("./data/frameworks.json");
    const allFrameworks = await res.json();
    const fw = allFrameworks.find(f => f.slug === slugId);

    if (!fw) {
      document.getElementById("pokemon-details").innerHTML =
        "<p>Framework not found.</p>";
      return;
    }

    displayFrameworkDetails(fw, allFrameworks);
  } catch (err) {
    console.error("Failed to load framework data:", err);
    document.getElementById("pokemon-details").innerHTML =
      "<p>Error loading framework data.</p>";
  }
};

const statusBadgeClass = (status) => {
  const map = {
    active: "badge-active",
    deprecated: "badge-deprecated",
    "maintenance-only": "badge-maintenance-only",
  };
  return map[status] || "badge-outline";
};

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
  } = fw;

  const currentIdx = allFrameworks.findIndex(f => f.slug === fw.slug);
  const nextFw = allFrameworks[currentIdx + 1];
  _nextSlug = nextFw ? nextFw.slug : null;

  const statusClass = statusBadgeClass(current_status);

  // ── Hero (buttons are position:fixed, no wrapper div needed) ──
  document.getElementById("pokemon-details").innerHTML = `
    <button class="previousBtn" onclick="backButton()">
      <i class="fas fa-chevron-left"></i>
    </button>
    ${nextFw
      ? `<button class="nextBtn" onclick="nextFramework()">
           <i class="fas fa-chevron-right"></i>
         </button>`
      : ""}
    <div class="names">
      <span class="japaneseName">${primary_category}</span>
      <div class="name">${name}</div>
      <span class="badge ${statusClass}">${current_status}</span>
      ${latest_stable_version
        ? `<span class="version-tag">v${latest_stable_version}</span>`
        : ""}
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

  // ── Tab 2: Details (structured key/value rows) ────────
  const tagPills = tags.length
    ? `<div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`
    : "";

  document.getElementById("tab_2").innerHTML = `
    <div class="about">
      <div class="about-row">
        <span class="about-label">Status</span>
        <span class="badge ${statusClass}">${current_status}</span>
      </div>
      <div class="about-row">
        <span class="about-label">Released</span>
        <span class="about-value">${initial_release_year || "Unknown"}</span>
      </div>
      <div class="about-row">
        <span class="about-label">Latest Version</span>
        <span class="about-value">${latest_stable_version || "N/A"}</span>
      </div>
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
  `;

  // ── Tab 3: Related frameworks (linked chips) ──────────
  const relatedHTML = related_frameworks.length
    ? related_frameworks
        .map((relName) => {
          const relFw = allFrameworks.find(
            (f) => f.name.toLowerCase() === relName.toLowerCase()
          );
          return relFw
            ? `<a href="details.html?id=${relFw.slug}" class="evolution__pokemon">
                 <h1>${relName}</h1>
               </a>`
            : `<div class="evolution__pokemon">
                 <h1>${relName}</h1>
               </div>`;
        })
        .join("")
    : `<p style="padding:20px 4px;color:#6b7280;font-size:0.875rem;">No related frameworks listed.</p>`;

  document.getElementById("tab_3").innerHTML = `
    <div class="evolution">${relatedHTML}</div>
  `;
};

const nextFramework = () => {
  if (_nextSlug) window.location.href = `details.html?id=${_nextSlug}`;
};

const backButton = () => {
  window.history.back();
};

fetchFrameworkDetails();

window.addEventListener("load", function () {
  document.querySelector("body").classList.add("loaded");
});