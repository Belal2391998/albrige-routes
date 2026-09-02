/** Base URL for the ASP.NET Core MVC API (set when backend is deployed). */
export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export const isApiConfigured = Boolean(API_BASE_URL && API_BASE_URL.startsWith("http"));
