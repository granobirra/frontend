import { storage } from "@/src/utils/storage";

export const TOKEN_KEY = "tl_access_token";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

type Options = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiFetch<T = any>(path: string, options: Options = {}): Promise<T> {
  const token = await storage.secureGet(TOKEN_KEY, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || "Errore di rete";
    throw new Error(typeof message === "string" ? message : "Errore di rete");
  }
  return data as T;
}
