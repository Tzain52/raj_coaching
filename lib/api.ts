const API_URL = process.env.NEXT_PUBLIC_API_URL!;

let cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch("/api/auth/token");
  if (!res.ok) throw new Error("Not authenticated");
  const data = await res.json();
  cachedToken = data.token;
  return cachedToken!;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    cachedToken = null;
    const freshToken = await getToken();
    headers.Authorization = `Bearer ${freshToken}`;
    return fetch(`${API_URL}${path}`, { ...options, headers });
  }

  return res;
}
