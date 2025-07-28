const poke_container = document.getElementById("poke-container");
const pokemon_count = 1010;
const colors = {
  fire: "#e03a3a",
  grass: "#50C878",
  electric: "#fad343",
  water: "#1E90FF",
  ground: "#735139",
  rock: "#63594f",
  fairy: "#EE99AC",
  poison: "#b34fb3",
  bug: "#A8B820",
  dragon: "#fc883a",
  psychic: "#882eff",
  flying: "#87CEEB",
  fighting: "#bf5858",
  normal: "#D2B48C",
  ghost: "#7B62A3",
  dark: "#414063",
  steel: "#808080",
  ice: "#98D8D8",
};
const regions = {
  kanto: {
    start: 1,
    end: 151,
  },
  johto: {
    start: 152,
    end: 251,
  },
  hoenn: {
    start: 252,
    end: 386,
  },
  test: {
    start: 387,
    end: 493,
  },
  unova: {
    start: 494,
    end: 649,
  },
  kalos: {
    start: 650,
    end: 721,
  },
  alola: {
    start: 722,
    end: 809,
  },
  galar: {
    start: 810,
    end: 898,
  },
  hisui: {
    start: 899,
    end: 905,
  },
  paldea: {
    start: 906,
    end: 1010,
  },
};

const loader = document.querySelector(".lds-ring");
const fetchPokemons = async (region) => {
  const { start, end } = regions[region];

  loader.classList.add("ring-active");
  
  // 1. Fetch the local JSON **once** (e.g. public/pokemon.json)
  const res = await fetch('/pokemon.json');   // path relative to your site root
  const allPokemon = await res.json();        // array of Pokémon objects
  loader.classList.remove('ring-active');     // hide loader immediately after the file is read

  // 2. Loop through the slice you need
  for (let i = start; i <= end; i++) {
    const data = allPokemon[i - 1];           // JSON is zero‑based; API IDs start at 1
    if (!data) break;                         // safety guard if end > file length
    createPokemonCard(data);
    await new Promise(r => setTimeout(r, 150)); // keep your pacing if needed
  }
};

const main_types = Object.keys(colors);

// const fetchPokemons = async () => {
//   for (let i = 1; i <= pokemon_count; i++) {
//     await getPokemon(i);
//   }
// };

// const getPokemon = async (id) => {
//   const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   console.log(data);
//   createPokemonCard(data);
// };

const createPokemonCard = (fw) => {

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

    var pokemonInnerHTML  = `
      <div class="front side">
          <div class="img-container">
              <img class="image" src="${logo_url || './images/placeholder.png'}" alt="${name} logo">
          </div>
          <div class="number">
          <span>${latest_stable_version || 'N/A'}</span>
          </div>
          <h3 class="name" title="${name}">${name}</h3>
          <div class="category">
              <div class="framework__category__bg ${primary_category.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
                  <img src="./images/icons/${primary_category.toLowerCase()}.png"
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

  // <div class="moves">
  // <div>${moves[0]}</div>
  // <div>${moves[1]}</div>
  // </div>

  card.innerHTML = pokemonInnerHTML;
  // Add event listener to open new page on card click
  card.addEventListener("click", () => {
    // Open new page with specific card details
    window.open(`details.html?id=${id}`, "_self");
  });

  const pokemonElHolder = document.createElement("div");
  pokemonElHolder.classList.add("cardContainer");
  pokemonElHolder.appendChild(card);

  poke_container.appendChild(pokemonElHolder);
};

const changeRegion = () => {
  const regionSelect = document.getElementById("regionSelect");
  regionSelect.addEventListener("click", (event) => {
    const selectedRegion = event.target.getAttribute("data-value");
    const activeRegion = document.querySelector(".active");
    if (selectedRegion) {
      poke_container.innerHTML = "";
      fetchPokemons(selectedRegion);
      activeRegion.classList.remove("active");
      event.target.classList.add("active");
    }
  });
};

fetchPokemons("kanto");

window.addEventListener("scroll", function () {
  var scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (window.scrollY > 100) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
});

document
  .getElementById("scrollToTopBtn")
  .addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

window.addEventListener("scroll", function () {
  var scrollToDownBtn = document.getElementById("scrollToDownBtn");
  if (window.scrollY > 100) {
    scrollToDownBtn.style.display = "block";
  } else {
    scrollToDownBtn.style.display = "none";
  }
});

document
  .getElementById("scrollToDownBtn")
  .addEventListener("click", function () {
    window.scrollTo({
      top: 999999,
      behavior: "smooth",
    });
  });
function search_pokemon() {
  let input = document.getElementById("searchbar").value;
  input = input.toLowerCase();
  input = input.replace(/\s+/g, ""); // removing all spaces from search box
  // storing all card along wiith details in variable
  let x = document.getElementsByClassName("cardContainer");

  for (i = 0; i < x.length; i++) {
    // checking  the name or type entered by user from search box if doesn't match than dont display the message
    if (!x[i].innerHTML.toLowerCase().includes(input)) {
      x[i].style.display = "none";
    }
    // checking  the name or type entered by user from search box if doesn't match than dont display the pokemon card
    else {
      x[i].style.display = "block";
    }
  }
}


// dark mode enabled
const darkModeButton = document.getElementById("dark");

darkModeButton.addEventListener("click", () => {

  let element = document.body;
  element.classList.toggle("dark-mode");
  document.body.classList.toggle("dark-mode");

  const regions = document.querySelectorAll(".regionvalue");
  console.log(regions);
  regions.forEach(region => {
    region.classList.toggle("dark-mode");
  });

});

const darkModeIcon = document.getElementById("dark");
darkModeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeIcon.classList.toggle("fa-toggle-on");
  // You can add additional elements that need dark mode here
});


changeRegion();
