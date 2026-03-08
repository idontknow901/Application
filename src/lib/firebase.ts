import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBM2QrnbtlTWysMbnuklQ3jL3reoRSLTRk",
    authDomain: "epic-rail-app.firebaseapp.com",
    projectId: "epic-rail-app",
    storageBucket: "epic-rail-app.firebasestorage.app",
    messagingSenderId: "43708952563",
    appId: "1:43708952563:web:e2c8e55a06098831ac6c86"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
