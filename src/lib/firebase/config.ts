
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyCGWXBtCmOBEcO98PAac1WrlB-pQFqFO8k",
  authDomain: "starcart-rewards.firebaseapp.com",
  projectId: "starcart-rewards",
  storageBucket: "starcart-rewards.firebasestorage.app",
  messagingSenderId: "396194071135",
  appId: "1:396194071135:web:4debeae899b02119c2d1ea"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);


export { app, db, storage };
