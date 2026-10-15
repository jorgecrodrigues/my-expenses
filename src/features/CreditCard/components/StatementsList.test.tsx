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

const { paginatedState, retryMock, navigateMock, loadMoreMock } = vi.hoisted(
  () => ({
    paginatedState: {
      results: [] as unknown[],
      status: "Exhausted" as string,
    },
    retryMock: vi.fn(),
    navigateMock: vi.fn(),
    loadMoreMock: vi.fn(),
  }),
);

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    creditCardStatements: {
      listStatements: "listStatements",
      retryStatement: "retryStatement",
    },
  },
}));

vi.mock("convex/react", () => ({
  usePaginatedQuery: () => ({ ...paginatedState, loadMore: loadMoreMock }),
  useMutation: () => retryMock,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/credit-card", navigateMock],
}));

vi.mock("@/shared/hooks/useIntersectionObserver", () => ({
  default: () => ({ ref: () => {}, entry: undefined }),
}));

vi.mock("@tabler/icons-react", () => ({
  IconRefresh: () => <span />,
  IconReportAnalytics: () => <span />,
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: { create: vi.fn() } }));

vi.mock("../modals/RemoveStatement", () => ({
  default: () => <button type="button">Delete statement</button>,
}));

import StatementsList from "./StatementsList";

const statement = (overrides: Record<string, unknown>) => ({
  _creationTime: 1,
  userId: "user1",
  issuer: "nubank",
  storageId: "storage1",
  filename: "fatura.pdf",
  ...overrides,
});

function renderList() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <StatementsList />
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
  paginatedState.results = [];
  paginatedState.status = "Exhausted";
  retryMock.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StatementsList", () => {
  it("shows an empty state", () => {
    renderList();
    expect(screen.getByText(/no statements yet/i)).toBeInTheDocument();
  });

  it("renders completed statements with a link to the report", () => {
    paginatedState.results = [
      statement({
        _id: "s1",
        status: "completed",
        referenceMonth: "2026-10",
        dueDate: "2026-10-10",
        totalAmountCents: 123456,
      }),
    ];
    renderList();

    expect(screen.getByText("Oct 2026")).toBeInTheDocument();
    expect(screen.getByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("10/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Process again" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View report" }));
    expect(navigateMock).toHaveBeenCalledWith("/credit-card/statements/s1");
  });

  it("shows the progress of statements being analyzed", () => {
    paginatedState.results = [
      statement({ _id: "s2", status: "processing", issuer: "inter" }),
    ];
    renderList();
    expect(screen.getByText("Analyzing")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View report" }),
    ).not.toBeInTheDocument();
  });

  it("shows the error of a failed statement and retries it", async () => {
    paginatedState.results = [
      statement({
        _id: "s3",
        status: "failed",
        errorMessage: "No transactions were found in the statement",
      }),
    ];
    renderList();

    expect(
      screen.getByText("No transactions were found in the statement"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Process again" }));
    await waitFor(() =>
      expect(retryMock).toHaveBeenCalledWith({ statementId: "s3" }),
    );
  });

  it("loads more statements on demand", () => {
    paginatedState.results = [statement({ _id: "s1", status: "completed" })];
    paginatedState.status = "CanLoadMore";
    renderList();
    fireEvent.click(screen.getByRole("button", { name: "Load More" }));
    expect(loadMoreMock).toHaveBeenCalledWith(15);
  });
});
