import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

type FullScreenLoaderProps = {
  label?: string;
};

export function FullScreenLoader({ label = "Chargement..." }: FullScreenLoaderProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ActivityIndicator size="large" color="#1e3a8a" />
      <Text className="mt-4 text-base text-slate-gray">{label}</Text>
    </View>
  );
}
