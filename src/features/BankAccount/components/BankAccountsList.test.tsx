// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: { bankAccounts: { getBankAccounts: "getBankAccounts" } },
}));

const loadMoreMock = vi.fn();
let paginatedQueryState: {
  results: object[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: typeof loadMoreMock;
} = { results: [], status: "LoadingFirstPage", loadMore: loadMoreMock };

vi.mock("convex/react", () => ({
  usePaginatedQuery: () => paginatedQueryState,
}));

let mockEntry: { isIntersecting: boolean } | null = null;

vi.mock("@/shared/hooks/useIntersectionObserver", () => ({
  default: () => ({ ref: vi.fn(), entry: mockEntry }),
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  listRowStaggerEnter: () => ({}),
}));

vi.mock("@/shared/utils/color", () => ({
  generateColorByString: () => "#123456",
  getContrastingTextColor: () => "#ffffff",
}));

vi.mock("../modals/CreateOrEditBankAccount", () => ({
  default: ({ account }: { account?: object }) =>
    account ? (
      <button aria-label="Edit Bank Account" />
    ) : (
      <button>Add Account</button>
    ),
}));

vi.mock("../modals/RemoveBankAccount", () => ({
  default: () => <button aria-label="Delete Bank Account" />,
}));

vi.mock("@tabler/icons-react", () => ({
  IconArrowDown: () => null,
}));

vi.mock("@chakra-ui/react", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span role="status">{children}</span>
  ),
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Input: ({
    onChange,
    placeholder,
  }: {
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
  }) => <input onChange={onChange} placeholder={placeholder} />,
  Skeleton: () => <div data-testid="skeleton" />,
  SkeletonCircle: () => <div data-testid="skeleton-circle" />,
  Table: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <table>{children}</table>
    ),
    Header: ({ children }: { children: React.ReactNode }) => (
      <thead>{children}</thead>
    ),
    Body: ({ children }: { children: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    Row: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
    ColumnHeader: ({ children }: { children: React.ReactNode }) => (
      <th>{children}</th>
    ),
    Cell: ({
      children,
      colSpan,
    }: {
      children: React.ReactNode;
      colSpan?: number;
    }) => <td colSpan={colSpan}>{children}</td>,
  },
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Separator: () => <div />,
}));

// --- Fixtures ---

const makeAccount = (overrides: object = {}) => ({
  _id: "acc1",
  _creationTime: new Date("2025-01-15T10:00:00Z").getTime(),
  userId: "user1",
  accountName: "Main Checking",
  accountType: "checking",
  accountNumber: "1234567890",
  accountAgency: "0001",
  accountDigit: "5",
  accountAmount: 1500,
  ...overrides,
});

import BankAccountsList from "./BankAccountsList";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  paginatedQueryState = {
    results: [],
    status: "LoadingFirstPage",
    loadMore: loadMoreMock,
  };
  mockEntry = null;
});

