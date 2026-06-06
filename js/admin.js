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
  doc,
  serverTimestamp
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

// =========================
// Global Var 
// =========================
const CLOUD_NAME = "djctmy4oq";
const UPLOAD_PRESET = "products";
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
});

async function uploadImageToCloudinary(file) {
  try{
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  return data.secure_url;
  }catch(err){
  alert("Error");
  return;
  }
}


// =========================
// ADD PRODUCT
// =========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("admin-product-image-input").files[0];
  let imageURL = "";
  if (file) {
  imageURL =  await uploadImageToCloudinary(file);
  }else{
  alert("Please upload a file");
  return;
  }

  const name = nameInput.value.trim();
  const productcost = Number(costInput.value);
  const price = Number(priceInput.value);
  if (!name || !productcost || !price || !imageURL) {
    alert("Please fill all fields");
    return;
  }
  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      productcost,
      imageURL,
      createdAt: serverTimestamp()
    });
    alert("Product added!");
    form.reset();
    loadProducts();
  } catch (err) {
    alert("FULL ERROR:"+ err);
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