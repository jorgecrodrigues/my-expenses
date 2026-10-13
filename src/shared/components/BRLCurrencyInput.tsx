import React from "react";
import { Input, type InputProps } from "@chakra-ui/react";

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
  const hasFractionDigits = defaultValue?.toString().includes(".");
  const value = hasFractionDigits ? defaultValue : defaultValue + "00";
  return formatValue(value as string | number | undefined);
}

export default function BRLCurrencyInput({
  defaultValue,
  ...props
}: InputProps) {
  const formattedDefault = formatDefaultValue(defaultValue);
  const [value, setValue] = React.useState(formattedDefault);
  const [prevFormattedDefault, setPrevFormattedDefault] =
    React.useState(formattedDefault);

  if (formattedDefault !== prevFormattedDefault) {
    setPrevFormattedDefault(formattedDefault);
    setValue(formattedDefault);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatValue(e.target.value));
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
