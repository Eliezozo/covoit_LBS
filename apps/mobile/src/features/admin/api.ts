import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase";

export type CommissionEntry = {
  id: string;
  rideId: string | null;
  driverId: string | null;
  passengerId: string | null;
  tokens: number;
  createdAt: string | null;
};

export type CommissionSummary = {
  totalTokens: number;
  totalCount: number;
  last30Tokens: number;
  recent: CommissionEntry[];
};

export async function getCommissionSummary() {
  const callable = httpsCallable<void, CommissionSummary>(functions, "getCommissionSummary");
  const result = await callable();
  return result.data;
}
