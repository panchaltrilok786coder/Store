import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Protect page based on allowed roles
 */
export function protectRoute(allowedRoles) {

  onAuthStateChanged(auth, async (user) => {

    try {

      // ❌ Not logged in
      if (!user) {
        window.location.href = "./login.html";
        return;
      }

      // Get user role
      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        window.location.href = "./login.html";
        return;
      }

      const role = userSnap.data().role;

      console.log("Route check role:", role);

      // ❌ Role not allowed
      if (!allowedRoles.includes(role)) {
        alert("Access denied!");
        window.location.href = "./login.html";
        return;
      }

      // ✅ SUCCESS CASE (IMPORTANT FIX)
      // Allow page to render properly
      document.body.style.visibility = "visible";

    } catch (err) {
      console.error("Route protect error:", err);
      window.location.href = "./login.html";
    }

  });

}