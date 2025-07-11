// src/lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyD_-1l2Xmy-sQ_HUwd_nuduYrM5F3oAUrs",
  authDomain: "ecommerce-dika.firebaseapp.com",
  projectId: "ecommerce-dika",
  storageBucket: "ecommerce-dika.firebasestorage.app",
  messagingSenderId: "834483429109",
  appId: "1:834483429109:web:0ee2944d8d722db8c3efbc",
  measurementId: "G-DNFXFT0RTV"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
