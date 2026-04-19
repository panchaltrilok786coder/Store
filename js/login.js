// login.js

import { signup, login } from "./auth.js";

// INPUTS
const emailInput = document.getElementById("login-email-input");
const passwordInput = document.getElementById("login-password-input");

// BUTTONS
const loginBtn = document.getElementById("login-submit-btn");

// Switch (if you have signup toggle)
let isSignup = false;

// HANDLE LOGIN / SIGNUP
loginBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  if (isSignup) {
    signup(email, password);
  } else {
    login(email, password);
  }
});

// OPTIONAL: SWITCH MODE
const switchLink = document.querySelector(".login-switch-link");

if (switchLink) {
  switchLink.addEventListener("click", () => {
    isSignup = !isSignup;

    loginBtn.textContent = isSignup ? "Sign Up" : "Login";
    switchLink.textContent = isSignup
      ? "Already have an account? Login"
      : "Don't have an account? Sign Up";
  });
}
