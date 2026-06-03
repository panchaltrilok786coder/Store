import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";
import { addToCart } from "./cartService.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ================= PROTECT =================
protectRoute(["customer", "admin"]);

// ================= GET PRODUCT ID =================
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// ================= DOM ELEMENTS =================
const nameEl = document.getElementById("product-name");
const priceEl = document.getElementById("product-price");
const imageEl = document.getElementById("product-image");
const buynowBtn = document.getElementById("buy-nowBtn");
const addToCartBtn = document.getElementById("add-to-cart-btn");
const relatedGrid = document.getElementById("related-products");

// QUANTITY DOM CONTROLS
const qtyMinusBtn = document.getElementById("qty-minus-btn");
const qtyPlusBtn = document.getElementById("qty-plus-btn");
const qtyValueEl = document.getElementById("qty-value");

// ================= APP STATE =================
let currentQuantity = 1;

// ================= LOAD MAIN PRODUCT =================
async function loadProduct() {
  try {
    if (!productId) {
      nameEl.innerText = "No product selected";
      return;
    }

    const ref = doc(db, "products", productId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      nameEl.innerText = "Product not found";
      return;
    }

    const data = snap.data();

    nameEl.innerText = data.name;
    priceEl.innerText = "₹" + data.price;
    imageEl.src = data.imageURL || "https://via.placeholder.com/450";
    imageEl.alt = data.name;
    
    const descEl = document.getElementById("product-description-text");
    if (descEl && data.description) {
      descEl.innerText = data.description;
    }
  } catch (err) {
    console.error("Error loading product:", err);
    nameEl.innerText = "Error loading product data";
  }
}

// ================= QUANTITY INTERACTION LOCKS =================
qtyMinusBtn.addEventListener("click", () => {
  if (currentQuantity > 1) {
    currentQuantity--;
    qtyValueEl.innerText = currentQuantity;
  }
});

qtyPlusBtn.addEventListener("click", () => {
  currentQuantity++;
  qtyValueEl.innerText = currentQuantity;
});

// ================= DIRECT CHECKOUT ACTION =================
buynowBtn.addEventListener("click", () => {
  if (!productId) return alert("Invalid product instance");
  window.location.href = `./checkout.html?id=${productId}&itemCount=${currentQuantity}&source=buynow`; 
});

// ================= PERSISTENT CART STORAGE ACTIONS =================
addToCartBtn.addEventListener("click", () => {
  if (!productId) return;
  
  addToCart({
    id: productId,
    name: nameEl.innerText,
    price: Number(priceEl.innerText.replace("₹", "")),
    imageURL: imageEl.src,
    quantity: currentQuantity
  });
  alert(`Added ${currentQuantity} item(s) to your cart!`);
});

// ================= RELATED CONTEXT RETRIEVAL =================
async function loadRelated() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    relatedGrid.innerHTML = "";

    snapshot.forEach((docSnap) => {
      // Avoid rendering the product currently being viewed
      if (docSnap.id === productId) return;

      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "product-product-card";

      card.innerHTML = `
        <img class="product-product-image" src="${data.imageURL || "https://via.placeholder.com/300"}" alt="${data.name}" />
        <h3 class="product-product-title">${data.name}</h3>
        <p class="product-product-price">₹${data.price}</p>
        <div class="product-product-actions">
          <button class="product-btn product-btn-view" data-id="${docSnap.id}">
            View
          </button>
          <button class="product-btn product-btn-cart" 
                  data-id="${docSnap.id}" 
                  data-name="${data.name}" 
                  data-price="${data.price}" 
                  data-image="${data.imageURL || ''}">
            Add
          </button>
        </div>
      `;
      relatedGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading related grid context:", err);
  }
}

// ================= CARD EVENTS RESOLUTION =================
relatedGrid.addEventListener("click", (e) => {
  const target = e.target;
  const id = target.dataset.id;

  if (target.classList.contains("product-btn-view")) {
    window.location.href = `./product.html?id=${id}`;
  }

  if (target.classList.contains("product-btn-cart")) {
    addToCart({
      id: id,
      name: target.dataset.name,
      price: Number(target.dataset.price),
      imageURL: target.dataset.image,
      quantity: 1 // Defaults to 1 for quick additions
    });
    alert("Added to cart");
  }
});

// ================= NAVIGATION BUTTON HANDLERS =================
document.getElementById("product-home-btn").onclick = () => {
  window.location.href = "./home.html";
};

document.getElementById("product-cart-btn").onclick = () => {
  window.location.href = "./cart.html";
};

document.getElementById("product-orders-btn").onclick = () => {
  window.location.href = "./orders.html";
};

document.getElementById("product-logout-btn").onclick = async () => {
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch (err) {
    alert("Sign out processing failed.");
  }
};

// ================= INITIALIZE EXECUTION =================
loadProduct();
loadRelated();
