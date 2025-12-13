import React from "react";
import { Input, type InputProps } from "@chakra-ui/react";

export default function BRLCurrencyInput({
  defaultValue,
  ...props
}: InputProps) {
  const [value, setValue] = React.useState(defaultValue);

  const formatValue = (val: string | number | undefined) => {
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatValue(e.target.value));
  };

  React.useEffect(() => {
    // Check if defaultValue has cents
    const hasFractionDigits = defaultValue?.toString().includes(".");
    // If not, append "00" to represent cents
    const value = hasFractionDigits ? defaultValue : defaultValue + "00";

    setValue(formatValue(value as string | number | undefined));
  }, [defaultValue]);

  return (
    <Input
      {...props}
      inputMode="numeric"
      value={value}
      onChange={handleChange}
    />
  );
}
