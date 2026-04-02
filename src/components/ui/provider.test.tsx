// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { defaultSystemStub, lastChakraValue, colorModePropsSpy } = vi.hoisted(
  () => ({
    defaultSystemStub: { __type: "defaultSystem" },
    lastChakraValue: { current: null as unknown },
    colorModePropsSpy: vi.fn(),
  }),
);

vi.mock("@chakra-ui/react", () => ({
  ChakraProvider: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: unknown;
  }) => {
    lastChakraValue.current = value;
    return <div data-testid="chakra-provider">{children}</div>;
  },
  defaultSystem: defaultSystemStub,
}));

vi.mock("./color-mode", () => ({
  ColorModeProvider: (props: Record<string, unknown>) => {
    colorModePropsSpy(props);
    return (
      <div data-testid="color-mode-provider">
        {props.children as React.ReactNode}
      </div>
    );
  },
}));

import { Provider } from "./provider";

afterEach(() => {
  cleanup();
  colorModePropsSpy.mockClear();
  lastChakraValue.current = null;
});

describe("Provider", () => {
  it("passes defaultSystem to ChakraProvider and renders children inside ColorModeProvider", () => {
    render(
      <Provider>
        <span>App content</span>
      </Provider>,
    );

    expect(screen.getByTestId("chakra-provider")).toBeInTheDocument();
    expect(lastChakraValue.current).toBe(defaultSystemStub);
    expect(screen.getByTestId("color-mode-provider")).toBeInTheDocument();
    expect(screen.getByText("App content")).toBeInTheDocument();
  });

  it("forwards props to ColorModeProvider", () => {
    render(
      <Provider defaultTheme="dark" storageKey="my-app-theme">
        <span>Child</span>
      </Provider>,
    );

    expect(colorModePropsSpy).toHaveBeenCalledTimes(1);
    expect(colorModePropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultTheme: "dark",
        storageKey: "my-app-theme",
        children: expect.anything(),
      }),
    );
  });
});
