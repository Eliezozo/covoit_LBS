import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { FullScreenLoader } from "@/components/organisms/FullScreenLoader";
import { useAuth } from "@/features/auth/AuthProvider";
import { CommissionSummary, getCommissionSummary } from "@/features/admin/api";

export default function AdminScreen() {
  const { user, loading, isAdmin, refreshClaims } = useAuth();
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await getCommissionSummary();
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chargement impossible.";
      setError(message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadSummary();
    }
  }, [isAdmin, loadSummary]);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base text-slate-gray">Connectez-vous pour acceder a l'administration.</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <ScrollView className="flex-1 bg-white px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="pt-6">
          <Text className="text-2xl font-semibold text-navy">Administration</Text>
          <Text className="mt-1 text-sm text-slate-gray">
            Vous n'avez pas les droits administrateur.
          </Text>
        </View>

        <Card className="mt-6">
          <Text className="text-sm text-slate-gray">
            Si vos droits viennent d'etre ajoutes, rafraichissez vos claims.
          </Text>
          <View className="mt-4">
            <Button title="Rafraichir mes droits" onPress={refreshClaims} />
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-6" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="pt-6">
        <Text className="text-2xl font-semibold text-navy">Administration</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Suivi des commissions LBS Covoit.
        </Text>
      </View>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Resume</Text>
        {fetching ? (
          <Text className="mt-2 text-sm text-slate-gray">Chargement...</Text>
        ) : null}
        {error ? <Text className="mt-2 text-sm text-red-600">{error}</Text> : null}
        {summary ? (
          <View className="mt-3 space-y-2">
            <Text className="text-sm text-slate-dark">Total commissions: {summary.totalTokens} jetons</Text>
            <Text className="text-sm text-slate-dark">Total courses: {summary.totalCount}</Text>
            <Text className="text-sm text-slate-dark">30 derniers jours: {summary.last30Tokens} jetons</Text>
          </View>
        ) : null}
        <View className="mt-4">
          <Button title="Rafraichir" onPress={loadSummary} disabled={fetching} />
        </View>
      </Card>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Dernieres commissions</Text>
        <View className="mt-3 space-y-3">
          {summary?.recent?.length ? (
            summary.recent.map((entry) => (
              <View key={entry.id} className="rounded-xl border border-slate-light px-4 py-3">
                <Text className="text-sm font-semibold text-slate-dark">{entry.tokens} jetons</Text>
                <Text className="mt-1 text-xs text-slate-gray">
                  {entry.createdAt ?? "Date inconnue"} · Trajet {entry.rideId ?? "-"}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-slate-gray">Aucune commission recente.</Text>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
