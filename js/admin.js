// =========================
// IMPORTS
// =========================
import { db } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";
import { auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================
// PROTECT ADMIN ROUTE
// =========================
protectRoute(["admin"]);

// =========================
// DOM ELEMENTS
// =========================
const form = document.getElementById("admin-product-form");
const nameInput = document.getElementById("admin-product-name-input");
const costInput = document.getElementById("admin-product-cost-input");
const priceInput = document.getElementById("admin-product-price-input");
const imageInput = document.getElementById("admin-product-image-input");
const productList = document.getElementById("admin-product-list");
alert("Before form")
// =========================
// ADD PRODUCT
// =========================
form.addEventListener("submit", async (e) => {
  alert("Entered Form")
  e.preventDefault();

  const name = nameInput.value.trim();
  const productcost = Number(costInput.value);
  const price = Number(priceInput.value);
  const imageURL = imageInput.value.trim(); // ✅ now string input

  if (!name || !cost || !price || !imageURL) {
    alert("Please fill all fields");
    return;
  }

  try {

    console.log("ADDING PRODUCT...");

    await addDoc(collection(db, "products"), {
      name,
      price,
      productcost,
      imageURL,
      createdAt: new Date()
    });

    console.log("PRODUCT ADDED");

    alert("Product added!");

    form.reset();
    loadProducts();

  } catch (err) {
    console.error("FULL ERROR:", err);
  }
});

// =========================
// LOAD PRODUCTS
// =========================
async function loadProducts() {
  productList.innerHTML = "Loading...";

  try {
    const snapshot = await getDocs(collection(db, "products"));

    productList.innerHTML = "";

    if (snapshot.empty) {
      productList.innerHTML = "<p>No products found</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const product = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "admin-card";

      card.innerHTML = `
        <img src="${product.imageURL || 'https://via.placeholder.com/150'}" 
             style="width:100%; border-radius:10px;" />

        <h3>${product.name}</h3>
        <p>₹${product.price}</p>

        <button data-id="${id}" class="delete-btn">Delete</button>
      `;

      productList.appendChild(card);
    });

  } catch (err) {
    productList.innerHTML = "<p>Failed to load products</p>";
    alert("Error loading products: " + err.message);
  }
}

// =========================
// DELETE PRODUCT
// =========================
productList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;

    try {
      await deleteDoc(doc(db, "products", id));
      alert("Product deleted!");
      loadProducts();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }
});

// =========================
// LOGOUT
// =========================
const logoutBtn = document.getElementById("admin-logout-btn");

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./login.html";
});

// =========================
// INIT
// =========================
window.addEventListener("DOMContentLoaded", loadProducts);