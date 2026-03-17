// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const signInMock = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({
    signIn: signInMock,
  }),
}));

vi.mock("@chakra-ui/react", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  Center: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  VStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Heading: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
}));

vi.mock("@/shared/components/icons/BrandIcon", () => ({
  BrandIcon: () => <div>BrandIcon</div>,
}));

vi.mock("@tabler/icons-react", () => ({
  IconBrandGithub: () => <span aria-hidden="true">GitHubIcon</span>,
}));

import SignIn from "./SignIn";

describe("SignIn", () => {
  it("renders sign-in copy and github button", () => {
    render(<SignIn />);
    expect(screen.getByText("Sign In to your account")).toBeInTheDocument();
    expect(
      screen.getByText("Use your GitHub account to sign in and manage your expenses."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in with github/i })).toBeInTheDocument();
  });

  it("calls signIn('github') when clicking the button", () => {
    render(<SignIn />);
    const buttons = screen.getAllByRole("button", { name: /sign in with github/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(signInMock).toHaveBeenCalledWith("github");
  });
});

