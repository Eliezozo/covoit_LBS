import React from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type QrCodeCardProps = {
  token?: string | null;
};

export function QrCodeCard({ token }: QrCodeCardProps) {
  return (
    <View className="items-center rounded-2xl border border-slate-light bg-white p-4">
      {token ? (
        <>
          <QRCode value={token} size={160} color="#0f172a" />
          <Text className="mt-3 text-xs text-slate-gray">Code: {token}</Text>
        </>
      ) : (
        <Text className="text-sm text-slate-gray">
          QR indisponible. Verifiez la reservation dans quelques instants.
        </Text>
      )}
    </View>
  );
}
