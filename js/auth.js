import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  setDoc,
  doc,
  getDoc,
  serverTimestamp
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
      createdAt: serverTimestamp()
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
// 🔐 Google Auth
// =======================

const provider = new GoogleAuthProvider();

export async function googleAuth(){
  try{
  const googleResult = await signInWithPopup(auth, provider);
  const additionalInfo = getAdditionalUserInfo(googleResult)
  if (additionalInfo.isNewUser) {
    // FIRST TIME SIGNUP
    await setDoc(doc(db, "users", googleResult.user.uid), {
      email: googleResult.user.email,
      role : "customer",
      createdAt: serverTimestamp()
    })
  }
  return { success: true, user: googleResult.user };
  }catch(err){
    alert("Error: "+ err.message);
    return { success: false, error: err.message };
  }
}
// =======================
// 🔁 AUTH STATE LISTENER
// =======================
export function checkAuthState() {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      alert("No user logged in");
      window.location.href = "./login.html";
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("User document not found");
        return;
      }

      const role = userSnap.data().role;

      if (role === "admin") {
        window.location.href = "./admin.html";
        return;
      }

      if (role === "customer") {
        window.location.href = "./home.html";
        return;
      }

      // fallback (if role missing or invalid)
      alert("Invalid role");

    } catch (err) {
      alert("Error fetching role: " + err.message);
    }

  });

}