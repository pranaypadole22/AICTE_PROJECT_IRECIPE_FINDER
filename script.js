import { CONFIG } from './config.js';

const APP_ID = CONFIG.APP_ID;
const APP_KEY = CONFIG.APP_KEY;
const USER_ID = CONFIG.USER_ID;

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const gridSection = document.getElementById("gridSection");
const resultsInfo = document.getElementById("resultsInfo");

const detailPanel = document.getElementById("detailPanel");
const panelClose = document.getElementById("panelClose");
const detailTitle = document.getElementById("detailTitle");
const detailImage = document.getElementById("detailImage");
const ingredientsList = document.getElementById("ingredientsList");
const nutritionBox = document.getElementById("nutritionBox");
const sourceLink = document.getElementById("sourceLink");
const panelFavBtn = document.getElementById("panelFavBtn");

const favBtn = document.getElementById("favoritesBtn");
const favCount = document.getElementById("favCount");
const favPanel = document.getElementById("favPanel");
const favList = document.getElementById("favList");
const favClose = document.getElementById("favClose");
const exploreBtn = document.getElementById("exploreBtn");

let currentRecipes = [];
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let selectedDiet = "";
let selectedHealth = "";

updateFavCount();

async function fetchRecipes(query) {
  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=${APP_ID}&app_key=${APP_KEY}${selectedDiet ? "&diet=" + selectedDiet : ""}${selectedHealth ? "&health=" + selectedHealth : ""}`;
  const res = await fetch(url, { headers: { "Edamam-Account-User": USER_ID } });
  if (!res.ok) throw new Error("API error " + res.status);
  const data = await res.json();
  return data.hits.map(hit => hit.recipe);
}

function renderCards(recipes, query) {
  gridSection.innerHTML = "";
  if (!recipes.length) { resultsInfo.textContent = `No recipes found for "${query}".`; return; }
  resultsInfo.textContent = `Found ${recipes.length} recipes for "${query}"`;
  recipes.forEach(r => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${r.image}" alt="${r.label}">
      <div class="card-body">
        <h3 class="card-title">${r.label}</h3>
        <p class="meta">${Math.round(r.calories)} kcal • ${r.yield} servings</p>
        <button>View Recipe</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => openPanel(r));
    gridSection.appendChild(card);
  });
}

function openPanel(recipe) {
  detailTitle.textContent = recipe.label;
  detailImage.src = recipe.image;
  sourceLink.href = recipe.url;

  ingredientsList.innerHTML = "";
  recipe.ingredientLines.forEach(line => { const li = document.createElement("li"); li.textContent = line; ingredientsList.appendChild(li); });

  nutritionBox.innerHTML = "";
  const nutrients = recipe.totalNutrients;
  const items = [
    { label: "Calories", val: Math.round(recipe.calories) + " kcal" },
    { label: "Protein", val: nutrients.PROCNT ? Math.round(nutrients.PROCNT.quantity) + " g" : "-" },
    { label: "Carbs", val: nutrients.CHOCDF ? Math.round(nutrients.CHOCDF.quantity) + " g" : "-" },
    { label: "Fat", val: nutrients.FAT ? Math.round(nutrients.FAT.quantity) + " g" : "-" },
  ];
  items.forEach(n => { const div = document.createElement("div"); div.textContent = `${n.label}: ${n.val}`; nutritionBox.appendChild(div); });

  panelFavBtn.textContent = favorites.find(f => f.uri === recipe.uri) ? "❤️ Saved" : "♡ Save";
  panelFavBtn.onclick = () => toggleFavorite(recipe);
  detailPanel.classList.add("active");
}

panelClose.addEventListener("click", () => detailPanel.classList.remove("active"));

function updateFavCount() { favCount.textContent = favorites.length; }

function toggleFavorite(recipe) {
  const exists = favorites.find(f => f.uri === recipe.uri);
  if (exists) favorites = favorites.filter(f => f.uri !== recipe.uri);
  else favorites.push(recipe);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavCount();
  renderFavList();
  panelFavBtn.textContent = favorites.find(f => f.uri === recipe.uri) ? "❤️ Saved" : "♡ Save";
}

function renderFavList() {
  favList.innerHTML = "";
  if (!favorites.length) { favList.innerHTML = "<p>No favorites yet.</p>"; return; }
  favorites.forEach(r => {
    const favCard = document.createElement("div");
    favCard.className = "fav-card";
    favCard.innerHTML = `
      <img src="${r.image}" alt="${r.label}">
      <div>
        <h4>${r.label}</h4>
        <p>${Math.round(r.calories)} kcal • ${r.yield} servings</p>
        <div class="fav-buttons">
          <button class="openFavBtn">Open</button>
          <button class="removeFav">Remove</button>
        </div>
      </div>
    `;
    favCard.querySelector(".openFavBtn").addEventListener("click", () => { openPanel(r); favPanel.classList.remove("active"); });
    favCard.querySelector(".removeFav").addEventListener("click", () => {
      favorites = favorites.filter(f => f.uri !== r.uri);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      updateFavCount();
      renderFavList();
    });
    favList.appendChild(favCard);
  });
}

favBtn.addEventListener("click", () => { renderFavList(); favPanel.classList.add("active"); });
favClose.addEventListener("click", () => favPanel.classList.remove("active"));

searchForm.addEventListener("submit", async e => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;
  resultsInfo.textContent = "Searching...";
  try {
    currentRecipes = await fetchRecipes(q);
    renderCards(currentRecipes, q);
  } catch (err) { console.error(err); resultsInfo.textContent = "Error fetching recipes."; }
});

document.querySelectorAll(".filterBtn").forEach(btn => btn.addEventListener("click", async () => {
  document.querySelectorAll(".filterBtn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedDiet = btn.dataset.diet;
  if (searchInput.value.trim()) { currentRecipes = await fetchRecipes(searchInput.value.trim()); renderCards(currentRecipes, searchInput.value.trim()); }
}));

document.querySelectorAll(".healthBtn").forEach(btn => btn.addEventListener("click", async () => {
  document.querySelectorAll(".healthBtn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedHealth = btn.dataset.health;
  if (searchInput.value.trim()) { currentRecipes = await fetchRecipes(searchInput.value.trim()); renderCards(currentRecipes, searchInput.value.trim()); }
}));

if (exploreBtn) { exploreBtn.addEventListener("click", () => { document.getElementById("filtersSection").scrollIntoView({ behavior: "smooth" }); }); }
