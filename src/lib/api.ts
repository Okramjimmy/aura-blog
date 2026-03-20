/**
 * Safe fetch wrapper: throws a clear error if the server returns HTML instead of JSON.
 * Prevents "Unexpected token '<'" errors by validating Content-Type first.
 */
export async function apiFetch(url: string, opts?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, opts);
  } catch (e: any) {
    throw new Error(`Network error: ${e.message}`);
  }

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error(
      `API at ${url} returned ${res.status} with content-type "${ct}" — expected JSON. ` +
      `Check that the backend is running and the route is registered.`
    );
  }
  return res;
}

export async function apiJson<T = any>(url: string, opts?: RequestInit): Promise<T> {
  const res = await apiFetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || `Request failed (${res.status})`);
  return data as T;
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
