// Firebase core imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Services
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Your Firebase config (replace with your real config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "trilok-store.firebaseapp.com",
  projectId: "trilok-store",
  storageBucket: "trilok-store.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other files
export { auth, db };
