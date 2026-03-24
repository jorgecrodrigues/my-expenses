// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import BRLCurrencyInput from "./BRLCurrencyInput";

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

afterEach(() => {
  cleanup();
});

describe("BRLCurrencyInput", () => {
  describe("initial render", () => {
    it("renders an input element", () => {
      renderWithChakra(<BRLCurrencyInput defaultValue={0} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("sets inputMode to numeric", () => {
      renderWithChakra(<BRLCurrencyInput defaultValue={0} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("inputMode", "numeric");
    });

    it("forwards name prop to the input", () => {
      renderWithChakra(<BRLCurrencyInput defaultValue={0} name="amount" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("name", "amount");
    });

    it("forwards placeholder prop to the input", () => {
      renderWithChakra(
        <BRLCurrencyInput defaultValue={0} placeholder="Enter amount" />,
      );
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        "Enter amount",
      );
    });
  });

  describe("defaultValue formatting", () => {
    it("formats an integer defaultValue as BRL currency", () => {
      // 100 has no "." → appends "00" → "10000" → 10000/100 = 100 → R$ 100,00
      renderWithChakra(<BRLCurrencyInput defaultValue={100} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$\u00a0100,00");
    });

    it("formats a small integer defaultValue correctly", () => {
      // 5 → "500" → 500/100 = 5 → R$ 5,00
      renderWithChakra(<BRLCurrencyInput defaultValue={5} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$\u00a05,00");
    });

    it("formats a string defaultValue with decimal digits", () => {
      // "1.50" has "." → stays → digits "150" → 150/100 = 1.5 → R$ 1,50
      renderWithChakra(
        <BRLCurrencyInput defaultValue={"1.50" as unknown as number} />,
      );
      expect(screen.getByRole("textbox")).toHaveValue("R$\u00a01,50");
    });

    it("formats zero as R$ 0,00", () => {
      // 0 → no "." → "000" → 0/100 = 0 → R$ 0,00
      renderWithChakra(<BRLCurrencyInput defaultValue={0} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$\u00a00,00");
    });

    it("formats a large value correctly", () => {
      // 1500 → "150000" → 1500 → R$ 1.500,00
      renderWithChakra(<BRLCurrencyInput defaultValue={1500} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$\u00a01.500,00");
    });
  });

  describe("user input formatting", () => {
    it("formats typed digits as BRL currency", () => {
      renderWithChakra(<BRLCurrencyInput defaultValue={0} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "1234" } });
      // "1234" → 1234/100 = 12.34 → R$ 12,34
      expect(input).toHaveValue("R$\u00a012,34");
    });

    it("strips non-digit characters from typed input", () => {
      renderWithChakra(<BRLCurrencyInput defaultValue={0} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "abc123" } });
      // non-digits stripped → "123" → 1.23 → R$ 1,23
      expect(input).toHaveValue("R$\u00a01,23");
    });

    it("returns empty string when input contains no digits", () => {
      renderWithChakra(<BRLCurrencyInput defaultValue={0} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "abc" } });
      expect(input).toHaveValue("");
    });
  });

  describe("defaultValue updates", () => {
    it("re-formats when defaultValue prop changes", () => {
      const { rerender } = renderWithChakra(
        <BRLCurrencyInput defaultValue={10} />,
      );
      expect(screen.getByRole("textbox")).toHaveValue("R$\u00a010,00");

      act(() => {
        rerender(
          <ChakraProvider value={defaultSystem}>
            <BRLCurrencyInput defaultValue={25} />
          </ChakraProvider>,
        );
      });

      expect(screen.getByRole("textbox")).toHaveValue("R$\u00a025,00");
    });
  });
});
