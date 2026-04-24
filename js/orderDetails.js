// ================= IMPORTS =================
import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ================= PROTECT =================
protectRoute(["customer"]);


// ================= GET ORDER ID =================
const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");


// ================= DOM =================
const container = document.getElementById("od-container");


// ================= LOAD ORDER =================
async function loadOrder(user) {

  if (!orderId) {
    container.innerHTML = "<p>Invalid order</p>";
    return;
  }

  try {
    const ref = doc(db, "orders", orderId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      container.innerHTML = "<p>Order not found</p>";
      return;
    }

    const data = snap.data();

    // SECURITY CHECK
    if (data.userId !== user.uid) {
      container.innerHTML = "<p>Unauthorized access</p>";
      return;
    }

    renderOrder(data, orderId);

  } catch (err) {
    alert("Error loading order: " + err.message);
  }
}


// ================= RENDER =================
function renderOrder(order, id) {

  let itemsHTML = "";

  order.items.forEach(item => {
    itemsHTML += `
      <div class="od-item">
        <span>${item.name} × ${item.quantity}</span>
        <span>₹${item.price * item.quantity}</span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="od-card">

      <div class="od-header">
        <span>Order ID: ${id}</span>
        <span class="od-status">${order.status}</span>
      </div>

      <div class="od-items">
        ${itemsHTML}
      </div>

      <div class="od-total">
        Total: ₹${order.totalAmount}
      </div>

      <div class="od-address">
        <p><strong>Delivery Details:</strong></p>
        <p>${order.address.name}</p>
        <p>${order.address.phone}</p>
        <p>${order.address.address}</p>
      </div>

    </div>
  `;
}


// ================= NAV =================
document.getElementById("od-home-btn").onclick = () => {
  window.location.href = "./home.html";
};

document.getElementById("od-orders-btn").onclick = () => {
  window.location.href = "./orders.html";
};

document.getElementById("od-logout-btn").onclick = async () => {
  await signOut(auth);
  window.location.href = "./login.html";
};


// ================= INIT =================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    alert("Please login first");
    window.location.href = "./login.html";
    return;
  }

  loadOrder(user);
});