import React from "react";
import { Pressable, PressableProps, Text, View } from "react-native";

type GoogleButtonProps = PressableProps & {
  title?: string;
};

export function GoogleButton({ title = "Continuer avec Google", ...props }: GoogleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="w-full flex-row items-center justify-center rounded-xl border border-slate-light bg-white px-4 py-3 active:opacity-90"
      {...props}
    >
      <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-slate-light">
        <Text className="text-sm font-semibold text-navy">G</Text>
      </View>
      <Text className="text-base font-semibold text-slate-dark">{title}</Text>
    </Pressable>
  );
}
