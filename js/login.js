import { login, signup, checkAuthState } from "./auth.js";

checkAuthState();

// elements
const emailInput = document.getElementById("login-email-input");
const passwordInput = document.getElementById("login-password-input");
const submitBtn = document.getElementById("login-submit-btn");

const errorBox = document.getElementById("error-box");
const loadingText = document.getElementById("loading-text");

const switchMode = document.getElementById("switch-mode");
const formTitle = document.getElementById("form-title");
const togglePasswordBtn = document.getElementById("toggle-password");

let isSignup = false;
let loading = false;

// toggle login/signup
switchMode.addEventListener("click", () => {
  isSignup = !isSignup;

  formTitle.innerText = isSignup ? "Sign Up" : "Login";
  submitBtn.innerText = isSignup ? "Sign Up" : "Login";
  switchMode.innerText = isSignup ? "Already have account?" : "Create account";
});

// password show/hide
togglePasswordBtn.addEventListener("click", () => {
  const input = passwordInput;
  input.type = input.type === "password" ? "text" : "password";
});

// show error
function showError(msg) {
  errorBox.innerText = msg;
}

// loading UI
function setLoading(state) {
  loading = state;

  loadingText.classList.toggle("hidden", !state);
  submitBtn.disabled = state;
}

// submit
submitBtn.addEventListener("click", async () => {

  const email = emailInput.value;
  const password = passwordInput.value;

  errorBox.innerText = "";

  if (!email || !password) {
    showError("Please fill all fields");
    return;
  }

  setLoading(true);

  try {
    if (isSignup) {
      await signup(email, password);
    } else {
      await login(email, password);
    }
  } catch (err) {
    showError(err.message);
  }

  setLoading(false);
});
