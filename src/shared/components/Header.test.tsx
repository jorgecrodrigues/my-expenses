// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

type Viewer = {
  _id?: string;
  name?: string;
  email?: string;
  image?: string;
} | null;

let viewer: Viewer | undefined;

const signOut = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: () => viewer,
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signOut }),
}));

vi.mock("@tabler/icons-react", () => ({
  IconChevronDown: () => <span aria-hidden>chevron-down</span>,
  IconLogout: () => <span aria-hidden>logout-icon</span>,
}));

import Header from "./Header";

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
  viewer = null;
  signOut.mockClear();
});

describe("Header", () => {
  it("renders the app title and tagline", () => {
    renderWithChakra(<Header />);
    expect(screen.getByText("My Expense Tracker")).toBeInTheDocument();
    expect(
      screen.getByText("Spending insights at a glance"),
    ).toBeInTheDocument();
  });

  it("shows Guest and Not provided when there is no viewer", () => {
    renderWithChakra(<Header />);
    expect(screen.getAllByText("Guest").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Not provided")).toBeInTheDocument();
  });

  it("shows the signed-in name and email when viewer data is present", () => {
    viewer = {
      name: "Ada Lovelace",
      email: "ada@example.com",
    };
    renderWithChakra(<Header />);
    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("calls signOut when Sign out is clicked in the account menu", async () => {
    const user = userEvent.setup();
    viewer = { name: "Ada Lovelace", email: "ada@example.com" };
    renderWithChakra(<Header />);

    const menuTrigger = screen.getAllByRole("button")[0];
    await user.click(menuTrigger);

    const signOutBtn = await screen.findByRole("button", { name: /sign out/i });
    await user.click(signOutBtn);

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
