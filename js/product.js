import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";

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


// ================= RELATED PRODUCTS =================
async function loadRelated() {

  const snapshot = await getDocs(collection(db, "products"));

  relatedGrid.innerHTML = "";

  snapshot.forEach((docSnap) => {

    if (docSnap.id === productId) return;

    const data = docSnap.data();

    const card = document.createElement("div");
    card.className = "product-product-card";
     
  card.innerHTML = `
    <img class="product-product-image" src="${data.imageURL || "https://via.placeholder.com/300"}" />
    
    <h3 class="product-product-title">${data.name}</h3>
    
    <p class="product-product-price">₹${data.price}</p>

    <div class="product-product-actions">
       <button class="product-btn product-btn-view" data-id="${docSnap.id}">
        View
      </button>
      <button class="product-btn product-btn-cart" data-id="${docSnap.id}">
        Add
      </button>
    </div>
  `;
    relatedGrid.appendChild(card);
  });

}


// ================= CARD ACTIONS =================
relatedGrid.addEventListener("click", (e) => {

  const id = e.target.dataset.id;

  // VIEW PRODUCT
  if (e.target.classList.contains("product-btn-view")) {
    // redirect to product page
    window.location.href = `./product.html?id=${id}`;
  }

  // ADD TO CART (placeholder)
  if (e.target.classList.contains("product-btn-cart")) {
    addToCart({
    id: productId,
    name: nameEl.innerText,
    price: Number(priceEl.innerText.replace("₹", "")),
    imageURL: imageEl.src
  });
    alert("Added to cart");
  }

});



// ================= NAV BUTTONS =================
document.getElementById("home-btn").onclick = () => {
  window.location.href = "./home.html";
};

document.getElementById("cart-btn").onclick = () => {
  window.location.href = "./cart.html";
};

document.getElementById("logout-btn").onclick = async () => {
  await signOut(auth);
  window.location.href = "./login.html";
};


// ================= INIT =================
loadProduct();
loadRelated();