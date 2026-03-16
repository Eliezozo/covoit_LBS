import { ZoneId } from "@/config/pricing";

export type RideStatus = "open" | "full" | "completed" | "cancelled";

export type Ride = {
  id: string;
  driverId: string;
  zoneId: ZoneId;
  seatsTotal: number;
  seatsAvailable: number;
  status: RideStatus;
  departureTime: string;
  createdAt: string;
};

export type ReservationStatus = "held" | "confirmed" | "cancelled";

export type RideReservation = {
  id: string;
  rideId: string;
  driverId: string;
  passengerId: string;
  tokensHeld: number;
  status: ReservationStatus;
  qrToken?: string | null;
  createdAt: string;
};
