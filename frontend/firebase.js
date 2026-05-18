// firebase.js - Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyB76g74qbrs2Ssw1CJuBE1XRla9X4qdwbI",
  authDomain: "todo-app-2c3f0.firebaseapp.com",
  projectId: "todo-app-2c3f0",
  storageBucket: "todo-app-2c3f0.firebasestorage.app",
  messagingSenderId: "857229135583",
  appId: "1:857229135583:web:7251251ba640de4d1be36a",
  measurementId: "G-5KC29DD321"
};

firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth();
window.googleProvider = new firebase.auth.GoogleAuthProvider();
