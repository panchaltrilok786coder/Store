// Firebase core imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Services
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Your Firebase config (replace with your real config)
const firebaseConfig = {
    apiKey: "AIzaSyBMdS-QLx29KMAHy2SJ9V8SKX8U181kSLw",
    authDomain: "store-da9c1.firebaseapp.com",
    projectId: "store-da9c1",
    storageBucket: "store-da9c1.firebasestorage.app",
    messagingSenderId: "22885736244",
    appId: "1:22885736244:web:75b757fbfeab977fc70f61",
    measurementId: "G-D6KMB3XL9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other files
export { auth, db };
