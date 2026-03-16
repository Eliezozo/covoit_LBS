import React from "react";
import { View, ViewProps } from "react-native";

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className = "", ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-slate-light bg-white p-4 shadow-sm ${className}`}
      {...props}
    />
  );
}
