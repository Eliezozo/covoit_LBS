import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from "react-native";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { useAuth } from "@/features/auth/AuthProvider";
import { purchaseTokens } from "@/features/wallet/api";
import type { Transaction, Wallet } from "@/features/wallet/types";
import { db } from "@/lib/firebase";

const MAX_DATE_FALLBACK = Number.MAX_SAFE_INTEGER;

const toDateValue = (value: unknown) => {
  if (!value) {
    return MAX_DATE_FALLBACK;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? MAX_DATE_FALLBACK : parsed.getTime();
  }
  if (typeof value === "object" && value && "toDate" in value) {
    const maybeDate = (value as { toDate?: () => Date }).toDate?.();
    if (maybeDate instanceof Date) {
      return maybeDate.getTime();
    }
  }
  return MAX_DATE_FALLBACK;
};

const formatDateTime = (value: unknown) => {
  const timestamp = toDateValue(value);
  if (timestamp === MAX_DATE_FALLBACK) {
    return "Date inconnue";
  }
  return new Date(timestamp).toLocaleString("fr-FR");
};

export default function WalletScreen() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseInput, setPurchaseInput] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const transactionLabels = useMemo(
    () => ({
      purchase: "Achat de jetons",
      hold: "Sequestre",
      release: "Liberation",
      payout: "Versement conducteur",
      commission: "Commission"
    }),
    []
  );

  const statusLabels = useMemo(
    () => ({
      pending: "En attente",
      completed: "Terminee",
      failed: "Echouee"
    }),
    []
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const walletRef = doc(db, "wallets", user.uid);
    const unsubscribeWallet = onSnapshot(
      walletRef,
      (snapshot) => {
        setWallet(snapshot.exists() ? ({ userId: user.uid, ...(snapshot.data() as Wallet) }) : null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError("Impossible de charger le wallet.");
        setLoading(false);
      }
    );

    const txQuery = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const unsubscribeTx = onSnapshot(
      txQuery,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Transaction, "id">)
        }));
        next.sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt));
        setTransactions(next);
      },
      () => {
        setError("Impossible de charger les transactions.");
      }
    );

    return () => {
      unsubscribeWallet();
      unsubscribeTx();
    };
  }, [user]);

  const handlePurchase = useCallback(async () => {
    setPurchaseError(null);
    const tokens = Number.parseInt(purchaseInput, 10);
    if (Number.isNaN(tokens) || tokens < 1) {
      setPurchaseError("Indiquez un nombre de jetons valide.");
      return;
    }
    setPurchaseLoading(true);
    try {
      const result = await purchaseTokens({ tokens });
      setPurchaseInput("");
      Alert.alert("Achat confirme", `Nouveau solde: ${result.balance} jeton(s).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Achat impossible.";
      setPurchaseError(message);
    } finally {
      setPurchaseLoading(false);
    }
  }, [purchaseInput]);

  return (
    <ScrollView className="flex-1 bg-white px-6" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="pt-6">
        <Text className="text-2xl font-semibold text-navy">Wallet</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Suivez vos jetons et vos transactions.
        </Text>
      </View>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Solde actuel</Text>
        {loading ? (
          <View className="mt-4 items-start">
            <ActivityIndicator size="small" color="#1e3a8a" />
          </View>
        ) : (
          <Text className="mt-2 text-3xl font-semibold text-navy">
            {wallet?.balance ?? 0} jeton(s)
          </Text>
        )}
        {error ? <Text className="mt-3 text-xs text-red-600">{error}</Text> : null}
      </Card>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Acheter des jetons</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Selectionnez le nombre de jetons a acheter.
        </Text>
        <View className="mt-4 space-y-3">
          <TextInput
            value={purchaseInput}
            onChangeText={setPurchaseInput}
            keyboardType="numeric"
            placeholder="Ex: 10"
            placeholderTextColor="#94a3b8"
            className="rounded-xl border border-slate-light px-4 py-3 text-base text-slate-dark"
          />
          {purchaseError ? <Text className="text-sm text-red-600">{purchaseError}</Text> : null}
          <Button
            title={purchaseLoading ? "Achat en cours..." : "Confirmer l'achat"}
            onPress={handlePurchase}
            disabled={purchaseLoading}
          />
        </View>
      </Card>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">
          Historique des transactions
        </Text>
        <View className="mt-3 space-y-3">
          {!loading && transactions.length === 0 ? (
            <Text className="text-sm text-slate-gray">
              Aucune transaction pour le moment.
            </Text>
          ) : null}

          {transactions.map((tx) => (
            <View key={tx.id} className="rounded-xl border border-slate-light px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-dark">
                  {transactionLabels[tx.type] ?? tx.type}
                </Text>
                <Text className="text-sm font-semibold text-navy">{tx.tokens} jetons</Text>
              </View>
              <Text className="mt-1 text-xs text-slate-gray">
                {formatDateTime(tx.createdAt)} · {statusLabels[tx.status] ?? tx.status}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}
