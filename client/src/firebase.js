
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDk4Ac-CycReDWVOru1SjCnycykWeiEJ5U",
  authDomain: "cubix-72bd2.firebaseapp.com",
  projectId: "cubix-72bd2",
  storageBucket: "cubix-72bd2.firebasestorage.app",
  messagingSenderId: "44643592825",
  appId: "1:44643592825:web:c2bc08d17ccd66b265c2a8",
  measurementId: "G-FSSJS3RW3X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

