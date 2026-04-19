import { signup, login, checkAuthState } from "./auth.js";

// Run auth state check when page loads
checkAuthState();

// Get elements
const emailInput = document.getElementById("login-email-input");
const passwordInput = document.getElementById("login-password-input");
const submitBtn = document.getElementById("login-submit-btn");

// Toggle (you can later connect this to UI switch)
let isSignup = false;

// Button click
submitBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  if (isSignup) {
    signup(email, password);
  } else {
    login(email, password);
  }
});