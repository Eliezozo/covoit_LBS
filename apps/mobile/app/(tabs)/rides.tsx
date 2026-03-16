import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { QrCodeCard } from "@/components/molecules/QrCodeCard";
import { ZONES, computeCommission, computeDriverPayout } from "@/config/pricing";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Ride, RideReservation } from "@/features/rides/types";
import { finalizeRide, reserveRideTokens } from "@/features/wallet/api";

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
    return "Horaire non renseigne";
  }
  return new Date(timestamp).toLocaleString("fr-FR");
};

export default function RidesScreen() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string>(ZONES[0]?.id ?? "");
  const [seatsTotal, setSeatsTotal] = useState("3");
  const [departureTime, setDepartureTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reservationLoading, setReservationLoading] = useState<string | null>(null);
  const [driverReservations, setDriverReservations] = useState<RideReservation[]>([]);
  const [passengerReservations, setPassengerReservations] = useState<RideReservation[]>([]);
  const [driverReservationError, setDriverReservationError] = useState<string | null>(null);
  const [passengerReservationError, setPassengerReservationError] = useState<string | null>(null);
  const [driverReservationsLoading, setDriverReservationsLoading] = useState(true);
  const [passengerReservationsLoading, setPassengerReservationsLoading] = useState(true);
  const [scanningReservation, setScanningReservation] = useState<RideReservation | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerPermission, setScannerPermission] = useState<boolean | null>(null);
  const [manualQrToken, setManualQrToken] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const selectedZone = useMemo(() => ZONES.find((zone) => zone.id === zoneId), [zoneId]);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("*")
          .order("departure_time", { ascending: true });

        if (error) {
          console.error(error);
          setError("Impossible de charger les trajets.");
          setLoading(false);
          return;
        }

        const next = (data ?? []).map((ride: any) => ({
          id: ride.id,
          driverId: ride.driver_id,
          zoneId: ride.zone_id,
          seatsTotal: ride.seats_total,
          seatsAvailable: ride.seats_available,
          status: ride.status,
          departureTime: ride.departure_time
        }));

        setRides(next);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les trajets.");
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchDriverReservations = async () => {
      try {
        const { data, error } = await supabase
          .from("ride_reservations")
          .select("*")
          .eq("driver_id", user.uid)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          setDriverReservationError("Impossible de charger les reservations conducteur.");
          setDriverReservationsLoading(false);
          return;
        }

        const next = (data ?? []).map((r: any) => ({
          id: r.id,
          rideId: r.ride_id,
          driverId: r.driver_id,
          passengerId: r.passenger_id,
          tokensHeld: r.tokens_held,
          status: r.status,
          qrToken: r.qr_token,
          createdAt: r.created_at
        }));

        setDriverReservations(next);
        setDriverReservationError(null);
      } catch (err) {
        console.error(err);
        setDriverReservationError("Impossible de charger les reservations conducteur.");
      } finally {
        setDriverReservationsLoading(false);
      }
    };

    fetchDriverReservations();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchPassengerReservations = async () => {
      try {
        const { data, error } = await supabase
          .from("ride_reservations")
          .select("*")
          .eq("passenger_id", user.uid)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          setPassengerReservationError("Impossible de charger vos reservations.");
          setPassengerReservationsLoading(false);
          return;
        }

        const next = (data ?? []).map((r: any) => ({
          id: r.id,
          rideId: r.ride_id,
          driverId: r.driver_id,
          passengerId: r.passenger_id,
          tokensHeld: r.tokens_held,
          status: r.status,
          qrToken: r.qr_token,
          createdAt: r.created_at
        }));

        setPassengerReservations(next);
        setPassengerReservationError(null);
      } catch (err) {
        console.error(err);
        setPassengerReservationError("Impossible de charger vos reservations.");
      } finally {
        setPassengerReservationsLoading(false);
      }
    };

    fetchPassengerReservations();
  }, [user]);

  const handleCreateRide = useCallback(async () => {
    if (!user) {
      return;
    }
    setFormError(null);
    const seats = Number.parseInt(seatsTotal, 10);
    if (!zoneId) {
      setFormError("Selectionnez une zone.");
      return;
    }
    if (Number.isNaN(seats) || seats < 1) {
      setFormError("Indiquez un nombre de places valide.");
      return;
    }
    if (!departureTime.trim()) {
      setFormError("Indiquez une heure de depart.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("rides").insert([
        {
          driver_id: user.id,
          zone_id: zoneId,
          seats_total: seats,
          seats_available: seats,
          status: "open",
          departure_time: departureTime.trim(),
          created_at: new Date().toISOString()
        }
      ]);

      if (error) {
        throw error;
      }

      setDepartureTime("");
      setSeatsTotal("3");
      Alert.alert("Trajet cree", "Votre trajet est maintenant visible.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de creer le trajet.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }, [departureTime, seatsTotal, user, zoneId]);

  const handleReserveRide = useCallback(
    async (ride: Ride) => {
      if (!user) {
        return;
      }
      setReservationLoading(ride.id);
      try {
        const result = await reserveRideTokens({ rideId: ride.id, zoneId: ride.zoneId });
        Alert.alert(
          "Reservation en cours",
          `${result.tokensHeld} jetons sont bloques sous sequestre.`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Reservation impossible.";
        Alert.alert("Erreur", message);
      } finally {
        setReservationLoading(null);
      }
    },
    [user]
  );

  const closeScanner = useCallback(() => {
    setScannerVisible(false);
    setScanningReservation(null);
    setManualQrToken("");
    setScanError(null);
    setScanLoading(false);
  }, []);

  const openScanner = useCallback(
    async (reservation: RideReservation) => {
      setScanningReservation(reservation);
      setManualQrToken("");
      setScanError(null);
      setScannerPermission(null);

      if (Platform.OS === "web") {
        setScannerPermission(false);
        setScannerVisible(true);
        return;
      }

      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setScannerPermission(status === "granted");
        setScannerVisible(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Acces camera refuse.";
        setScannerPermission(false);
        setScannerVisible(true);
        setScanError(message);
      }
    },
    []
  );

  const submitFinalize = useCallback(
    async (qrToken: string) => {
      if (!scanningReservation) {
        return;
      }
      if (!qrToken.trim()) {
        setScanError("Saisissez un QR valide.");
        return;
      }
      setScanLoading(true);
      try {
        const result = await finalizeRide({
          reservationId: scanningReservation.id,
          qrToken: qrToken.trim()
        });
        closeScanner();
        Alert.alert(
          "Trajet valide",
          `Versement conducteur: ${result.payoutTokens} jeton(s). Commission: ${result.commissionTokens} jeton(s).`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Validation impossible.";
        setScanError(message);
      } finally {
        setScanLoading(false);
      }
    },
    [closeScanner, scanningReservation]
  );

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanLoading) {
        return;
      }
      await submitFinalize(data);
    },
    [scanLoading, submitFinalize]
  );

  return (
    <ScrollView className="flex-1 bg-white px-6" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="pt-6">
        <Text className="text-2xl font-semibold text-navy">Trajets</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Creez un trajet conducteur ou reservez une place.
        </Text>
      </View>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Conducteur</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Definissez la zone, le nombre de places et l'heure de depart.
        </Text>
        <View className="mt-4 space-y-4">
          <View className="space-y-2">
            <Text className="text-xs font-semibold uppercase text-slate-gray">Zone</Text>
            {ZONES.map((zone) => {
              const isSelected = zone.id === zoneId;
              return (
                <Pressable
                  key={zone.id}
                  onPress={() => setZoneId(zone.id)}
                  className={`rounded-xl border px-4 py-3 ${isSelected ? "border-navy bg-slate-light" : "border-slate-light"}`}
                >
                  <Text className="text-sm font-semibold text-slate-dark">{zone.label}</Text>
                  <Text className="mt-1 text-xs text-slate-gray">{zone.examples.join(", ")}</Text>
                  <Text className="mt-2 text-sm font-semibold text-navy">{zone.tokens} jetons</Text>
                </Pressable>
              );
            })}
          </View>

          <View className="space-y-2">
            <Text className="text-xs font-semibold uppercase text-slate-gray">Places disponibles</Text>
            <TextInput
              value={seatsTotal}
              onChangeText={setSeatsTotal}
              keyboardType="numeric"
              placeholder="Ex: 3"
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-light px-4 py-3 text-base text-slate-dark"
            />
          </View>

          <View className="space-y-2">
            <Text className="text-xs font-semibold uppercase text-slate-gray">Depart</Text>
            <TextInput
              value={departureTime}
              onChangeText={setDepartureTime}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-light px-4 py-3 text-base text-slate-dark"
            />
          </View>

          {selectedZone ? (
            <View className="rounded-xl border border-slate-light bg-slate-light px-4 py-3">
              <Text className="text-xs font-semibold uppercase text-slate-gray">Repartition</Text>
              <Text className="mt-2 text-sm text-slate-dark">
                Passager: {selectedZone.tokens} jetons
              </Text>
              <Text className="mt-1 text-xs text-slate-gray">
                Commission {computeCommission(selectedZone.tokens)} jeton(s) · Versement conducteur{" "}
                {computeDriverPayout(selectedZone.tokens)} jeton(s)
              </Text>
            </View>
          ) : null}

          {formError ? <Text className="text-sm text-red-600">{formError}</Text> : null}

          <Button
            title={submitting ? "Creation..." : "Creer un trajet"}
            onPress={handleCreateRide}
            disabled={submitting}
          />
        </View>
      </Card>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Passager</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Les jetons sont bloques sous sequestre jusqu'a la validation QR.
        </Text>
        <View className="mt-4 space-y-3">
          {loading ? (
            <View className="items-center justify-center rounded-xl border border-slate-light px-4 py-6">
              <ActivityIndicator size="small" color="#1e3a8a" />
              <Text className="mt-2 text-xs text-slate-gray">Chargement des trajets...</Text>
            </View>
          ) : null}

          {error ? (
            <View className="rounded-xl border border-slate-light bg-slate-light px-4 py-3">
              <Text className="text-sm text-slate-dark">{error}</Text>
            </View>
          ) : null}

          {!loading && !error && rides.length === 0 ? (
            <View className="rounded-xl border border-slate-light px-4 py-3">
              <Text className="text-sm font-semibold text-slate-dark">
                Aucun trajet disponible pour le moment.
              </Text>
              <Text className="mt-1 text-xs text-slate-gray">
                Ajoutez un trajet pour etre visible ici.
              </Text>
            </View>
          ) : null}

          {rides.map((ride) => {
            const zone = ZONES.find((entry) => entry.id === ride.zoneId);
            const isMine = ride.driverId === user?.uid;
            const hasSeats = ride.seatsAvailable > 0 && ride.status === "open";
            const isLoading = reservationLoading === ride.id;
            return (
              <View key={ride.id} className="rounded-xl border border-slate-light px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-slate-dark">
                    {zone?.label ?? ride.zoneId}
                  </Text>
                  <Text className="text-xs text-slate-gray">
                    {isMine ? "Votre trajet" : ride.status}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-slate-gray">
                  Depart {formatDateTime(ride.departureTime)}
                </Text>
                <Text className="mt-3 text-sm font-semibold text-slate-dark">
                  {ride.seatsAvailable}/{ride.seatsTotal} places
                </Text>
                <Text className="mt-1 text-sm font-semibold text-navy">
                  {zone?.tokens ?? "-"} jetons
                </Text>
                {!isMine ? (
                  <View className="mt-4">
                    <Button
                      title={isLoading ? "Reservation..." : "Reserver une place"}
                      onPress={() => handleReserveRide(ride)}
                      disabled={!hasSeats || isLoading}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">Mes reservations</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Scannez le QR du conducteur pour confirmer votre trajet.
        </Text>

        <View className="mt-4 space-y-3">
          {passengerReservationError ? (
            <View className="rounded-xl border border-slate-light bg-slate-light px-4 py-3">
              <Text className="text-sm text-slate-dark">{passengerReservationError}</Text>
            </View>
          ) : null}

          {passengerReservationsLoading ? (
            <View className="items-center justify-center rounded-xl border border-slate-light px-4 py-6">
              <ActivityIndicator size="small" color="#1e3a8a" />
              <Text className="mt-2 text-xs text-slate-gray">Chargement...</Text>
            </View>
          ) : null}

          {passengerReservations.length === 0 &&
          !passengerReservationError &&
          !passengerReservationsLoading ? (
            <View className="rounded-xl border border-slate-light px-4 py-3">
              <Text className="text-sm text-slate-gray">
                Aucune reservation pour le moment.
              </Text>
            </View>
          ) : null}

          {passengerReservations.map((reservation) => (
            <View key={reservation.id} className="rounded-xl border border-slate-light px-4 py-4">
              <Text className="text-sm font-semibold text-slate-dark">
                Reservation {reservation.status}
              </Text>
              <Text className="mt-1 text-xs text-slate-gray">
                Trajet {reservation.rideId} · Conducteur {reservation.driverId}
              </Text>
              <Text className="mt-2 text-sm text-slate-dark">
                {reservation.tokensHeld} jeton(s) sous sequestre
              </Text>
              {reservation.status === "held" ? (
                <View className="mt-3">
                  <Button title="Scanner le QR conducteur" onPress={() => openScanner(reservation)} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      <Card className="mt-6">
        <Text className="text-base font-semibold text-slate-dark">QR conducteur</Text>
        <Text className="mt-1 text-sm text-slate-gray">
          Affichez le QR pour que le passager puisse finaliser la course.
        </Text>

        <View className="mt-4 space-y-3">
          {driverReservationError ? (
            <View className="rounded-xl border border-slate-light bg-slate-light px-4 py-3">
              <Text className="text-sm text-slate-dark">{driverReservationError}</Text>
            </View>
          ) : null}

          {driverReservationsLoading ? (
            <View className="items-center justify-center rounded-xl border border-slate-light px-4 py-6">
              <ActivityIndicator size="small" color="#1e3a8a" />
              <Text className="mt-2 text-xs text-slate-gray">Chargement...</Text>
            </View>
          ) : null}

          {driverReservations.length === 0 && !driverReservationError && !driverReservationsLoading ? (
            <View className="rounded-xl border border-slate-light px-4 py-3">
              <Text className="text-sm text-slate-gray">
                Aucun passager en attente.
              </Text>
            </View>
          ) : null}

          {driverReservations.map((reservation) => (
            <View key={reservation.id} className="rounded-xl border border-slate-light px-4 py-4">
              <Text className="text-sm font-semibold text-slate-dark">
                Reservation {reservation.status}
              </Text>
              <Text className="mt-1 text-xs text-slate-gray">
                Trajet {reservation.rideId} · Passager {reservation.passengerId}
              </Text>
              <Text className="mt-2 text-sm text-slate-dark">
                {reservation.tokensHeld} jeton(s) sous sequestre
              </Text>
              {reservation.status === "held" ? (
                <View className="mt-4">
                  <QrCodeCard token={reservation.qrToken} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      <Modal
        animationType="slide"
        visible={scannerVisible}
        onRequestClose={closeScanner}
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white px-6 pt-10">
          <Text className="text-2xl font-semibold text-navy">Validation QR</Text>
          <Text className="mt-2 text-sm text-slate-gray">
            Scannez le QR du conducteur pour finaliser votre trajet.
          </Text>

          {scannerPermission === null && Platform.OS !== "web" ? (
            <View className="mt-8 items-center">
              <ActivityIndicator size="large" color="#1e3a8a" />
              <Text className="mt-4 text-sm text-slate-gray">Demande d'autorisation...</Text>
            </View>
          ) : null}

          {scannerPermission === true ? (
            <View className="mt-6 flex-1 overflow-hidden rounded-2xl border border-slate-light">
              <BarCodeScanner
                onBarCodeScanned={handleBarCodeScanned}
                barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
                style={{ flex: 1 }}
              />
            </View>
          ) : null}

          {scannerPermission === false ? (
            <View className="mt-6 space-y-3">
              <Text className="text-sm text-slate-gray">
                Autorisation camera indisponible. Saisissez le code manuellement.
              </Text>
              <TextInput
                value={manualQrToken}
                onChangeText={setManualQrToken}
                placeholder="QRCode"
                placeholderTextColor="#94a3b8"
                className="rounded-xl border border-slate-light px-4 py-3 text-base text-slate-dark"
              />
              <Button
                title={scanLoading ? "Validation..." : "Valider"}
                onPress={() => submitFinalize(manualQrToken)}
                disabled={!manualQrToken || scanLoading}
              />
            </View>
          ) : null}

          {scanError ? <Text className="mt-4 text-sm text-red-600">{scanError}</Text> : null}

          <View className="mt-6">
            <Button title="Fermer" variant="outline" onPress={closeScanner} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
