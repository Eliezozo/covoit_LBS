import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { isAllowedEmail } from "@/features/auth/domain";

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  domainError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainError, setDomainError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    responseType: "id_token"
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser && !isAllowedEmail(nextUser.email)) {
        setDomainError("Domaine non autorise. Utilisez votre email @lomebs.com.");
        await signOut(auth);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(nextUser ?? null);
      setDomainError(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const finishNativeSignIn = async () => {
      if (response?.type !== "success") {
        return;
      }

      const idToken = "id_token" in response.params ? response.params.id_token : undefined;
      if (!idToken) {
        setDomainError("Jeton Google manquant. Reessayez.");
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    };

    finishNativeSignIn().catch((error) => {
      const message = error instanceof Error ? error.message : "Connexion impossible.";
      setDomainError(message);
    });
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    setDomainError(null);
    const provider = new GoogleAuthProvider();

    if (Platform.OS !== "web") {
      if (!request) {
        throw new Error("Le flux Google n'est pas pret. Reessayez.");
      }
      await promptAsync();
      return;
    }

    const result = await signInWithPopup(auth, provider);
    if (!isAllowedEmail(result.user.email)) {
      await signOut(auth);
      throw new Error("Domaine non autorise. Utilisez votre email @lomebs.com.");
    }
  }, [promptAsync, request]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signOutUser,
      domainError
    }),
    [user, loading, signInWithGoogle, signOutUser, domainError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider.");
  }
  return context;
}
