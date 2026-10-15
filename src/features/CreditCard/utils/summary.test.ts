import { describe, expect, it } from "vitest";
import { parseSummary } from "./summary";

describe("parseSummary", () => {
  it("splits headings, paragraphs and bullet lists", () => {
    const markdown = [
      "## Overview",
      "You spent **R$ 1.000,00** this month.",
      "",
      "## Suggestions",
      "- Cancel unused subscriptions",
      "* Avoid international fees",
      "1. Pay in full",
    ].join("\n");

    expect(parseSummary(markdown)).toEqual([
      { type: "heading", text: "Overview" },
      { type: "paragraph", text: "You spent R$ 1.000,00 this month." },
      { type: "heading", text: "Suggestions" },
      {
        type: "list",
        items: [
          "Cancel unused subscriptions",
          "Avoid international fees",
          "Pay in full",
        ],
      },
    ]);
  });

  it("starts a new list after a paragraph", () => {
    expect(parseSummary("- a\ntext\n- b")).toEqual([
      { type: "list", items: ["a"] },
      { type: "paragraph", text: "text" },
      { type: "list", items: ["b"] },
    ]);
  });

  it("returns no blocks for empty input", () => {
    expect(parseSummary("")).toEqual([]);
    expect(parseSummary("\n  \n")).toEqual([]);
  });

  it("handles Windows line endings and underscores emphasis", () => {
    expect(parseSummary("# Title\r\n__bold__ text")).toEqual([
      { type: "heading", text: "Title" },
      { type: "paragraph", text: "bold text" },
    ]);
  });
});
