import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYhK2C__yYAOrSpq0jHezMeWtabBrTV-w",
  authDomain: "dustfreehub.firebaseapp.com",
  projectId: "dustfreehub",
  storageBucket: "dustfreehub.appspot.com",
  messagingSenderId: "810097428488",
  appId: "1:810097428488:web:f3380d44af157572e0a9bd",
  measurementId: "G-GTY3DCV842",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
