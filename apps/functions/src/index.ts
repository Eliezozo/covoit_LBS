import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { randomUUID } from "crypto";

admin.initializeApp();

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const ALLOWED_DOMAIN = "lomebs.com";
const COMMISSION_RATE = 0.2;
const MAX_PURCHASE_TOKENS = 500;

const ZONE_TOKENS: Record<string, number> = {
  "zone-1": 2,
  "zone-2": 4,
  "zone-3": 7
};

type RideStatus = "open" | "full" | "completed" | "cancelled";

type Ride = {
  id: string;
  driverId: string;
  zoneId: string;
  seatsTotal: number;
  seatsAvailable: number;
  status: RideStatus;
};

type RideReservation = {
  rideId: string;
  driverId: string;
  passengerId: string;
  tokensHeld: number;
  status: "held" | "confirmed" | "cancelled";
  qrToken?: string | null;
};

const assertAuth = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentification requise.");
  }
  return context.auth;
};

const assertDomain = (context: functions.https.CallableContext) => {
  const email = context.auth?.token?.email ?? "";
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      `Seuls les comptes @${ALLOWED_DOMAIN} sont autorises.`
    );
  }
  if (context.auth?.token?.email_verified === false) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Email non verifie."
    );
  }
};

const assertAdmin = (context: functions.https.CallableContext) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError("permission-denied", "Acces administrateur requis.");
  }
};

const asString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new functions.https.HttpsError("invalid-argument", `${field} invalide.`);
  }
  return value.trim();
};

const asPositiveInt = (value: unknown, field: string) => {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new functions.https.HttpsError("invalid-argument", `${field} invalide.`);
  }
  return parsed;
};

const tokensForZone = (zoneId: string) => {
  const tokens = ZONE_TOKENS[zoneId];
  if (!tokens) {
    throw new functions.https.HttpsError("invalid-argument", "Zone inconnue.");
  }
  return tokens;
};

export const reserveRide = functions.https.onCall(async (data, context) => {
  const auth = assertAuth(context);
  assertDomain(context);

  const rideId = asString(data?.rideId, "rideId");
  const zoneId = asString(data?.zoneId, "zoneId");
  const tokens = tokensForZone(zoneId);

  return db.runTransaction(async (tx) => {
    const rideRef = db.collection("rides").doc(rideId);
    const rideSnap = await tx.get(rideRef);

    if (!rideSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Trajet introuvable.");
    }

    const ride = rideSnap.data() as Ride;

    if (ride.driverId === auth.uid) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Vous ne pouvez pas reserver votre propre trajet."
      );
    }

    if (ride.status !== "open") {
      throw new functions.https.HttpsError("failed-precondition", "Trajet indisponible.");
    }

    if (ride.zoneId !== zoneId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "La zone selectionnee ne correspond pas au trajet."
      );
    }

    const seatsAvailable = Number(ride.seatsAvailable ?? 0);
    if (!Number.isFinite(seatsAvailable) || seatsAvailable < 1) {
      throw new functions.https.HttpsError("failed-precondition", "Plus de places disponibles.");
    }

    const walletRef = db.collection("wallets").doc(auth.uid);
    const walletSnap = await tx.get(walletRef);
    const currentBalance = walletSnap.exists ? Number(walletSnap.data()?.balance ?? 0) : 0;

    if (currentBalance < tokens) {
      throw new functions.https.HttpsError("failed-precondition", "Solde insuffisant.");
    }

    const reservationRef = db.collection("rideReservations").doc();
    const now = FieldValue.serverTimestamp();
    const qrToken = randomUUID();

    tx.set(reservationRef, {
      rideId,
      driverId: ride.driverId,
      passengerId: auth.uid,
      tokensHeld: tokens,
      status: "held",
      qrToken,
      createdAt: now,
      updatedAt: now
    });

    const newSeatsAvailable = seatsAvailable - 1;
    tx.update(rideRef, {
      seatsAvailable: newSeatsAvailable,
      status: newSeatsAvailable === 0 ? "full" : "open"
    });

    tx.set(
      walletRef,
      {
        userId: auth.uid,
        balance: currentBalance - tokens,
        updatedAt: now
      },
      { merge: true }
    );

    const txRef = db.collection("transactions").doc();
    tx.set(txRef, {
      userId: auth.uid,
      rideId,
      type: "hold",
      status: "completed",
      tokens: -tokens,
      createdAt: now
    });

    return {
      reservationId: reservationRef.id,
      tokensHeld: tokens,
      qrToken
    };
  });
});

