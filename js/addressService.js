import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ADD ADDRESS
export async function addAddress(addressData) {

  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  await addDoc(
    collection(db, "users", user.uid, "addresses"),
    {
      ...addressData,
      createdAt: serverTimestamp()
    }
  );
}


// GET ADDRESSES
export async function getAddresses() {

  const user = auth.currentUser;

  if (!user) return [];

  const snap = await getDocs(
    collection(db, "users", user.uid, "addresses")
  );

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}