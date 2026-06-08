// ================= IMPORTS =================
import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";

import {
  collection,
  query,
  where,
  updateDoc,
  orderBy,
  doc,
  onSnapshot
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

const totalordercount = document.getElementById("total-orders");
const todayorders = document.getElementById("today-orders");
const totalrev = document.getElementById("total-revenue");


// ================= GLOBAL STATE =================
let allOrders = [];
let activeUnsubscribe = null;      
let isInitialHistoryLoaded = false; 


// ================= REAL-TIME OBSERVER ENGINE =================
function startLiveOrderObserver(firestoreQuery) {
  if (activeUnsubscribe) {
    activeUnsubscribe();
  }

  ordersContainer.innerHTML = "Loading...";

  activeUnsubscribe = onSnapshot(firestoreQuery, (snapshot) => {
    
    allOrders = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    renderOrders();
    calculateRealtimeStats(allOrders);

    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" && isInitialHistoryLoaded) {
        const incomingNewOrder = change.doc.data();
        incomingNewOrder.id = change.doc.id;
        
        triggerAdminAlerts(incomingNewOrder);
      }
    });

    isInitialHistoryLoaded = true;
  }, (err) => {
    alert("Real-time snapshot engine error: " + err.message);
  });
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
        <option value="Placed" ${order.status === 'Placed' ? 'selected' : ''}>Placed</option>
        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
    `;

    ordersContainer.appendChild(card);
  });
}


// ================= NOTIFICATIONS ENGINE =================
// System-managed device notifications
function triggerAdminAlerts(order) {
  console.log("🚨 New Order Received:", order.id);

  if (window.Notification && Notification.permission === "granted") {
    new Notification("🚨 New Order Received!", {
      body: `Amount: ₹${order.totalAmount || 0} from ${order.address?.name || "Customer"}`,
      icon: "./icons/192x192.png",
      tag: order.id, 
      // silent: null configuration allows the OS to explicitly use its default alert sound or vibration pattern
      silent: false  
    });
  }
}


// ================= STATISTICS COMPILER =================
function calculateRealtimeStats(ordersList) {
  let counter = 0;
  let todayCounter = 0;
  let rev = 0;

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  ordersList.forEach((order) => {
    counter++;
    rev += order.totalAmount || 0;

    const orderDate = order.createdAt?.toDate?.();
    if (orderDate && orderDate >= startOfDay && orderDate <= endOfDay) {
      todayCounter++;
    }
  });

  if (totalordercount) totalordercount.innerText = counter;
  if (todayorders) todayorders.innerText = todayCounter;
  if (totalrev) totalrev.innerText = "₹" + rev;
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
    } catch (err) {
      alert("Error updating status: " + err);
    }
  }
});


// ================= FILTER LOGIC =================
function setupFilters() {
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.innerText.trim();
      let ref;

      isInitialHistoryLoaded = false; 

      if (filter === "All") {
        ref = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      } else {
        ref = query(
          collection(db, "orders"),
          where("status", "==", filter),
          orderBy("createdAt", "desc")
        );
      }

      startLiveOrderObserver(ref);
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

  if (window.Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }

  const defaultQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  startLiveOrderObserver(defaultQuery);
  setupFilters();
});


// ================= LOGOUT =================
logoutBtn?.addEventListener("click", async () => {
  if (activeUnsubscribe) activeUnsubscribe();
  await signOut(auth);
  window.location.href = "./login.html";
});
