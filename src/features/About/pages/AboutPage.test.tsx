// @vitest-environment jsdom
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import AboutPage from "./AboutPage";

function renderAbout() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <AboutPage />
    </ChakraProvider>,
  );
}

describe("AboutPage", () => {
  it("renders the main heading and core sections", () => {
    renderAbout();

    expect(
      screen.getByRole("heading", { name: "About", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What you can do" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Built with" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Why we built it" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contact" }),
    ).toBeInTheDocument();
  });

  it("renders a mailto contact link", () => {
    renderAbout();

    const links = screen.getAllByRole("link", {
      name: "jorgerodrigues9@outlook.com",
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "mailto:jorgerodrigues9@outlook.com");
    }
  });
});
