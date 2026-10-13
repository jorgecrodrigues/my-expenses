import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL } from "./currency";

// Intl uses a non-breaking space between the symbol and the number.
const normalize = (value: string) => value.replace(/\s/g, " ");

describe("formatBRL", () => {
  it("formats values as Brazilian Real", () => {
    expect(normalize(formatBRL(1234.5))).toBe("R$ 1.234,50");
  });

  it("formats zero and negative values", () => {
    expect(normalize(formatBRL(0))).toBe("R$ 0,00");
    expect(normalize(formatBRL(-10))).toBe("-R$ 10,00");
  });

  it("uses compact notation when requested", () => {
    expect(normalize(formatBRL(1500, true))).toBe("R$ 1,5 mil");
    expect(normalize(formatBRL(80, true))).toBe("R$ 80");
  });
});

describe("parseBRL", () => {
  it("parses formatted values with thousands separators", () => {
    expect(parseBRL("R$ 4.095,49")).toBe(4095.49);
    expect(parseBRL("R$ 1.234.567,89")).toBe(1234567.89);
  });

  it("round-trips formatted values", () => {
    expect(parseBRL(formatBRL(-10.5))).toBe(-10.5);
  });

  it("returns NaN when there are no digits", () => {
    expect(parseBRL("")).toBeNaN();
    expect(parseBRL("R$")).toBeNaN();
  });
});
