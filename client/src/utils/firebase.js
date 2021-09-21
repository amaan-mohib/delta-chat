import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";
import firebaseConfig from "../config/firebase-config";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
// import { user } from "./store";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//Auth
export const auth = getAuth();
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});
export const login = () => {
  signInWithPopup(auth, provider)
    .then((res) => {
      console.log(res);
      // user.set(res.user);
    })
    .catch((err) => console.error(err));
};
export const logout = () => {
  signOut(auth)
    .then(() => {
      console.log("user signed out");
    })
    .catch((err) => console.error(err));
};

//Firestore
export const db = getFirestore();

//Storage
const storage = getStorage(app);
export const storageRef = ref(storage);
