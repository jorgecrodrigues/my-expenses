// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

let mockLocation = "/";
const navigate = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => [mockLocation, navigate],
}));

vi.mock("@tabler/icons-react", () => ({
  IconBuildingBank: () => <span data-icon="bank" />,
  IconChevronRight: () => <span data-icon="chevron" />,
  IconDashboard: () => <span data-icon="dashboard" />,
  IconHome: () => <span data-icon="home" />,
  IconInfoCircle: () => <span data-icon="info" />,
  IconReceipt: () => <span data-icon="receipt" />,
}));

import Sidebar from "./Sidebar";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
});

function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.localStorage.removeItem("__sidebar_state__");
  mockLocation = "/";
  navigate.mockClear();
});

describe("Sidebar", () => {
  it("renders main navigation with an accessible label", () => {
    renderWithChakra(<Sidebar />);
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
  });

  it("shows the Menu heading and all nav labels when expanded", () => {
    renderWithChakra(<Sidebar />);
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expenses/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /bank accounts/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /about/i })).toBeInTheDocument();
  });

  it("does not show the Menu heading when collapsed", () => {
    window.localStorage.setItem("__sidebar_state__", "collapsed");
    renderWithChakra(<Sidebar />);
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
  });

  it("marks the active route with aria-current when expanded", () => {
    mockLocation = "/dashboard";
    renderWithChakra(<Sidebar />);
    expect(screen.getByRole("button", { name: /dashboard/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: /home/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("treats nested dashboard paths as active for Dashboard", () => {
    mockLocation = "/dashboard/month/3/year/2026";
    renderWithChakra(<Sidebar />);
    expect(screen.getByRole("button", { name: /dashboard/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it.each([
    ["Home", "/"],
    ["Dashboard", "/dashboard"],
    ["Expenses", "/expenses"],
    ["Bank Accounts", "/bank-accounts"],
    ["About", "/about"],
  ])("calls navigate with %s when the item is clicked", async (label, path) => {
    const user = userEvent.setup();
    renderWithChakra(<Sidebar />);
    await user.click(screen.getByRole("button", { name: new RegExp(label, "i") }));
    expect(navigate).toHaveBeenCalledWith(path);
  });

  it("toggles sidebar state in localStorage when the collapse control is used", async () => {
    const user = userEvent.setup();
    renderWithChakra(<Sidebar />);

    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    await waitFor(() => {
      expect(window.localStorage.getItem("__sidebar_state__")).toBe("collapsed");
    });

    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));
    await waitFor(() => {
      expect(window.localStorage.getItem("__sidebar_state__")).toBe("expanded");
    });
  });
});
