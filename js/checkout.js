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
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// PROTECT
protectRoute(["customer"]);

// DOM ELEMENTS
const itemsContainer = document.getElementById("checkout-items");
const totalEl = document.getElementById("checkout-total");
const paymentBtn = document.getElementById("place-order-btn");
const form = document.getElementById("address-form-section");
const savedAddressesEl = document.getElementById("saved-addresses");

document.getElementById("show-address-form-btn").addEventListener("click", () => {
  form.classList.remove("hidden");
  selectedAddress = null;
  // Clear any previous selections visually
  document.querySelectorAll(".saved-address-card").forEach(card => card.classList.remove("selected-address"));
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

  let totalAmount = Math.ceil(total * 1.05); // Including 5% tax/fees
  totalEl.innerText = totalAmount;
}

// LOAD SAVED ADDRESSES
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
      document.querySelectorAll(".saved-address-card").forEach(card => {  
        card.classList.remove("selected-address");  
      });  
      div.classList.add("selected-address");  
      selectedAddress = address;  
      // Hide form if they select an existing address
      form.classList.add("hidden"); 
    };  

    savedAddressesEl.appendChild(div);  
    
    if (!selectedAddress) {  
      selectedAddress = address;  
      div.classList.add("selected-address");  
    }
  });
}

// CLEAR CART
async function clearCart(uid) {
  const snap = await getDocs(collection(db, "users", uid, "cart"));
  const deletes = snap.docs.map((d) => deleteDoc(doc(db, "users", uid, "cart", d.id)));
  await Promise.all(deletes);
}

// ONLINE PAYMENT FLOW
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

    if (!res.ok) {
      alert(
        "Status: " + res.status +
        "\nError: " +
        JSON.stringify(order)
      );
      return;
    }
    // 2. OPEN RAZORPAY
    const options = {
      key: "rzp_test_SwMZvhp9XZ4JY1",
      amount: 100,
      currency: order.currency,
      order_id: order.id,
      handler: async function (response) {  
        // 3. VERIFY PAYMENT  
        const verifyRes = await fetch("https://storeapi-xl4c.vercel.app/api/verify-payment", {  
          method: "POST",  
          headers: { "Content-Type": "application/json" },  
          body: JSON.stringify(response)  
        });  
        const verifyData = await verifyRes.json();  
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
    alert("Error: " + err.message);
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
      paymentStatus: paymentMode === "COD" ? "Pending" : "Paid",
      createdAt: serverTimestamp()
    });

    await clearCart(user.uid);  
    alert("Order placed successfully!");  
    window.location.href = "./home.html";
  } catch (err) {
    alert(err.message);
  }
}

// SUBMIT / PLACE ORDER BUTTON EVENT
paymentBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("Login required");

  let finalAddress = selectedAddress;

  // If no saved address is selected, read and validate form values
  if (!finalAddress) {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    if (name.length === 0 || phone.length === 0 || address.length === 0) {
      alert("Please fill all the address details or select a saved address!");
      return; // <-- CRITICAL FIX: Stops code execution here if form is empty
    }

    finalAddress = { name, phone, address };
    await addAddress(finalAddress);
  }

  // Final sanity check
  if (!finalAddress) {
    alert("Please select or add an address");
    return;
  }

  // =========================
  // COD FLOW
  // =========================
  if (selectedPayment === "cod") {
    await placeOrder(user, finalAddress, cartItems, "COD");
  }

  // =========================
  // ONLINE FLOW
  // =========================
  if (selectedPayment === "razorpay") {
    await startOnlinePayment(user, finalAddress, cartItems);
  }
});

// INIT
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("name").value = user.displayName || "";  
    loadCheckout();  
    loadAddresses();
  }
});
