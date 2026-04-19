import { auth, db } from "./firebase.js";

// Auth functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firestore functions
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

    // Save user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "customer", // default role
      createdAt: new Date()
    });

    console.log("User signed up:", user);

  } catch (error) {
    console.error("Signup Error:", error.message);
  }
}


// =======================
// 🔐 LOGIN
// =======================
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    console.log("User logged in:", userCredential.user);

  } catch (error) {
    console.error("Login Error:", error.message);
  }
}


// =======================
// 🔁 AUTH STATE LISTENER (REAL-TIME)
// =======================
export function checkAuthState() {

  onAuthStateChanged(auth, async (user) => {

    if (user) {
      console.log("User is logged in:", user.uid);

      try {
        // Get user role from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const role = userData.role;

          console.log("User role:", role);

          // 🔀 Redirect based on role
          if (role === "admin") {
            window.location.href = "/admin/admin.html";
          } else {
            window.location.href = "/customer/home.html";
          }

        } else {
          console.error("User document not found");
        }

      } catch (err) {
        console.error("Error fetching user role:", err.message);
      }

    } else {
      console.log("No user logged in");
    }

  });

}