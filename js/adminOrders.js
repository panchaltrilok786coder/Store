// ================= IMPORTS =================
import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ================= ROUTE PROTECTION =================
protectRoute(["admin"]);


// ================= DOM ELEMENTS =================
const ordersContainer = document.querySelectorAll(".filter-btn");
const orderFilterbtns = document.getElementById("order-filters");
// ================= GLOBAL STATE =================
let allOrders = [];


// ================= LOAD ORDERS =================
async function loadOrders(filterOrders) {
    try{
      const orderSnap = await getDocs(filterOrders);
      orderSnap.forEach((docSnap)=>{
          allOrders.push({
             id:docSnap.id,
             ...docSnap.data()
            });
      });
      alert("Orders: "+ allOrders);
      renderOrders();
    }catch(err){
       alert(err.message);
    }
}

function renderOrders(){
  ordersContainer.innerHTML = "";
  if (allOrders.length === 0){
    ordersContainer.innerHTML = "No Orders found"
  }
  allOrders.forEach((order)=>{
    const card = document.createElement("div");
    card.innerHTML = `
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
    `;
    ordersContainer.appendChild(card);
  })
};

// ================= FILTERING ORDERS =================
orderFilterbtns.forEach((btn) =>{
  btn.addEventListener("click", () =>{
    orderFilterbtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    //FilterLogic
    if(btn.innerText === "All"){
      const filterOrders = collection(db , "orders");
      loadOrders(filterOrders);
    } else if(btn.innerText === "Pending"){
      const filterOrders = query(collection(db , "orders"),where("status"),"==", "Pending");
      loadOrders(filterOrders);
    } else if(btn.innerText === "Shipped"){
      const filterOrders = query(collection(db , "orders"),where("status"),"==", "Shipped");
      loadOrders(filterOrders);
    } else if(btn.innerText === "Delivered"){
      const filterOrders = query(collection(db , "orders"),where("status"),"==", "Delivered");
      loadOrders(filterOrders);
    }
  })
})