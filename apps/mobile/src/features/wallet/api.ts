import { supabase } from "@/lib/supabase";
import { ZoneId } from "@/config/pricing";

type ReserveRideInput = {
  rideId: string;
  zoneId: ZoneId;
};

type ReserveRideResult = {
  reservation_id: string;
  tokens_held: number;
  qr_token?: string | null;
};

type FinalizeRideInput = {
  reservationId: string;
  qrToken: string;
};

type FinalizeRideResult = {
  payout_tokens: number;
  commission_tokens: number;
};

type PurchaseTokensInput = {
  tokens: number;
};

type PurchaseTokensResult = {
  balance: number;
  transaction_id: string;
};

export async function reserveRideTokens(input: ReserveRideInput) {
  const { data, error } = await supabase.rpc("reserve_ride", {
    ride_id: input.rideId,
    zone_id: input.zoneId
  });
  if (error || !data) {
    throw new Error(error?.message || "Échec de la réservation.");
  }
  return data as ReserveRideResult;
}

export async function finalizeRide(input: FinalizeRideInput) {
  const { data, error } = await supabase.rpc("finalize_ride", {
    reservation_id: input.reservationId,
    qr_token: input.qrToken
  });
  if (error || !data) {
    throw new Error(error?.message || "Échec de la finalisation.");
  }
  return data as FinalizeRideResult;
}

export async function purchaseTokens(input: PurchaseTokensInput) {
  const { data, error } = await supabase.rpc("purchase_tokens", {
    tokens: input.tokens
  });
  if (error || !data) {
    throw new Error(error?.message || "Échec de l'achat de jetons.");
  }
  return data as PurchaseTokensResult;
}
