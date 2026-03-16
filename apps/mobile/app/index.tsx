import React from "react";
import { Redirect } from "expo-router";

import { FullScreenLoader } from "@/components/organisms/FullScreenLoader";
import { useAuth } from "@/features/auth/AuthProvider";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(tabs)" />;
}
