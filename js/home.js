// ================= IMPORTS =================
import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";
import { addToCart } from "./cartService.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ================= PROTECT ROUTE =================
// Only customers allowed
protectRoute(["customer"]);


// ================= DOM =================
const grid = document.getElementById("home-products-grid");
const searchInput = document.getElementById("home-search-input");
const logoutBtn = document.getElementById("home-logout-btn");

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
  grid.innerHTML = "Loading...";

  try {
    const snapshot = await getDocs(collection(db, "products"));

    allProducts = [];

    snapshot.forEach((doc) => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });

    renderProducts(allProducts);

  } catch (err) {
    console.error("Error loading products:", err.message);
    grid.innerHTML = "Failed to load products";
  }
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


// ================= SEARCH =================
searchInput.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(value)
  );

  renderProducts(filtered);
});


// ================= CARD ACTIONS =================
grid.addEventListener("click", (e) => {

  const button = e.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;

  // VIEW PRODUCT
  if (button.classList.contains("home-btn-view")) {
    window.location.href = `./product.html?id=${id}`;
  }

  // ADD TO CART
  if (button.classList.contains("home-btn-cart")) {

    const product = allProducts.find(p => p.id === id);
    alert("PRODUCT FOUND: " + JSON.stringify(product));

    if (!product) {
      alert("Product not found");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageURL: product.imageURL
    });

    alert("Added to cart");
  }

});


// ================= LOGOUT =================
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch (err) {
    console.error("Logout error:", err.message);
  }
});

//=================== Navbar ===================
document.getElementById("home-cart-btn").onclick = () => {
  window.location.href = "./cart.html";
};
document.getElementById("home-orders-btn").onclick = () => {
  window.location.href = "./orders.html";
};

// ================= INIT =================
loadProducts();