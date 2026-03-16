import React from "react";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/atoms/Card";
import { ZONES } from "@/config/pricing";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-white px-6" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="pt-6">
        <Text className="text-2xl font-semibold text-navy">Bonjour, LBS</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Reservez un trajet en quelques secondes avec un pricing clair.
        </Text>
      </View>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Zonage & tarifs</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Commission automatique de 20% sur chaque transaction.
        </Text>

        <View className="mt-4 space-y-3">
          {ZONES.map((zone) => (
            <View key={zone.id} className="rounded-xl border border-slate-light px-4 py-3">
              <Text className="text-sm font-semibold text-slate-dark">{zone.label}</Text>
              <Text className="mt-1 text-xs text-slate-gray">
                {zone.examples.join(", ")}
              </Text>
              <Text className="mt-2 text-sm font-semibold text-navy">
                {zone.tokens} jetons
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Prochaines etapes</Text>
        <Text className="mt-2 text-sm text-slate-gray">
          Ajoutez un trajet en tant que conducteur ou reservez une place.
        </Text>
      </Card>
    </ScrollView>
  );
}
