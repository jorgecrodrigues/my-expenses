// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import Logo from "./Logo";

afterEach(() => {
  cleanup();
});

describe("Logo", () => {
  it("renders a 120×120 svg", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("height", "120");
  });

  it("renders the dollar sign in the graphic", () => {
    const { container } = render(<Logo />);
    const text = container.querySelector("text");
    expect(text?.textContent).toContain("$");
  });

  it("omits loading animations when loading is omitted or false", () => {
    const { container, unmount } = render(<Logo />);
    expect(container.querySelectorAll("animate")).toHaveLength(0);
    unmount();

    const { container: c2 } = render(<Logo loading={false} />);
    expect(c2.querySelectorAll("animate")).toHaveLength(0);
  });

  it("renders loading animations when loading is true", () => {
    const { container } = render(<Logo loading />);
    const animates = container.querySelectorAll("animate");
    expect(animates.length).toBe(4);
  });
});
