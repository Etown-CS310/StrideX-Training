import { clearSession, getToken } from './currentUser';

/**
 * An error response from our API, with the HTTP status and the server's message.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Sends a request to the StrideX API with fetch() and returns the parsed JSON.
 * Adds the login token if there is one. Throws ApiError for any non-2xx response.
 * @param path - Path under /api, e.g. "/activities".
 * @param method - HTTP method.
 * @param body - Sent as JSON when given.
 */
export async function apiFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token != null) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  let response: Response;
  try {
    response = await fetch('/api' + path, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Is it running?');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // An expired token means the saved session is useless now
    if (response.status === 401 && token != null) {
      clearSession();
    }
    throw new ApiError(response.status, data.error ?? 'Request failed (' + response.status + ')');
  }

  return data as T;
}
