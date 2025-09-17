import { firebaseConfig } from "../config.js"; // path to config file

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// DOM Elements
let loginForm, registerForm, toggleButton, welcomeText, welcomeDescription;
let loginButton, registerButton, loginButtonContainer, registerButtonContainer;
let loginEmail,
  loginPassword,
  registerUsername,
  registerEmail,
  registerPassword;
let loginErrorMessage, registerErrorMessage;

let isLoginActive = true;

// Initialize the application
function initApp() {
  // Get DOM elements
  loginForm = document.querySelector(".login-form");
  registerForm = document.querySelector(".register-form");
  toggleButton = document.getElementById("toggleButton");
  welcomeText = document.getElementById("welcomeText");
  welcomeDescription = document.getElementById("welcomeDescription");

  loginButton = document.getElementById("loginButton");
  registerButton = document.getElementById("registerButton");
  loginButtonContainer = document.getElementById("loginButtonContainer");
  registerButtonContainer = document.getElementById("registerButtonContainer");

  loginEmail = document.getElementById("loginEmail");
  loginPassword = document.getElementById("loginPassword");
  registerUsername = document.getElementById("registerUsername");
  registerEmail = document.getElementById("registerEmail");
  registerPassword = document.getElementById("registerPassword");

  loginErrorMessage = document.getElementById("loginErrorMessage");
  registerErrorMessage = document.getElementById("registerErrorMessage");

  // Add event listeners
  toggleButton.addEventListener("click", toggleForms);
  loginButton.addEventListener("click", handleLogin);
  registerButton.addEventListener("click", handleRegister);

  // Add input validation listeners
  [loginEmail, loginPassword].forEach((input) =>
    input.addEventListener("input", () => {
      loginButton.style.cursor = isLoginFormValid() ? "pointer" : "default";
    })
  );

  [registerUsername, registerEmail, registerPassword].forEach((input) =>
    input.addEventListener("input", () => {
      registerButton.style.cursor = isRegisterFormValid()
        ? "pointer"
        : "default";
    })
  );

  // Add the "jumpy button" functionality
  addJumpyButtonEffect();
}

// Helper Functions
function clearMessages() {
  loginErrorMessage.style.display = "none";
  registerErrorMessage.style.display = "none";
}

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
  setTimeout(() => (element.style.display = "none"), 5000);
}

function isLoginFormValid() {
  return loginEmail.value.includes("@") && loginPassword.value.length >= 6;
}

function isRegisterFormValid() {
  return (
    registerEmail.value.includes("@") &&
    registerPassword.value.length >= 6 &&
    registerUsername.value.length >= 3
  );
}

// Toggle Forms
function toggleForms() {
  isLoginActive = !isLoginActive;
  loginForm.classList.toggle("active");
  registerForm.classList.toggle("active");
  clearMessages();
  welcomeText.textContent = isLoginActive ? "Welcome Back" : "Welcome";
  welcomeDescription.textContent = isLoginActive
    ? "Enter your credentials to access your account."
    : "Join our community and explore amazing features. Start your journey today.";
  toggleButton.textContent = isLoginActive ? "Register" : "Login";
}

// Add the "jumpy button" effect when trying to click without filling details
function addJumpyButtonEffect() {
  loginButton.addEventListener("mouseover", (e) => {
    if (!isLoginFormValid()) {
      e.target.style.transform = "translateX(10px)";
      setTimeout(() => {
        e.target.style.transform = "translateX(-10px)";
      }, 100);
      setTimeout(() => {
        e.target.style.transform = "translateX(0)";
      }, 200);
    }
  });

  registerButton.addEventListener("mouseover", (e) => {
    if (!isRegisterFormValid()) {
      e.target.style.transform = "translateX(10px)";
      setTimeout(() => {
        e.target.style.transform = "translateX(-10px)";
      }, 100);
      setTimeout(() => {
        e.target.style.transform = "translateX(0)";
      }, 200);
    }
  });
}

// Firebase Register
async function handleRegister(e) {
  e.preventDefault();
  clearMessages();
  const name = registerUsername.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  if (!isRegisterFormValid()) {
    // Add jumpy effect for invalid form
    registerButton.style.transform = "translateX(10px)";
    setTimeout(() => {
      registerButton.style.transform = "translateX(-10px)";
    }, 100);
    setTimeout(() => {
      registerButton.style.transform = "translateX(0)";
    }, 200);

    return showError(registerErrorMessage, "Please fill all fields correctly");
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await setDoc(doc(db, "users", userCredential.user.uid), { name, email });
    window.location.href = "main.html";
  } catch (error) {
    if (error.code === "auth/email-already-in-use")
      showError(registerErrorMessage, "Email already in use!");
    else
      showError(
        registerErrorMessage,
        "Error creating account: " + error.message
      );
  }
}

// Firebase Login
async function handleLogin(e) {
  e.preventDefault();
  clearMessages();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!isLoginFormValid()) {
    // Add jumpy effect for invalid form
    loginButton.style.transform = "translateX(10px)";
    setTimeout(() => {
      loginButton.style.transform = "translateX(-10px)";
    }, 100);
    setTimeout(() => {
      loginButton.style.transform = "translateX(0)";
    }, 200);

    return showError(loginErrorMessage, "Please enter valid credentials");
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    localStorage.setItem("loggedInUserId", userCredential.user.uid);
    window.location.href = "main.html";
  } catch (error) {
    if (
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    )
      showError(loginErrorMessage, "Incorrect email or password!");
    else showError(loginErrorMessage, "Login failed: " + error.message);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
