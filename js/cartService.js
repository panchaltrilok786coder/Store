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
  return new Promise((resolve, reject) => {

    onAuthStateChanged(auth, async (user) => {

      if (!user) {
        alert("Login required");
        reject("No user");
        return;
      }

      try {
        const ref = doc(db, "users", user.uid, "cart", product.id);

        await setDoc(ref, {
          ...product,
          quantity: 1
        });

        resolve();

      } catch (err) {
        console.error(err);
        reject(err);
      }

    });

  });
}


// GET
export async function getCart() {
  const user = auth.currentUser;
  if (!user) return [];

  const snap = await getDocs(collection(db, "users", user.uid, "cart"));

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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