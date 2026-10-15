// @vitest-environment jsdom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

const { queryState, useQueryMock, retryMock, navigateMock } = vi.hoisted(
  () => ({
    queryState: { current: undefined as unknown },
    useQueryMock: vi.fn(),
    retryMock: vi.fn(),
    navigateMock: vi.fn(),
  }),
);

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    creditCardStatements: {
      getStatementReport: "getStatementReport",
      retryStatement: "retryStatement",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (fn: string, args: unknown) => {
    useQueryMock(fn, args);
    return queryState.current;
  },
  useMutation: () => retryMock,
}));

vi.mock("wouter", () => ({
  useParams: () => ({ statementId: "statement1" }),
  useLocation: () => ["/credit-card/statements/statement1", navigateMock],
}));

vi.mock("@tabler/icons-react", () => ({
  IconArrowLeft: () => <span />,
  IconRefresh: () => <span />,
  IconSparkles: () => <span />,
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: { create: vi.fn() } }));

vi.mock("../components/StatementCategoryChart", () => ({
  default: ({ categories }: { categories: unknown[] }) => (
    <div>CategoryChart ({categories.length})</div>
  ),
}));

vi.mock("../components/TransactionsTable", () => ({
  default: ({ statementId }: { statementId: string }) => (
    <div>TransactionsTable {statementId}</div>
  ),
}));

import StatementReportPage from "./StatementReportPage";

const baseStatement = {
  _id: "statement1",
  _creationTime: 1,
  userId: "user1",
  issuer: "nubank",
  storageId: "storage1",
  filename: "fatura.pdf",
};

const report = {
  totalSpentCents: 150000,
  refundsCents: 2000,
  paymentsCents: 90000,
  netCents: 148000,
  transactionCount: 12,
  internationalCents: 5000,
  iofCents: 219,
  feesCents: 0,
  interestCents: 0,
  byCategory: [{ category: "food", totalCents: 80000, count: 8 }],
  topMerchants: [{ merchant: "iFood", totalCents: 60000, count: 6 }],
  installmentsCents: 30000,
  futureInstallmentsCents: 240000,
  installments: [
    {
      description: "Notebook",
      amountCents: 30000,
      installmentCurrent: 2,
      installmentTotal: 10,
      remainingCents: 240000,
    },
  ],
};

function renderPage() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <StatementReportPage />
    </ChakraProvider>,
  );
}

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  queryState.current = undefined;
  retryMock.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StatementReportPage", () => {
  it("queries the report of the statement in the URL", () => {
    renderPage();
    expect(useQueryMock).toHaveBeenCalledWith("getStatementReport", {
      statementId: "statement1",
    });
    expect(screen.getByLabelText("Loading report")).toBeInTheDocument();
  });

  it("shows a not found message and goes back to the list", () => {
    queryState.current = null;
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Statement not found" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to statements/i }));
    expect(navigateMock).toHaveBeenCalledWith("/credit-card");
  });

  it("shows progress while the statement is being analyzed", () => {
    queryState.current = {
      statement: { ...baseStatement, status: "processing" },
      report: null,
    };
    renderPage();
    expect(screen.getByText("Analyzing statement")).toBeInTheDocument();
    expect(screen.queryByText(/TransactionsTable/)).not.toBeInTheDocument();
  });

  it("shows the error and retries a failed statement", async () => {
    queryState.current = {
      statement: {
        ...baseStatement,
        status: "failed",
        errorMessage: "Could not read the statement: empty response",
      },
      report: null,
    };
    renderPage();
    expect(
      screen.getByText("Could not read the statement: empty response"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /process again/i }));
    await waitFor(() =>
      expect(retryMock).toHaveBeenCalledWith({ statementId: "statement1" }),
    );
  });

  it("renders the full report for a completed statement", () => {
    queryState.current = {
      statement: {
        ...baseStatement,
        status: "completed",
        referenceMonth: "2026-10",
        dueDate: "2026-10-10",
        totalAmountCents: 150000,
        extractedSumCents: 150000,
        cardLastDigits: "1234",
        aiSummary: "## Overview\n- Food was the largest category",
      },
      report,
    };
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Nubank Oct 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Card ending 1234/)).toBeInTheDocument();
    expect(screen.getByText("Total spent")).toBeInTheDocument();
    expect(screen.getByText("CategoryChart (1)")).toBeInTheDocument();
    expect(screen.getByText("iFood")).toBeInTheDocument();
    expect(screen.getByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText("Food was the largest category")).toBeInTheDocument();
    expect(screen.getByText("TransactionsTable statement1")).toBeInTheDocument();
    expect(screen.queryByText("Totals do not match")).not.toBeInTheDocument();
  });

  it("warns when the extracted lines do not add up to the statement total", () => {
    queryState.current = {
      statement: {
        ...baseStatement,
        status: "completed",
        referenceMonth: "2026-10",
        totalAmountCents: 150000,
        extractedSumCents: 120000,
      },
      report,
    };
    renderPage();
    expect(screen.getByText("Totals do not match")).toBeInTheDocument();
    expect(
      screen.getByText("The analysis is not available for this statement yet."),
    ).toBeInTheDocument();
  });
});
