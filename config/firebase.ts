// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCV2eypibGq5SUaougb6lR80aNY_T6_6oc",
  authDomain: "expence-tracker-app-4fb19.firebaseapp.com",
  projectId: "expence-tracker-app-4fb19",
  storageBucket: "expence-tracker-app-4fb19.firebasestorage.app",
  messagingSenderId: "234140510271",
  appId: "1:234140510271:web:23f0c2271698f663ce308a",
  measurementId: "G-54EDDJHV27",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const fireStore = getFirestore(app);
