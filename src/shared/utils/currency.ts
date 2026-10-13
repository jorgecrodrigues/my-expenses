const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactBrlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/**
 * Formats a number as Brazilian Real (e.g. "R$ 1.234,56").
 * @param value The amount to format.
 * @param compact Whether to use compact notation (e.g. "R$ 1,2 mil").
 */
export const formatBRL = (value: number, compact = false): string =>
  (compact ? compactBrlFormatter : brlFormatter).format(value);

/**
 * Parses a BRL-formatted string (e.g. "R$ 1.234,56") into a number.
 * @returns The amount, or NaN when the input has no digits.
 */
export const parseBRL = (value: string): number => {
  const normalized = value.replace(/[^\d,-]/g, "").replace(",", ".");
  return normalized ? Number(normalized) : NaN;
};
