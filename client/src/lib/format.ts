export function formatPrice(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}
