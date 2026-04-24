import { login, signup } from "./auth.js";
import {checkAuthState} from "./auth.js";
// =========================
// ELEMENTS
// =========================
const loginBox = document.getElementById("login-box");
const signupBox = document.getElementById("signup-box");
alert("Hello 1");
const toSignup = document.getElementById("to-signup");
const toLogin = document.getElementById("to-login");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");

const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");

const loading = document.getElementById("loading");

// =========================
// TOGGLE UI
// =========================
toSignup.addEventListener("click", () => {
  loginBox.classList.add("hidden");
  signupBox.classList.remove("hidden");
});

toLogin.addEventListener("click", () => {
  signupBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
});

// =========================
// LOGIN
// =========================
loginBtn.addEventListener("click", async () => {
  loading.classList.remove("hidden");

  const result = await login(loginEmail.value, loginPassword.value);

  if (!result.success) {
    loading.classList.add("hidden");
    alert(result.error);
  }
  // success → routeprotect handles redirect
  checkAuthState();
});

// =========================
// SIGNUP
// =========================
signupBtn.addEventListener("click", async () => {
  loading.classList.remove("hidden");

  const result = await signup(signupEmail.value, signupPassword.value);

  if (!result.success) {
    loading.classList.add("hidden");
    alert(result.error);
  } else {
    alert("Account created. Please login.");
    loading.classList.add("hidden");
    signupBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
  }
});