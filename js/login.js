import { login, signup } from "./auth.js";

// elements
const email = document.getElementById("email");
const password = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const errorBox = document.getElementById("error");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

let isLogin = true;

// switch UI
loginTab.addEventListener("click", () => {
  isLogin = true;
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  submitBtn.innerText = "Login";
  errorBox.innerText = "";
});

signupTab.addEventListener("click", () => {
  isLogin = false;
  signupTab.classList.add("active");
  loginTab.classList.remove("active");
  submitBtn.innerText = "Sign Up";
  errorBox.innerText = "";
});

// submit
submitBtn.addEventListener("click", async () => {
  const em = email.value.trim();
  const pw = password.value.trim();

  if (!em || !pw) {
    errorBox.innerText = "Fill all fields";
    return;
  }

  try {
    if (isLogin) {
      await login(em, pw);
    } else {
      await signup(em, pw);
    }
  } catch (err) {
    errorBox.innerText = err.message;
  }
});