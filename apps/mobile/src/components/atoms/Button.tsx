import React from "react";
import { Pressable, PressableProps, Text } from "react-native";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  className?: string;
  textClassName?: string;
};

const base =
  "w-full items-center justify-center rounded-xl px-4 py-3 active:opacity-90";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy",
  outline: "border border-slate-light bg-white",
  ghost: "bg-transparent"
};

const textVariants: Record<ButtonVariant, string> = {
  primary: "text-white",
  outline: "text-slate-dark",
  ghost: "text-navy"
};

export function Button({
  title,
  variant = "primary",
  className = "",
  textClassName = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`${base} ${variants[variant]} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      {...props}
    >
      <Text className={`text-base font-semibold ${textVariants[variant]} ${textClassName}`}>
        {title}
      </Text>
    </Pressable>
  );
}
