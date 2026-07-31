import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8GxQB7iayGlwCPfnqtuLS11YjREK8YLI",
  authDomain: "nexai-food.firebaseapp.com",
  projectId: "nexai-food",
  storageBucket: "nexai-food.firebasestorage.app",
  messagingSenderId: "704351369612",
  appId: "1:704351369612:web:fdf626b69d38c601cbfea9",
  measurementId: "G-CVHNRPYJVX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products: any[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }
}

fetchProducts();
