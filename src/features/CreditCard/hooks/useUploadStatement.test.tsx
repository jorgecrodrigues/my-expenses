// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { generateUploadUrlMock, createStatementMock } = vi.hoisted(() => ({
  generateUploadUrlMock: vi.fn(),
  createStatementMock: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    creditCardStatements: {
      generateUploadUrl: "generateUploadUrl",
      createStatement: "createStatement",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: (fn: string) =>
    fn === "generateUploadUrl" ? generateUploadUrlMock : createStatementMock,
}));

import useUploadStatement from "./useUploadStatement";

const pdf = new File(["pdf"], "fatura.pdf", { type: "application/pdf" });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  generateUploadUrlMock.mockResolvedValue("https://upload.example/1");
  createStatementMock.mockResolvedValue("statement1");
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ storageId: "storage1" }),
  }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("useUploadStatement", () => {
  it("uploads the PDF and registers the statement with the issuer", async () => {
    const { result } = renderHook(() => useUploadStatement());

    let statementId: string | undefined;
    await act(async () => {
      statementId = await result.current.upload(pdf, "inter");
    });

    expect(fetchMock).toHaveBeenCalledWith("https://upload.example/1", {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: pdf,
    });
    expect(createStatementMock).toHaveBeenCalledWith({
      storageId: "storage1",
      filename: "fatura.pdf",
      issuer: "inter",
    });
    expect(statementId).toBe("statement1");
    expect(result.current.uploading).toBe(false);
  });

  it("throws and does not register the statement when the upload fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const { result } = renderHook(() => useUploadStatement());

    await act(async () => {
      await expect(result.current.upload(pdf, "nubank")).rejects.toThrow(
        'Upload of "fatura.pdf" failed (500)',
      );
    });

    expect(createStatementMock).not.toHaveBeenCalled();
    expect(result.current.uploading).toBe(false);
  });

  it("reports uploading while the request is in flight", async () => {
    let resolveUrl: (url: string) => void = () => {};
    generateUploadUrlMock.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveUrl = resolve;
      }),
    );
    const { result } = renderHook(() => useUploadStatement());

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.upload(pdf, "nubank");
    });
    expect(result.current.uploading).toBe(true);

    await act(async () => {
      resolveUrl("https://upload.example/2");
      await pending;
    });
    expect(result.current.uploading).toBe(false);
  });
});
