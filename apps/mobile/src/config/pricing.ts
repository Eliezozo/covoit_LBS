export type ZoneId = "zone-1" | "zone-2" | "zone-3";

export type Zone = {
  id: ZoneId;
  label: string;
  examples: string[];
  tokens: number;
};

export const COMMISSION_RATE = 0.2;

export const ZONES: Zone[] = [
  {
    id: "zone-1",
    label: "Zone 1 - Proximite",
    examples: ["Adidoadin", "Totsi", "Agbalepedogan"],
    tokens: 2
  },
  {
    id: "zone-2",
    label: "Zone 2 - Moyenne distance",
    examples: ["Hedzranawoe", "Aeroport", "Deckon", "Nyekonakpoe"],
    tokens: 4
  },
  {
    id: "zone-3",
    label: "Zone 3 - Longue distance",
    examples: ["Agoe-Assiyeye", "Baguida", "Adetikope"],
    tokens: 7
  }
];

export function computeCommission(tokens: number): number {
  return Math.ceil(tokens * COMMISSION_RATE);
}

export function computeDriverPayout(tokens: number): number {
  return tokens - computeCommission(tokens);
}
