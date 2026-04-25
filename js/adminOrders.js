// ================= IMPORTS =================
alert("L1");
import { db, auth } from "./firebase.js";
import { protectRoute } from "./routeprotect.js";
alert("L2");
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
alert("L3");
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

alert("L4");
// ================= ROUTE PROTECTION =================
protectRoute(["admin"]);

alert("L5");
// ================= DOM ELEMENTS =================
const ordersContainer = document.getElementById("admin-orders-list"); 
alert("L6");
const orderFilterbtns = document.querySelectorAll(".filter-btn");
// ================= GLOBAL STATE =================
let allOrders = [];

alert("L7");
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
      if(allOrders == null){
      
      }
      alert("Orders: "+ allOrders);
      renderOrders();
    }catch(err){
       alert(err.message);
    }
}
alert("L8");
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
alert("L9");
// ================= FILTERING ORDERS =================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    alert("Please login first");
    window.location.href = "./login.html";
    return;
  }

  window.addEventListener("DOMContentLoaded", Dynamic);
});
function Dynamic(){
orderFilterbtns.forEach((btn) =>{
  btn.addEventListener("click", () =>{
    orderFilterbtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    alert("Btn EL working properly");
    //FilterLogic
    if(btn.innerText === "All"){
      const filterOrders = collection(db , "orders");
      alert("Calling LoadOrders");
      loadOrders(filterOrders);
      allOrders=[];
      alert("LoadOrders Called");
    } else if(btn.innerText === "Pending"){
      const filterOrders = query(collection(db , "orders"),where("status" ,"==", "Pending");
      loadOrders(filterOrders);
      allOrders=[];
      alert("LoadOrders Called");
    } else if(btn.innerText === "Shipped"){
      const filterOrders = query(collection(db , "orders"),where("status" ,"==", "Shipped");
      loadOrders(filterOrders);
      allOrders=[];
      alert("LoadOrders Called");
    } else if(btn.innerText === "Delivered"){
      const filterOrders = query(collection(db , "orders"),where("status" ,"==", "Delivered");
      loadOrders(filterOrders);
      allOrders=[];
      alert("LoadOrders Called");
    }
  })
})
}