import { getCsrfToken, resetCsrfToken } from './csrf';

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(body?.message || body?.errorMessage || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function handle(res: Response): Promise<any> {
  const body = await parse(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

function isCsrfFailure(status: number, body: any): boolean {
  return status === 403 && (body?.message === 'Invalid CSRF token' || body?.code === 'EBADCSRFTOKEN');
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(path, { credentials: 'include' }).then(handle) as Promise<T>;
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  _retried = false,
): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'csrf-token': token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!_retried && res.status === 403) {
    const peek = await parse(res.clone());
    if (isCsrfFailure(res.status, peek)) {
      resetCsrfToken();
      return apiSend<T>(path, method, body, true);
    }
  }
  return handle(res);
}

export async function apiUpload<T>(
  path: string,
  method: 'POST' | 'PUT',
  form: FormData,
  _retried = false,
): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: { 'csrf-token': token },
    body: form,
  });
  if (!_retried && res.status === 403) {
    const peek = await parse(res.clone());
    if (isCsrfFailure(res.status, peek)) {
      resetCsrfToken();
      return apiUpload<T>(path, method, form, true);
    }
  }
  return handle(res);
}
