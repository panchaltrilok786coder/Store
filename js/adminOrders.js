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
  onSnapshot // <-- MODIFIED: Swapped static getDocs out for real-time streaming
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
let activeUnsubscribe = null;      // <-- NEW: Keeps track of our active real-time data listener
let isInitialHistoryLoaded = false; // <-- NEW: Shield flag to stop old orders from chiming on page load


// ================= REAL-TIME OBSERVER ENGINE =================
// NEW: This replaced both fetchOrders() and loadOrders(). Instead of checking the 
// database once, it leaves a permanent, active connection pipe open.
function startLiveOrderObserver(firestoreQuery) {
  // If an active stream tracker is already running (e.g. admin clicked a new filter), close it first
  if (activeUnsubscribe) {
    activeUnsubscribe();
  }

  ordersContainer.innerHTML = "Loading...";

  // Open a real-time data listener pipeline down from your Firestore database
  activeUnsubscribe = onSnapshot(firestoreQuery, (snapshot) => {
    
    // 1. Sync data changes straight into your local tracking state array
    allOrders = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    // 2. Re-render individual visual order UI cards instantly
    renderOrders();

    // 3. Re-calculate financial revenue stat counts dynamically
    calculateRealtimeStats(allOrders);

    // 4. Evaluate distinct document actions to catch incoming new sales
    snapshot.docChanges().forEach((change) => {
      // Condition: Trigger alerts ONLY if an order document is newly added AND your startup data load is finished
      if (change.type === "added" && isInitialHistoryLoaded) {
        const incomingNewOrder = change.doc.data();
        incomingNewOrder.id = change.doc.id;
        
        triggerAdminAlerts(incomingNewOrder);
      }
    });

    // Flip the shield flag once the first collection packet processes successfully
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

    // Standardized selection values so the active status selection option stays accurately highlighted
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
// NEW: Dispatches browser tab ringtones and OS push alerts when a fresh order matches the stream observer
function triggerAdminAlerts(order) {
  console.log("🚨 New Order Alert Dispatched for ID:", order.id);

  // ALERT A: Play custom sound chime on the active panel page
  const audioChime = new Audio("./assets/notification-chime.mp3");
  audioChime.play().catch(() => {
    console.log("Audio notification blocked by browser privacy rules until the admin interacts with the window.");
  });

  // ALERT B: Native OS Push Banner Notification (Works even if PWA is minimized or backgrounded)
  if (window.Notification && Notification.permission === "granted") {
    new Notification("🚨 New Order Received!", {
      body: `Amount: ₹${order.totalAmount || 0} from ${order.address?.name || "Customer"}`,
      icon: "./icons/192x192.png",
      tag: order.id, // Eliminates overlapping alert duplicates
      silent: true   // Leaves audio duties entirely to our mp3 file above
    });
  }
}


// ================= STATISTICS COMPILER =================
// NEW: This replaced your old static countOrders() block. It recalculates 
// your summary dashboard cards instantly as soon as anything alters in the database.
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
      // Handled cleanly! We don't need a browser alert("Status updated") block anymore, 
      // because the stream automatically fires and updates the dashboard instantly.
    } catch (err) {
      alert("Error updating status: " + err);
    }
  }
});


// ================= FILTER LOGIC =================
function setupFilters() {
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // UI active styling state toggle
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.innerText.trim();
      let ref;

      // Reset initial notification barrier when modifying filters 
      // so switching categories doesn't set off old historical chime notifications
      isInitialHistoryLoaded = false; 

      if (filter === "All") {
        ref = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      } else {
        ref = query(
          collection(db, "orders"),
          where("status", "==", filter),
          orderBy("createdAt", "desc") // Kept chronological sorting active across filtered outputs
        );
      }

      // Re-trigger our stream with the updated filter rules
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

  // MODIFIED: Ask the admin's operating system for permission to dispatch banner alerts immediately
  if (window.Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }

  // Define default query configuration layout: chronologically sorted
  const defaultQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  // Spin up the real-time observer engine stream
  startLiveOrderObserver(defaultQuery);

  // Setup component layout filters
  setupFilters();
});


// ================= LOGOUT =================
logoutBtn?.addEventListener("click", async () => {
  // MODIFIED: Gracefully clear database listener pipelines before terminating authorization states
  if (activeUnsubscribe) activeUnsubscribe();
  await signOut(auth);
  window.location.href = "./login.html";
});
