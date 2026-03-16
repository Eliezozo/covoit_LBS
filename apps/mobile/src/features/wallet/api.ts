import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase";
import { ZoneId } from "@/config/pricing";

type ReserveRideInput = {
  rideId: string;
  zoneId: ZoneId;
};

type ReserveRideResult = {
  reservationId: string;
  tokensHeld: number;
  qrToken?: string | null;
};

type FinalizeRideInput = {
  reservationId: string;
  qrToken: string;
};

type FinalizeRideResult = {
  payoutTokens: number;
  commissionTokens: number;
};

type PurchaseTokensInput = {
  tokens: number;
};

type PurchaseTokensResult = {
  balance: number;
  transactionId: string;
};

export async function reserveRideTokens(input: ReserveRideInput) {
  const callable = httpsCallable<ReserveRideInput, ReserveRideResult>(functions, "reserveRide");
  const result = await callable(input);
  return result.data;
}

export async function finalizeRide(input: FinalizeRideInput) {
  const callable = httpsCallable<FinalizeRideInput, FinalizeRideResult>(functions, "finalizeRide");
  const result = await callable(input);
  return result.data;
}

export async function purchaseTokens(input: PurchaseTokensInput) {
  const callable = httpsCallable<PurchaseTokensInput, PurchaseTokensResult>(
    functions,
    "purchaseTokens"
  );
  const result = await callable(input);
  return result.data;
}
