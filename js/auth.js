import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =======================
// 🔐 SIGN UP
// =======================
export async function signup(email, password) {
  try {

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "customer",
      createdAt: new Date()
    });

    console.log("Signup success:", user.uid);

    // ✅ IMPORTANT FIX
    return { success: true, user };

  } catch (error) {
    console.error("Signup Error:", error.message);

    // ✅ IMPORTANT FIX
    return { success: false, error: error.message };
  }
}


// =======================
// 🔐 LOGIN
// =======================
export async function login(email, password) {
  try {

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    console.log("Login success:", userCredential.user.uid);

    // ✅ IMPORTANT FIX
    return { success: true, user: userCredential.user };

  } catch (error) {
    console.error("Login Error:", error.message);

    // ✅ IMPORTANT FIX
    return { success: false, error: error.message };
  }
}


// =======================
// 🔁 AUTH STATE LISTENER
// =======================
export function checkAuthState() {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      alert("No user logged in");
      return;
    }else if (user){

    try {

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("User document not found");
        return;
      }else{

      const role = userSnap.data().role;

      console.log("User role:", role);

      if (role === "admin") {
        window.location.href = "./admin.html";
      } else {
        window.location.href = "./home.html";
      }

    } catch (err) {
      console.error("Error fetching role:", err.message);
    }
    }
    }
  });

}