// Fix: Use Firebase v9 modular imports.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// -----------------------------------------------------------------------------
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!! CRITICAL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
//          YOU MUST REPLACE THIS WITH YOUR FIREBASE PROJECT CONFIG
//
// 1. Go to your Firebase Console: https://console.firebase.google.com/
// 2. Select your project.
// 3. Click the gear icon (Project settings) in the top-left.
// 4. In the "General" tab, scroll down to "Your apps".
// 5. Select your web app and find the "SDK setup and configuration" section.
// 6. Copy the entire config object and paste it here, replacing the placeholders.
//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBYGL6XqsTv7XyXz-aYGF8vaTIuCBL4iYI",
  authDomain: "shms-c9ecb.firebaseapp.com",
  projectId: "shms-c9ecb",
  storageBucket: "shms-c9ecb.firebasestorage.app",
  messagingSenderId: "581540276535",
  appId: "1:581540276535:web:c9c6c6a5385cb1d81552b2",
  measurementId: "G-XY4B25E6S5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth service to be used in other parts of the app
export const auth = getAuth(app);

// Export the firestore service
export const db = getFirestore(app);