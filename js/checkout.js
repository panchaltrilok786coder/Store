import { db, auth } from "./firebase.js";
import { getCart } from "./cartService.js";
import { protectRoute } from "./routeprotect.js";
import {
  addAddress,
  getAddresses
} from "./addressService.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// PROTECT
protectRoute(["customer"]);

// DOM
const itemsContainer = document.getElementById("checkout-items");
const totalEl = document.getElementById("checkout-total");
const paymentBtn = document.getElementById("place-order-btn");
const form = document.getElementById("checkout-form");
const savedAddressesEl = document.getElementById("saved-addresses");
document.getElementById("show-address-form-btn").addEventListener("click", () => {
    alert("hi");
    form.classList.remove("hidden");
    selectedAddress = null;
});
document.querySelectorAll('input[name="payment"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    selectedPayment = e.target.value;
  });
});

let selectedPayment = "cod";
let selectedAddress = null;
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
      <img src="${item.imageURL || "https://via.placeholder.com/100"}" alt="${item.name}" />
      <div class="checkout-item-info">
        <p class="checkout-item-name">${item.name}</p>
        <p class="checkout-item-price">₹${item.price} x ${item.quantity}</p>
      </div>
      <span>₹${item.price * item.quantity}</span>
    `;

    itemsContainer.appendChild(div);
  });

  totalEl.innerText = total;
}

// Loading Address

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

      document
        .querySelectorAll(".saved-address-card")
        .forEach(card => {
          card.classList.remove("selected-address");
        });

      div.classList.add("selected-address");

      selectedAddress = address;
    };

    savedAddressesEl.appendChild(div);
    if (!selectedAddress) {
      selectedAddress = address;
      div.classList.add("selected-address");
    }
  });
}


async function clearCart(uid) {
  const snap = await getDocs(collection(db, "users", uid, "cart"));

  const deletes = snap.docs.map((d) =>
    deleteDoc(doc(db, "users", uid, "cart", d.id))
  );

  await Promise.all(deletes);
}

async function startOnlinePayment(user, address, items) {
  try {
    const amount = Number(totalEl.innerText);
    // 1. CREATE ORDER (Vercel API)
    const res = await fetch("https://storeapi-xl4c.vercel.app/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });
    const order = await res.json();
    // 2. OPEN RAZORPAY
    const options = {
      key: "rzp_test_StB2iN4eL3Dm6I",
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      
      handler: async function (response) {
        alert("Hello Handler");
        // 3. VERIFY PAYMENT
        const verifyRes = await fetch("https://storeapi-xl4c.vercel.app/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });
        alert("hello verifydata");
        const verifyData = await verifyRes.json();
        alert(JSON.stringify(verifyData));
        alert(verifyData.success);
        if (verifyData.success) {
          await placeOrder(user, address, items, "ONLINE");
        } else {
          alert("Payment verification failed");
        }
      },

      prefill: {
        name: user.displayName || "",
        email: user.email
      },

      theme: {
        color: "#38bdf8"
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    alert(err.message);
  }
}

// PLACE ORDER
async function placeOrder(user, address, items, paymentMode) {
  try {
    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      items,
      totalAmount: Number(totalEl.innerText),
      address,
      paymentMode,
      status: "Pending",
      paymentStatus: paymentMode === "COD" ? "Cash on Delivery" : "Paid/Pending",
      createdAt: serverTimestamp()
    });

    await clearCart(user.uid);

    alert("Order placed successfully!");
    window.location.href = "./home.html";

  } catch (err) {
    alert(err.message);
  }
}


paymentBtn.addEventListener("click", async (e) => {
  alert("form clicking");
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("Login required");

  let finalAddress = selectedAddress;

  // If no saved address, take from form
  if (!finalAddress) {
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;

    finalAddress = { name, phone, address };

    await addAddress(finalAddress);
  }

  // Validate address
  if (!finalAddress) {
    alert("Please select or add address");
    return;
  }
alert(selectedPayment);
  // =========================
  // COD FLOW
  // =========================
  if (selectedPayment === "cod") {
    await placeOrder(user, finalAddress, cartItems, "COD");
  }

  // =========================
  // ONLINE FLOW (Razorpay later)
  // =========================
  if (selectedPayment === "razorpay") {
    alert("inside selected payments !!!!");
    await startOnlinePayment(user, finalAddress, cartItems);
  }
});

// INIT
onAuthStateChanged(auth, (user) => {

  if (user) {

    document.getElementById("name").value =
      user.displayName || "";

    loadCheckout();
    loadAddresses();
  }

});