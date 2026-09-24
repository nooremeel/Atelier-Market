export function getImageUrl(path?: string): string {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return path;
  return `/${path}`;
}

export const FALLBACK_IMAGE = '/images/placeholder.jpg';

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== window.location.origin + FALLBACK_IMAGE && !target.src.endsWith(FALLBACK_IMAGE)) {
    target.src = FALLBACK_IMAGE;
  }
}
