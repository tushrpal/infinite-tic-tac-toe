const DEFAULT_LOCAL_API_PORT = 4000;
const DEFAULT_LOCAL_API_URL = `http://localhost:${DEFAULT_LOCAL_API_PORT}`;

function getServerApiBaseUrl(): string {
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envApiUrl) {
    return envApiUrl.replace(/\/+$/, '');
  }
  return DEFAULT_LOCAL_API_URL;
}

type ServerFetchOptions = RequestInit & {
  /** Seconds before revalidation. Use `false` for always-fresh data. */
  revalidate?: number | false;
};

export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { revalidate = 30, ...init } = options;
  const url = `${getServerApiBaseUrl()}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText || response.statusText;

    try {
      const parsed = JSON.parse(errorText) as { error?: string };
      if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      // keep raw text
    }

    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}
