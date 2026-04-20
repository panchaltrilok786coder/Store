// =========================
// IMPORTS
// =========================
import { db, storage } from "./firebase.js";
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

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// =========================
// PROTECT ADMIN ROUTE
// =========================
protectRoute(["admin"]);

// =========================
// DOM ELEMENTS
// =========================
const form = document.getElementById("admin-product-form");
const nameInput = document.getElementById("admin-product-name-input");
const priceInput = document.getElementById("admin-product-price-input");
const imageInput = document.getElementById("admin-product-image-input");
const productList = document.getElementById("admin-product-list");

// =========================
// ADD PRODUCT
// =========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const file = imageInput.files[0];

  if (!name || !price || !file) {
    alert("Please fill all fields");
    return;
  }

  try {
    // Upload image to Firebase Storage
    const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);

    const imageURL = await getDownloadURL(storageRef);

    // Save product in Firestore
    await addDoc(collection(db, "products"), {
      name,
      price,
      imageURL,
      createdAt: new Date()
    });

    alert("Product added!");

    form.reset();
    loadProducts();

  } catch (err) {
    console.error("Error adding product:", err.message);
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

    snapshot.forEach((docSnap) => {
      const product = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "admin-card";

      card.innerHTML = `
        <img src="${product.imageURL}" style="width:100%; border-radius:10px;" />
        <h3>${product.name}</h3>
        <p>₹${product.price}</p>
        <button data-id="${id}" class="delete-btn">Delete</button>
      `;

      productList.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading products:", err.message);
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
      console.error("Delete error:", err.message);
    }
  }
});

// =========================
// LOGOUT
// =========================

const logoutBtn = document.getElementById("admin-logout-btn");

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "Store/login.html";
  } catch (err) {
    console.error("Logout error:", err.message);
  }
});

// =========================
// INIT
// =========================
loadProducts();