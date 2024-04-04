import { initializeApp } from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";
var config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE__PROJECT_ID,
};
const firebaseApp = initializeApp(config);

export default firebaseApp;
