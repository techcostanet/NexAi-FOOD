import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8GxQB7iayGlwCPfnqtuLS11YjREK8YLI",
  authDomain: "nexai-food.firebaseapp.com",
  projectId: "nexai-food",
  storageBucket: "nexai-food.firebasestorage.app",
  messagingSenderId: "704351369612",
  appId: "1:704351369612:web:fdf626b69d38c601cbfea9",
  measurementId: "G-CVHNRPYJVX"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firestore = getFirestore(app);
