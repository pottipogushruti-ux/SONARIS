const API_BASE_URL = 'http://127.0.0.1:8001';

export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}