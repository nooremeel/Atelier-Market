let cached: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cached) return cached;
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  if (!res.ok) throw new Error('Could not fetch CSRF token');
  const body = (await res.json()) as { csrfToken: string };
  cached = body.csrfToken;
  return cached;
}

export function resetCsrfToken(): void {
  cached = null;
}
