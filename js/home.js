import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ================= DOM =================
const grid = document.getElementById("home-products-grid");
const searchInput = document.getElementById("home-search-input");

let allProducts = [];

// ================= CARD CREATOR =================
function createProductCard(product, id) {
  const card = document.createElement("div");
  card.className = "home-product-card";

  card.innerHTML = `
    <img class="home-product-image" src="${product.imageURL}" />
    <h3 class="home-product-title">${product.name}</h3>
    <p class="home-product-price">₹${product.price}</p>

    <div class="home-product-actions">
      <button class="home-btn home-btn-view" data-id="${id}">
        View
      </button>

      <button class="home-btn home-btn-cart" data-id="${id}">
        Add
      </button>
    </div>
  `;

  return card;
}

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  const snapshot = await getDocs(collection(db, "products"));

  allProducts = [];

  snapshot.forEach((doc) => {
    allProducts.push({ id: doc.id, ...doc.data() });
  });

  renderProducts(allProducts);
}

// ================= RENDER =================
function renderProducts(products) {
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach((product) => {
    const card = createProductCard(product, product.id);
    grid.appendChild(card);
  });
}


// ========================= LOGOUT =========================
const logoutBtn = document.getElementById("home-logout-btn");

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./login.html";
});


// ================= SEARCH =================
searchInput.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(value)
  );

  renderProducts(filtered);
});

// ================= INIT =================
loadProducts();