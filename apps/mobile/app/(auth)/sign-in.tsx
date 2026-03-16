import React, { useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { GoogleButton } from "@/components/molecules/GoogleButton";
import { useAuth } from "@/features/auth/AuthProvider";

export default function SignInScreen() {
  const { signInWithGoogle, domainError } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connexion impossible.";
      setError(message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-1 items-center justify-center">
        <View className="w-full max-w-md">
          <Text className="text-3xl font-semibold text-navy">LBS Covoit</Text>
          <Text className="mt-2 text-base text-slate-gray">
            Connectez-vous avec votre compte officiel pour acceder a la
            communaute.
          </Text>

          <View className="mt-8">
            <GoogleButton onPress={handleGoogle} />
          </View>

          {(error || domainError) && (
            <View className="mt-4 rounded-xl border border-slate-light bg-slate-light px-4 py-3">
              <Text className="text-sm text-slate-dark">{error ?? domainError}</Text>
            </View>
          )}

          <Text className="mt-8 text-xs text-slate-gray">
            Seuls les comptes @lomebs.com sont autorises.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
