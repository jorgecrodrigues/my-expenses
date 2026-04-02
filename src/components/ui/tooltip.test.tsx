// @vitest-environment jsdom
import * as React from "react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { lastPortalProps } = vi.hoisted(() => ({
  lastPortalProps: {
    current: null as {
      disabled?: boolean;
      container?: React.RefObject<HTMLElement | null>;
    } | null,
  },
}));

vi.mock("@chakra-ui/react", () => ({
  Tooltip: {
    Root: (props: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid="tooltip-root">{props.children}</div>
    ),
    Trigger: ({
      children,
      asChild,
    }: {
      children?: React.ReactNode;
      asChild?: boolean;
    }) => (
      <div data-testid="tooltip-trigger" data-as-child={String(asChild)}>
        {children}
      </div>
    ),
    Positioner: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="tooltip-positioner">{children}</div>
    ),
    Content: React.forwardRef(function Content(
      {
        children,
        ...props
      }: React.PropsWithChildren<Record<string, unknown>>,
      ref: React.Ref<HTMLDivElement>,
    ) {
      return (
        <div data-testid="tooltip-content" ref={ref} {...props}>
          {children}
        </div>
      );
    }),
    Arrow: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="tooltip-arrow">{children}</div>
    ),
    ArrowTip: () => <span data-testid="tooltip-arrow-tip" />,
  },
  Portal: ({
    children,
    disabled,
    container,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    container?: React.RefObject<HTMLElement | null>;
  }) => {
    lastPortalProps.current = { disabled, container };
    return (
      <div
        data-testid="portal"
        data-portal-disabled={String(disabled)}
        data-has-container={String(container != null)}
      >
        {children}
      </div>
    );
  },
}));

import { Tooltip } from "./tooltip";

afterEach(() => {
  cleanup();
  lastPortalProps.current = null;
});

describe("Tooltip", () => {
  it("returns children only when disabled", () => {
    render(
      <Tooltip disabled content="Help text">
        <button type="button">Target</button>
      </Tooltip>,
    );
    expect(screen.getByRole("button", { name: "Target" })).toBeInTheDocument();
    expect(screen.queryByTestId("tooltip-root")).not.toBeInTheDocument();
    expect(screen.queryByText("Help text")).not.toBeInTheDocument();
  });

  it("renders content in the tooltip tree when not disabled", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("tooltip-root")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-trigger")).toHaveAttribute(
      "data-as-child",
      "true",
    );
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent("Help text");
    expect(screen.getByRole("button", { name: "Target" })).toBeInTheDocument();
  });

  it("renders arrow elements when showArrow is true", () => {
    render(
      <Tooltip content="Tip" showArrow>
        <span>Hover me</span>
      </Tooltip>,
    );
    expect(screen.getByTestId("tooltip-arrow")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-arrow-tip")).toBeInTheDocument();
  });

  it("does not render arrow elements when showArrow is false", () => {
    render(
      <Tooltip content="Tip" showArrow={false}>
        <span>Hover me</span>
      </Tooltip>,
    );
    expect(screen.queryByTestId("tooltip-arrow")).not.toBeInTheDocument();
  });

  it("portals by default and disables the portal when portalled is false", () => {
    const { rerender } = render(
      <Tooltip content="A">
        <button type="button">One</button>
      </Tooltip>,
    );
    const portal = screen.getByTestId("portal");
    expect(portal).toHaveAttribute("data-portal-disabled", "false");

    rerender(
      <Tooltip content="A" portalled={false}>
        <button type="button">One</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("portal")).toHaveAttribute(
      "data-portal-disabled",
      "true",
    );
  });

  it("passes portalRef to Portal as container", () => {
    const portalRef = createRef<HTMLDivElement>();
    render(
      <Tooltip content="X" portalRef={portalRef}>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(lastPortalProps.current?.container).toBe(portalRef);
  });

  it("forwards contentProps and ref to the content element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tooltip
        ref={ref}
        content="Body"
        contentProps={{ id: "tip-body", "data-custom": "yes" } as never}
      >
        <button type="button">T</button>
      </Tooltip>,
    );
    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveAttribute("id", "tip-body");
    expect(content).toHaveAttribute("data-custom", "yes");
    expect(ref.current).toBe(content);
  });
});
