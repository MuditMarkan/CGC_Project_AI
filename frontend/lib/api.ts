import type {
  AnalysisRequest,
  AnalysisResponse,
  ApiErrorBody,
  InstagramAccountsResponse,
  InstagramConfigResponse,
  InstagramConnectResponse,
} from "./contracts";
import { createMockAnalysis } from "./mock-analysis";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean,
    public status: number,
  ) {
    super(message);
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...init });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      error?.message ?? "The request failed.",
      error?.code ?? "unknown_error",
      error?.retryable ?? false,
      response.status,
    );
  }
  return body as T;
}

export function getInstagramConfig(): Promise<InstagramConfigResponse> {
  return requestJson("/api/v1/instagram/config");
}

export function getInstagramAccounts(): Promise<InstagramAccountsResponse> {
  return requestJson("/api/v1/instagram/accounts");
}

export function beginInstagramConnect(): Promise<InstagramConnectResponse> {
  return requestJson("/api/v1/instagram/connect", { method: "POST" });
}

export function disconnectInstagramAccount(accountId: string): Promise<null> {
  return requestJson(`/api/v1/instagram/accounts/${encodeURIComponent(accountId)}`, { method: "DELETE" });
}

export async function createAnalysis(
  input: AnalysisRequest,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  if (USE_MOCK) {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 650);
      signal?.addEventListener("abort", () => {
        window.clearTimeout(timer);
        reject(new DOMException("The request was cancelled.", "AbortError"));
      });
    });
    return createMockAnalysis(input);
  }

  const response = await fetch(`${API_BASE}/api/v1/analyses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": crypto.randomUUID(),
    },
    body: JSON.stringify(input),
    signal,
    cache: "no-store",
  });

  const body = (await response.json()) as AnalysisResponse | ApiErrorBody;
  if (!response.ok) {
    const error = (body as ApiErrorBody).error;
    throw new ApiClientError(
      error?.message ?? "The request failed.",
      error?.code ?? "unknown_error",
      error?.retryable ?? false,
      response.status,
    );
  }
  return body as AnalysisResponse;
}
