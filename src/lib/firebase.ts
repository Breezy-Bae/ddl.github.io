
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCq1Deiig1TtH5pvm40G3bNTeZEwcBfZcY",
  authDomain: "ddleague-3.firebaseapp.com",
  projectId: "ddleague-3",
  storageBucket: "ddleague-3.firebasestorage.app",
  messagingSenderId: "11392319566",
  appId: "1:11392319566:web:5ab9f34d75f8d127d1431f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
