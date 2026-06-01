// =========================
// IMPORTS
// =========================
import { db, auth } from "./firebase.js";
import { getCart } from "./cartService.js";
import { protectRoute } from "./routeprotect.js";
import { addAddress, getAddresses } from "./addressService.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// =========================
// ROUTE PROTECTION
// =========================
protectRoute(["customer", "admin"]);

// =========================
// DOM ELEMENTS
// =========================
const itemsContainer = document.getElementById("checkout-items");
const totalEl = document.getElementById("checkout-total");
const paymentBtn = document.getElementById("place-order-btn");
const form = document.getElementById("address-form-section");
const savedAddressesEl = document.getElementById("saved-addresses");

// =========================
// STATE
// =========================
let selectedPayment = "cod";
let selectedAddress = null;
let cartItems = [];
let finalTotal = 0;

// =========================
// UI EVENTS
// =========================
document.getElementById("show-address-form-btn").addEventListener("click", () => {
  form.classList.remove("hidden");
  selectedAddress = null;

  document.querySelectorAll(".saved-address-card")
    .forEach(c => c.classList.remove("selected-address"));
});

document.querySelectorAll('input[name="payment"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    selectedPayment = e.target.value;
  });
});

// =========================
// LOAD CHECKOUT
// =========================
async function loadCheckout() {
  try {
    cartItems = await getCart();

    if (cartItems.length === 0) {
      itemsContainer.innerHTML = "<p>Your cart is empty</p>";
      totalEl.innerText = "0";
      return;
    }

    let total = 0;
    itemsContainer.innerHTML = "";

    cartItems.forEach(item => {
      total += item.price * item.quantity;

      const div = document.createElement("div");
      div.className = "checkout-item";

      div.innerHTML = `
        <img src="${item.imageURL || "https://via.placeholder.com/100"}" />
        <div>
          <p>${item.name}</p>
          <p>₹${item.price} x ${item.quantity}</p>
        </div>
        <b>₹${item.price * item.quantity}</b>
      `;

      itemsContainer.appendChild(div);
    });

    // =========================
    // 5% PLATFORM FEE
    // =========================

    finalTotal = Math.ceil(total * 1.05);
    totalEl.innerText = finalTotal;

  } catch (err) {
    alert("Checkout error:\n" + (err.message || err));
  }
}

// =========================
// LOAD ADDRESSES
// =========================
async function loadAddresses() {
  const addresses = await getAddresses();
  savedAddressesEl.innerHTML = "";

  if (addresses.length === 0) {
    form.classList.remove("hidden");
    return;
  }

  form.classList.add("hidden");

  addresses.forEach(address => {
    const div = document.createElement("div");
    div.className = "saved-address-card";

    div.innerHTML = `
      <h4>${address.name}</h4>
      <p>${address.phone}</p>
      <p>${address.address}</p>
    `;

    div.onclick = () => {
      document.querySelectorAll(".saved-address-card")
        .forEach(c => c.classList.remove("selected-address"));

      div.classList.add("selected-address");
      selectedAddress = address;
      form.classList.add("hidden");
    };

    savedAddressesEl.appendChild(div);

    if (!selectedAddress) {
      selectedAddress = address;
      div.classList.add("selected-address");
    }
  });
}

// =========================
// CLEAR CART
// =========================
async function clearCart(uid) {
  const snap = await getDocs(collection(db, "users", uid, "cart"));
  const tasks = snap.docs.map(d =>
    deleteDoc(doc(db, "users", uid, "cart", d.id))
  );
  await Promise.all(tasks);
}

// =========================
// RAZORPAY: CREATE ORDER
// =========================
async function createOrder(amount) {
  const res = await fetch(
    "https://storeapi-xl4c.vercel.app/api/create-order",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert("Create Order Failed:\n" + JSON.stringify(data, null, 2));
    throw new Error("Order creation failed");
  }

  return data.order;
}

// =========================
// RAZORPAY: VERIFY PAYMENT
// =========================
async function verifyPayment(payload) {
  const res = await fetch(
    "https://storeapi-xl4c.vercel.app/api/verify-payment",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert("Verify Failed:\n" + JSON.stringify(data, null, 2));
    return false;
  }

  return data.success;
}

// =========================
// ONLINE PAYMENT
// =========================
async function startOnlinePayment(user, address, items) {
  try {
    alert("GLOBAL TOTAL: " + finalTotal);
    const order = await createOrder(finalTotal);

    const options = {
      key: "rzp_test_StB2iN4eL3Dm6I",
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,

      handler: async function (response) {
        const ok = await verifyPayment(response);

        if (!ok) {
          alert("Payment verification failed");
          return;
        }

        await placeOrder(user, address, items, "ONLINE");
      }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (res) {
      alert("Payment Failed:\n" + JSON.stringify(res.error, null, 2));
    });

    rzp.open();

  } catch (err) {
    alert("Payment Error:\n" + (err.message || err));
  }
}

// =========================
// PLACE ORDER
// =========================
async function placeOrder(user, address, items, mode) {
  try {
    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      items,
      totalAmount: Number(totalEl.innerText),
      address,
      paymentMode: mode,
      status: "Pending",
      paymentStatus: mode === "COD" ? "Pending" : "Paid",
      createdAt: serverTimestamp()
    });

    await clearCart(user.uid);

    alert("Order placed successfully!");
    window.location.href = "./home.html";

  } catch (err) {
    alert("Order Error:\n" + (err.message || err));
  }
}

// =========================
// PLACE ORDER BUTTON
// =========================
paymentBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("Login required");

  if (!selectedAddress) {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!name || !phone || !address) {
      return alert("Fill address details");
    }

    selectedAddress = { name, phone, address };
    await addAddress(selectedAddress);
  }

  if (selectedPayment === "cod") {
    await placeOrder(user, selectedAddress, cartItems, "COD");
  }

  if (selectedPayment === "razorpay") {
    await startOnlinePayment(user, selectedAddress, cartItems);
  }
});

// =========================
// INIT
// =========================
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("name").value = user.displayName || "";
    loadCheckout();
    loadAddresses();
  } else {
    alert("Login required");
    window.location.href = "./login.html";
  }
});