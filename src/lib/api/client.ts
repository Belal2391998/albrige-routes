import { API_BASE_URL, isApiConfigured } from "@/lib/api/config";
import { getAdminSessionToken } from "@/lib/api/adminSession";
import type { ApiResult } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";

const LOCALE_KEY = "albreeji-locale";
const ADMIN_SESSION_HEADER = "X-Admin-Session";

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const stored = window.localStorage.getItem(LOCALE_KEY);
  if (stored === "ar" || stored === "en" || stored === "de") return stored;
  return "ar";
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = {
  locale?: Locale | undefined;
  admin?: boolean | undefined;
};

function buildHeaders(options?: ApiRequestOptions, jsonBody?: boolean): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (jsonBody) headers["Content-Type"] = "application/json";
  headers["Accept-Language"] = options?.locale ?? readStoredLocale();
  if (options?.admin) {
    const token = getAdminSessionToken();
    if (!token) throw new ApiError("Admin session required", 401);
    headers[ADMIN_SESSION_HEADER] = token;
  }
  return headers;
}

async function parseResponse<T>(res: Response, path: string): Promise<T> {
  let body: ApiResult<T> | null = null;
  try {
    body = (await res.json()) as ApiResult<T>;
  } catch {
    if (!res.ok) throw new ApiError(`HTTP ${res.status} for ${path}`, res.status);
    throw new ApiError("Invalid API response", res.status);
  }

  if (!res.ok || !body.success) {
    throw new ApiError(body.error ?? body.message ?? `HTTP ${res.status} for ${path}`, res.status);
  }

  if (body.data === undefined) {
    throw new ApiError(body.error ?? body.message ?? "API returned no data", res.status);
  }

  return body.data;
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError("API base URL is not configured", 0);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(options, body !== undefined),
    credentials: "omit",
    // Admin saves must never read back a cached snapshot.
    cache: "no-store",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  return parseResponse<T>(res, path);
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>("GET", path, undefined, options);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>("POST", path, body, options);
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>("PUT", path, body, options);
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>("PATCH", path, body, options);
}

export async function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>("DELETE", path, undefined, options);
}

/** Multipart upload (e.g. station image). */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: ApiRequestOptions,
): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError("API base URL is not configured", 0);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(options, false),
    credentials: "omit",
    body: formData,
  });

  return parseResponse<T>(res, path);
}

export { isApiConfigured };
