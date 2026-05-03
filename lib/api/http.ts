/** Клиентски fetch към app/api — cookies се изпращат по подразбиране (same-origin). */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function redirectToLoginIfUnauthorized(status: number) {
  if (typeof window === "undefined" || status !== 401) return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    redirectToLoginIfUnauthorized(res.status);
    const msg = typeof (body as { error?: string }).error === "string" ? (body as { error: string }).error : res.statusText;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

export async function apiSend<T = void>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  json?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers:
      json !== undefined
        ? { "Content-Type": "application/json" }
        : {},
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    redirectToLoginIfUnauthorized(res.status);
    const msg = typeof (body as { error?: string }).error === "string" ? (body as { error: string }).error : res.statusText;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}
