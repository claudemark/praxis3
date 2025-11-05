const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Debug logging
console.log("[Supabase Config]", {
  configured: isSupabaseConfigured,
  url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : "NOT SET",
  hasKey: !!SUPABASE_ANON_KEY,
});

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    this.name = "SupabaseNotConfiguredError";
  }
}

interface SupabaseRequestOptions extends RequestInit {
  skipJsonParse?: boolean;
}

export async function supabaseRequest<T>(path: string, init: SupabaseRequestOptions = {}): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new SupabaseNotConfiguredError();
  }

  const headers = new Headers(init.headers ?? {});
  headers.set("apikey", SUPABASE_ANON_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorMessage = await safeReadBody(response);
    throw new Error(`Supabase request failed (${response.status}): ${errorMessage}`);
  }

  if (init.skipJsonParse || response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

async function safeReadBody(response: Response) {
  try {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return typeof data === "string" ? data : JSON.stringify(data);
    }
    return await response.text();
  } catch {
    return "Unknown error";
  }
}
