import { protectRoute } from "./routeprotect.js";
import {
  getCart,
  removeFromCart,
  updateQuantity
} from "./cartService.js";

import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase.js";

protectRoute(["customer", "admin"]);
alert("cart.js is called");
const list = document.getElementById("cart-list");
const totalEl = document.getElementById("cart-total");
const emptyEl = document.getElementById("cart-empty");

// NAV
document.getElementById("home-btn").onclick = () => {
  window.location.href = "./home.html";
};

document.getElementById("logout-btn").onclick = async () => {
  await signOut(auth);
  window.location.href = "./login.html";
};

document.getElementById("cart-orders-btn").onclick = () => {
  window.location.href = "./orders.html";
};

document.getElementById("go-home-btn").onclick = () => {
  window.location.href = "./home.html";
};

document.getElementById("checkout-btn").onclick = () => {
  window.location.href = "./checkout.html";
};

// LOAD
async function loadCart() {
  alert("loadCart function is called!!");
  try{
  const items = await getCart();
  alert("CART DATA: " + JSON.stringify(items));
  list.innerHTML = "";

  if (items.length === 0) {
    emptyEl.classList.remove("hidden");
    totalEl.innerText = "Total: ₹0";
    return;
  }

  emptyEl.classList.add("hidden");

  let total = 0;

  items.forEach(item => {

    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-card";

    div.innerHTML = `
      <img src="${item.imageURL || "https://via.placeholder.com/150"}" />

      <div class="cart-info">
        <h4 class="cart-title">${item.name}</h4>
        <p class="cart-price">₹${item.price}</p>

        <div class="cart-actions">
          <button class="dec">-</button>
          <span>${item.quantity}</span>
          <button class="inc">+</button>
          <button class="remove">Remove</button>
        </div>
      </div>
    `;

    div.querySelector(".dec").onclick = async () => {
      await updateQuantity(item.id, item.quantity - 1);
      loadCart();
    };

    div.querySelector(".inc").onclick = async () => {
      await updateQuantity(item.id, item.quantity + 1);
      loadCart();
    };

    div.querySelector(".remove").onclick = async () => {
      await removeFromCart(item.id);
      loadCart();
    };

    list.appendChild(div);
  });

  totalEl.innerText = "Total: ₹" + total;
 }catch(err){
     alert("Error:" + err)
  }
}

loadCart();