export const finalizeRide = functions.https.onCall(async (data, context) => {
  const auth = assertAuth(context);
  assertDomain(context);

  const reservationId = asString(data?.reservationId, "reservationId");
  const qrToken = asString(data?.qrToken, "qrToken");

  return db.runTransaction(async (tx) => {
    const reservationRef = db.collection("rideReservations").doc(reservationId);
    const reservationSnap = await tx.get(reservationRef);

    if (!reservationSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Reservation introuvable.");
    }

    const reservation = reservationSnap.data() as RideReservation;

    if (reservation.passengerId !== auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Action non autorisee.");
    }

    if (reservation.status !== "held") {
      throw new functions.https.HttpsError("failed-precondition", "Reservation deja finalisee.");
    }

    if (!reservation.qrToken || reservation.qrToken !== qrToken) {
      throw new functions.https.HttpsError("permission-denied", "QR invalide.");
    }

    const tokens = Number(reservation.tokensHeld ?? 0);
    if (!Number.isFinite(tokens) || tokens < 1) {
      throw new functions.https.HttpsError("failed-precondition", "Montant invalide.");
    }

    const commissionTokens = Math.ceil(tokens * COMMISSION_RATE);
    const payoutTokens = tokens - commissionTokens;
    const now = FieldValue.serverTimestamp();

    const driverWalletRef = db.collection("wallets").doc(reservation.driverId);
    const driverWalletSnap = await tx.get(driverWalletRef);
    const driverBalance = driverWalletSnap.exists ? Number(driverWalletSnap.data()?.balance ?? 0) : 0;

    tx.set(
      driverWalletRef,
      {
        userId: reservation.driverId,
        balance: driverBalance + payoutTokens,
        updatedAt: now
      },
      { merge: true }
    );

    tx.update(reservationRef, {
      status: "confirmed",
      confirmedAt: now,
      updatedAt: now
    });

    const payoutRef = db.collection("transactions").doc();
    tx.set(payoutRef, {
      userId: reservation.driverId,
      rideId: reservation.rideId,
      type: "payout",
      status: "completed",
      tokens: payoutTokens,
      createdAt: now
    });

    const commissionRef = db.collection("commissions").doc();
    tx.set(commissionRef, {
      rideId: reservation.rideId,
      driverId: reservation.driverId,
      passengerId: reservation.passengerId,
      tokens: commissionTokens,
      createdAt: now
    });

    const metricsRef = db.collection("platformMetrics").doc("commissions");
    tx.set(
      metricsRef,
      {
        totalTokens: FieldValue.increment(commissionTokens),
        totalCount: FieldValue.increment(1),
        updatedAt: now
      },
      { merge: true }
    );

    return {
      payoutTokens,
      commissionTokens
    };
  });
});

export const getCommissionSummary = functions.https.onCall(async (_data, context) => {
  assertAuth(context);
  assertDomain(context);
  assertAdmin(context);

  const metricsSnap = await db.collection("platformMetrics").doc("commissions").get();
  const metrics = metricsSnap.exists ? metricsSnap.data() : null;
  const totalTokens = Number(metrics?.totalTokens ?? 0);
  const totalCount = Number(metrics?.totalCount ?? 0);

  const recentSnap = await db
    .collection("commissions")
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const recent = recentSnap.docs.map((doc) => {
    const data = doc.data();
    const createdAt =
      typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate().toISOString() : null;
    return {
      id: doc.id,
      rideId: data.rideId ?? null,
      driverId: data.driverId ?? null,
      passengerId: data.passengerId ?? null,
      tokens: Number(data.tokens ?? 0),
      createdAt
    };
  });

  const since = admin.firestore.Timestamp.fromMillis(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  );
  const last30Snap = await db
    .collection("commissions")
    .where("createdAt", ">=", since)
    .get();

  const last30Tokens = last30Snap.docs.reduce((sum, doc) => {
    const tokens = Number(doc.data().tokens ?? 0);
    return sum + (Number.isFinite(tokens) ? tokens : 0);
  }, 0);

  return {
    totalTokens,
    totalCount,
    last30Tokens,
    recent
  };
});

export const purchaseTokens = functions.https.onCall(async (data, context) => {
  const auth = assertAuth(context);
  assertDomain(context);

  const tokens = asPositiveInt(data?.tokens, "tokens");
  if (tokens > MAX_PURCHASE_TOKENS) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Achat limite a ${MAX_PURCHASE_TOKENS} jetons.`
    );
  }

  return db.runTransaction(async (tx) => {
    const walletRef = db.collection("wallets").doc(auth.uid);
    const walletSnap = await tx.get(walletRef);
    const currentBalance = walletSnap.exists ? Number(walletSnap.data()?.balance ?? 0) : 0;
    const newBalance = currentBalance + tokens;
    const now = FieldValue.serverTimestamp();

    tx.set(
      walletRef,
      {
        userId: auth.uid,
        balance: newBalance,
        updatedAt: now
      },
      { merge: true }
    );

    const txRef = db.collection("transactions").doc();
    tx.set(txRef, {
      userId: auth.uid,
      type: "purchase",
      status: "completed",
      tokens,
      createdAt: now
    });

    return {
      balance: newBalance,
      transactionId: txRef.id
    };
  });
});
