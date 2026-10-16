// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

const { signInMock, toasterMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  toasterMock: { create: vi.fn() },
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({
    signIn: signInMock,
  }),
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: toasterMock }));

vi.mock("@/shared/components/icons/BrandIcon", () => ({
  BrandIcon: () => <div>BrandIcon</div>,
}));

import SignIn from "./SignIn";

function renderSignIn() {
  render(
    <ChakraProvider value={defaultSystem}>
      <SignIn />
    </ChakraProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SignIn", () => {
  it("renders the brand, sign-in copy and github button", () => {
    renderSignIn();

    expect(
      screen.getByRole("heading", { level: 1, name: "My Expense Tracker" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Sign in to your account",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Use your GitHub account to sign in and manage your expenses.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with github/i }),
    ).toBeEnabled();
  });

  it("calls signIn('github') and shows a loading state", () => {
    signInMock.mockReturnValue(new Promise(() => {}));
    renderSignIn();

    fireEvent.click(
      screen.getByRole("button", { name: /sign in with github/i }),
    );

    expect(signInMock).toHaveBeenCalledWith("github");
    expect(
      screen.getByRole("button", { name: /redirecting to github/i }),
    ).toBeDisabled();
  });

  it("shows an error toast and re-enables the button when sign-in fails", async () => {
    signInMock.mockRejectedValue(new Error("Popup blocked"));
    renderSignIn();

    fireEvent.click(
      screen.getByRole("button", { name: /sign in with github/i }),
    );

    await waitFor(() =>
      expect(toasterMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Could not sign in",
          description: "Popup blocked",
        }),
      ),
    );
    expect(
      screen.getByRole("button", { name: /sign in with github/i }),
    ).toBeEnabled();
  });
});
