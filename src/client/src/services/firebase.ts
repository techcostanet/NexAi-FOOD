import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "nexai-food",
  authDomain: "nexai-food.firebaseapp.com",
  storageBucket: "nexai-food.appspot.com",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firestore = getFirestore(app);
