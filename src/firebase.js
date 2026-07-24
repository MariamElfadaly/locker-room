import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ============================================================
// PASTE YOUR FIREBASE CONFIG HERE.
// Get it from: Firebase Console -> Project settings (gear icon) ->
// General tab -> scroll to "Your apps" -> click the web app -> copy
// the firebaseConfig object shown there, and paste its values below.
//
// This is safe to have directly in the code and to upload to GitHub --
// it is not a secret. Every Firebase web app ships this publicly.
// Real security comes from firestore.rules, not from hiding this.
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDjyI-tDJCvPHQ0CwnTHan31j62Oz5UxNU",
  authDomain: "lockerroom-tracker.firebaseapp.com",
  projectId: "lockerroom-tracker",
  storageBucket: "lockerroom-tracker.firebasestorage.app",
  messagingSenderId: "1065891397695",
  appId: "1:1065891397695:web:aec6418ce3563ecd8c788a",
  // measurementId: "G-YW56HKPLQ9",
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
