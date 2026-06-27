import { auth, fireStore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await updateUserData(firebaseUser.uid);
        router.replace("/(tabs)");
      } else {
        setUser(null);

        setTimeout(() => {
          router.replace("/(auth)/welcome");
        }, 2000);
      }
    });

    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      return {
        success: true,
        msg: "Login successful",
      };
    } catch (error: any) {
      let msg = error.message;

      if (msg.includes("auth/invalid-credential")) {
        msg = "Please enter correct email and password";
      }

      console.log(msg);

      return {
        success: false,
        msg,
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Save displayName in Firebase Auth
      await updateProfile(response.user, {
        displayName: name,
      });

      // Save user in Firestore
      await setDoc(doc(fireStore, "users", response.user.uid), {
        uid: response.user.uid,
        name,
        email: response.user.email,
        image: null,
      });

      // Update local state immediately
      setUser({
        uid: response.user.uid,
        name,
        email: response.user.email!,
        image: null,
      });

      return {
        success: true,
        msg: "Register successful",
      };
    } catch (error: any) {
      let msg = error.message;

      if (msg.includes("auth/weak-password")) {
        msg = "Password length should be greater than 6";
      }

      console.log(msg);

      return {
        success: false,
        msg,
      };
    }
  };

  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(fireStore, "users", uid);
      const snapShot = await getDoc(docRef);

      if (snapShot.exists()) {
        const data = snapShot.data();

        const userData: UserType = {
          uid: data.uid,
          name: data.name,
          email: data.email,
          image: data.image || null,
        };

        console.log("Firestore User:", userData);

        setUser(userData);
      }
    } catch (error: any) {
      console.log("Error:", error.message);
    }
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }

  return context;
};
