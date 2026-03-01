const poke_container = document.getElementById("poke-container");
const loader = document.querySelector(".lds-ring");

const fetchFrameworks = async () => {
  loader.classList.add("ring-active");

  const res = await fetch('./data/frameworks.json');
  const allFrameworks = await res.json();
  loader.classList.remove('ring-active');

  for (let i = 0; i < allFrameworks.length; i++) {
    const data = allFrameworks[i];
    if (!data) break;
    createFrameworkCard(data, i);
    await new Promise(r => setTimeout(r, 150));
  }
};

const createFrameworkCard = (fw, index) => {

  const card = document.createElement('div');
  card.className = 'card';
  card.id = fw.slug || fw.name.toLowerCase().replace(/\s+/g, '-');

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

  const cardInnerHTML = `
    <div class="front side">
        <div class="img-container">
            <img class="image" src="${logo_url || './assets/images/placeholder.png'}" alt="${name} logo">
        </div>
        <div class="number">
        <span>${latest_stable_version || 'N/A'}</span>
        </div>
        <h3 class="name" title="${name}">${name}</h3>
        <div class="category">
            <div class="framework__category__bg ${primary_category.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
                <img src="./assets/images/icons/${primary_category.toLowerCase()}.png"
                 style="width: 22px;"
                 alt="${primary_category}" title="${primary_category}">
            </div>
        </div>
        <div class="status-indicator ${current_status}" title="Status: ${current_status}">
             <span class="badge badge-sm badge-${current_status.replace(/[^a-z0-9]/g, '-')}">${current_status}</span>
        </div>
    </div>

    <div class="back side">
        <div class="framework-info">
            <div class="description">
                <p>${description || 'No description available'}</p>
            </div>
            <span>${String(initial_release_year || '????')}</span>
            <div class="stats">
                <div class="stat-item">
                    <span class="label">Version:</span>
                    <span class="value">${latest_stable_version || 'N/A'}</span>
                </div>
                <div class="stat-item">
                    <span class="label">License:</span>
                    <span class="value">${license || 'Unknown'}</span>
                </div>
            </div>

            ${tags.length ? `
            <div class="tags">
                ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>` : ''}

            ${website_or_repo ? `
            <div class="links">
                <a href="${website_or_repo}" target="_blank" rel="noopener noreferrer" class="repo-link">
                    <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                    View Project
                </a>
            </div>` : ''}
        </div>
    </div>
  `;

  card.innerHTML = cardInnerHTML;
  card.addEventListener("click", () => {
    window.open(`details.html?id=${index}`, "_self");
  });

  const pokemonElHolder = document.createElement("div");
  pokemonElHolder.classList.add("cardContainer");
  pokemonElHolder.dataset.search = [
    name,
    primary_category,
    current_status,
    description || "",
    latest_stable_version || "",
    license || "",
    ...tags,
  ].join(" ").toLowerCase();
  pokemonElHolder.appendChild(card);

  poke_container.appendChild(pokemonElHolder);
};

fetchFrameworks();

window.addEventListener("scroll", function () {
  var scrollToTopBtn = document.getElementById("scrollToTopBtn");
  var scrollToDownBtn = document.getElementById("scrollToDownBtn");
  if (window.scrollY > 100) {
    scrollToTopBtn.style.display = "block";
    scrollToDownBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
    scrollToDownBtn.style.display = "none";
  }
});

document.getElementById("scrollToTopBtn").addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("scrollToDownBtn").addEventListener("click", function () {
  window.scrollTo({ top: 999999, behavior: "smooth" });
});

function search_pokemon() {
  const input = document.getElementById("searchbar").value.toLowerCase().trim();
  const cards = document.getElementsByClassName("cardContainer");

  for (let i = 0; i < cards.length; i++) {
    const match = !input || cards[i].dataset.search.includes(input);
    cards[i].style.display = match ? "" : "none";
  }
}
