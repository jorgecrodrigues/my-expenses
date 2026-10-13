// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { generateUploadUrlMock, sendFileMock } = vi.hoisted(() => ({
  generateUploadUrlMock: vi.fn(),
  sendFileMock: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    expensesfiles: {
      generateUploadUrl: "generateUploadUrl",
      sendFile: "sendFile",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: (fn: string) =>
    fn === "generateUploadUrl" ? generateUploadUrlMock : sendFileMock,
}));

import type { Id } from "../../../../convex/_generated/dataModel";
import useUploadExpenseFiles from "./useUploadExpenseFiles";

const expenseId = "exp1" as Id<"expenses">;
const pdf = new File(["pdf"], "invoice.pdf", { type: "application/pdf" });
const png = new File(["png"], "receipt.png", { type: "image/png" });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  let urlCount = 0;
  generateUploadUrlMock.mockImplementation(
    async () => `https://upload.example/${++urlCount}`,
  );
  sendFileMock.mockResolvedValue("file1");
  fetchMock = vi.fn(async (_url: string, init: RequestInit) => ({
    ok: true,
    status: 200,
    json: async () => ({ storageId: `storage-${(init.body as File).name}` }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useUploadExpenseFiles", () => {
  it("uses a fresh upload URL per file and attaches each one to the expense", async () => {
    const { result } = renderHook(() => useUploadExpenseFiles(expenseId));

    let outcome: Awaited<ReturnType<typeof result.current.upload>>;
    await act(async () => {
      outcome = await result.current.upload([pdf, png]);
    });

    expect(generateUploadUrlMock).toHaveBeenCalledTimes(2);
    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(new Set(urls).size).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: pdf,
      }),
    );
    expect(sendFileMock).toHaveBeenCalledWith({
      expenseId,
      storageId: "storage-invoice.pdf",
      filename: "invoice.pdf",
    });
    expect(sendFileMock).toHaveBeenCalledWith({
      expenseId,
      storageId: "storage-receipt.png",
      filename: "receipt.png",
    });
    expect(outcome!).toEqual({ uploaded: [pdf, png], failed: [] });
    expect(result.current.uploading).toBe(false);
  });

  it("reports failed files without aborting the others", async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
      (init.body as File).name === "invoice.pdf"
        ? { ok: false, status: 500, json: async () => ({}) }
        : { ok: true, status: 200, json: async () => ({ storageId: "s2" }) },
    );
    const { result } = renderHook(() => useUploadExpenseFiles(expenseId));

    let outcome: Awaited<ReturnType<typeof result.current.upload>>;
    await act(async () => {
      outcome = await result.current.upload([pdf, png]);
    });

    expect(outcome!).toEqual({ uploaded: [png], failed: [pdf] });
    expect(sendFileMock).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it("marks a file as failed when attaching it to the expense fails", async () => {
    sendFileMock.mockRejectedValueOnce(new Error("Unauthorized"));
    const { result } = renderHook(() => useUploadExpenseFiles(expenseId));

    let outcome: Awaited<ReturnType<typeof result.current.upload>>;
    await act(async () => {
      outcome = await result.current.upload([pdf]);
    });

    expect(outcome!).toEqual({ uploaded: [], failed: [pdf] });
  });

  it("exposes the uploading state while files are in flight", async () => {
    let resolveFetch!: (value: unknown) => void;
    fetchMock.mockImplementation(
      () => new Promise((resolve) => (resolveFetch = resolve)),
    );
    const { result } = renderHook(() => useUploadExpenseFiles(expenseId));

    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current.upload([pdf]);
    });
    expect(result.current.uploading).toBe(true);

    await act(async () => {
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
      resolveFetch({ ok: true, status: 200, json: async () => ({ storageId: "s" }) });
      await pending;
    });
    expect(result.current.uploading).toBe(false);
  });
});
