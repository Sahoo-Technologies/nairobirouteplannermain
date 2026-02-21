import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/** Unwrap paginated `{ data, pagination }` envelope or return as-is for plain arrays/objects */
function unwrapPaginated(json: unknown): unknown {
  if (json && typeof json === "object" && !Array.isArray(json) && "data" in json && "pagination" in json) {
    return (json as { data: unknown }).data;
  }
  return json;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const json = await res.json();
    return unwrapPaginated(json) as Awaited<T>;
  };

/** Fetch a list endpoint, auto-unwrapping paginated envelopes */
export async function fetchList<T = unknown>(url: string): Promise<T[]> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  const json = await res.json();
  const data = unwrapPaginated(json);
  return (Array.isArray(data) ? data : []) as T[];
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000, // 30 seconds before considered stale
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
