type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  url?: string;

  constructor(message: string, status?: number, data?: unknown, url?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.url = url;
  }
}

const API_BASE_URL = 'https://designli-challenge.onrender.com';

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorizedCallback(callback: () => void) {
  onUnauthorized = callback;
}

function buildUrl(path: string): string {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = buildUrl(path);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    console.log('[API_REQUEST]', options.method ?? 'GET', url);

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const text = await response.text();

    let data: unknown = null;
    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    console.log('[API_RESPONSE]', response.status, url);

    if (!response.ok) {
      // Handle 401 unauthorized
      if (response.status === 401 && onUnauthorized) {
        onUnauthorized();
      }

      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message?: unknown }).message)
          : `HTTP ${response.status}`;

      throw new ApiError(message, response.status, data, url);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      console.log('[API_ERROR]', {
        url: error.url,
        status: error.status,
        message: error.message,
        data: error.data,
      });
      throw error;
    }

    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Request timeout'
        : error instanceof Error
          ? error.message
          : 'Network request failed';

    console.log('[API_NETWORK_ERROR]', {
      url,
      message,
      raw: String(error),
    });

    throw new ApiError(message, undefined, undefined, url);
  } finally {
    clearTimeout(timeout);
  }
}
