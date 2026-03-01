const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get("id"));

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

const fetchFrameworkDetails = async () => {
  try {
    const res = await fetch("./pokemon.json");
    const allFrameworks = await res.json();
    const fw = allFrameworks[id];

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
    notable_use_cases,
    related_frameworks,
  } = fw;

  const total = allFrameworks.length;
  const statusClass = statusBadgeClass(current_status);

  // ── Hero (buttons are position:fixed, no wrapper div needed) ──
  document.getElementById("pokemon-details").innerHTML = `
    <button class="previousBtn" onclick="backButton()">
      <i class="fas fa-chevron-left"></i>
    </button>
    ${id + 1 < total
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
             src="${logo_url || "./images/placeholder.png"}"
             alt="${name} logo"
             onerror="this.src='./images/placeholder.png'">
      </div>
    </div>
  `;

  // ── Tab 1: Overview ───────────────────────────────────
  const useCaseTags = notable_use_cases
    ? notable_use_cases
        .split(",")
        .map((u) => `<span class="tag">${u.trim()}</span>`)
        .join("")
    : "";

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
  const related = related_frameworks
    ? related_frameworks.split(",").map((r) => r.trim()).filter(Boolean)
    : [];

  const relatedHTML = related.length
    ? related
        .map((relName) => {
          const relIdx = allFrameworks.findIndex(
            (f) => f.name.toLowerCase() === relName.toLowerCase()
          );
          return relIdx >= 0
            ? `<a href="details.html?id=${relIdx}" class="evolution__pokemon">
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
  window.location.href = `details.html?id=${id + 1}`;
};

const backButton = () => {
  window.history.back();
};

fetchFrameworkDetails();

window.addEventListener("load", function () {
  document.querySelector("body").classList.add("loaded");
});
