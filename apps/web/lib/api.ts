const DEFAULT_LOCAL_API_URL = 'http://localhost:3000';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_LOCAL_API_URL;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function isLikelyFrontendRouteMiss(response: Response): boolean {
  if (response.status !== 404 && response.status !== 405) {
    return false;
  }

  const poweredBy = response.headers.get('x-powered-by')?.toLowerCase() ?? '';
  if (poweredBy.includes('next.js')) {
    return true;
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  return contentType.includes('text/html');
}

function getApiBaseCandidates(): string[] {
  const candidates: string[] = [];
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envApiUrl) {
    candidates.push(normalizeBaseUrl(envApiUrl));
  }

  if (process.env.NODE_ENV !== 'production') {
    if (typeof window !== 'undefined') {
      const hostBase = `${window.location.protocol}//${window.location.hostname}:3000`;
      candidates.push(normalizeBaseUrl(hostBase));
    }

    candidates.push(DEFAULT_LOCAL_API_URL);
  }

  if (typeof window !== 'undefined') {
    // In production, same-origin proxy/rewrite deployments should work without hardcoding ports.
    // In development, keep this as fallback after explicit local API candidates.
    candidates.push(normalizeBaseUrl(window.location.origin));
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
  let lastHttpError: Error | null = null;

  for (let index = 0; index < baseCandidates.length; index += 1) {
    const base = baseCandidates[index];
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
      let errorData: any = null;
      const errorText = await response.text();

      // Try to parse JSON error response
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // Not JSON, keep as text
      }

      const error = new Error(errorData?.error || errorText || response.statusText) as Error & {
        status?: number;
        baseUrl?: string;
        data?: any;
      };

      error.status = response.status;
      error.baseUrl = base;
      error.data = errorData;

      const hasFallbackCandidates = index < baseCandidates.length - 1;
      if (hasFallbackCandidates && isLikelyFrontendRouteMiss(response)) {
        lastHttpError = error;
        continue;
      }

      throw error;
    }

    return response.json() as Promise<T>;
  }

  if (lastHttpError) {
    throw lastHttpError;
  }

  const wrapped = new Error(
    `API request failed for ${path}. Tried: ${baseCandidates.join(', ')}`
  );
  (wrapped as Error & { cause?: unknown; status?: number }).cause = lastNetworkError;
  (wrapped as Error & { cause?: unknown; status?: number }).status = 0;
  throw wrapped;
}
