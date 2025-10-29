import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCFzAy8bHkBRe3DwNqHO3CjS2P49ZhxSnM",
  authDomain: "hotel-plaza-trujillo-8e076.firebaseapp.com",
  projectId: "hotel-plaza-trujillo-8e076",
  storageBucket: "hotel-plaza-trujillo-8e076.firebasestorage.app",
  messagingSenderId: "96496613829",
  appId: "1:96496613829:web:4601045c6d99ef5cd2b3ac",
  measurementId: "G-GFKJNHKKJE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;