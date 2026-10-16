// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

let mockLocation = "/";
const navigate = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => [mockLocation, navigate],
}));

vi.mock("@tabler/icons-react", () => ({
  IconCreditCard: () => <span data-icon="credit-card" />,
  IconDashboard: () => <span data-icon="dashboard" />,
  IconHome: () => <span data-icon="home" />,
  IconInfoCircle: () => <span data-icon="info" />,
  IconReceipt: () => <span data-icon="receipt" />,
}));

import MobileNav from "./MobileNav";

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockLocation = "/";
  navigate.mockClear();
});

describe("MobileNav", () => {
  it("renders the mobile navigation with every nav label", () => {
    renderWithChakra(<MobileNav />);
    expect(
      screen.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeInTheDocument();
    for (const label of [
      "Home",
      "Dashboard",
      "Expenses",
      "Credit Card",
      "About",
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("marks the active route with aria-current", () => {
    mockLocation = "/credit-card/statements/abc123";
    renderWithChakra(<MobileNav />);
    expect(
      screen.getByRole("button", { name: /credit card/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("button", { name: /dashboard/i }),
    ).not.toHaveAttribute("aria-current");
  });

  it("navigates to the item path when tapped", async () => {
    const user = userEvent.setup();
    renderWithChakra(<MobileNav />);
    await user.click(screen.getByRole("button", { name: /expenses/i }));
    expect(navigate).toHaveBeenCalledWith("/expenses");
  });
});
