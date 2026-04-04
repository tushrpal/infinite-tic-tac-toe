const DEFAULT_LOCAL_API_URL = 'http://localhost:3000';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_LOCAL_API_URL;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getApiBaseCandidates(): string[] {
  const candidates: string[] = [];
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envApiUrl) {
    candidates.push(normalizeBaseUrl(envApiUrl));
  }

  if (typeof window !== 'undefined') {
    // In production, same-origin proxy/rewrite deployments should work without hardcoding ports.
    candidates.push(normalizeBaseUrl(window.location.origin));
  }

  if (process.env.NODE_ENV !== 'production') {
    if (typeof window !== 'undefined') {
      const hostBase = `${window.location.protocol}//${window.location.hostname}:3000`;
      candidates.push(normalizeBaseUrl(hostBase));
    }

    candidates.push(DEFAULT_LOCAL_API_URL);
  }

  candidates.push(normalizeBaseUrl(API_BASE_URL));

  return unique(candidates);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseCandidates = getApiBaseCandidates();
  let lastNetworkError: unknown = null;

  for (const base of baseCandidates) {
    let response: Response;

    try {
      response = await fetch(`${base}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      });
    } catch (error) {
      lastNetworkError = error;
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(errorText || response.statusText);
      (error as Error & { status?: number; baseUrl?: string }).status = response.status;
      (error as Error & { status?: number; baseUrl?: string }).baseUrl = base;
      throw error;
    }

    return response.json() as Promise<T>;
  }

  const wrapped = new Error(
    `API request failed for ${path}. Tried: ${baseCandidates.join(', ')}`
  );
  (wrapped as Error & { cause?: unknown; status?: number }).cause = lastNetworkError;
  (wrapped as Error & { cause?: unknown; status?: number }).status = 0;
  throw wrapped;
}
