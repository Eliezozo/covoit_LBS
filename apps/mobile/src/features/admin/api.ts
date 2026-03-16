import { supabase } from "@/lib/supabase";

export type CommissionEntry = {
  id: string;
  ride_id: string | null;
  driver_id: string | null;
  passenger_id: string | null;
  tokens: number;
  created_at: string | null;
};

export type CommissionSummary = {
  total_tokens: number;
  total_count: number;
  last30_tokens: number;
  recent: CommissionEntry[];
};

export async function getCommissionSummary() {
  const { data, error } = await supabase.rpc("get_commission_summary");
  if (error || !data) {
    throw new Error(error?.message || "Impossible de charger le rapport de commission.");
  }
  return data as CommissionSummary;
}
