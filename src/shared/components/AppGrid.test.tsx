// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import AppGrid from "./AppGrid";
import styles from "./AppGrid.module.scss";

afterEach(() => {
  cleanup();
});

describe("AppGrid", () => {
  describe("layout regions", () => {
    it("places slot content in header, nav, main, and footer elements", () => {
      const { container } = render(
        <AppGrid
          header={<span>Header</span>}
          sidebar={<span>Sidebar</span>}
          footer={<span>Footer</span>}
        >
          <span>Main content</span>
        </AppGrid>,
      );

      expect(container.querySelector("header")).toHaveTextContent("Header");
      expect(container.querySelector("nav")).toHaveTextContent("Sidebar");
      expect(screen.getByRole("main")).toHaveTextContent("Main content");
      expect(container.querySelector("footer")).toHaveTextContent("Footer");
    });

    it("accepts an array of nodes in a slot", () => {
      render(
        <AppGrid
          header={[
            <span key="a">First</span>,
            <span key="b">Second</span>,
          ]}
        >
          <span>Body</span>
        </AppGrid>,
      );
      expect(screen.getByRole("banner")).toHaveTextContent("FirstSecond");
    });

    it("renders empty regions when slots are omitted but still applies module classes", () => {
      const { container } = render(
        <AppGrid data-testid="grid">
          <span>Only main</span>
        </AppGrid>,
      );

      expect(screen.getByRole("main")).toHaveTextContent("Only main");
      expect(container.querySelector("header")).toBeEmptyDOMElement();
      expect(screen.getByRole("navigation")).toBeEmptyDOMElement();
      expect(container.querySelector("footer")).toBeEmptyDOMElement();

      expect(screen.getByTestId("grid")).toHaveClass(styles.layout);
      expect(container.querySelector("header")).toHaveClass(styles.header);
      expect(screen.getByRole("navigation")).toHaveClass(styles.sidebar);
      expect(screen.getByRole("main")).toHaveClass(styles.content);
      expect(container.querySelector("footer")).toHaveClass(styles.footer);
    });

    it("renders with no children when children is omitted", () => {
      render(<AppGrid data-testid="grid" />);
      expect(screen.getByRole("main")).toBeEmptyDOMElement();
    });
  });

  describe("root element props", () => {
    it("forwards data attributes and aria to the root", () => {
      render(
        <AppGrid data-testid="app-grid" aria-label="Application layout">
          <span>Main content</span>
        </AppGrid>,
      );
      const root = screen.getByTestId("app-grid");
      expect(root).toHaveAttribute("aria-label", "Application layout");
    });

    it("forwards event handlers and inline styles", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <AppGrid
          data-testid="root"
          onClick={onClick}
          style={{ marginTop: 8 }}
        >
          <span>Main</span>
        </AppGrid>,
      );
      const root = screen.getByTestId("root");
      expect(root).toHaveStyle({ marginTop: "8px" });
      await user.click(root);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not merge className onto the root (layout uses the module class only)", () => {
      render(
        // LayoutProps omits className, but the implementation strips it from rest props at runtime
        // @ts-expect-error — exercise runtime behavior when className is passed anyway
        <AppGrid className="custom-class" data-testid="root">
          <span>Main content</span>
        </AppGrid>,
      );
      const root = screen.getByTestId("root");
      expect(root.className).not.toContain("custom-class");
      expect(root).toHaveClass(styles.layout);
    });
  });
});
