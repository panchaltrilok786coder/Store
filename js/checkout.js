import { db, auth } from "./firebase.js";
import { getCart } from "./cartService.js";
import { protectRoute } from "./routeprotect.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// PROTECT
protectRoute(["customer"]);

// DOM
const itemsContainer = document.getElementById("checkout-items");
const totalEl = document.getElementById("checkout-total");
const form = document.getElementById("checkout-form");

let cartItems = [];

// LOAD CART
async function loadCheckout() {
  cartItems = await getCart();

  if (cartItems.length === 0) {
    itemsContainer.innerHTML = "<p>Your cart is empty</p>";
    return;
  }

  let total = 0;
  itemsContainer.innerHTML = "";

  cartItems.forEach(item => {
    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "checkout-item";

    div.innerHTML = `
      <span>${item.name} (x${item.quantity})</span>
      <span>₹${item.price * item.quantity}</span>
    `;

    itemsContainer.appendChild(div);
  });

  totalEl.innerText = total;
}

// PLACE ORDER
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;

  const user = auth.currentUser;
  if (!user) return alert("Login required");

  try {
    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      items: cartItems,
      totalAmount: Number(totalEl.innerText),
      address: {
        name,
        phone,
        address
      },
      status: "placed",
      createdAt: serverTimestamp()
    });

    alert("Order placed successfully!");

    window.location.href = "./home.html";

  } catch (err) {
    alert(err.message);
  }
});

// INIT
onAuthStateChanged(auth, (user) => {
  if (user) loadCheckout();
});