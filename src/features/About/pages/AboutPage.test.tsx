// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import AboutPage from "./AboutPage";

describe("AboutPage", () => {
  it("renders the main heading and core sections", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: "About Us", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "About the Application" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Our Mission" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact Us" })).toBeInTheDocument();
  });

  it("renders a mailto contact link", () => {
    render(<AboutPage />);

    const links = screen.getAllByRole("link", {
      name: "jorgerodrigues9@outlook.com",
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "mailto:jorgerodrigues9@outlook.com");
    }
  });
});

