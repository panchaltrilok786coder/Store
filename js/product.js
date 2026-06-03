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


// ================= DOM =================
const nameEl = document.getElementById("product-name");
const priceEl = document.getElementById("product-price");
const imageEl = document.getElementById("product-image");
const buynowBtn = document.getElementById("buy-nowBtn");
const addToCartBtn = document.getElementById("add-to-cart-btn");

const relatedGrid = document.getElementById("related-products");


// ================= LOAD PRODUCT =================
async function loadProduct() {
  const ref = doc(db, "products", productId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    nameEl.innerText = "Product not found";
    return;
  }

  const data = snap.data();

  nameEl.innerText = data.name;
  priceEl.innerText = "₹" + data.price;
  imageEl.src = data.imageURL;
}

// FIXED: Added missing closing parenthesis and updated variables
buynowBtn.addEventListener("click", () => {
    // Added &source=buynow to clearly distinguish this flow from a normal cart checkout
    window.location.href = `./checkout.html?id=${productId}&itemCount=1&source=buynow`; 
});


// FIXED: Added missing closing parenthesis
addToCartBtn.addEventListener("click", () => {
    addToCart({
      id: productId,
      name: nameEl.innerText,
      price: Number(priceEl.innerText.replace("₹", "")),
      imageURL: imageEl.src
    });
});


// ================= RELATED PRODUCTS =================
async function loadRelated() {
  const snapshot = await getDocs(collection(db, "products"));
  relatedGrid.innerHTML = "";

  snapshot.forEach((docSnap) => {
    if (docSnap.id === productId) return;

    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "product-product-card";

    // FIXED: Added data attributes to the card so the click listener can grab them easily
    card.innerHTML = `
      <img class="product-product-image" src="${data.imageURL || "https://via.placeholder.com/300"}" />
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
}


// ================= CARD ACTIONS =================
relatedGrid.addEventListener("click", (e) => {
  const target = e.target;
  const id = target.dataset.id;

  // VIEW PRODUCT
  if (target.classList.contains("product-btn-view")) {
    window.location.href = `./product.html?id=${id}`;
  }

  // ADD TO CART
  // FIXED: Now correctly extracts data attributes from the specific card clicked
  if (target.classList.contains("product-btn-cart")) {
    addToCart({
      id: id,
      name: target.dataset.name,
      price: Number(target.dataset.price),
      imageURL: target.dataset.image
    });
    alert("Added to cart");
  }
});



// ================= NAV BUTTONS =================
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
  await signOut(auth);
  window.location.href = "./login.html";
};


// ================= INIT =================
loadProduct();
loadRelated();
