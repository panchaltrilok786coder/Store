// ================= IMPORTS =================
import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ================= ROUTE PROTECTION =================
protectRoute(["customer"]);


// ================= DOM ELEMENTS =================
const orderContainer = document.getElementById("orders-container");


// ================= GLOBAL STATE =================
let allOrders = [];


// ================= LOAD ORDERS =================
async function loadOrders(user) {

  try {

    // STEP 1: Query only THIS user's orders
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    allOrders = [];

    // STEP 2: Store orders
    snapshot.forEach((docSnap) => {
      allOrders.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // STEP 3: Render UI
    renderOrders();

  } catch (err) {
    alert("Failed to load orders: " + err.message);
  }
}


// ================= RENDER ORDERS =================
function renderOrders() {

  orderContainer.innerHTML = "";

  if (allOrders.length === 0) {
    orderContainer.innerHTML = "<p>No orders found</p>";
    return;
  }

  allOrders.forEach((order) => {

    const card = document.createElement("div");
    card.classList.add("order-card");

    // Format items
    let itemsHTML = "";

    order.items.forEach(item => {
      itemsHTML += `
        <div class="order-item">
          ${item.name} × ${item.quantity} — ₹${item.price * item.quantity}
        </div>
      `;
    });

    card.innerHTML = `
      <div class="order-header">
        <span class="order-id">Order ID: ${order.id}</span>
        <span class="order-status">${order.status}</span>
      </div>

      <div class="order-items">
        ${itemsHTML}
      </div>

      <div class="order-total">
        Total: ₹${order.totalAmount}
      </div>
    `;

    orderContainer.appendChild(card);
  });
}


// ================= NAVBAR BUTTONS =================

// HOME
document.getElementById("orders-home-btn").addEventListener("click", () => {
  window.location.href = "./home.html";
});

// CART
document.getElementById("orders-cart-btn").addEventListener("click", () => {
  window.location.href = "./cart.html";
});

// LOGOUT
document.getElementById("orders-logout-btn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch (err) {
    alert("Logout error: " + err.message);
  }
});


// ================= INIT =================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    alert("Please login first");
    window.location.href = "./login.html";
    return;
  }

  loadOrders(user);
});