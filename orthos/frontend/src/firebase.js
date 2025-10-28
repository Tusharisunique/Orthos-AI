import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9GrBlYWviy6IRtsbCJvBolcBsjzQiOmU",
  authDomain: "orthos-ad64f.firebaseapp.com",
  projectId: "orthos-ad64f",
  storageBucket: "orthos-ad64f.firebasestorage.app",
  messagingSenderId: "1097832385912",
  appId: "1:1097832385912:web:47ad719ce80de4a1da4c8d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);