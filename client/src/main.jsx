
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { onAuthStateChanged } from "firebase/auth";

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import "./index.css";
import App from "./App.jsx";

function ProfileSync() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) return;

        try {
          const userRef = doc(db, "users", user.uid);

          await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
              transaction.set(userRef, {
                uid: user.uid,
                email: user.email,
                role: "learner",
                createdAt: serverTimestamp(),
              });
            }
          });

          console.log("User profile synchronized successfully!");

        } catch (error) {
          console.error(
            "User profile synchronization failed:",
            error.message
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ProfileSync />
    <App />
  </StrictMode>
);
