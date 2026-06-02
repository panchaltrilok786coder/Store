// ================= IMPORTS =================
import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";

import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  orderBy,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ================= ROUTE PROTECTION =================
protectRoute(["admin"]);


// ================= DOM =================
const ordersContainer = document.getElementById("admin-orders-list");
const filterButtons = document.querySelectorAll(".filter-btn");
const logoutBtn = document.getElementById("admin-logout-btn");


// ================= GLOBAL STATE =================
let allOrders = [];


// ================= FETCH ORDERS =================
async function fetchOrders(ref) {
  try {
    const snap = await getDocs(ref);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (err) {
    alert("Error fetching orders: " + err.message);
    return [];
  }
}


// ================= LOAD ORDERS =================
async function loadOrders(ref) {
  ordersContainer.innerHTML = "Loading...";

  allOrders = await fetchOrders(ref);

  renderOrders();
}


// ================= RENDER =================
function renderOrders() {

  ordersContainer.innerHTML = "";

  if (allOrders.length === 0) {
    ordersContainer.innerHTML = "<p>No orders found</p>";
    return;
  }

  allOrders.forEach(order => {

    const itemsHTML = (order.items || [])
      .map(item => `<p>${item.name} × ${item.quantity}</p>`)
      .join("");

    const card = document.createElement("div");
    card.className = "order-card";

    card.innerHTML = `
      <div class="od-header">
        <span>Order ID: ${order.id}</span>
        <span class="od-status">${order.status}</span>
      </div>

      <div class="od-items">
        ${itemsHTML}
      </div>

      <div>Total: ₹${order.totalAmount || 0}</div>

      <div class="od-address">
        <p>${order.address?.name || ""}</p>
        <p>${order.address?.phone || ""}</p>
        <p>${order.address?.address || ""}</p>
      </div>

      <select class="order-status" data-id="${order.id}">
        <option value="Placed">Placed</option>
        <option value="Pending">Pending</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    `;

    ordersContainer.appendChild(card);
  });
}

// ================= STATUS UPDATE =================
ordersContainer.addEventListener("change", async (e) => {

  if (e.target.classList.contains("order-status")) {

    const id = e.target.dataset.id;
    const status = e.target.value;

    try {
      await updateDoc(doc(db, "orders", id), {
        status
      });

      alert("Status updated");
    } catch (err) {
      alert("Error updating status" + err);
    }
  }
});



// ================= FILTER LOGIC =================
function setupFilters() {

  filterButtons.forEach(btn => {

    btn.addEventListener("click", () => {

      // UI active state
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.innerText.trim();

      let ref;

      if (filter === "All") {
        ref = collection(db, "orders");
      } 
      else {
        ref = query(
          collection(db, "orders"),
          where("status", "==", filter)
        );
      }

      loadOrders(ref);
    });
  });
}


// ================= AUTH INIT =================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    alert("Please login first");
    window.location.href = "./login.html";
    return;
  }

  // Default load
  const q = query(
  collection(db, "orders"),
  orderBy("createdAt", "desc")
  );
  loadOrders(q);

  // Setup filters
  setupFilters();
});


// ================= LOGOUT =================
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./login.html";
});

const totalordercount = document.getElementById("total-orders");
const todayorders = document.getElementById("today-orders");
const totalrev = document.getElementById("total-revenue");

async function countOrders() {

  let counter = 0;
  let todayCounter = 0;
  let rev = 0;

  const orders = await fetchOrders(collection(db, "orders"));

  const now = new Date();

  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  orders.forEach((order) => {

    counter++;

    rev += order.totalAmount || 0;

    // 🔥 Correct date comparison
    const orderDate = order.createdAt?.toDate?.();

    if (orderDate && orderDate >= startOfDay && orderDate <= endOfDay) {
      todayCounter++;
    }
  });

  totalordercount.innerText = counter;
  todayorders.innerText = todayCounter;
  totalrev.innerText = "₹" + rev;
}

countOrders();