// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBcm80xmKqdPioKo-eH3k3YfdPsuwdAT4",
  authDomain: "profile-company-indokoding.firebaseapp.com",
  projectId: "profile-company-indokoding",
  storageBucket: "profile-company-indokoding.firebasestorage.app",
  messagingSenderId: "195112865661",
  appId: "1:195112865661:web:7efb43b520b4ca3c418614",
  measurementId: "G-59XEPRJSZV"
};

// Hindari re-init saat hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
