import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAX63jwwPG82T7cnstu8oZ7bS5WkEHAbmk",
    authDomain: "project1-c3ef3.firebaseapp.com",
    projectId: "project1-c3ef3",
    storageBucket: "project1-c3ef3.appspot.com",
    messagingSenderId: "1036031836888",
    appId: "1:1036031836888:web:ca7ff6ea695c80933a4dad",
    measurementId: "G-JY8RTW6HQ9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, (user) => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const loginButtonNav = document.getElementById('loginButtonNav');
    const logoutButton = document.getElementById('logout');

    if (user && loggedInUserId === user.uid) {
        // User is logged in
        userEmailDisplay.textContent = user.email;
        userEmailDisplay.style.display = 'inline-block';
        loginButtonNav.style.display = 'none';
        logoutButton.style.display = 'block';

        const docRef = doc(db, "users", loggedInUserId);
        getDoc(docRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    // You can use userData if needed
                }
            })
            .catch((error) => {
                console.error("Error fetching document:", error);
            });
    } else {
        // User is not logged in
        userEmailDisplay.style.display = 'none';
        loginButtonNav.style.display = 'block';
        logoutButton.style.display = 'none';
    }
});

// Logout button
const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedInUserId');
        signOut(auth)
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch((error) => {
                console.error('Error signing out:', error);
            });
    });
}