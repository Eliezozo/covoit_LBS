export type Wallet = {
  userId: string;
  balance: number;
  updatedAt: string;
};

export type TransactionType = "purchase" | "hold" | "release" | "payout" | "commission";

export type TransactionStatus = "pending" | "completed" | "failed";

export type Transaction = {
  id: string;
  userId: string;
  rideId?: string;
  type: TransactionType;
  status: TransactionStatus;
  tokens: number;
  createdAt: string;
};
