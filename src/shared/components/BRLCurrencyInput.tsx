import React from "react";
import { Input, type InputProps } from "@chakra-ui/react";
import { parseBRL } from "@/shared/utils/currency";

interface BRLCurrencyInputProps extends InputProps {
  /** Called with the parsed amount (NaN when empty) whenever the user types. */
  onValueChange?: (value: number) => void;
}

function formatValue(val: string | number | undefined) {
  if (val === undefined) return "";
  // Remove all non-digit characters
  const cleanedValue = val?.toString()?.replace(/\D/g, "");

  // Parse the cleaned value as a number and divide by 100 to get the correct currency amount
  const numberValue = parseInt(cleanedValue, 10) / 100;

  if (isNaN(numberValue)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

function formatDefaultValue(defaultValue: InputProps["defaultValue"]) {
  if (typeof defaultValue === "number") {
    return formatValue(defaultValue.toFixed(2));
  }
  const hasFractionDigits = defaultValue?.toString().includes(".");
  const value = hasFractionDigits ? defaultValue : defaultValue + "00";
  return formatValue(value as string | number | undefined);
}

export default function BRLCurrencyInput({
  defaultValue,
  onValueChange,
  ...props
}: BRLCurrencyInputProps) {
  const formattedDefault = formatDefaultValue(defaultValue);
  const [value, setValue] = React.useState(formattedDefault);
  const [prevFormattedDefault, setPrevFormattedDefault] =
    React.useState(formattedDefault);

  if (formattedDefault !== prevFormattedDefault) {
    setPrevFormattedDefault(formattedDefault);
    setValue(formattedDefault);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatValue(e.target.value);
    setValue(formatted);
    onValueChange?.(parseBRL(formatted));
  };

  return (
    <Input
      {...props}
      inputMode="numeric"
      value={value}
      onChange={handleChange}
    />
  );
}
