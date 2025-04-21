// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9ucFZTkqOfI2Jfqnt76zSBJy50gQCt1Y",
  authDomain: "vysjchat.firebaseapp.com",
  projectId: "vysjchat",
  storageBucket: "vysjchat.firebasestorage.app",
  messagingSenderId: "513592563203",
  appId: "1:513592563203:web:63c7985c74238742a32036",
  measurementId: "G-8TGJYYJ553"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Initialize global window objects for easy access
window.initFirebase = () => {
  window.auth = auth;
  window.db = db;
  window.storage = storage;
};

export { firebaseConfig, app, auth, db, storage, analytics };
