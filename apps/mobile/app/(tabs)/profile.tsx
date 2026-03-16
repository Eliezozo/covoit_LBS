import React from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { useRouter } from "expo-router";

import { useAuth } from "@/features/auth/AuthProvider";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOutUser, isAdmin } = useAuth();

  return (
    <ScrollView className="flex-1 bg-white px-6" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="pt-6">
        <Text className="text-2xl font-semibold text-navy">Profil</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Vos informations de compte LBS.
        </Text>
      </View>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Compte</Text>
        <View className="mt-3 space-y-2">
          <View className="rounded-xl border border-slate-light px-4 py-3">
            <Text className="text-xs text-slate-gray">Email</Text>
            <Text className="mt-1 text-sm font-semibold text-slate-dark">
              {user?.email ?? "Non connecte"}
            </Text>
          </View>
        </View>
      </Card>

      {isAdmin ? (
        <View className="mt-6">
          <Button title="Administration" onPress={() => router.push("/admin")} />
        </View>
      ) : null}

      <View className={isAdmin ? "mt-3" : "mt-6"}>
        <Button title="Se deconnecter" variant="outline" onPress={signOutUser} />
      </View>
    </ScrollView>
  );
}
