import { db, auth } from "./firebase.js";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ADD
export async function addToCart(product) {

  alert("INSIDE addToCart");

  const user = auth.currentUser;

  alert("USER: " + (user ? user.uid : "NULL"));

  if (!user) {
    alert("Login required");
    return;
  }

  try {

    alert("WRITING TO FIRESTORE");

    const ref = doc(db, "users", user.uid, "cart", product.id);

    await setDoc(ref, {
      ...product,
      quantity: 1
    });

    alert("WRITE SUCCESS");

  } catch (err) {
    alert("ERROR: " + err.message);
  }
}

// GET

export function getCart() {
  return new Promise((resolve) => {

    onAuthStateChanged(auth, async (user) => {

      if (!user) {
        alert("User not logged in");
        resolve([]);
        return;
      }

      try {
        const snap = await getDocs(collection(db, "users", user.uid, "cart"));

        const items = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        resolve(items);

      } catch (err) {
        alert("Error: " + err.message);
        resolve([]);
      }

    });

  });
}

// REMOVE
export async function removeFromCart(id) {
  const user = auth.currentUser;
  if (!user) return;

  await deleteDoc(doc(db, "users", user.uid, "cart", id));
}


// UPDATE QUANTITY
export async function updateQuantity(id, quantity) {
  const user = auth.currentUser;
  if (!user) return;

  if (quantity <= 0) {
    await removeFromCart(id);
    return;
  }

  await updateDoc(doc(db, "users", user.uid, "cart", id), {
    quantity
  });
}