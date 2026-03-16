import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAllowedEmail } from "@/features/auth/domain";

type User = {
  id: string;
  email?: string | null;
  app_metadata?: { [key: string]: unknown };
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  domainError: string | null;
  isAdmin: boolean;
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshClaims = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user;
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }
    const adminRole = (currentUser.app_metadata as any)?.role === "admin";
    setIsAdmin(Boolean(adminRole));
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (currentUser && !isAllowedEmail(currentUser.email)) {
        await supabase.auth.signOut();
        setDomainError("Domaine non autorise. Utilisez votre email @lomebs.com.");
        setUser(null);
        setIsAdmin(false);
      } else {
        setUser(currentUser || null);
        setDomainError(null);
        setIsAdmin(Boolean((currentUser?.app_metadata as any)?.role === "admin"));
      }
      setLoading(false);
    };

    initialize().catch(() => {
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser && !isAllowedEmail(currentUser.email)) {
        await supabase.auth.signOut();
        setDomainError("Domaine non autorise. Utilisez votre email @lomebs.com.");
        setUser(null);
        setIsAdmin(false);
      } else {
        setUser(currentUser);
        setDomainError(null);
        setIsAdmin(Boolean((currentUser?.app_metadata as any)?.role === "admin"));
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setDomainError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signOutUser,
      domainError,
      isAdmin,
      refreshClaims
    }),
    [user, loading, signInWithGoogle, signOutUser, domainError, isAdmin, refreshClaims]
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
