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
    card.className = "related-card";

    card.innerHTML = `
      <h4>${data.name}</h4>
      <p>₹${data.price}</p>
    `;

    relatedGrid.appendChild(card);
  });

}


// ================= NAV BUTTONS =================
document.getElementById("home-btn").onclick = () => {
  window.location.href = "./home.html";
};

document.getElementById("logout-btn").onclick = async () => {
  await signOut(auth);
  window.location.href = "./login.html";
};


// ================= INIT =================
loadProduct();
loadRelated();