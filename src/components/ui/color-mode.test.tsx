// @vitest-environment jsdom
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

const setThemeMock = vi.fn();
let mockThemeState = {
  resolvedTheme: "light" as string | undefined,
  setTheme: setThemeMock,
  forcedTheme: undefined as string | undefined,
};

vi.mock("next-themes", () => ({
  ThemeProvider: ({
    children,
    attribute,
  }: {
    children: React.ReactNode;
    attribute?: string;
  }) => <div data-testid="theme-provider" data-attribute={attribute}>{children}</div>,
  useTheme: () => mockThemeState,
}));

vi.mock("react-icons/lu", () => ({
  LuMoon: () => <span data-testid="moon-icon" />,
  LuSun: () => <span data-testid="sun-icon" />,
}));

vi.mock("@chakra-ui/react", () => ({
  ClientOnly: ({
    children,
  }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) => <>{children}</>,
  IconButton: React.forwardRef(function IconButton(
    {
      children,
      onClick,
      "aria-label": ariaLabel,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      "aria-label"?: string;
    },
    ref: React.Ref<HTMLButtonElement>,
  ) {
    return (
      <button onClick={onClick} aria-label={ariaLabel} ref={ref}>
        {children}
      </button>
    );
  }),
  Skeleton: () => <div data-testid="skeleton" />,
  Span: React.forwardRef(function Span(
    {
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    },
    ref: React.Ref<HTMLSpanElement>,
  ) {
    return (
      <span className={className} ref={ref}>
        {children}
      </span>
    );
  }),
}));

import {
  ColorModeButton,
  ColorModeIcon,
  ColorModeProvider,
  DarkMode,
  LightMode,
  useColorMode,
  useColorModeValue,
} from "./color-mode";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockThemeState = {
    resolvedTheme: "light",
    setTheme: setThemeMock,
    forcedTheme: undefined,
  };
});

// --- ColorModeProvider ---

describe("ColorModeProvider", () => {
  it("renders children", () => {
    render(
      <ColorModeProvider>
        <span>child</span>
      </ColorModeProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("passes attribute='class' to ThemeProvider", () => {
    render(<ColorModeProvider><span /></ColorModeProvider>);
    expect(screen.getByTestId("theme-provider")).toHaveAttribute(
      "data-attribute",
      "class",
    );
  });
});

// --- useColorMode ---

describe("useColorMode", () => {
  it("returns colorMode from resolvedTheme when forcedTheme is absent", () => {
    mockThemeState = { resolvedTheme: "dark", setTheme: setThemeMock, forcedTheme: undefined };
    const { result } = renderHook(() => useColorMode());
    expect(result.current.colorMode).toBe("dark");
  });

  it("prefers forcedTheme over resolvedTheme when both are set", () => {
    mockThemeState = { resolvedTheme: "light", setTheme: setThemeMock, forcedTheme: "dark" };
    const { result } = renderHook(() => useColorMode());
    expect(result.current.colorMode).toBe("dark");
  });

  it("exposes setColorMode as setTheme", () => {
    const { result } = renderHook(() => useColorMode());
    result.current.setColorMode("dark");
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("toggleColorMode switches from dark to light", () => {
    mockThemeState = { resolvedTheme: "dark", setTheme: setThemeMock, forcedTheme: undefined };
    const { result } = renderHook(() => useColorMode());
    act(() => result.current.toggleColorMode());
    expect(setThemeMock).toHaveBeenCalledWith("light");
  });

  it("toggleColorMode switches from light to dark", () => {
    mockThemeState = { resolvedTheme: "light", setTheme: setThemeMock, forcedTheme: undefined };
    const { result } = renderHook(() => useColorMode());
    act(() => result.current.toggleColorMode());
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});

// --- useColorModeValue ---

describe("useColorModeValue", () => {
  it("returns the light value in light mode", () => {
    mockThemeState = { resolvedTheme: "light", setTheme: setThemeMock, forcedTheme: undefined };
    const { result } = renderHook(() => useColorModeValue("light-val", "dark-val"));
    expect(result.current).toBe("light-val");
  });

  it("returns the dark value in dark mode", () => {
    mockThemeState = { resolvedTheme: "dark", setTheme: setThemeMock, forcedTheme: undefined };
    const { result } = renderHook(() => useColorModeValue("light-val", "dark-val"));
    expect(result.current).toBe("dark-val");
  });
});

// --- ColorModeIcon ---

describe("ColorModeIcon", () => {
  it("renders the moon icon in dark mode", () => {
    mockThemeState = { resolvedTheme: "dark", setTheme: setThemeMock, forcedTheme: undefined };
    render(<ColorModeIcon />);
    expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("sun-icon")).not.toBeInTheDocument();
  });

  it("renders the sun icon in light mode", () => {
    mockThemeState = { resolvedTheme: "light", setTheme: setThemeMock, forcedTheme: undefined };
    render(<ColorModeIcon />);
    expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("moon-icon")).not.toBeInTheDocument();
  });
});

// --- ColorModeButton ---

describe("ColorModeButton", () => {
  it("renders a button with aria-label 'Toggle color mode'", () => {
    render(<ColorModeButton />);
    expect(
      screen.getByRole("button", { name: "Toggle color mode" }),
    ).toBeInTheDocument();
  });

  it("calls toggleColorMode when clicked", () => {
    mockThemeState = { resolvedTheme: "light", setTheme: setThemeMock, forcedTheme: undefined };
    render(<ColorModeButton />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle color mode" }));
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("forwards ref to the underlying button", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<ColorModeButton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// --- LightMode ---

describe("LightMode", () => {
  it("renders children", () => {
    render(<LightMode>light content</LightMode>);
    expect(screen.getByText("light content")).toBeInTheDocument();
  });

  it("applies the chakra-theme light class", () => {
    render(<LightMode>content</LightMode>);
    expect(screen.getByText("content")).toHaveClass("chakra-theme", "light");
  });

  it("forwards ref to the span element", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<LightMode ref={ref}>content</LightMode>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

// --- DarkMode ---

describe("DarkMode", () => {
  it("renders children", () => {
    render(<DarkMode>dark content</DarkMode>);
    expect(screen.getByText("dark content")).toBeInTheDocument();
  });

  it("applies the chakra-theme dark class", () => {
    render(<DarkMode>content</DarkMode>);
    expect(screen.getByText("content")).toHaveClass("chakra-theme", "dark");
  });

  it("forwards ref to the span element", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<DarkMode ref={ref}>content</DarkMode>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
