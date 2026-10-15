import { describe, expect, it } from "vitest";
import {
  isEncryptedPdf,
  MAX_CATEGORY_NAME_LENGTH,
  resolveCategoryName,
  trimToPdfHeader,
} from "./creditCardRules";

describe("resolveCategoryName", () => {
  it("matches built-in categories case-insensitively", () => {
    expect(resolveCategoryName("  Food ", [])).toEqual({
      category: "food",
      isNew: false,
    });
  });

  it("matches existing custom categories case-insensitively", () => {
    expect(resolveCategoryName("pets", ["Pets"])).toEqual({
      category: "Pets",
      isNew: false,
    });
  });

  it("creates a new category with collapsed whitespace", () => {
    expect(resolveCategoryName("  Gym   membership ", ["Pets"])).toEqual({
      category: "Gym membership",
      isNew: true,
    });
  });

  it("rejects empty and too long names", () => {
    expect(() => resolveCategoryName("   ", [])).toThrow(
      "Category name is required",
    );
    expect(() =>
      resolveCategoryName("x".repeat(MAX_CATEGORY_NAME_LENGTH + 1), []),
    ).toThrow(/at most/);
  });
});

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

describe("trimToPdfHeader", () => {
  it("returns the bytes unchanged when the file starts with the header", () => {
    const bytes = encode("%PDF-1.7\n1 0 obj");
    expect(trimToPdfHeader(bytes)).toEqual(bytes);
  });

  it("drops zero padding before the header", () => {
    const pdf = encode("%PDF-1.7\n%%EOF");
    const padded = new Uint8Array(64 + pdf.length);
    padded.set(pdf, 64);

    expect(decode(trimToPdfHeader(padded)!)).toBe("%PDF-1.7\n%%EOF");
  });

  it("returns null when there is no PDF header", () => {
    expect(trimToPdfHeader(encode("<html></html>"))).toBeNull();
    expect(trimToPdfHeader(new Uint8Array())).toBeNull();
  });
});

describe("isEncryptedPdf", () => {
  it("detects an /Encrypt entry in the trailer", () => {
    expect(
      isEncryptedPdf(encode("%PDF-1.7\ntrailer <</Root 1 0 R /Encrypt 5 0 R>>")),
    ).toBe(true);
  });

  it("ignores unprotected files and similarly named keys", () => {
    expect(isEncryptedPdf(encode("%PDF-1.7\ntrailer <</Root 1 0 R>>"))).toBe(
      false,
    );
    expect(isEncryptedPdf(encode("<</EncryptMetadata false>>"))).toBe(false);
  });
});
