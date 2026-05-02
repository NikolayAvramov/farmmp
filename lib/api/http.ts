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

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
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
    headers: { "Content-Type": "application/json" },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof (body as { error?: string }).error === "string" ? (body as { error: string }).error : res.statusText;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}