describe("BankAccountsList", () => {
  describe("loading state", () => {
    it("shows skeleton rows while loading", () => {
      paginatedQueryState = {
        results: [],
        status: "LoadingFirstPage",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    });
  });

  describe("with data", () => {
    beforeEach(() => {
      paginatedQueryState = {
        results: [
          makeAccount(),
          makeAccount({
            _id: "acc2",
            accountName: "Savings Account",
            accountType: "savings",
            accountNumber: "9876543210",
            accountAmount: 5000,
          }),
        ],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
    });

    it("renders account names", () => {
      render(<BankAccountsList />);
      expect(screen.getByText("Main Checking")).toBeInTheDocument();
      expect(screen.getByText("Savings Account")).toBeInTheDocument();
    });

    it("renders account type badges", () => {
      render(<BankAccountsList />);
      expect(screen.getByText("checking")).toBeInTheDocument();
      expect(screen.getByText("savings")).toBeInTheDocument();
    });

    it("renders account numbers", () => {
      render(<BankAccountsList />);
      expect(screen.getByText("1234567890")).toBeInTheDocument();
      expect(screen.getByText("9876543210")).toBeInTheDocument();
    });

    it("renders edit and delete action buttons for each row", () => {
      render(<BankAccountsList />);
      expect(
        screen.getAllByRole("button", { name: "Edit Bank Account" }),
      ).toHaveLength(2);
      expect(
        screen.getAllByRole("button", { name: "Delete Bank Account" }),
      ).toHaveLength(2);
    });

    it("shows total balance footer", () => {
      render(<BankAccountsList />);
      expect(screen.getByText("Total Balance:")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when there are no accounts", () => {
      paginatedQueryState = {
        results: [],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      expect(
        screen.getByText("No accounts found. Please add a new account."),
      ).toBeInTheDocument();
    });
  });

  describe("pagination states", () => {
    it("shows Load More button when CanLoadMore", () => {
      paginatedQueryState = {
        results: [makeAccount()],
        status: "CanLoadMore",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      expect(
        screen.getByRole("button", { name: "Load More" }),
      ).toBeInTheDocument();
    });

    it("calls loadMore when Load More button is clicked", () => {
      paginatedQueryState = {
        results: [makeAccount()],
        status: "CanLoadMore",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      fireEvent.click(screen.getByRole("button", { name: "Load More" }));
      expect(loadMoreMock).toHaveBeenCalledWith(15);
    });

    it("shows exhausted message when all accounts are loaded", () => {
      paginatedQueryState = {
        results: [makeAccount()],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      expect(screen.getByText("No more accounts to load.")).toBeInTheDocument();
    });

    it("shows skeleton row while loading more", () => {
      paginatedQueryState = {
        results: [makeAccount()],
        status: "LoadingMore",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      paginatedQueryState = {
        results: [
          makeAccount({ accountName: "Main Checking", accountNumber: "1111" }),
          makeAccount({
            _id: "acc2",
            accountName: "Savings Account",
            accountNumber: "2222",
            accountType: "savings",
          }),
        ],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
    });

    it("filters by account name", () => {
      render(<BankAccountsList />);
      fireEvent.change(screen.getByPlaceholderText("Search accounts..."), {
        target: { value: "main" },
      });
      expect(screen.getByText("Main Checking")).toBeInTheDocument();
      expect(screen.queryByText("Savings Account")).not.toBeInTheDocument();
    });

    it("filters by account number", () => {
      render(<BankAccountsList />);
      fireEvent.change(screen.getByPlaceholderText("Search accounts..."), {
        target: { value: "2222" },
      });
      expect(screen.queryByText("Main Checking")).not.toBeInTheDocument();
      expect(screen.getByText("Savings Account")).toBeInTheDocument();
    });

    it("filters by account type", () => {
      render(<BankAccountsList />);
      fireEvent.change(screen.getByPlaceholderText("Search accounts..."), {
        target: { value: "savings" },
      });
      expect(screen.queryByText("Main Checking")).not.toBeInTheDocument();
      expect(screen.getByText("Savings Account")).toBeInTheDocument();
    });

    it("shows all accounts when search is cleared", () => {
      render(<BankAccountsList />);
      const input = screen.getByPlaceholderText("Search accounts...");
      fireEvent.change(input, { target: { value: "main" } });
      fireEvent.change(input, { target: { value: "" } });
      expect(screen.getByText("Main Checking")).toBeInTheDocument();
      expect(screen.getByText("Savings Account")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    const rowTexts = () =>
      Array.from(document.querySelectorAll("tbody tr")).map(
        (r) => r.textContent ?? "",
      );

    beforeEach(() => {
      paginatedQueryState = {
        results: [
          makeAccount({
            _id: "a1",
            accountName: "ZZZ Account",
            accountAmount: 100,
            _creationTime: 2000,
          }),
          makeAccount({
            _id: "a2",
            accountName: "AAA Account",
            accountAmount: 500,
            _creationTime: 1000,
          }),
        ],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
    });

    it("sorts by a new field ascending on first click (lines 55-56)", () => {
      render(<BankAccountsList />);
      fireEvent.click(screen.getByRole("button", { name: "Name" }));
      const rows = rowTexts();
      expect(rows[0]).toContain("AAA Account");
      expect(rows[1]).toContain("ZZZ Account");
    });

    it("toggles sort order to descending on second click of same field (lines 52-53)", () => {
      render(<BankAccountsList />);
      fireEvent.click(screen.getByRole("button", { name: "Name" }));
      fireEvent.click(screen.getByRole("button", { name: "Name" }));
      const rows = rowTexts();
      expect(rows[0]).toContain("ZZZ Account");
      expect(rows[1]).toContain("AAA Account");
    });

    it("returns 1 when fieldA > fieldB in descending order (line 67)", () => {
      render(<BankAccountsList />);
      // Click Balance once (asc): 100 first, 500 second
      fireEvent.click(screen.getByRole("button", { name: "Balance" }));
      expect(rowTexts()[0]).toContain("ZZZ Account"); // amount 100
      // Click Balance again (desc): 500 first, 100 second
      fireEvent.click(screen.getByRole("button", { name: "Balance" }));
      expect(rowTexts()[0]).toContain("AAA Account"); // amount 500
    });

    it("falls back to _creationTime when the sort field is undefined (line 63)", () => {
      paginatedQueryState = {
        results: [
          makeAccount({
            _id: "a1",
            accountName: "Newer",
            accountAmount: undefined,
            _creationTime: 2000,
          }),
          makeAccount({
            _id: "a2",
            accountName: "Older",
            accountAmount: undefined,
            _creationTime: 1000,
          }),
        ],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      fireEvent.click(screen.getByRole("button", { name: "Balance" }));
      // asc by _creationTime fallback: Older (1000) first
      expect(rowTexts()[0]).toContain("Older");
      expect(rowTexts()[1]).toContain("Newer");
    });

    it("returns 0 for equal sort field values and preserves relative order (line 69)", () => {
      paginatedQueryState = {
        results: [
          makeAccount({ _id: "a1", accountName: "First", accountAmount: 999 }),
          makeAccount({ _id: "a2", accountName: "Second", accountAmount: 999 }),
        ],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      fireEvent.click(screen.getByRole("button", { name: "Balance" }));
      // Both have same amount → compare returns 0, order is stable
      expect(rowTexts()[0]).toContain("First");
      expect(rowTexts()[1]).toContain("Second");
    });
  });

  describe("intersection observer auto-load (lines 90-91)", () => {
    it("calls loadMore automatically when sentinel intersects and status is CanLoadMore", () => {
      mockEntry = { isIntersecting: true };
      paginatedQueryState = {
        results: [makeAccount()],
        status: "CanLoadMore",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      expect(loadMoreMock).toHaveBeenCalledWith(15);
    });

    it("does not call loadMore when sentinel is not intersecting", () => {
      mockEntry = { isIntersecting: false };
      paginatedQueryState = {
        results: [makeAccount()],
        status: "CanLoadMore",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      expect(loadMoreMock).not.toHaveBeenCalled();
    });
  });

  describe("missing optional fields (lines 200, 218)", () => {
    it("shows dash when accountType is absent (line 200)", () => {
      paginatedQueryState = {
        results: [makeAccount({ accountType: undefined })],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      // The type cell renders "-" — check it is present in the row
      const cells = document.querySelectorAll("tbody td");
      const typeCellText = Array.from(cells).map((c) => c.textContent);
      expect(typeCellText).toContain("-");
    });

    it("shows dash when accountAmount is absent (line 218)", () => {
      paginatedQueryState = {
        results: [makeAccount({ accountAmount: undefined })],
        status: "Exhausted",
        loadMore: loadMoreMock,
      };
      render(<BankAccountsList />);
      const cells = document.querySelectorAll("tbody td");
      const cellTexts = Array.from(cells).map((c) => c.textContent);
      expect(cellTexts).toContain("-");
    });
  });
});
