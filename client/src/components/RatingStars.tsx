export function RatingStars({ value, outOf = 5 }: { value: number; outOf?: number }) {
  return (
    <span className="text-gold-leaf" aria-label={`Rated ${value} out of ${outOf}`} role="img">
      {Array.from({ length: outOf }, (_, i) => (i < Math.round(value) ? '★' : '☆')).join('')}
    </span>
  );
}
