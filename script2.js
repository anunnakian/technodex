const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get("id"));

const tabs = document.querySelectorAll("[data-tab-value]");
const tabInfos = document.querySelectorAll("[data-tab-info]");

// Mark first tab as active on load
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
    const res = await fetch("./framework.json");
    const allFrameworks = await res.json();
    const fw = allFrameworks[id];

    if (!fw) {
      document.getElementById("pokemon-details").innerHTML =
        "<p>Framework not found.</p>";
      return;
    }

    displayFrameworkDetails(fw, allFrameworks.length);
  } catch (err) {
    console.error("Failed to load framework data:", err);
    document.getElementById("pokemon-details").innerHTML =
      "<p>Error loading framework data.</p>";
  }
};

const displayFrameworkDetails = (fw, total) => {
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

  // Header
  document.getElementById("pokemon-details").innerHTML = `
    <div class="btn">
      <button class="previousBtn" onclick="backButton()"><i class="fas fa-chevron-left"></i></button>
      ${id + 1 < total ? `<button class="nextBtn" onclick="nextFramework()"><i class="fas fa-chevron-right"></i></button>` : ""}
    </div>
    <div class="names">
      <div class="japaneseName">${primary_category}</div>
      <div class="name">${name}</div>
    </div>
    <div class="top">
      <div class="image">
        <img class="imgFront" src="${logo_url || "./images/placeholder.png"}" alt="${name} logo"
          onerror="this.src='./images/placeholder.png'">
      </div>
    </div>
  `;

  // Tab 1: Overview
  document.getElementById("tab_1").innerHTML = `
    <div class="overview">
      <p>${description || "No description available."}</p>
      <div class="about">
        <div>Status: <b>${current_status}</b></div>
        <div>Released: <b>${initial_release_year || "Unknown"}</b></div>
        <div>Version: <b>${latest_stable_version || "N/A"}</b></div>
        <div>License: <b>${license || "Unknown"}</b></div>
        ${notable_use_cases ? `<div>Use Cases: <b>${notable_use_cases}</b></div>` : ""}
        ${website_or_repo ? `<div><a href="${website_or_repo}" target="_blank" rel="noopener noreferrer">View Project &rarr;</a></div>` : ""}
        ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
      </div>
    </div>
  `;

  // Tab 2: Stats
  const releaseYear = initial_release_year || 2000;
  document.getElementById("tab_2").innerHTML = `
    <div class="stats">
      <div class="stat">
        <div><span>Release Year:</span><span>${initial_release_year || "?"}</span></div>
        <meter min="1990" max="2025" value="${releaseYear}"></meter>
      </div>
      <div class="stat">
        <div><span>Status:</span><span>${current_status}</span></div>
      </div>
      <div class="stat">
        <div><span>Latest Version:</span><span>${latest_stable_version || "N/A"}</span></div>
      </div>
      <div class="stat">
        <div><span>License:</span><span>${license || "Unknown"}</span></div>
      </div>
    </div>
  `;

  // Tab 3: Related frameworks
  const related = related_frameworks
    ? related_frameworks
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  document.getElementById("tab_3").innerHTML = `
    <div class="evolution">
      ${
        related.length
          ? related
              .map((r) => `<div class="evolution__pokemon"><h1>${r}</h1></div>`)
              .join('<i class="fa-solid fa-caret-right fa-2x fa-beat"></i>')
          : "<p>No related frameworks listed.</p>"
      }
    </div>
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
